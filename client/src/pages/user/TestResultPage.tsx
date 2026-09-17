import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  Share2,
  Star,
  Globe,
  ChevronLeft,
  ChevronRight,
  Shield,
  AlertTriangle,
  Eye,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const TestResultPage: React.FC = () => {
  const { isHindi, t } = useLanguage();
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mode: 'summary' (Page 8) vs 'solutions' (Page 9)
  const [activeView, setActiveView] = useState<'summary' | 'solutions'>(
    searchParams.get('view') === 'solutions' ? 'solutions' : 'summary'
  );
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Solutions state (Page 9)
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [filterType, setFilterType] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');
  const [solutionLanguage, setSolutionLanguage] = useState<'HINDI' | 'ENGLISH'>('HINDI');
  const [reattemptMode, setReattemptMode] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number>>({});
  const [starRating, setStarRating] = useState(5);

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
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="bg-slate-800/90 p-8 rounded-3xl text-center space-y-4 max-w-sm border border-slate-700 shadow-2xl">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-200">Generating Comprehensive Scorecard...</p>
          <span className="text-xs text-slate-400">Calculating rank, accuracy, percentile & solutions</span>
        </div>
      </div>
    );
  }

  if (!resultData || !resultData.attempt) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl text-center space-y-4 border border-slate-200 shadow-xl">
        <h3 className="font-bold text-lg text-slate-800">Result Not Available</h3>
        <p className="text-xs text-slate-500">Could not retrieve results for this examination session.</p>
        <Link
          to="/test-series"
          className="inline-block px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-bold text-xs shadow-md"
        >
          Return to Test Series
        </Link>
      </div>
    );
  }

  const { attempt, questions } = resultData;
  const totalQuestions = questions.length || attempt.totalQuestions || 50;
  const score = attempt.score ?? 0;
  const totalMarks = attempt.totalMarks || resultData.test?.totalMarks || 100;
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  // Counts
  const correctCount = questions.filter((q: any) => q.isCorrect).length;
  const attemptedCount = questions.filter((q: any) => q.userSelected !== null && q.userSelected !== undefined && q.userSelected !== '').length;
  const incorrectCount = attemptedCount - correctCount;
  const skippedCount = totalQuestions - attemptedCount;
  const accuracyPercent = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  // Percentile and rank simulation from backend or calculated
  const simulatedPercentile = resultData.userPercentile || attempt.percentile || (percentage > 0 ? Math.min(99.8, Math.max(15, Math.round((percentage * 0.95 + 5) * 10) / 10)) : 43);
  const totalCandidates = 2412;
  const simulatedRank = attempt.rank || Math.max(1, Math.round(totalCandidates * (1 - simulatedPercentile / 100)));

  // Cutoff calculation
  const examCutoff = resultData.examCutoff || Math.round(totalMarks * 0.67);
  const cutoffDiff = examCutoff - score;

  // Filtered questions for Solutions view (Page 9)
  const filteredQuestions = questions.filter((q: any) => {
    const isAns = q.userSelected !== null && q.userSelected !== undefined && q.userSelected !== '';
    if (filterType === 'correct') return q.isCorrect;
    if (filterType === 'incorrect') return isAns && !q.isCorrect;
    if (filterType === 'skipped') return !isAns;
    return true;
  });

  const currentSolQ = filteredQuestions[solutionIndex] || filteredQuestions[0] || questions[0];

  // Bilingual Options array parsing
  let solOptions: string[] = [];
  if (solutionLanguage === 'HINDI' && currentSolQ.optionsHindi && currentSolQ.optionsHindi.length > 0) {
    solOptions = currentSolQ.optionsHindi;
  } else if (solutionLanguage === 'ENGLISH' && currentSolQ.optionsEnglish && currentSolQ.optionsEnglish.length > 0) {
    solOptions = currentSolQ.optionsEnglish;
  } else if (Array.isArray(currentSolQ.options)) {
    solOptions = currentSolQ.options;
  } else if (typeof currentSolQ.options === 'string') {
    try {
      solOptions = JSON.parse(currentSolQ.options);
    } catch {
      solOptions = [currentSolQ.options];
    }
  }

  // Bilingual Question Text
  const currentSolQuestionText =
    solutionLanguage === 'HINDI' && currentSolQ.questionHindi
      ? currentSolQ.questionHindi
      : solutionLanguage === 'ENGLISH' && currentSolQ.questionEnglish
      ? currentSolQ.questionEnglish
      : currentSolQ.questionText;

  // Bilingual Explanation
  const currentExplanation =
    solutionLanguage === 'HINDI' && currentSolQ.explanationHindi
      ? currentSolQ.explanationHindi
      : solutionLanguage === 'ENGLISH' && currentSolQ.explanationEnglish
      ? currentSolQ.explanationEnglish
      : currentSolQ.explanation ||
        'इस प्रश्न का सही उत्तर आधिकारिक आयोग की उत्तर कुंजी एवं मानक संदर्भ पुस्तकों पर आधारित है। विस्तृत व्याख्या के लिए अध्यायवार थ्योरी नोट्स का पुनरीक्षण करें।';

  const correctIndex = parseInt(String(currentSolQ.correctAnswer), 10);
  const userSelectedIndex = currentSolQ.userSelected !== null && currentSolQ.userSelected !== undefined
    ? parseInt(String(currentSolQ.userSelected), 10)
    : null;

  // Format time MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // -----------------------------------------------------------------
  // PAGE 9: Question Solutions & Re-attempt Mode
  // -----------------------------------------------------------------
  if (activeView === 'solutions') {
    const isAttempted = userSelectedIndex !== null && !isNaN(userSelectedIndex);
    const isCorrect = isAttempted && userSelectedIndex === correctIndex;

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
        {/* Top Header matching Screenshot Page 7 */}
        <header className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('summary')}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 flex items-center gap-1 font-bold text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-bold text-slate-800 truncate max-w-md">
              {resultData.test?.title || 'Mock Test Solutions'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Star Rating */}
            <div className="hidden sm:flex items-center gap-1 text-amber-400">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Rate the Test</span>
              {[1, 2, 3, 4, 5].map((st) => (
                <button key={st} onClick={() => setStarRating(st)}>
                  <Star className={`w-3.5 h-3.5 ${st <= starRating ? 'fill-current' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>

            {/* Language dropdown */}
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={solutionLanguage}
                onChange={(e) => setSolutionLanguage(e.target.value as 'HINDI' | 'ENGLISH')}
                className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2 py-1 font-semibold text-slate-700 outline-none"
              >
                <option value="HINDI">View in Hindi</option>
                <option value="ENGLISH">View in English</option>
              </select>
            </div>

            {/* Analytics button to return to Page 8 */}
            <button
              onClick={() => setActiveView('summary')}
              className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs shadow-xs"
            >
              ANALYTICS
            </button>
          </div>
        </header>

        {/* Filter Pills */}
        <div className="bg-white px-6 py-2 border-b border-slate-200 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Filter:</span>
            {(['all', 'correct', 'incorrect', 'skipped'] as const).map((ft) => (
              <button
                key={ft}
                onClick={() => {
                  setFilterType(ft);
                  setSolutionIndex(0);
                }}
                className={`px-3 py-1 rounded-full font-bold capitalize transition-all ${
                  filterType === ft
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ft}
              </button>
            ))}
          </div>

          {/* Re-attempt Mode Toggle Switch */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600">Re-attempt mode:</span>
            <button
              onClick={() => setReattemptMode(!reattemptMode)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase transition-all ${
                reattemptMode ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {reattemptMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* 2-Column Solutions Viewer */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Question & Detailed Explanation */}
          <div className="flex-1 bg-white p-6 sm:p-8 overflow-y-auto space-y-6">
            {/* Question Status Chip Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900">
                  Question No. {solutionIndex + 1}
                </span>

                {/* Status Badge */}
                {isCorrect ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase flex items-center gap-1">
                    <Check className="w-3 h-3" /> Correct
                  </span>
                ) : isAttempted ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase flex items-center gap-1">
                    <X className="w-3 h-3" /> Incorrect
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                    Skipped
                  </span>
                )}

                <span className="text-slate-400 font-mono">
                  Time: {formatTime(currentSolQ.timeSpentSeconds || 35)}
                </span>
                <span className="text-slate-400 font-mono">
                  Avg Time: 00:25
                </span>
              </div>

              <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                77% students answered correctly
              </div>
            </div>

            {/* Question Text */}
            <div className="text-base font-bold text-slate-900 leading-relaxed">
              {currentSolQuestionText}
            </div>

            {/* Options List */}
            <div className="space-y-3 max-w-2xl">
              {solOptions.map((optText, optIdx) => {
                const isThisCorrect = optIdx === correctIndex;
                const isUserChoice = optIdx === userSelectedIndex;

                let optClass = 'bg-white border-slate-200 text-slate-800';
                if (!reattemptMode) {
                  if (isThisCorrect) {
                    optClass = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold ring-1 ring-emerald-400';
                  } else if (isUserChoice) {
                    optClass = 'bg-rose-50 border-rose-500 text-rose-900 font-semibold';
                  }
                } else {
                  if (practiceAnswers[solutionIndex] === optIdx) {
                    optClass = 'bg-cyan-50 border-cyan-500 text-cyan-900 font-semibold';
                  }
                }

                return (
                  <div
                    key={optIdx}
                    onClick={() => {
                      if (reattemptMode) {
                        setPracticeAnswers((prev) => ({ ...prev, [solutionIndex]: optIdx }));
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${optClass} ${
                      reattemptMode ? 'cursor-pointer hover:bg-slate-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {['A', 'B', 'C', 'D'][optIdx] || optIdx + 1}
                      </span>
                      <span className="text-xs sm:text-sm">{optText}</span>
                    </div>

                    {!reattemptMode && (
                      <div>
                        {isThisCorrect && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Correct Answer
                          </span>
                        )}
                        {isUserChoice && !isThisCorrect && (
                          <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Your Answer
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Detailed Explanation / Solution Box */}
            {!reattemptMode && (
              <div className="p-5 sm:p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-cyan-600" />
                  <span>Detailed Solution & Explanation:</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {currentExplanation}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Question Palette Navigation */}
          <div className="w-full lg:w-80 bg-white border-l border-slate-200 p-4 space-y-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Question Palette ({filteredQuestions.length})
              </h4>

              <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto pr-1">
                {filteredQuestions.map((q: any, idx: number) => {
                  const isCur = idx === solutionIndex;
                  const isAns = q.userSelected !== null && q.userSelected !== undefined && q.userSelected !== '';
                  let btnBg = 'bg-slate-100 text-slate-600 border-slate-200';
                  if (q.isCorrect) btnBg = 'bg-emerald-500 text-white border-emerald-500';
                  else if (isAns) btnBg = 'bg-rose-500 text-white border-rose-500';

                  return (
                    <button
                      key={idx}
                      onClick={() => setSolutionIndex(idx)}
                      className={`h-9 rounded-xl border text-xs font-bold transition-all flex items-center justify-center ${btnBg} ${
                        isCur ? 'ring-2 ring-cyan-500 scale-105 shadow-sm' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Solution Controls */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                disabled={solutionIndex === 0}
                onClick={() => setSolutionIndex((i) => Math.max(0, i - 1))}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs disabled:opacity-30"
              >
                Previous
              </button>
              <button
                disabled={solutionIndex >= filteredQuestions.length - 1}
                onClick={() => setSolutionIndex((i) => Math.min(filteredQuestions.length - 1, i + 1))}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // PAGE 8: Overall Performance & Analytics Summary Dashboard
  // -----------------------------------------------------------------
  const leaderboardList = resultData.leaderboard || [
    { rank: 1, name: 'Bhupendra', score: '100 / 100' },
    { rank: 2, name: 'Pandit Ji', score: '98 / 100' },
    { rank: 3, name: 'Kamini Rathour', score: '96 / 100' },
    { rank: 4, name: 'Anoop Sharma', score: '95 / 100' },
    { rank: 5, name: 'Mohd Shahrukh', score: '94 / 100' },
    { rank: 6, name: 'Rajat Singh', score: '93 / 100' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 selection:bg-cyan-500 selection:text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Top Breadcrumb & Return Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {resultData.test?.title || 'Mock Examination'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Completed on {new Date(attempt.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/test-series"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Go to Tests
            </Link>

            <button
              onClick={() => setActiveView('solutions')}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-xs shadow-md shadow-cyan-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isHindi ? 'विस्तृत हल देखें' : 'View Solutions'}</span>
            </button>
          </div>
        </header>

        {/* Section: Overall Performance Summary Cards (Screenshot Page 5 bottom) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
            Overall Performance Summary
          </h2>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {/* Rank Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-1">
              <div className="text-xs text-slate-400 font-semibold uppercase">Rank</div>
              <div className="text-lg sm:text-xl font-black text-slate-900">
                {simulatedRank} <span className="text-xs text-slate-400 font-normal">/ {totalCandidates}</span>
              </div>
            </div>

            {/* Score Card */}
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-center space-y-1">
              <div className="text-xs text-purple-600 font-semibold uppercase">Score</div>
              <div className="text-lg sm:text-xl font-black text-purple-700">
                {score} <span className="text-xs text-purple-400 font-normal">/ {totalMarks}</span>
              </div>
            </div>

            {/* Attempted Card */}
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center space-y-1">
              <div className="text-xs text-blue-600 font-semibold uppercase">Attempted</div>
              <div className="text-lg sm:text-xl font-black text-blue-700">
                {attemptedCount} <span className="text-xs text-blue-400 font-normal">/ {totalQuestions}</span>
              </div>
            </div>

            {/* Accuracy Card */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center space-y-1">
              <div className="text-xs text-emerald-600 font-semibold uppercase">Accuracy</div>
              <div className="text-lg sm:text-xl font-black text-emerald-700">
                {accuracyPercent}%
              </div>
            </div>

            {/* Percentile Card */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center space-y-1 col-span-2 sm:col-span-1">
              <div className="text-xs text-amber-600 font-semibold uppercase">Percentile</div>
              <div className="text-lg sm:text-xl font-black text-amber-700">
                {simulatedPercentile}%
              </div>
            </div>
          </div>

          {/* Cutoff Comparison Banner matching Screenshot Page 5 */}
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-rose-900 text-sm">
                You scored {Math.max(0, cutoffDiff)} Marks ▼ less than cutoff !
              </div>
              <div className="text-xs text-rose-700">
                Major gaps observed, strong basics needed. Focus on revision and attempt sectional mock tests.
              </div>
            </div>
          </div>

          {/* Sectional Summary Table matching Screenshot Page 6 */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900">Sectional Summary</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Section Name</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-center">Attempted</th>
                    <th className="py-3 px-4 text-center">Accuracy</th>
                    <th className="py-3 px-4 text-center">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/60 font-semibold text-slate-700">
                    <td className="py-3 px-4 font-bold text-slate-900">General Paper</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600">
                      {score} / {totalMarks}
                      <span className="block text-[10px] text-slate-400 font-normal">Cutoff: {examCutoff}</span>
                    </td>
                    <td className="py-3 px-4 text-center">{attemptedCount} / {totalQuestions}</td>
                    <td className="py-3 px-4 text-center">{accuracyPercent}%</td>
                    <td className="py-3 px-4 text-center font-mono">
                      {formatTime(attempt.timeSpentSeconds || 157)} / {resultData.test?.durationMinutes || 30}m
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 2 Columns: Weakness & Strengths + Top Rankers Leaderboard */}
        <div className="grid md:grid-cols-12 gap-6">
          {/* Left Column: Weakness & Strengths Chapters */}
          <div className="md:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">Your Weakness and Strengths</h3>

            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold">
                Weak Chapters
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                Uncategorized Chapters
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>1. Central Government & Polity</span>
                  <span className="text-rose-500 font-mono">Correct 0%</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[3, 10, 21, 28].map((n) => (
                    <span key={n} className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>2. Basics of Indian Constitution</span>
                  <span className="text-rose-500 font-mono">Correct 0%</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 8, 9, 27, 30, 33, 35, 36, 45, 46, 49, 50].map((n) => (
                    <span key={n} className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Top Rankers Leaderboard */}
          <div className="md:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">Top Rankers (Leaderboard)</h3>

            <div className="space-y-2 text-xs">
              {leaderboardList.map((ldr: any) => (
                <div
                  key={ldr.rank}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        ldr.rank === 1
                          ? 'bg-amber-100 text-amber-800'
                          : ldr.rank === 2
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {ldr.rank}
                    </span>
                    <span className="font-bold text-slate-800">{ldr.name}</span>
                  </div>
                  <span className="font-mono text-cyan-600 font-bold">{ldr.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compare with Topper Table matching Screenshot Page 6 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900">Compare with Topper</h3>
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Accuracy</th>
                  <th className="py-3 px-4 text-center">Correct</th>
                  <th className="py-3 px-4 text-center">Wrong</th>
                  <th className="py-3 px-4 text-center">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                <tr className="bg-cyan-50/40">
                  <td className="py-3 px-4 font-black text-cyan-900">You (Candidate)</td>
                  <td className="py-3 px-4 text-center font-bold">{score} / {totalMarks}</td>
                  <td className="py-3 px-4 text-center">{accuracyPercent}%</td>
                  <td className="py-3 px-4 text-center text-emerald-600">{correctCount} / {totalQuestions}</td>
                  <td className="py-3 px-4 text-center text-rose-500">{incorrectCount} / {totalQuestions}</td>
                  <td className="py-3 px-4 text-center font-mono">{formatTime(attempt.timeSpentSeconds || 157)}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Topper (Rank 1)</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">100 / 100</td>
                  <td className="py-3 px-4 text-center">100%</td>
                  <td className="py-3 px-4 text-center text-emerald-600">50 / 50</td>
                  <td className="py-3 px-4 text-center">0 / 50</td>
                  <td className="py-3 px-4 text-center font-mono">03:19</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Average Student</td>
                  <td className="py-3 px-4 text-center font-bold">49.31 / 100</td>
                  <td className="py-3 px-4 text-center">55.94%</td>
                  <td className="py-3 px-4 text-center">25 / 50</td>
                  <td className="py-3 px-4 text-center">19 / 50</td>
                  <td className="py-3 px-4 text-center font-mono">12:03</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setActiveView('solutions')}
            className="px-8 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-sm shadow-xl shadow-cyan-600/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>{isHindi ? 'विस्तृत हल देखें' : 'View Detailed Solutions'}</span>
          </button>

          <button
            onClick={() => navigate(`/test-series/${id}/attempt`)}
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm shadow-sm transition-all"
          >
            {isHindi ? 'पुनः परीक्षा दें' : 'Re-attempt Test'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestResultPage;
