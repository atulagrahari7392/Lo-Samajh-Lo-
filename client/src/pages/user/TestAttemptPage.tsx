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
} from 'lucide-react';
import { api } from '../../services/api';
import { Question } from '../../types';
import QuestionPalette from '../../components/test/QuestionPalette';
import TestTimer from '../../components/test/TestTimer';
import { useToast } from '../../context/ToastContext';

export const TestAttemptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  const [testInfo, setTestInfo] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);

  useEffect(() => {
    if (!id) return;
    const loadTest = async () => {
      try {
        setLoading(true);
        const data = await api.tests.takeTest(id);
        if (data.success) {
          setTestInfo(data.test);
          setQuestions(data.questions || []);
          setSecondsRemaining((data.test.durationMinutes || 60) * 60);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold">Setting up your examination session...</p>
        </div>
      </div>
    );
  }

  if (!testInfo || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl text-center space-y-3 max-w-md">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="font-bold text-lg text-slate-900">No Questions In This Test</h3>
          <p className="text-xs text-slate-500">The administrator has not added questions to this test yet.</p>
          <button
            onClick={() => navigate('/test-series')}
            className="px-5 py-2 rounded-xl bg-[#6C63FF] text-white font-bold text-xs"
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
  const isReview = markedForReview[qId];

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

  const handleToggleReview = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
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

  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== undefined && answers[k] !== '').length;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Test Header Bar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] text-white font-black text-xs flex items-center justify-center">
            LS
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-800 line-clamp-1">{testInfo.title}</h2>
            <span className="text-[10px] text-slate-400 font-semibold">
              Section: {currentQ.sectionName || currentQ.subject} • Mark: +{currentQ.marks} / -{currentQ.negativeMarks}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <TestTimer
            initialSeconds={secondsRemaining}
            onTick={(s) => setSecondsRemaining(s)}
            onTimeUp={handleFinalSubmit}
          />

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Examination Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: Question Card */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 flex flex-col justify-between min-h-[500px]">
          <div className="space-y-6">
            {/* Question Counter & Badges */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-purple-100 text-[#6C63FF] font-black text-xs">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {currentQ.difficulty} Level
                </span>
              </div>

              <button
                onClick={handleToggleReview}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  isReview
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isReview ? 'Marked for Review' : 'Mark Review'}</span>
              </button>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {currentQ.questionText}
            </div>

            {/* Options List */}
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
                        ? 'border-[#6C63FF] bg-purple-50/70 text-slate-900 font-bold shadow-sm ring-2 ring-[#6C63FF]/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black transition-colors ${
                        isSelected
                          ? 'bg-[#6C63FF] text-white'
                          : 'bg-white border border-slate-300 text-slate-600'
                      }`}
                    >
                      {optLetter}
                    </div>
                    <span className="flex-1">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Question Actions */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {currentAnswer !== undefined && (
                <button
                  onClick={handleClearResponse}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Response</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white text-xs font-bold shadow-sm shadow-[#6C63FF]/30 disabled:opacity-40 transition-all"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Palette */}
        <div className="lg:col-span-4 space-y-6">
          <QuestionPalette
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            answers={answers}
            markedForReview={markedForReview}
            questionIds={questions.map((q) => q.questionId || q.id)}
            onSelect={(idx) => setCurrentIndex(idx)}
          />

          {/* Quick Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-slate-800">Exam Statistics</h4>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Questions Answered:</span>
                <span className="font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Marked for Review:</span>
                <span className="font-bold text-purple-600">{reviewCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Unanswered:</span>
                <span className="font-bold text-slate-400">{unansweredCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowSubmitModal(false)} />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#6C63FF] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Confirm Test Submission</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to finish your test and submit your answers for evaluation?
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs font-semibold text-slate-700">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-bold">{questions.length}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Answered:</span>
                <span className="font-bold">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-rose-500">
                <span>Unanswered:</span>
                <span className="font-bold">{unansweredCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Resume Test
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md"
              >
                {isSubmitting ? 'Evaluating...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAttemptPage;
