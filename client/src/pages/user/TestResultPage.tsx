import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  BookOpen,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../../services/api';

export const TestResultPage: React.FC = () => {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');

  useEffect(() => {
    if (!id || !attemptId) return;
    const fetchResult = async () => {
      try {
        setLoading(true);
        const data = await api.tests.getResult(id, attemptId);
        if (data.success) {
          setResultData(data);
        }
      } catch (err) {
        console.error('Error fetching test result:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id, attemptId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Generating detailed scorecard...</p>
      </div>
    );
  }

  if (!resultData || !resultData.attempt) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl text-center space-y-4 border border-slate-200">
        <h3 className="font-bold text-lg text-slate-800">Result Not Available</h3>
        <p className="text-xs text-slate-500">Could not retrieve results for this test session.</p>
        <Link to="/test-series" className="inline-block px-5 py-2.5 rounded-xl bg-[#6C63FF] text-white font-bold text-xs">
          Return to Test Series
        </Link>
      </div>
    );
  }

  const { attempt, questions } = resultData;
  const percentage = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;

  const filteredQuestions = questions.filter((q: any) => {
    if (filterType === 'correct') return q.isCorrect;
    if (filterType === 'incorrect') return q.userSelected !== null && !q.isCorrect;
    if (filterType === 'skipped') return q.userSelected === null;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/test-series"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#6C63FF] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Test Series</span>
        </Link>
      </div>

      {/* Scorecard Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 pb-8">
          <div className="space-y-2 text-center md:text-left">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-[#6C63FF]">
              TEST EVALUATION REPORT
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{attempt.testTitle}</h1>
            <p className="text-xs text-slate-400">
              Submitted on {new Date(attempt.submittedAt).toLocaleDateString()} at{' '}
              {new Date(attempt.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="text-center md:text-right">
            <span
              className={`inline-block px-4 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase mb-2 ${
                attempt.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {attempt.passed ? 'QUALIFIED / PASSED' : 'NEEDS IMPROVEMENT'}
            </span>
            <div className="flex items-baseline justify-center md:justify-end gap-1">
              <span className="text-4xl sm:text-5xl font-black text-[#6C63FF]">{attempt.score}</span>
              <span className="text-slate-400 font-bold text-sm">/ {attempt.totalMarks} Marks</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Percentage: {percentage}%</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs text-slate-500 font-bold uppercase">Accuracy</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{attempt.accuracy}%</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs text-slate-500 font-bold uppercase">Correct</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{attempt.correctCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs text-slate-500 font-bold uppercase">Incorrect</span>
            <p className="text-2xl sm:text-3xl font-black text-rose-500 mt-1">{attempt.incorrectCount}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs text-slate-500 font-bold uppercase">Skipped</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-400 mt-1">{attempt.skippedCount}</p>
          </div>
        </div>
      </div>

      {/* Solutions Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Question-by-Question Solution Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review correct answers, your selected options, and detailed step-by-step explanations.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs font-bold bg-white p-1.5 rounded-2xl border border-slate-200">
            {[
              { id: 'all', label: `All (${questions.length})` },
              { id: 'correct', label: `Correct (${attempt.correctCount})` },
              { id: 'incorrect', label: `Incorrect (${attempt.incorrectCount})` },
              { id: 'skipped', label: `Skipped (${attempt.skippedCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-colors ${
                  filterType === f.id
                    ? 'bg-[#6C63FF] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Questions Detailed List */}
        <div className="space-y-5">
          {filteredQuestions.map((q: any) => {
            const isUserCorrect = q.isCorrect;
            const isSkipped = q.userSelected === null;

            return (
              <div
                key={q.questionId}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-black text-xs">
                      Q.{q.number}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">{q.subject}</span>
                  </div>

                  <div>
                    {isSkipped ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-xs font-bold">
                        Skipped (0 Marks)
                      </span>
                    ) : isUserCorrect ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> +{q.marksAwarded} Marks
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> {q.marksAwarded} Marks
                      </span>
                    )}
                  </div>
                </div>

                {/* Question */}
                <h3 className="font-bold text-base text-slate-900 leading-snug">{q.questionText}</h3>

                {/* Options */}
                <div className="space-y-2 pt-2">
                  {q.options.map((opt: string, optIdx: number) => {
                    const isOptionCorrect = String(optIdx) === String(q.correctAnswer);
                    const isOptionSelected = String(optIdx) === String(q.userSelected);

                    let style = 'bg-slate-50 border-slate-200 text-slate-700';
                    if (isOptionCorrect) {
                      style = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                    } else if (isOptionSelected && !isUserCorrect) {
                      style = 'bg-rose-50 border-rose-300 text-rose-900 font-bold';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${style}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-xs">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isOptionCorrect && (
                          <span className="text-xs font-extrabold text-emerald-700">✓ Correct Answer</span>
                        )}
                        {isOptionSelected && !isOptionCorrect && (
                          <span className="text-xs font-extrabold text-rose-600">✗ Your Answer</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1 mt-4">
                    <span className="text-xs font-extrabold text-[#6C63FF] uppercase tracking-wider block">
                      Solution Explanation
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestResultPage;
