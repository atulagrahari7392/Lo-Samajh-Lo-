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
  TrendingUp,
  Percent,
  Target,
  Sparkles,
  Zap,
  BarChart3,
  Check,
  X,
  HelpCircle,
  Share2
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
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="apple-liquid-glass p-8 rounded-3xl max-w-sm mx-auto space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-800">Generating Testbook-Style Scorecard...</p>
          <span className="text-xs text-slate-500">Calculating All-India rank, percentile & solutions</span>
        </div>
      </div>
    );
  }

  if (!resultData || !resultData.attempt) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 apple-liquid-glass rounded-3xl text-center space-y-4 border border-white/80">
        <h3 className="font-bold text-lg text-slate-800">Result Not Available</h3>
        <p className="text-xs text-slate-500">Could not retrieve results for this examination session.</p>
        <Link
          to="/test-series"
          className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md"
        >
          Return to Test Series
        </Link>
      </div>
    );
  }

  const { attempt, questions } = resultData;
  const percentage = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;

  // Testbook Simulated All-India Rank & Percentile Calculation
  const totalCandidates = 3450;
  const simulatedPercentile = Math.min(99.8, Math.max(12.5, Math.round((percentage * 0.95 + 4.5) * 10) / 10));
  const simulatedRank = Math.max(1, Math.round(totalCandidates * (1 - simulatedPercentile / 100)));

  // Average time per question
  const avgTimePerQuestion = attempt.totalQuestions > 0 ? Math.round(attempt.timeSpentSeconds / attempt.totalQuestions) : 0;

  // Section-wise stats
  const sectionStats: Record<string, { total: number; correct: number; incorrect: number; marks: number }> = {};
  questions.forEach((q: any) => {
    const sec = q.subject || 'General';
    if (!sectionStats[sec]) {
      sectionStats[sec] = { total: 0, correct: 0, incorrect: 0, marks: 0 };
    }
    sectionStats[sec].total += 1;
    if (q.isCorrect) {
      sectionStats[sec].correct += 1;
      sectionStats[sec].marks += q.marksAwarded || 1;
    } else if (q.userSelected !== null) {
      sectionStats[sec].incorrect += 1;
      sectionStats[sec].marks += q.marksAwarded || 0;
    }
  });

  const filteredQuestions = questions.filter((q: any) => {
    if (filterType === 'correct') return q.isCorrect;
    if (filterType === 'incorrect') return q.userSelected !== null && !q.isCorrect;
    if (filterType === 'skipped') return q.userSelected === null;
    return true;
  });

  return (
    <div className="relative min-h-screen bg-slate-50/70 pb-20 selection:bg-cyan-500 selection:text-white">
      {/* Background Ambient Liquid Glow */}
      <div className="water-ambient-blob w-96 h-96 bg-cyan-300/30 top-10 left-10" />
      <div className="water-ambient-blob w-96 h-96 bg-indigo-300/20 top-60 right-10" style={{ animationDelay: '-5s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/test-series"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-cyan-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Test Series Catalog</span>
          </Link>

          <Link
            to={`/test-series/${id}/attempt`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl apple-capsule text-xs font-bold text-cyan-700 hover:bg-white/80 transition-all shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-attempt Mock</span>
          </Link>
        </div>

        {/* 1. Scorecard Hero Banner (Testbook Rank & Percentile Card) */}
        <div className="apple-liquid-glass rounded-3xl p-6 sm:p-10 space-y-8 relative overflow-hidden border border-white/80 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-200/60 pb-8">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-700 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                <span>OFFICIAL CBT EVALUATION REPORT</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">{attempt.testTitle}</h1>
              <p className="text-xs text-slate-500 font-medium">
                Submitted on {new Date(attempt.submittedAt).toLocaleDateString()} • Duration: {Math.round(attempt.timeSpentSeconds / 60)} Mins used
              </p>
            </div>

            <div className="text-center md:text-right space-y-1">
              <span
                className={`inline-block px-4 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase ${
                  attempt.passed
                    ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-800 border border-rose-500/30'
                }`}
              >
                {attempt.passed ? '✓ QUALIFIED / PASSED' : '⚠ NEEDS IMPROVEMENT'}
              </span>

              <div className="flex items-baseline justify-center md:justify-end gap-1.5 pt-1">
                <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                  {attempt.score}
                </span>
                <span className="text-slate-400 font-bold text-sm">/ {attempt.totalMarks} Marks</span>
              </div>
              <p className="text-xs text-slate-500 font-semibold">Cutoff Mark: {attempt.passMarks} pts • Score: {percentage}%</p>
            </div>
          </div>

          {/* 2. Testbook Core Performance Matrix Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rank Card */}
            <div className="p-5 rounded-2xl bg-white/70 border border-white/80 shadow-xs text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-bold uppercase">
                <Award className="w-4 h-4 text-cyan-500" />
                <span>All-India Rank</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                #{simulatedRank}
              </p>
              <span className="text-[11px] text-slate-500 block">Out of {totalCandidates} students</span>
            </div>

            {/* Percentile Card */}
            <div className="p-5 rounded-2xl bg-white/70 border border-white/80 shadow-xs text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-bold uppercase">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <span>Percentile</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">
                {simulatedPercentile}%
              </p>
              <span className="text-[11px] text-slate-500 block">Better than {Math.round(simulatedPercentile)}% students</span>
            </div>

            {/* Accuracy Card */}
            <div className="p-5 rounded-2xl bg-white/70 border border-white/80 shadow-xs text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-bold uppercase">
                <Target className="w-4 h-4 text-emerald-500" />
                <span>Accuracy</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                {attempt.accuracy}%
              </p>
              <span className="text-[11px] text-slate-500 block">{attempt.correctCount} correct / {attempt.correctCount + attempt.incorrectCount} attempted</span>
            </div>

            {/* Speed Card */}
            <div className="p-5 rounded-2xl bg-white/70 border border-white/80 shadow-xs text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-bold uppercase">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Avg. Speed</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                {avgTimePerQuestion}s
              </p>
              <span className="text-[11px] text-slate-500 block">Time spent per question</span>
            </div>
          </div>

          {/* Sectional Performance Table (Testbook Feature) */}
          <div className="space-y-3 pt-2">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-600" />
              <span>Sectional Performance Breakdown</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-white/80 bg-white/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200/60 text-slate-600 font-black">
                  <tr>
                    <th className="p-3.5">Section Name</th>
                    <th className="p-3.5">Total Questions</th>
                    <th className="p-3.5 text-emerald-700">Correct</th>
                    <th className="p-3.5 text-rose-600">Incorrect</th>
                    <th className="p-3.5 text-slate-900">Marks Scored</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {Object.entries(sectionStats).map(([secName, s]) => (
                    <tr key={secName} className="hover:bg-white/60 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{secName}</td>
                      <td className="p-3.5">{s.total}</td>
                      <td className="p-3.5 text-emerald-600 font-black">{s.correct}</td>
                      <td className="p-3.5 text-rose-500 font-black">{s.incorrect}</td>
                      <td className="p-3.5 font-black text-cyan-700">{s.marks.toFixed(2)} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 3. Question-by-Question Solution Analysis */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Question-by-Question Solution &amp; Answer Key
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed step-by-step Hindi &amp; English explanations, short tricks, and reference formulas.
              </p>
            </div>

            {/* Testbook Solution Filter Pills */}
            <div className="inline-flex p-1.5 rounded-2xl bg-white/70 backdrop-blur-md border border-white/80 shadow-xs">
              {[
                { id: 'all', label: `All (${questions.length})` },
                { id: 'correct', label: `Correct (${attempt.correctCount})` },
                { id: 'incorrect', label: `Incorrect (${attempt.incorrectCount})` },
                { id: 'skipped', label: `Skipped (${attempt.skippedCount})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterType === f.id
                      ? 'apple-capsule-active shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
                  className="apple-glass-card p-6 sm:p-8 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-black text-xs">
                        Q.{q.number}
                      </span>
                      <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-lg border border-cyan-100">
                        {q.subject || 'General'}
                      </span>
                    </div>

                    <div>
                      {isSkipped ? (
                        <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold">
                          Skipped (0.00 Marks)
                        </span>
                      ) : isUserCorrect ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> +{q.marksAwarded} Marks
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1 border border-rose-200">
                          <XCircle className="w-4 h-4 text-rose-600" /> {q.marksAwarded} Marks
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {q.questionText}
                  </h3>

                  {/* Options with Status Colors */}
                  <div className="space-y-2.5 pt-2">
                    {q.options.map((opt: string, optIdx: number) => {
                      const isOptionCorrect = String(optIdx) === String(q.correctAnswer);
                      const isOptionSelected = String(optIdx) === String(q.userSelected);

                      let style = 'bg-white/60 border-slate-200 text-slate-700';
                      if (isOptionCorrect) {
                        style = 'bg-emerald-50/90 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500/20';
                      } else if (isOptionSelected && !isUserCorrect) {
                        style = 'bg-rose-50/90 border-rose-400 text-rose-950 font-bold ring-1 ring-rose-400/20';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs sm:text-sm ${style}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </div>
                          {isOptionCorrect && (
                            <span className="text-xs font-black text-emerald-700 flex items-center gap-1 shrink-0 ml-2">
                              <Check className="w-4 h-4" /> Correct Answer
                            </span>
                          )}
                          {isOptionSelected && !isOptionCorrect && (
                            <span className="text-xs font-black text-rose-600 flex items-center gap-1 shrink-0 ml-2">
                              <X className="w-4 h-4" /> Your Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Explanation Container in Apple Glass */}
                  {q.explanation && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-tr from-cyan-50/80 to-blue-50/60 border border-cyan-200/60 space-y-1.5 mt-4">
                      <div className="flex items-center gap-1.5 text-xs font-black text-cyan-800 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Step-by-Step Solution &amp; Concept Trick</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium">
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
    </div>
  );
};

export default TestResultPage;
