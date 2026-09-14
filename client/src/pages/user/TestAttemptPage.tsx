import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
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
  Menu,
  Layers,
} from 'lucide-react';
import { api } from '../../services/api';
import { Question } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const TestAttemptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Drawers inside live exam
  const [showSubmitModal, setShowSubmitModal] = useState(false); // Page 7
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showQuestionPaperModal, setShowQuestionPaperModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [reportReason, setReportReason] = useState('Question is incorrect or ambiguous');
  const [reportComment, setReportComment] = useState('');

  // Two Independent Timers:
  // 1. Overall Countdown Timer (seconds remaining in entire exam)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);
  // 2. Current Question Stopwatch (live seconds ticking on active question)
  const [currentQuestionSeconds, setCurrentQuestionSeconds] = useState<number>(0);
  // Total cumulative seconds recorded per question ID
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});

  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const autoSaveTimeoutRef = useRef<any>(null);

  // Start or resume test from backend
  useEffect(() => {
    if (!id) return;
    const loadTest = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        // Call start endpoint to register or resume test attempt (passing preview flag if set)
        const data = await api.tests.start(id, { preview: isPreview }, isPreview ? { preview: 'true' } : undefined);
        if (data.success && data.test) {
          setTestInfo(data.test);
          setAttemptId(data.attempt?.id || data.attemptId || null);
          const qList = data.questions || [];
          setQuestions(qList);

          const durationSecs = (data.test.durationMinutes || 60) * 60;
          let remaining = durationSecs;
          let initialIdx = 0;
          const restoredTimes: Record<string, number> = {};

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
              initialIdx = Math.min(data.attempt.currentQuestionIndex, Math.max(0, qList.length - 1));
              setCurrentIndex(initialIdx);
            }
            if (data.attempt.secondsRemaining !== undefined && data.attempt.secondsRemaining > 0) {
              remaining = data.attempt.secondsRemaining;
            } else if (data.attempt.timeSpentSeconds) {
              remaining = Math.max(30, durationSecs - data.attempt.timeSpentSeconds);
            }

            // Restore per-question time tracking
            if (data.attempt.timeSpentPerQuestion && typeof data.attempt.timeSpentPerQuestion === 'object') {
              Object.assign(restoredTimes, data.attempt.timeSpentPerQuestion);
              setQuestionTimes(restoredTimes);
            }

            // Populate visited questions from answered or resumed state
            const visitedMap: Record<string, boolean> = {};
            if (data.attempt.answersMap) {
              Object.keys(data.attempt.answersMap).forEach((k) => {
                visitedMap[k] = true;
              });
            }
            if (qList[initialIdx]) {
              const currentId = qList[initialIdx].questionId || qList[initialIdx].id;
              visitedMap[currentId] = true;
            }
            setVisitedQuestions(visitedMap);

            // If user already had answers and test was IN_PROGRESS, skip instructions straight to live_exam
            if (data.isResumed && data.attempt.status === 'IN_PROGRESS' && Object.keys(data.attempt.answersMap || {}).length > 0) {
              setExamStep('live_exam');
              info('Resumed previous in-progress examination session.');
            }
          } else {
            // First time loading test
            if (qList.length > 0) {
              const firstId = qList[0].questionId || qList[0].id;
              setVisitedQuestions({ [firstId]: true });
            }
          }

          setSecondsRemaining(remaining);

          // Initialize current question seconds from restored time
          if (qList[initialIdx]) {
            const currentQId = qList[initialIdx].questionId || qList[initialIdx].id;
            setCurrentQuestionSeconds(restoredTimes[currentQId] || 0);
          }
        } else {
          throw new Error(data.message || 'Unable to start examination.');
        }
      } catch (err: any) {
        if (isPreview) {
          setErrorMessage(err.message || 'Unable to start direct CBT preview.');
        } else {
          toastError(err.message || 'Unable to start test.');
          navigate('/test-series');
        }
      } finally {
        setLoading(false);
      }
    };
    loadTest();
  }, [id, isPreview]);

  // Debounced auto-save function with status indicator
  const triggerAutoSave = useCallback(
    (
      newAnswers: Record<string, string>,
      newMarked: Record<string, boolean>,
      newIdx: number,
      newSecs: number,
      updatedQTimes?: Record<string, number>
    ) => {
      if (!id || examStep !== 'live_exam') return;
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);

      setAutoSaveStatus('saving');

      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          const markedArr = Object.keys(newMarked).filter((k) => newMarked[k]);
          const totalSecs = (testInfo?.durationMinutes || 60) * 60;
          const activeQ = questions[newIdx];
          const activeId = activeQ?.questionId || activeQ?.id;

          const qTimes = updatedQTimes || {
            ...questionTimes,
            ...(activeId ? { [activeId]: currentQuestionSeconds } : {}),
          };

          await api.tests.saveProgress(id, {
            attemptId: attemptId || undefined,
            answersMap: newAnswers,
            markedQuestions: markedArr,
            currentQuestionIndex: newIdx,
            secondsRemaining: newSecs,
            timeSpentSeconds: Math.max(0, totalSecs - newSecs),
            timeSpentPerQuestion: qTimes,
          });
          setAutoSaveStatus('saved');
        } catch {
          setAutoSaveStatus('error');
        }
      }, 800);
    },
    [id, attemptId, examStep, testInfo, questions, questionTimes, currentQuestionSeconds]
  );

  // Two Timers:
  // Overall countdown decreases by 1 every second.
  // Question stopwatch increases by 1 every second.
  useEffect(() => {
    if (examStep !== 'live_exam' || isPaused || secondsRemaining <= 0) return;

    const interval = setInterval(() => {
      // 1. Increment Question Stopwatch
      setCurrentQuestionSeconds((prev) => prev + 1);

      // 2. Decrement Overall Test Countdown
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
  const sections = useMemo(() => {
    const list = Array.from(new Set(questions.map((q) => q.sectionName || q.subject || 'General')));
    return list.length > 1 ? ['All', ...list] : list;
  }, [questions]);

  // Filter questions by section if selected
  const filteredQuestions = useMemo(() => {
    return questions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q }) => currentSection === 'All' || (q.sectionName || q.subject || 'General') === currentSection);
  }, [questions, currentSection]);

  // Calculate 5-state summary counts for palette & submission modal
  const summaryCounts = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let marked = 0;
    let answeredAndMarked = 0;
    let notVisited = 0;

    questions.forEach((q) => {
      const qId = q.questionId || q.id;
      const isAns = answers[qId] !== undefined && answers[qId] !== '';
      const isRev = !!markedForReview[qId];
      const isVis = !!visitedQuestions[qId];

      if (isAns && isRev) {
        answeredAndMarked++;
      } else if (isAns) {
        answered++;
      } else if (isRev) {
        marked++;
      } else if (isVis) {
        notAnswered++;
      } else {
        notVisited++;
      }
    });

    return {
      answered,
      notAnswered,
      marked,
      answeredAndMarked,
      notVisited,
      total: questions.length,
    };
  }, [questions, answers, markedForReview, visitedQuestions]);

  // Calculate section-wise breakdown for Page 7 modal
  const sectionSummaryMap = useMemo(() => {
    const map: Record<
      string,
      {
        total: number;
        answered: number;
        notAnswered: number;
        marked: number;
        answeredAndMarked: number;
        notVisited: number;
      }
    > = {};

    questions.forEach((q) => {
      const sec = q.sectionName || q.subject || 'General';
      if (!map[sec]) {
        map[sec] = { total: 0, answered: 0, notAnswered: 0, marked: 0, answeredAndMarked: 0, notVisited: 0 };
      }
      map[sec].total++;

      const thisQId = q.questionId || q.id;
      const isAns = answers[thisQId] !== undefined && answers[thisQId] !== '';
      const isRev = !!markedForReview[thisQId];
      const isVis = !!visitedQuestions[thisQId];

      if (isAns && isRev) {
        map[sec].answeredAndMarked++;
      } else if (isAns) {
        map[sec].answered++;
      } else if (isRev) {
        map[sec].marked++;
      } else if (isVis) {
        map[sec].notAnswered++;
      } else {
        map[sec].notVisited++;
      }
    });

    return map;
  }, [questions, answers, markedForReview, visitedQuestions]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSelectSection = (sec: string) => {
    setCurrentSection(sec);
    if (sec !== 'All') {
      const firstSecIdx = questions.findIndex(
        (q) => (q.sectionName || q.subject || 'General') === sec
      );
      if (firstSecIdx !== -1) {
        handleSelectQuestion(firstSecIdx);
      }
    }
  };

  const handleSelectQuestion = (nextIdx: number) => {
    if (nextIdx < 0 || nextIdx >= questions.length) return;

    // Record and preserve elapsed time on previous question
    const prevQ = questions[currentIndex];
    const prevId = prevQ ? (prevQ.questionId || prevQ.id) : null;
    const nextQ = questions[nextIdx];
    const nextId = nextQ ? (nextQ.questionId || nextQ.id) : null;

    const updatedTimes = { ...questionTimes };
    if (prevId) {
      updatedTimes[prevId] = currentQuestionSeconds;
    }
    setQuestionTimes(updatedTimes);

    // Switch active question
    setCurrentIndex(nextIdx);

    // Restore previously accumulated seconds on next question
    if (nextId) {
      setCurrentQuestionSeconds(updatedTimes[nextId] || 0);
      setVisitedQuestions((prev) => ({ ...prev, [nextId]: true }));
    }

    triggerAutoSave(answers, markedForReview, nextIdx, secondsRemaining, updatedTimes);
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

    if (currentIndex < questions.length - 1) {
      handleSelectQuestion(currentIndex + 1);
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
      const activeQId = questions[currentIndex]?.questionId || questions[currentIndex]?.id;
      const finalQuestionTimes = {
        ...questionTimes,
        ...(activeQId ? { [activeQId]: currentQuestionSeconds } : {}),
      };

      // Save progress right before submitting to persist question stopwatch counters
      try {
        await api.tests.saveProgress(id, {
          attemptId: attemptId || undefined,
          answersMap: answers,
          markedQuestions: Object.keys(markedForReview).filter((k) => markedForReview[k]),
          currentQuestionIndex: currentIndex,
          secondsRemaining,
          timeSpentSeconds: (testInfo?.durationMinutes || 60) * 60 - secondsRemaining,
          timeSpentPerQuestion: finalQuestionTimes,
        });
      } catch {
        // Proceed to submit even if background autosave throws
      }

      const answerPayload = Object.entries(answers).map(([qId, val]) => ({
        questionId: qId,
        selectedOption: val,
      }));

      const res = await api.tests.submitTest(id, {
        attemptId: attemptId || undefined,
        answers: answerPayload,
        timeSpentSeconds: (testInfo?.durationMinutes || 60) * 60 - secondsRemaining,
        preview: isPreview,
      });

      if (res.success) {
        success('Examination successfully submitted!');
        const resId = res.attempt?.id || res.attemptId || res.result?.id || 'preview-result';
        navigate(`/test-series/${id}/result/${resId}${isPreview ? '?preview=true' : ''}`);
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
    const s = Math.max(0, totalSeconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800/90 p-8 rounded-3xl text-center space-y-4 max-w-sm border border-slate-700 shadow-2xl">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-200">Setting up secure CBT session...</p>
          <span className="text-xs text-slate-400">Loading questions, instructions & timer</span>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-3xl text-center space-y-4 max-w-md border border-slate-700 shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="font-bold text-lg text-white">Preview CBT Session Notice</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{errorMessage}</p>
          <div className="flex items-center justify-center gap-3 pt-3">
            <Link
              to={`/admin/tests/${id}/questions`}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
            >
              Open Question Manager
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!testInfo || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl text-center space-y-4 max-w-md border border-slate-200 shadow-xl">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="font-bold text-lg text-slate-900">
            {isPreview ? 'No Questions Added to Test' : 'No Questions Found'}
          </h3>
          <p className="text-xs text-slate-500">
            {isPreview
              ? 'This test currently has 0 questions attached. Click below to add questions via manual input, Excel/CSV upload, or Question Bank import.'
              : 'The administrator has not added questions to this test paper yet.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {isPreview && (
              <Link
                to={`/admin/tests/${id}/questions`}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
              >
                Manage Questions
              </Link>
            )}
            <button
              onClick={() => navigate('/test-series')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Back to Test Series
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PAGE 4: Fullscreen General Instructions Screen
  // -------------------------------------------------------------
  if (examStep === 'general_instructions') {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-blue-500 selection:text-white">
        {isPreview && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] tracking-wider uppercase">ADMIN PREVIEW MODE</span>
              <span>Direct CBT Exam Simulator • Questions: {questions.length} • Total Marks: {testInfo?.totalMarks || 100} • Duration: {testInfo?.durationMinutes || 60}m</span>
            </div>
            <Link
              to={`/admin/tests/${id}/questions`}
              className="px-3 py-1 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-[11px] font-bold shadow-xs transition-all"
            >
              Manage Questions
            </Link>
          </div>
        )}
        {/* Top Header */}
        <header className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shadow-xs">
          <div className="flex items-center gap-3">
            <img
              src="/logo-horizontal.png"
              alt="Lo Samajh Lo"
              className="h-7 sm:h-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#0B2A63] text-white tracking-wider uppercase">CBT</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-bold text-slate-700 truncate max-w-md">
              {testInfo.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0B2A63] text-white flex items-center justify-center font-bold text-sm shadow-xs">
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
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              General Instructions:
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Please read the instructions carefully before proceeding to the examination.
            </p>
          </div>

          <div className="space-y-4 text-slate-700 leading-relaxed">
            <ol className="list-decimal pl-6 space-y-3 font-normal">
              <li>
                The countdown timer in the top right corner of the screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end automatically. You will not be required to end or submit your examination manually.
              </li>
              <li>
                The Question Palette displayed on the right side of the screen will show the status of each question using one of the following 5 symbols:
              </li>
            </ol>

            {/* Symbols Legend matching 5-state specification */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 my-4">
              <div className="flex items-center gap-4">
                <span className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  1
                </span>
                <span className="text-xs font-semibold text-slate-700">You have not visited the question yet.</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  2
                </span>
                <span className="text-xs font-semibold text-slate-700">You have not answered the question.</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  3
                </span>
                <span className="text-xs font-semibold text-slate-700">You have answered the question.</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  4
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  You have NOT answered the question, but have marked the question for review.
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 relative shadow-xs">
                  5
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  The question(s) <strong>"Answered and Marked for Review"</strong> will be evaluated in the final score.
                </span>
              </div>
            </div>

            <ol start={3} className="list-decimal pl-6 space-y-3 font-normal">
              <li>
                Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.
              </li>
              <li>
                Click on <span className="font-bold text-slate-900">Save & Next</span> to save your answer for the current question and go to the next question.
              </li>
              <li>
                Click on <span className="font-bold text-slate-900">Mark for Review & Next</span> to save your answer for the current question, mark it for review, and go to the next question.
              </li>
              <li>
                Each question has an individual <strong>Question Stopwatch</strong> that keeps track of the time you spend on that question and remembers it if you revisit.
              </li>
            </ol>
          </div>
        </main>

        {/* Bottom Bar */}
        <footer className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={() => setExamStep('specific_instructions')}
            className="px-6 py-2.5 rounded-xl bg-[#0B2A63] hover:bg-blue-900 text-white font-black text-xs shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
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
      <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-blue-500 selection:text-white">
        {isPreview && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] tracking-wider uppercase">ADMIN PREVIEW MODE</span>
              <span>Direct CBT Exam Simulator • Questions: {questions.length} • Total Marks: {testInfo?.totalMarks || 100} • Duration: {testInfo?.durationMinutes || 60}m</span>
            </div>
            <Link
              to={`/admin/tests/${id}/questions`}
              className="px-3 py-1 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-[11px] font-bold shadow-xs transition-all"
            >
              Manage Questions
            </Link>
          </div>
        )}
        {/* Top Header */}
        <header className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shadow-xs">
          <div className="flex items-center gap-3">
            <img
              src="/logo-horizontal.png"
              alt="Lo Samajh Lo"
              className="h-7 sm:h-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#0B2A63] text-white tracking-wider uppercase">CBT</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-bold text-slate-700 truncate max-w-md">
              {testInfo.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0B2A63] text-white flex items-center justify-center font-bold text-sm shadow-xs">
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
              <li>You will be awarded positive marks (+{testInfo.positiveMarks || 1}) for each correct answer. Negative marking applies for wrong attempts (-{testInfo.negativeMarking || 0.25} marks).</li>
              <li>There is no negative marking for questions that you have not attempted.</li>
              <li>You can write this test only once. Make sure you do not close the browser tab until you submit.</li>
            </ol>
          </div>

          {/* Language selection */}
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
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
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
          <div className="pt-4 border-t border-slate-200 space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">Declaration:</h4>
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
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
            }}
            className="px-6 py-2.5 rounded-xl bg-[#0B2A63] hover:bg-blue-900 text-white font-black text-xs shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
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
  const qId = currentQ?.questionId || currentQ?.id;
  const currentAnswer = answers[qId];

  // Bilingual Options & Question text
  const currentQuestionText =
    language === 'HINDI' && currentQ?.questionHindi
      ? currentQ.questionHindi
      : language === 'ENGLISH' && currentQ?.questionEnglish
      ? currentQ.questionEnglish
      : currentQ?.questionText;

  let renderedOptions: string[] = [];
  if (language === 'HINDI' && currentQ?.optionsHindi && currentQ.optionsHindi.length > 0) {
    renderedOptions = currentQ.optionsHindi;
  } else if (language === 'ENGLISH' && currentQ?.optionsEnglish && currentQ.optionsEnglish.length > 0) {
    renderedOptions = currentQ.optionsEnglish;
  } else if (Array.isArray(currentQ?.options)) {
    renderedOptions = currentQ.options;
  } else if (typeof currentQ?.options === 'string') {
    try {
      renderedOptions = JSON.parse(currentQ.options);
    } catch {
      renderedOptions = [currentQ.options];
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white select-none">
      {isPreview && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] tracking-wider uppercase">ADMIN PREVIEW MODE</span>
            <span>Direct CBT Exam Simulator • Questions: {questions.length} • Total Marks: {testInfo?.totalMarks || 100} • Duration: {testInfo?.durationMinutes || 60}m</span>
          </div>
          <Link
            to={`/admin/tests/${id}/questions`}
            className="px-3 py-1 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-[11px] font-bold shadow-xs transition-all"
          >
            Manage Questions
          </Link>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="px-3 sm:px-6 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 sm:gap-4 shadow-xs">
        {/* Left: Logo + CBT Badge + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img
            src="/logo-horizontal.png"
            alt="Lo Samajh Lo"
            className="h-7 sm:h-8 object-contain shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-[#0B2A63] text-white tracking-wider uppercase shrink-0">CBT</span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-xs font-bold text-slate-800 truncate max-w-[140px] sm:max-w-xs md:max-w-md" title={testInfo.title}>
            {testInfo.title}
          </span>
        </div>

        {/* Center: Section Tabs */}
        <div className="order-3 sm:order-2 flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto max-w-full sm:max-w-xs md:max-w-md scrollbar-none">
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => handleSelectSection(sec)}
              className={`px-3 py-1 rounded-lg transition-all whitespace-nowrap text-xs ${
                currentSection === sec
                  ? 'bg-[#0B2A63] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Right Header: AutoSave indicator, Overall Timer, Fullscreen, Profile */}
        <div className="order-2 sm:order-3 flex items-center gap-2 sm:gap-3">
          {/* Subtle Auto-Save Indicator */}
          {autoSaveStatus === 'saving' && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Saving...
            </span>
          )}
          {autoSaveStatus === 'saved' && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
              <Check className="w-3 h-3 text-emerald-600" />
              Saved
            </span>
          )}
          {autoSaveStatus === 'error' && (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg" title="Failed to save progress. Reconnecting...">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              Reconnecting...
            </span>
          )}

          {/* Primary Overall Test Countdown Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-black shadow-xs ${
              secondsRemaining < 300
                ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse'
                : 'bg-slate-50 text-slate-900 border-slate-200'
            }`}
            title="Overall Test Time Left (Authoritative)"
          >
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Time Left: {formatTime(secondsRemaining)}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors hidden sm:inline-flex"
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

          {/* Mobile Palette Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMobilePalette(!showMobilePalette)}
            className="lg:hidden p-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1"
            title="Open Question Palette"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">Palette</span>
          </button>

          {/* Candidate Avatar */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#0B2A63] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <span className="hidden xl:inline text-xs font-bold text-slate-800">
              {user?.name || 'Candidate'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Examination Layout: 2 Columns */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Column: Question Area */}
        <div className="flex-1 flex flex-col justify-between bg-white border-r border-slate-200 overflow-y-auto">
          {/* Question Sub-header with PER-QUESTION STOPWATCH */}
          <div className="px-4 sm:px-6 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/50">
            <div className="flex items-center gap-2 sm:gap-3 font-bold flex-wrap">
              <span className="text-slate-900 text-sm font-black">Question No. {currentIndex + 1}</span>
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-mono text-[11px]">
                +{currentQ?.marks || 1}
              </span>
              <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-mono text-[11px]">
                -{currentQ?.negativeMarks || 0.25}
              </span>

              {/* LIVE PER-QUESTION STOPWATCH */}
              <div
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-mono font-bold text-xs shadow-2xs"
                title="Stopwatch: Cumulative time spent on this specific question"
              >
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>⏱ {formatTime(currentQuestionSeconds)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'HINDI' | 'ENGLISH')}
                  className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1 font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="HINDI">Hindi (हिंदी)</option>
                  <option value="ENGLISH">English</option>
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
          <div className="p-5 sm:p-8 space-y-6 flex-1">
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
              {currentQuestionText}
            </div>

            {/* If question has an image */}
            {(currentQ as any)?.imageUrl && (
              <div className="my-3 max-w-lg">
                <img
                  src={(currentQ as any).imageUrl}
                  alt="Question illustration"
                  className="rounded-xl border border-slate-200 max-h-60 object-contain"
                />
              </div>
            )}

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
                        ? 'bg-blue-50/90 border-[#1D64D8] shadow-sm ring-1 ring-[#1D64D8]'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isSelected
                          ? 'border-[#1D64D8] bg-[#1D64D8] text-white'
                          : 'border-slate-300 text-slate-600'
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

          {/* Bottom Action Strip */}
          <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleReviewAndNext}
                className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs border border-purple-200 transition-colors shadow-2xs"
              >
                Mark for Review & Next
              </button>
              <button
                type="button"
                onClick={handleClearResponse}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200 transition-colors shadow-2xs"
              >
                Clear Response
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveAndNext}
              className="px-6 py-2.5 rounded-xl bg-[#0B2A63] hover:bg-blue-900 text-white font-black text-xs shadow-md transition-all hover:scale-105 active:scale-95"
            >
              {currentIndex < questions.length - 1 ? 'Save & Next' : 'Save & Submit'}
            </button>
          </div>
        </div>

        {/* Right Column: Question Palette (Desktop Permanent, Mobile Slide-out Drawer) */}
        <div
          className={`bg-white border-l border-slate-200 p-4 space-y-4 flex flex-col justify-between overflow-y-auto transition-transform lg:transition-none duration-300 z-40 ${
            showMobilePalette
              ? 'fixed inset-y-0 right-0 w-80 shadow-2xl flex translate-x-0'
              : 'w-full lg:w-80 lg:flex fixed lg:static top-0 bottom-0 right-0 translate-x-full lg:translate-x-0 hidden'
          }`}
        >
          <div className="space-y-4">
            {/* Header in mobile drawer */}
            <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900">Question Palette</span>
              <button onClick={() => setShowMobilePalette(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 5-State Summary Counts Cards */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Question Status Overview
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <span className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                    {summaryCounts.answered}
                  </span>
                  <span className="truncate">Answered</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                  <span className="w-5 h-5 rounded-md bg-rose-500 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                    {summaryCounts.notAnswered}
                  </span>
                  <span className="truncate">Not Answered</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800">
                  <span className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center font-black text-[10px] shrink-0">
                    {summaryCounts.marked}
                  </span>
                  <span className="truncate">Marked</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800">
                  <div className="relative shrink-0">
                    <span className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center font-black text-[10px]">
                      {summaryCounts.answeredAndMarked}
                    </span>
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
                  </div>
                  <span className="truncate">Ans & Marked</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 col-span-2">
                  <span className="w-5 h-5 rounded-md bg-white border border-slate-300 text-slate-800 flex items-center justify-center font-black text-[10px] shrink-0">
                    {summaryCounts.notVisited}
                  </span>
                  <span className="truncate">Not Visited</span>
                </div>
              </div>
            </div>

            {/* Section label */}
            <div className="flex items-center justify-between text-xs font-black uppercase text-slate-500 tracking-wider">
              <span>SECTION: {currentSection}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({filteredQuestions.length} questions)
              </span>
            </div>

            {/* Questions Grid with 5 States */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
              {filteredQuestions.map(({ q, idx }) => {
                const thisQId = q.questionId || q.id;
                const isSelected = idx === currentIndex;
                const isAns = answers[thisQId] !== undefined && answers[thisQId] !== '';
                const isRev = !!markedForReview[thisQId];
                const isVis = !!visitedQuestions[thisQId];

                let bgClass = 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100';
                let badgeIndicator = null;

                if (isAns && isRev) {
                  bgClass = 'bg-purple-600 text-white border-purple-700 shadow-xs';
                  badgeIndicator = (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white ring-1 ring-emerald-500" />
                  );
                } else if (isAns) {
                  bgClass = 'bg-emerald-500 text-white border-emerald-600 shadow-xs';
                } else if (isRev) {
                  bgClass = 'bg-purple-600 text-white border-purple-700 shadow-xs';
                } else if (isVis) {
                  bgClass = 'bg-rose-500 text-white border-rose-600 shadow-xs';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleSelectQuestion(idx);
                      setShowMobilePalette(false);
                    }}
                    className={`h-9 relative rounded-xl border text-xs font-bold transition-all flex items-center justify-center ${bgClass} ${
                      isSelected ? 'ring-2 ring-blue-600 ring-offset-1 scale-105 font-black z-10' : ''
                    }`}
                    title={`Question ${idx + 1}: ${
                      isAns && isRev
                        ? 'Answered & Marked for Review'
                        : isAns
                        ? 'Answered'
                        : isRev
                        ? 'Marked for Review'
                        : isVis
                        ? 'Not Answered'
                        : 'Not Visited'
                    }`}
                  >
                    {idx + 1}
                    {badgeIndicator}
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
              className="w-full py-3 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs shadow-md transition-all hover:scale-[1.02] active:scale-95"
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
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Submit Examination Summary</h3>
              <p className="text-xs text-slate-500">
                Please verify your attempt breakdown section-wise before final submission.
              </p>
            </div>

            {/* Summary Table matching Testbook CBT standard */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#0B2A63] text-white font-bold">
                    <th className="py-3 px-3 sm:px-4">Section</th>
                    <th className="py-3 px-2 sm:px-3 text-center">Total</th>
                    <th className="py-3 px-2 sm:px-3 text-center">Answered</th>
                    <th className="py-3 px-2 sm:px-3 text-center">Not Answered</th>
                    <th className="py-3 px-2 sm:px-3 text-center">Marked</th>
                    <th className="py-3 px-2 sm:px-3 text-center">Ans & Marked</th>
                    <th className="py-3 px-2 sm:px-3 text-center">Not Visited</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(sectionSummaryMap).map(([secName, counts]) => (
                    <tr key={secName} className="hover:bg-slate-50/60 font-semibold text-slate-700">
                      <td className="py-2.5 px-3 sm:px-4 font-bold text-slate-900">{secName}</td>
                      <td className="py-2.5 px-2 sm:px-3 text-center">{counts.total}</td>
                      <td className="py-2.5 px-2 sm:px-3 text-center text-emerald-600 font-bold">{counts.answered}</td>
                      <td className="py-2.5 px-2 sm:px-3 text-center text-rose-500 font-bold">{counts.notAnswered}</td>
                      <td className="py-2.5 px-2 sm:px-3 text-center text-purple-600 font-bold">{counts.marked}</td>
                      <td className="py-2.5 px-2 sm:px-3 text-center text-purple-700 font-bold">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {counts.answeredAndMarked}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 sm:px-3 text-center text-slate-400">{counts.notVisited}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td className="py-2.5 px-3 sm:px-4">TOTAL</td>
                    <td className="py-2.5 px-2 sm:px-3 text-center">{summaryCounts.total}</td>
                    <td className="py-2.5 px-2 sm:px-3 text-center text-emerald-600">{summaryCounts.answered}</td>
                    <td className="py-2.5 px-2 sm:px-3 text-center text-rose-500">{summaryCounts.notAnswered}</td>
                    <td className="py-2.5 px-2 sm:px-3 text-center text-purple-600">{summaryCounts.marked}</td>
                    <td className="py-2.5 px-2 sm:px-3 text-center text-purple-700">{summaryCounts.answeredAndMarked}</td>
                    <td className="py-2.5 px-2 sm:px-3 text-center text-slate-500">{summaryCounts.notVisited}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Warning callout if questions remain unattempted */}
            {(summaryCounts.notAnswered + summaryCounts.notVisited + summaryCounts.marked) > 0 && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Unattempted Questions Alert</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-normal">
                  You have <strong>{summaryCounts.notAnswered + summaryCounts.notVisited}</strong> unattempted question(s) and <strong>{summaryCounts.marked}</strong> question(s) marked for review.
                </p>
              </div>
            )}

            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-[11px] text-rose-700 text-center font-medium">
              ⚠️ Are you sure you want to submit? Once submitted, you cannot resume this examination session.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Continue Test
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Test</span>
                )}
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
              <p>• Purple with Green dot: Answered & Marked for Review (Evaluated).</p>
              <p>• White: Not visited yet.</p>
              <p>• Each question tracks the active time spent on it via the Question Stopwatch.</p>
              <p>• The countdown timer runs continuously until the test duration expires.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAttemptPage;
