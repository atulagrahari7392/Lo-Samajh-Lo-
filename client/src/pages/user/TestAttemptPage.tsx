import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Globe,
  HelpCircle,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  User,
  X,
  FileText,
  Shield,
  Check,
  Flag,
} from 'lucide-react';
import { api } from '../../services/api';
import { Question } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const TestAttemptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: toastError, success, info } = useToast();

  // 3 Exam Steps: general_instructions (Page 4) -> specific_instructions (Page 5) -> live_exam (Page 6)
  const [examStep, setExamStep] = useState<'general_instructions' | 'specific_instructions' | 'live_exam'>(
    'general_instructions'
  );

  const [testInfo, setTestInfo] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>({});
  const [currentSection, setCurrentSection] = useState<string>('All');
  const [language, setLanguage] = useState<'HINDI' | 'ENGLISH'>('HINDI');
  const [defaultLanguage, setDefaultLanguage] = useState<'HINDI' | 'ENGLISH'>('HINDI');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals inside live exam
  const [showSubmitModal, setShowSubmitModal] = useState(false); // Page 7
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showQuestionPaperModal, setShowQuestionPaperModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Question is incorrect or ambiguous');
  const [reportComment, setReportComment] = useState('');

  // Timer & Fullscreen
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const questionStartTimeRef = useRef<number>(Date.now());
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const autoSaveTimeoutRef = useRef<any>(null);

  // Start or resume test from backend
  useEffect(() => {
    if (!id) return;
    const loadTest = async () => {
      try {
        setLoading(true);
        // Call start endpoint to register or resume test attempt
        const data = await api.tests.start(id);
        if (data.success) {
          setTestInfo(data.test);
          setAttemptId(data.attempt?.id || null);
          const qList = data.questions || [];
          setQuestions(qList);

          const durationSecs = (data.test.durationMinutes || 60) * 60;
          let remaining = durationSecs;

          if (data.attempt) {
            // Restore previous attempt if resumed
            if (data.attempt.answersMap) {
              setAnswers(data.attempt.answersMap);
            }
            if (data.attempt.markedQuestions && Array.isArray(data.attempt.markedQuestions)) {
              const markedMap: Record<string, boolean> = {};
              data.attempt.markedQuestions.forEach((qKey: string) => {
                markedMap[qKey] = true;
              });
              setMarkedForReview(markedMap);
            }
            if (data.attempt.currentQuestionIndex !== undefined && data.attempt.currentQuestionIndex !== null) {
              setCurrentIndex(Math.min(data.attempt.currentQuestionIndex, Math.max(0, qList.length - 1)));
            }
            if (data.attempt.secondsRemaining !== undefined && data.attempt.secondsRemaining > 0) {
              remaining = data.attempt.secondsRemaining;
            } else if (data.attempt.timeSpentSeconds) {
              remaining = Math.max(30, durationSecs - data.attempt.timeSpentSeconds);
            }

            // If user already had answers and test was IN_PROGRESS, skip instructions straight to live_exam
            if (data.isResumed && data.attempt.status === 'IN_PROGRESS' && Object.keys(data.attempt.answersMap || {}).length > 0) {
              setExamStep('live_exam');
              info('Resumed previous in-progress examination session.');
            }
          }

          setSecondsRemaining(remaining);

          if (qList.length > 0) {
            const firstId = qList[0].questionId || qList[0].id;
            setVisitedQuestions({ [firstId]: true });
          }
        }
      } catch (err: any) {
        toastError(err.message || 'Unable to start test.');
        navigate('/test-series');
      } finally {
        setLoading(false);
      }
    };
    loadTest();
  }, [id]);

  // Debounced auto-save function
  const triggerAutoSave = useCallback(
    (newAnswers: Record<string, string>, newMarked: Record<string, boolean>, newIdx: number, newSecs: number) => {
      if (!id || examStep !== 'live_exam') return;
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          const markedArr = Object.keys(newMarked).filter((k) => newMarked[k]);
          const totalSecs = (testInfo?.durationMinutes || 60) * 60;
          await api.tests.saveProgress(id, {
            answersMap: newAnswers,
            markedQuestions: markedArr,
            currentQuestionIndex: newIdx,
            secondsRemaining: newSecs,
            timeSpentSeconds: Math.max(0, totalSecs - newSecs),
          });
        } catch {
          // Silent catch for background autosave
        }
      }, 800);
    },
    [id, examStep, testInfo]
  );

  // Countdown timer (only ticks during live_exam and not paused)
  useEffect(() => {
    if (examStep !== 'live_exam' || isPaused || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examStep, isPaused, secondsRemaining]);

  // Extract unique sections from questions
  const sections = React.useMemo(() => {
    const list = Array.from(new Set(questions.map((q) => q.sectionName || q.subject || 'General')));
    return list.length > 1 ? ['All', ...list] : list;
  }, [questions]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSelectQuestion = (idx: number) => {
    // Record time spent on previous question
    const prevQ = questions[currentIndex];
    if (prevQ) {
      const prevId = prevQ.questionId || prevQ.id;
      const spent = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
      setQuestionTimes((t) => ({ ...t, [prevId]: (t[prevId] || 0) + spent }));
    }

    setCurrentIndex(idx);
    questionStartTimeRef.current = Date.now();

    const q = questions[idx];
    if (q) {
      const qId = q.questionId || q.id;
      setVisitedQuestions((prev) => ({ ...prev, [qId]: true }));
    }

    triggerAutoSave(answers, markedForReview, idx, secondsRemaining);
  };

  const handleSelectOption = (optIndex: number) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const qId = currentQ.questionId || currentQ.id;
    const updatedAnswers = { ...answers, [qId]: String(optIndex) };
    setAnswers(updatedAnswers);
    triggerAutoSave(updatedAnswers, markedForReview, currentIndex, secondsRemaining);
  };

  const handleClearResponse = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const qId = currentQ.questionId || currentQ.id;
    const updatedAnswers = { ...answers };
    delete updatedAnswers[qId];
    setAnswers(updatedAnswers);
    triggerAutoSave(updatedAnswers, markedForReview, currentIndex, secondsRemaining);
  };

  const handleToggleReviewAndNext = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const qId = currentQ.questionId || currentQ.id;
    const updatedMarked = { ...markedForReview, [qId]: !markedForReview[qId] };
    setMarkedForReview(updatedMarked);

    const nextIdx = currentIndex < questions.length - 1 ? currentIndex + 1 : currentIndex;
    if (currentIndex < questions.length - 1) {
      handleSelectQuestion(nextIdx);
    } else {
      triggerAutoSave(answers, updatedMarked, currentIndex, secondsRemaining);
    }
  };

  const handleSaveAndNext = () => {
    if (currentIndex < questions.length - 1) {
      handleSelectQuestion(currentIndex + 1);
    } else {
      setShowSubmitModal(true);
    }
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting || !id) return;
    try {
      setIsSubmitting(true);
      const answerPayload = Object.entries(answers).map(([qId, val]) => ({
        questionId: qId,
        selectedOption: val,
      }));

      const res = await api.tests.submitTest(id, {
        answers: answerPayload,
        timeSpentSeconds: (testInfo?.durationMinutes || 60) * 60 - secondsRemaining,
      });

      if (res.success && res.attempt) {
        success('Examination successfully submitted!');
        navigate(`/test-series/${id}/result/${res.attempt.id}`);
      } else {
        toastError('Failed to record submission.');
      }
    } catch (err: any) {
      toastError(err.message || 'Submission error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportQuestion = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    try {
      await api.tests.reportQuestion({
        questionId: currentQ.questionId || currentQ.id,
        testId: id,
        reason: reportReason,
        comment: reportComment,
      });
      success('Question reported. Thank you for helping improve quality!');
      setShowReportModal(false);
      setReportComment('');
    } catch {
      toastError('Failed to submit question report.');
    }
  };

  // Format time MM:SS or HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800/90 p-8 rounded-3xl text-center space-y-4 max-w-sm border border-slate-700 shadow-2xl">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-200">Setting up secure CBT session...</p>
          <span className="text-xs text-slate-400">Loading questions, instructions & timer</span>
        </div>
      </div>
    );
  }

  if (!testInfo || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl text-center space-y-4 max-w-md border border-slate-200 shadow-xl">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="font-bold text-lg text-slate-900">No Questions Found</h3>
          <p className="text-xs text-slate-500">The administrator has not added questions to this test paper yet.</p>
          <button
            onClick={() => navigate('/test-series')}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 text-white font-bold text-xs"
          >
            Back to Test Series
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PAGE 4: Fullscreen General Instructions Screen
  // -------------------------------------------------------------
  if (examStep === 'general_instructions') {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
        {/* Top Header */}
        <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black tracking-tight text-slate-900">
              Lo Samajh Lo <span className="text-cyan-600">CBT</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-bold text-slate-600 truncate max-w-md">
              {testInfo.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-900">{user?.name || 'Candidate'}</div>
              <div className="text-[10px] text-slate-400">Roll: LSL-2026-8921</div>
            </div>
          </div>
        </header>

        {/* Content Body matching Page 3 Screenshot */}
        <main className="max-w-4xl mx-auto w-full px-6 py-8 space-y-6 flex-1 overflow-y-auto text-xs sm:text-sm">
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              General Instructions:
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Please read the instructions carefully before starting the exam.
            </p>
          </div>

          <div className="space-y-4 text-slate-700 leading-relaxed">
            <ol className="list-decimal pl-6 space-y-3 font-normal">
              <li>
                The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination manually.
              </li>
              <li>
                The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:
              </li>
            </ol>

            {/* Symbols Legend matching Screenshot Page 3 */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 my-4">
              <div className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </span>
                <span className="text-xs font-semibold text-slate-700">You have not visited the question yet.</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </span>
                <span className="text-xs font-semibold text-slate-700">You have not answered the question.</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </span>
                <span className="text-xs font-semibold text-slate-700">You have answered the question.</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  4
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  You have NOT answered the question, but have marked the question for review.
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 relative">
                  5
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  The question(s) "Answered and Marked for Review" will be considered for evaluation.
                </span>
              </div>
            </div>

            <ol start={3} className="list-decimal pl-6 space-y-3 font-normal">
              <li>
                Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.
              </li>
              <li>
                Click on <span className="font-bold text-slate-900">Save & Next</span> to save your answer for the current question and then go to the next question.
              </li>
              <li>
                Click on <span className="font-bold text-slate-900">Mark for Review & Next</span> to save your answer for the current question, mark it for review, and then go to the next question.
              </li>
            </ol>
          </div>
        </main>

        {/* Bottom Bar */}
        <footer className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={() => setExamStep('specific_instructions')}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs shadow-md shadow-cyan-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PAGE 5: Specific Instructions & Declaration Checkbox Screen
  // -------------------------------------------------------------
  if (examStep === 'specific_instructions') {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
        {/* Top Header */}
        <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black tracking-tight text-slate-900">
              Lo Samajh Lo <span className="text-cyan-600">CBT</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-bold text-slate-600 truncate max-w-md">
              {testInfo.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-900">{user?.name || 'Candidate'}</div>
              <div className="text-[10px] text-slate-400">Roll: LSL-2026-8921</div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="max-w-4xl mx-auto w-full px-6 py-8 space-y-6 flex-1 overflow-y-auto text-xs sm:text-sm">
          <div className="border-b border-slate-200 pb-4 space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {testInfo.title}
            </h1>
            <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
              <span>Duration: {testInfo.durationMinutes || 60} Mins</span>
              <span>•</span>
              <span>Total Marks: {testInfo.totalMarks || 100}</span>
              <span>•</span>
              <span>Total Questions: {questions.length}</span>
            </div>
          </div>

          <div className="space-y-3 text-slate-700">
            <h3 className="font-bold text-sm text-slate-900">Read the following instructions carefully:</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>The test contains {questions.length} questions across scheduled exam sections.</li>
              <li>Each question has 4 options out of which only one is correct.</li>
              <li>You have to finish the test within {testInfo.durationMinutes || 60} minutes.</li>
              <li>You will be awarded positive marks for each correct answer. Negative marking applies for wrong attempts ({testInfo.negativeMarking || 0.25} marks).</li>
              <li>There is no negative marking for questions that you have not attempted.</li>
              <li>You can write this test only once. Make sure you do not close the browser tab until you submit.</li>
            </ol>
          </div>

          {/* Language selection matching Screenshot Page 4 bottom */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="font-bold text-slate-800">
                Choose your default language:
              </label>
              <select
                value={defaultLanguage}
                onChange={(e) => {
                  const val = e.target.value as 'HINDI' | 'ENGLISH';
                  setDefaultLanguage(val);
                  setLanguage(val);
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-cyan-500/20"
              >
                <option value="HINDI">Hindi (हिंदी)</option>
                <option value="ENGLISH">English</option>
              </select>
            </div>
            <p className="text-[11px] text-rose-600 font-medium">
              Please note all questions will appear in your default language. This language can be changed for a particular question later on.
            </p>
          </div>

          {/* Declaration Checkbox */}
          <div className="pt-4 border-t border-slate-200 space-y-2 bg-slate-50 p-4 rounded-2xl">
            <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">Declaration:</h4>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500"
              />
              <span className="text-xs text-slate-700 leading-normal font-medium">
                I have read and understood all the instructions. I declare that all computer peripherals, mouse and internet are functioning properly and I will attempt this test with honesty.
              </span>
            </label>
          </div>
        </main>

        {/* Bottom Bar */}
        <footer className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => setExamStep('general_instructions')}
            className="px-5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs"
          >
            Previous
          </button>

          <button
            disabled={!declarationAccepted}
            onClick={() => {
              setExamStep('live_exam');
              questionStartTimeRef.current = Date.now();
            }}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs shadow-md shadow-cyan-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            I am Ready to begin
          </button>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PAGE 6: Fullscreen Live CBT Exam Screen
  // -------------------------------------------------------------
  const currentQ = questions[currentIndex] || questions[0];
  const qId = currentQ.questionId || currentQ.id;
  const currentAnswer = answers[qId];

  // Bilingual Options & Question text
  const currentQuestionText =
    language === 'HINDI' && currentQ.questionHindi
      ? currentQ.questionHindi
      : language === 'ENGLISH' && currentQ.questionEnglish
      ? currentQ.questionEnglish
      : currentQ.questionText;

  let renderedOptions: string[] = [];
  if (language === 'HINDI' && currentQ.optionsHindi && currentQ.optionsHindi.length > 0) {
    renderedOptions = currentQ.optionsHindi;
  } else if (language === 'ENGLISH' && currentQ.optionsEnglish && currentQ.optionsEnglish.length > 0) {
    renderedOptions = currentQ.optionsEnglish;
  } else if (Array.isArray(currentQ.options)) {
    renderedOptions = currentQ.options;
  } else if (typeof currentQ.options === 'string') {
    try {
      renderedOptions = JSON.parse(currentQ.options);
    } catch {
      renderedOptions = [currentQ.options];
    }
  }

  // Calculate Section summary counts for Page 7 modal
  const sectionSummaryMap: Record<string, { total: number; answered: number; notAnswered: number; marked: number; notVisited: number }> = {};
  questions.forEach((q) => {
    const sec = q.sectionName || q.subject || 'General';
    if (!sectionSummaryMap[sec]) {
      sectionSummaryMap[sec] = { total: 0, answered: 0, notAnswered: 0, marked: 0, notVisited: 0 };
    }
    sectionSummaryMap[sec].total++;
    const thisQId = q.questionId || q.id;
    const isAns = answers[thisQId] !== undefined && answers[thisQId] !== '';
    const isRev = !!markedForReview[thisQId];
    const isVis = !!visitedQuestions[thisQId];

    if (isAns) sectionSummaryMap[sec].answered++;
    else if (isRev) sectionSummaryMap[sec].marked++;
    else if (isVis) sectionSummaryMap[sec].notAnswered++;
    else sectionSummaryMap[sec].notVisited++;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white select-none">
      {/* Top Header Bar */}
      <header className="px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-base font-black tracking-tight text-slate-900">
            Lo Samajh Lo <span className="text-cyan-600">CBT</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-slate-700 truncate max-w-xs sm:max-w-md">
            {testInfo.title}
          </span>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto max-w-md scrollbar-none">
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setCurrentSection(sec)}
              className={`px-3 py-1 rounded-lg transition-all whitespace-nowrap ${
                currentSection === sec
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Right Header: Timer, Fullscreen, Profile */}
        <div className="flex items-center gap-3">
          {/* Timer Display */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
              secondsRemaining < 300
                ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-600" />
            <span>Time Left: {formatTime(secondsRemaining)}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Toggle Fullscreen Mode"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Pause Button */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title={isPaused ? 'Resume Exam' : 'Pause Exam'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-600" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Candidate Avatar */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <span className="hidden md:inline text-xs font-bold text-slate-800">
              {user?.name || 'Candidate'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Examination Layout: 2 Columns */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Question Area */}
        <div className="flex-1 flex flex-col justify-between bg-white border-r border-slate-200 overflow-y-auto">
          {/* Question Sub-header */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 font-bold">
              <span className="text-slate-900">Question No. {currentIndex + 1}</span>
              <span className="text-emerald-600 font-mono">Marks: +{currentQ.marks || 1}</span>
              <span className="text-rose-600 font-mono">-{currentQ.negativeMarks || 0.25}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'HINDI' | 'ENGLISH')}
                  className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 py-1 font-semibold text-slate-700 outline-none"
                >
                  <option value="HINDI">View in Hindi</option>
                  <option value="ENGLISH">View in English</option>
                </select>
              </div>

              <button
                onClick={() => setShowReportModal(true)}
                className="text-slate-400 hover:text-rose-600 text-[11px] flex items-center gap-1 transition-colors"
                title="Report question error"
              >
                <Flag className="w-3 h-3" />
                <span>Report</span>
              </button>
            </div>
          </div>

          {/* Question Text & Options */}
          <div className="p-6 sm:p-8 space-y-6 flex-1">
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
              {currentQuestionText}
            </div>

            {/* Options List */}
            <div className="space-y-3 max-w-2xl">
              {renderedOptions.map((optText, optIdx) => {
                const isSelected = currentAnswer === String(optIdx);
                const letter = ['A', 'B', 'C', 'D'][optIdx] || String(optIdx + 1);

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-cyan-50/80 border-cyan-500 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isSelected
                          ? 'border-cyan-600 bg-cyan-600 text-white'
                          : 'border-slate-300 text-slate-500'
                      }`}
                    >
                      {letter}
                    </div>
                    <span className="text-xs sm:text-sm text-slate-800 font-medium">
                      {optText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Strip matching Screenshot Page 5 */}
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleReviewAndNext}
                className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition-colors"
              >
                Mark for Review & Next
              </button>
              <button
                type="button"
                onClick={handleClearResponse}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200 transition-colors"
              >
                Clear Response
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveAndNext}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs shadow-md shadow-cyan-600/20 transition-all hover:scale-105 active:scale-95"
            >
              Save & Next
            </button>
          </div>
        </div>

        {/* Right Column: Question Palette Sidebar */}
        <div className="w-full lg:w-80 bg-white border-l border-slate-200 p-4 space-y-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            {/* Legend Box */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] space-y-2">
              <div className="grid grid-cols-2 gap-2 text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold">
                    ✓
                  </span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                    ✕
                  </span>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                    ?
                  </span>
                  <span>Marked Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-white border border-slate-300" />
                  <span>Not Visited</span>
                </div>
              </div>
            </div>

            {/* Section label */}
            <div className="text-xs font-black uppercase text-slate-500 tracking-wider">
              SECTION: {currentSection}
            </div>

            {/* Questions Grid 1 to N */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const thisQId = q.questionId || q.id;
                const isSelected = idx === currentIndex;
                const isAns = answers[thisQId] !== undefined && answers[thisQId] !== '';
                const isRev = !!markedForReview[thisQId];
                const isVis = !!visitedQuestions[thisQId];

                let bgClass = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
                if (isAns && isRev) {
                  bgClass = 'bg-purple-600 text-white border-purple-600 ring-2 ring-emerald-400';
                } else if (isAns) {
                  bgClass = 'bg-emerald-500 text-white border-emerald-500';
                } else if (isRev) {
                  bgClass = 'bg-purple-600 text-white border-purple-600';
                } else if (isVis) {
                  bgClass = 'bg-rose-500 text-white border-rose-500';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectQuestion(idx)}
                    className={`h-9 rounded-xl border text-xs font-bold transition-all flex items-center justify-center ${bgClass} ${
                      isSelected ? 'ring-2 ring-cyan-500 scale-105 shadow-sm' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Palette Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowQuestionPaperModal(true)}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors text-center"
              >
                Question Paper
              </button>
              <button
                type="button"
                onClick={() => setShowInstructionsModal(true)}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors text-center"
              >
                Instructions
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs shadow-md shadow-cyan-600/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* PAGE 7: Test Submit Summary Table Dialog */}
      {/* ------------------------------------------------------------- */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Submit Your Test</h3>
              <p className="text-xs text-slate-500">
                Please verify your attempt summary before final submission.
              </p>
            </div>

            {/* Summary Table matching Screenshot Page 5 middle */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-cyan-600 text-white font-bold">
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4 text-center">No. of questions</th>
                    <th className="py-3 px-4 text-center">Answered</th>
                    <th className="py-3 px-4 text-center">Not Answered</th>
                    <th className="py-3 px-4 text-center">Marked for Review</th>
                    <th className="py-3 px-4 text-center">Not Visited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(sectionSummaryMap).map(([secName, counts]) => (
                    <tr key={secName} className="hover:bg-slate-50/60 font-semibold text-slate-700">
                      <td className="py-3 px-4 font-bold text-slate-900">{secName}</td>
                      <td className="py-3 px-4 text-center">{counts.total}</td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">{counts.answered}</td>
                      <td className="py-3 px-4 text-center text-rose-500 font-bold">{counts.notAnswered}</td>
                      <td className="py-3 px-4 text-center text-purple-600 font-bold">{counts.marked}</td>
                      <td className="py-3 px-4 text-center text-slate-400">{counts.notVisited}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-[11px] text-rose-700 text-center font-medium">
              ⚠️ Are you sure you want to submit? Once submitted, you cannot resume this examination.
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Close / Resume Test
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs shadow-md shadow-cyan-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Paper View Modal */}
      {showQuestionPaperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Question Paper View</h3>
              <button onClick={() => setShowQuestionPaperModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              {questions.map((q, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="font-bold text-slate-900">Q{idx + 1}. {q.questionText}</div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    {(Array.isArray(q.options) ? q.options : []).map((op: string, oIdx: number) => (
                      <div key={oIdx}>({['A', 'B', 'C', 'D'][oIdx]}) {op}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Question Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Flag className="w-4 h-4 text-rose-500" />
                Report Question #{currentIndex + 1}
              </h3>
              <button onClick={() => setShowReportModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <label className="block font-bold text-slate-700">Select Issue Reason:</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none"
              >
                <option value="Question is incorrect or ambiguous">Question is incorrect or ambiguous</option>
                <option value="Options are incorrect or missing">Options are incorrect or missing</option>
                <option value="Hindi translation error">Hindi translation error</option>
                <option value="Out of syllabus or formatting issue">Out of syllabus or formatting issue</option>
              </select>

              <label className="block font-bold text-slate-700">Detailed comments (optional):</label>
              <textarea
                value={reportComment}
                onChange={(e) => setReportComment(e.target.value)}
                placeholder="Explain what is wrong with this question..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none h-20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleReportQuestion}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Exam Instructions</h3>
              <button onClick={() => setShowInstructionsModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>• Green: Question Answered.</p>
              <p>• Red: Question Visited but not answered.</p>
              <p>• Purple: Marked for Review.</p>
              <p>• White: Not visited yet.</p>
              <p>• Questions can be answered in any order. The countdown timer runs continuously.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAttemptPage;
