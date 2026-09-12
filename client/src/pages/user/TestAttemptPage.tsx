import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Maximize2
} from 'lucide-react';
import { api } from '../../services/api';
import { Question } from '../../types';
import QuestionPalette from '../../components/test/QuestionPalette';
import TestTimer from '../../components/test/TestTimer';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const TestAttemptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: toastError } = useToast();

  const [testInfo, setTestInfo] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>({});
  const [currentSection, setCurrentSection] = useState<string>('All');
  const [language, setLanguage] = useState<'HINDI' | 'ENGLISH'>('HINDI');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);

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

          // Mark first question as visited
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

  // Extract unique sections from questions
  const sections = React.useMemo(() => {
    const list = Array.from(new Set(questions.map((q) => q.sectionName || q.subject || 'General')));
    return list.length > 1 ? ['All', ...list] : list;
  }, [questions]);

  // Handle visiting question
  const handleSelectQuestion = (idx: number) => {
    setCurrentIndex(idx);
    const q = questions[idx];
    if (q) {
      const qId = q.questionId || q.id;
      setVisitedQuestions((prev) => ({ ...prev, [qId]: true }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="apple-liquid-glass-dark p-8 rounded-3xl text-center space-y-4 max-w-sm">
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
        <div className="apple-liquid-glass p-8 rounded-3xl text-center space-y-4 max-w-md">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="font-bold text-lg text-slate-900">No Questions Found</h3>
          <p className="text-xs text-slate-500">The administrator has not added questions to this mock test yet.</p>
          <button
            onClick={() => navigate('/test-series')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs"
          >
            Back to Test Series
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const qId = currentQ.questionId || currentQ.id;
  const currentAnswer = answers[qId];
  const isReview = !!markedForReview[qId];

  // Option selection
  const handleSelectOption = (optIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: String(optIndex),
    }));
  };

  const handleClearResponse = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  const handleToggleReviewAndNext = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
    // Advance to next question
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
    try {
      setIsSubmitting(true);
      const totalTime = (testInfo.durationMinutes || 60) * 60;
      const timeSpentSeconds = totalTime - secondsRemaining;

      const data = await api.tests.submitTest(id!, {
        answers,
        timeSpentSeconds,
      });

      if (data.success && data.attemptId) {
        navigate(`/test-series/${id}/result/${data.attemptId}`);
      }
    } catch (err: any) {
      toastError(err.message || 'Submission error.');
      setIsSubmitting(false);
    }
  };

  // Stats calculation
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== undefined && answers[k] !== '').length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="relative min-h-screen bg-slate-100/80 flex flex-col overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      {/* Background Ambient Liquid Glow */}
      <div className="water-ambient-blob w-96 h-96 bg-cyan-200/40 top-0 right-10" />
      <div className="water-ambient-blob w-80 h-80 bg-indigo-200/30 bottom-10 left-10" style={{ animationDelay: '-4s' }} />

      {/* 1. Top CBT Exam Header Bar (Apple Liquid Glass) */}
      <header className="apple-liquid-glass sticky top-0 z-30 px-4 sm:px-8 h-16 flex items-center justify-between border-b border-white/80 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md shadow-cyan-500/30">
            LSL
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 line-clamp-1 flex items-center gap-2">
              <span>{testInfo.title}</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-800 border border-cyan-500/20">
                CBT MOCK
              </span>
            </h2>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="font-semibold text-cyan-700">
                Section: {currentQ.sectionName || currentQ.subject}
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">+{currentQ.marks || 1} Correct</span>
              <span>•</span>
              <span className="text-rose-600 font-bold">-{currentQ.negativeMarks || testInfo.negativeMarking} Wrong</span>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          {/* Bilingual Language Switcher (Testbook Feature) */}
          <button
            onClick={() => setLanguage((prev) => (prev === 'HINDI' ? 'ENGLISH' : 'HINDI'))}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl apple-capsule text-xs font-bold text-slate-700 hover:bg-white/80 transition-all"
            title="Switch Question Display Language"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-600" />
            <span>{language === 'HINDI' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* Test Timer Capsule */}
          <TestTimer
            initialSeconds={secondsRemaining}
            onTick={(s) => setSecondsRemaining(s)}
            onTimeUp={handleFinalSubmit}
          />

          {/* Submit Test Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* 2. Section Tabs Bar (Testbook Section Switcher) */}
      {sections.length > 1 && (
        <div className="bg-white/60 backdrop-blur-md border-b border-slate-200/70 px-4 sm:px-8 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider mr-1">Sections:</span>
          {sections.map((sec) => {
            const isCurrent = (sec === 'All' && currentSection === 'All') || currentQ.sectionName === sec || currentQ.subject === sec;
            return (
              <button
                key={sec}
                onClick={() => {
                  setCurrentSection(sec);
                  if (sec !== 'All') {
                    const firstIdx = questions.findIndex(q => (q.sectionName || q.subject) === sec);
                    if (firstIdx !== -1) handleSelectQuestion(firstIdx);
                  }
                }}
                className={`apple-capsule px-3.5 py-1 text-xs font-bold whitespace-nowrap transition-all ${
                  isCurrent ? 'apple-capsule-active' : 'text-slate-600 hover:bg-white/90'
                }`}
              >
                {sec}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Main CBT Examination Workspace */}
      <div className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: Question Card (Apple Glass Card) */}
        <div className="lg:col-span-8 apple-glass-card p-6 sm:p-8 space-y-6 flex flex-col justify-between min-h-[540px]">
          <div className="space-y-6">
            {/* Top Question Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black text-xs shadow-xs">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-bold text-slate-500 bg-white/60 px-2.5 py-0.5 rounded-lg border border-white/80">
                  {currentQ.sectionName || currentQ.subject}
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400">
                  {currentQ.difficulty || 'Medium'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLanguage((prev) => (prev === 'HINDI' ? 'ENGLISH' : 'HINDI'))}
                  className="sm:hidden px-2.5 py-1 rounded-lg bg-white/70 text-xs font-bold text-slate-700"
                >
                  {language === 'HINDI' ? 'हिन्दी' : 'ENG'}
                </button>
                <button
                  onClick={handleToggleReviewAndNext}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isReview
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                  <span>{isReview ? 'Marked for Review' : 'Mark Review & Next'}</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed select-none">
              {currentQ.questionText}
            </div>

            {/* Options List with Apple Glass Buttons */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = currentAnswer === String(optIdx);
                const optLetter = String.fromCharCode(65 + optIdx); // A, B, C, D

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all text-sm font-medium ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50/80 text-slate-900 font-bold shadow-md shadow-cyan-500/10 ring-2 ring-cyan-500/25'
                        : 'border-white/80 hover:border-slate-300 bg-white/60 hover:bg-white/90 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all shrink-0 ${
                        isSelected
                          ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      {optLetter}
                    </div>
                    <span className="flex-1 leading-snug">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Footer (Testbook Navigation Bar) */}
          <div className="pt-6 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {currentAnswer !== undefined && (
                <button
                  onClick={handleClearResponse}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-white/80 transition-all border border-transparent hover:border-slate-200"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Response</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleSelectQuestion(Math.max(currentIndex - 1, 0))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-white/80 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={handleSaveAndNext}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-500/25 transition-all hover:scale-105"
              >
                <span>{currentIndex === questions.length - 1 ? 'Save & Finish' : 'Save & Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Palette (Testbook 5-State Component) */}
        <div className="lg:col-span-4 space-y-6">
          <QuestionPalette
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            answers={answers}
            markedForReview={markedForReview}
            visitedQuestions={visitedQuestions}
            questionIds={questions.map((q) => q.questionId || q.id)}
            candidateName={user?.name || 'Candidate'}
            candidateAvatar={user?.avatar}
            onSelect={handleSelectQuestion}
          />
        </div>
      </div>

      {/* 4. Testbook Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-md transition-opacity"
            onClick={() => setShowSubmitModal(false)}
          />
          <div className="relative apple-liquid-glass rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 border border-white/90">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Confirm Exam Submission</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to finish this test session? Your score, rank, and percentile will be evaluated immediately.
              </p>
            </div>

            {/* Testbook Summary Breakdown Matrix */}
            <div className="bg-white/70 p-4 rounded-2xl border border-white/80 space-y-2.5 text-xs font-semibold text-slate-700">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-black text-slate-900">{totalQuestions}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Answered Questions:</span>
                <span className="font-black">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-purple-700">
                <span>Marked for Review:</span>
                <span className="font-black">{reviewCount}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Unanswered / Skipped:</span>
                <span className="font-black">{unansweredCount}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200/80 text-xs font-bold text-slate-700 hover:bg-white/80 transition-all"
              >
                Resume Exam
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition-all"
              >
                {isSubmitting ? 'Evaluating Score...' : 'Confirm & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAttemptPage;
