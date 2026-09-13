import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { api } from '../../services/api';
import { Question } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const TestAttemptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: toastError, success } = useToast();

  // 3 Exam Steps: general_instructions (Page 4) -> specific_instructions (Page 5) -> live_exam (Page 6)
  const [examStep, setExamStep] = useState<'general_instructions' | 'specific_instructions' | 'live_exam'>(
    'general_instructions'
  );

  const [testInfo, setTestInfo] = useState<any>(null);
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

  // Timer & Fullscreen
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const questionStartTimeRef = useRef<number>(Date.now());
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!id) return;
    const loadTest = async () => {
      try {
        setLoading(true);
        const data = await api.tests.takeTest(id);
        if (data.success) {
          setTestInfo(data.test);
          const qList = data.questions || [];
          setQuestions(qList);
          setSecondsRemaining((data.test.durationMinutes || 60) * 60);

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
  };

  const handleSelectOption = (optIndex: number) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const qId = currentQ.questionId || currentQ.id;
    setAnswers((prev) => ({ ...prev, [qId]: String(optIndex) }));
  };

  const handleClearResponse = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const qId = currentQ.questionId || currentQ.id;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  const handleToggleReviewAndNext = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    const qId = currentQ.questionId || currentQ.id;
    setMarkedForReview((prev) => ({ ...prev, [qId]: !prev[qId] }));
    if (currentIndex < questions.length - 1) {
      handleSelectQuestion(currentIndex + 1);
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
        <div className="bg-slate-800/90 p-8 rounded-3xl text-center space-y-4 max-w-sm border border-slate-700">
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
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-slate-900">
                Lo Samajh Lo <span className="text-cyan-600">CBT</span>
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-bold text-slate-600 truncate max-w-md">
              {testInfo.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'T'}
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-900">{user?.name || 'Atul Candidate'}</div>
              <div className="text-[10px] text-slate-400">Roll: LSL-2026-8921</div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 overflow-y-auto space-y-6 text-slate-700 text-xs leading-relaxed">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-2">
            General Instructions:
          </h2>

          <div className="space-y-4">
            <p>
              1. The clock will be set at the server. The countdown timer at the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You need not terminate the examination or submit your paper manually.
            </p>

            <p>
              2. The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:
            </p>

            {/* Status Palette Legend (Matching Screenshot Page 4) */}
            <div className="space-y-2.5 pl-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-md bg-white border border-slate-300 shrink-0" />
                <span>You have not visited the question yet.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-md bg-rose-500 text-white shrink-0" />
                <span>You have not answered the question.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-md bg-emerald-500 text-white shrink-0" />
                <span>You have answered the question.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-md bg-purple-600 text-white shrink-0" />
                <span>You have NOT answered the question, but have marked the question for review.</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-5 h-5 rounded-md bg-purple-600 shrink-0 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <span>You have answered the question, but marked it for review.</span>
              </div>
            </div>

            <p className="font-semibold text-slate-900">
              The 'Mark For Review' status for a question simply indicates that you would like to look at that question again. If a question is answered, but marked for review, then the answer will be considered for evaluation unless the status is modified by the candidate.
            </p>

            <div className="space-y-2 pt-2">
              <h3 className="font-bold text-slate-900">Navigating to a Question:</h3>
              <p>3. To answer a question, do the following:</p>
              <ul className="list-disc pl-6 space-y-1 text-slate-600">
                <li>Click on the question number in the Question Palette at the right of your screen to go to that question directly.</li>
                <li>Click on <strong>Save & Next</strong> to save your answer for the current question and then go to the next question.</li>
                <li>Click on <strong>Mark for Review & Next</strong> to save your answer and mark it for review.</li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="font-bold text-slate-900">Answering a Question:</h3>
              <ul className="list-disc pl-6 space-y-1 text-slate-600">
                <li>Choose one answer from the 4 options (A, B, C, D) given below the question by clicking on the option.</li>
                <li>To deselect your chosen answer, click on <strong>Clear Response</strong> button.</li>
                <li>To change your chosen answer, click on the bubble of another option.</li>
              </ul>
            </div>
          </div>
        </main>

        {/* Bottom Bar matching Screenshot Page 4 */}
        <footer className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => navigate('/test-series')}
            className="px-5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs"
          >
            ← Go To Tests
          </button>

          <button
            onClick={() => setExamStep('specific_instructions')}
            className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/20 flex items-center gap-1.5"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PAGE 5: Specific Instructions & Declaration Screen
  // -------------------------------------------------------------
  if (examStep === 'specific_instructions') {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
        {/* Top Header */}
        <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight text-slate-900">
              Lo Samajh Lo <span className="text-cyan-600">CBT</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'T'}
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900">{user?.name || 'Atul Candidate'}</div>
            </div>
          </div>
        </header>

        {/* Main Area matching Screenshot Page 4 bottom */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 overflow-y-auto space-y-6 text-xs leading-relaxed">
          <div className="text-center space-y-1 border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black text-slate-900">{testInfo.title}</h2>
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-1 font-semibold">
              <span>Duration: {testInfo.durationMinutes || 30} Mins</span>
              <span>•</span>
              <span>Maximum Marks: {testInfo.totalMarks || 100}</span>
              <span>•</span>
              <span>Total Questions: {questions.length}</span>
            </div>
          </div>

          <div className="space-y-3 text-slate-700">
            <h3 className="font-bold text-sm text-slate-900">Read the following instructions carefully:</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>The test contains {questions.length} questions across scheduled exam sections.</li>
              <li>Each question has 4 options out of which only one is correct.</li>
              <li>You have to finish the test within {testInfo.durationMinutes || 30} minutes.</li>
              <li>You will be awarded positive marks for each correct answer. Negative marking applies for wrong attempts.</li>
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

  // Options parsing
  let renderedOptions: string[] = [];
  if (Array.isArray(currentQ.options)) {
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
      {/* Top Header Bar matching Screenshot Page 5 top */}
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
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setCurrentSection(sec)}
              className={`px-3 py-1 rounded-lg transition-all ${
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
              {user?.name ? user.name.charAt(0).toUpperCase() : 'T'}
            </div>
            <span className="hidden md:inline text-xs font-bold text-slate-800">
              {user?.name || 'Atul'}
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

              <button className="text-slate-400 hover:text-slate-600 text-[11px]">
                Report
              </button>
            </div>
          </div>

          {/* Question Text & Options */}
          <div className="p-6 sm:p-8 space-y-6 flex-1">
            <div className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
              {currentQ.questionText}
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
              className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs shadow-md shadow-cyan-600/20 transition-all hover:scale-105 active:scale-95"
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
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs shadow-md shadow-cyan-600/30 transition-all hover:scale-[1.02] active:scale-95"
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
