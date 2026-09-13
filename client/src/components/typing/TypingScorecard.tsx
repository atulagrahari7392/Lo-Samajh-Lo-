import React from 'react';
import {
  Award,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Target,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Share2,
} from 'lucide-react';
import { TypingTest, TypingExam } from '../../types';

interface ScorecardData {
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  errors: number;
  correctChars: number;
  wrongChars: number;
  backspaces: number;
  timeSpentSeconds: number;
  resultStatus?: string | null;
  readinessScore?: number | null;
  weakKeys?: string[];
}

interface TypingScorecardProps {
  test: TypingTest;
  exam?: TypingExam | null;
  scorecard: ScorecardData;
  onRetry: () => void;
  onNext?: () => void;
  onGoToDashboard?: () => void;
}

export const TypingScorecard: React.FC<TypingScorecardProps> = ({
  test,
  exam,
  scorecard,
  onRetry,
  onNext,
  onGoToDashboard,
}) => {
  const {
    grossWpm,
    netWpm,
    accuracy,
    errors,
    correctChars,
    wrongChars,
    backspaces,
    timeSpentSeconds,
    resultStatus = 'PASSED',
    readinessScore = 75,
    weakKeys = [],
  } = scorecard;

  // Format time
  const mins = Math.floor(timeSpentSeconds / 60);
  const secs = timeSpentSeconds % 60;
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  // Target comparison
  const targetSpeed = exam?.targetSpeed || 35;
  const isQualified = netWpm >= targetSpeed && accuracy >= (exam?.minAccuracy || 90);

  // Dynamic feedback
  let feedback = 'Good consistency and rhythm. Continue regular daily practice.';
  if (accuracy < 90) {
    feedback = 'Your accuracy dipped below 90%. Slow down slightly to build muscle memory before pushing speed.';
  } else if (netWpm >= targetSpeed && accuracy >= 95) {
    feedback = 'Outstanding performance! You are well within the passing benchmark for this exam.';
  } else if (netWpm < targetSpeed) {
    feedback = `You need +${Math.round(targetSpeed - netWpm)} WPM more to clear the ${exam?.name || 'official benchmark'}. Recommended: 5-minute speed drills.`;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xl max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              isQualified
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {isQualified ? '✓ Benchmark Qualified (उत्तीर्ण)' : '⚠ Practice Required (अभ्यास आवश्यक)'}
            </span>
            <span className="text-xs text-slate-400 font-medium">Mode: {test.category || 'Practice'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Typing Test Performance Scorecard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 truncate max-w-xl">
            {test.title}
          </p>
        </div>

        {/* Exam Readiness Badge */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-2xl border border-indigo-100 text-center sm:text-right shrink-0">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
            Exam Readiness Score
          </span>
          <div className="text-3xl font-black text-[#6C63FF] leading-tight">
            {readinessScore}%
          </div>
          <span className="text-[10px] text-slate-500">
            {exam ? exam.name.slice(0, 20) + '...' : 'Government Benchmark'}
          </span>
        </div>
      </div>

      {/* Primary Key Stats Grid (Phase 23) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-[#6C63FF] text-white shadow-md space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
            Net Speed (शुद्ध गति)
          </span>
          <p className="text-3xl sm:text-4xl font-black leading-none">{netWpm}</p>
          <span className="text-xs text-indigo-100">Words Per Minute (WPM)</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Gross Speed (कुल गति)
          </span>
          <p className="text-3xl sm:text-4xl font-black text-slate-800 leading-none">{grossWpm}</p>
          <span className="text-xs text-slate-500">WPM raw typing rate</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Accuracy (सटीकता)
          </span>
          <p className={`text-3xl sm:text-4xl font-black leading-none ${
            accuracy >= 95 ? 'text-emerald-600' : accuracy >= 85 ? 'text-amber-600' : 'text-rose-600'
          }`}>
            {accuracy}%
          </p>
          <span className="text-xs text-slate-500">Min. req: {exam?.minAccuracy || 90}%</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            समय / Duration
          </span>
          <p className="text-3xl sm:text-4xl font-black text-slate-800 leading-none">{timeFormatted}</p>
          <span className="text-xs text-slate-500">Minutes : Seconds</span>
        </div>
      </div>

      {/* Secondary Metrics & Error Analysis (Phase 23) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Error Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>गलतियां एवं त्रुटि विश्लेषण / Error Breakdown</span>
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-600">कुल गलतियां / Total Mistakes:</span>
              <strong className="text-rose-600 font-bold">{errors}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-600">सही अक्षर / Correct Characters:</span>
              <strong className="text-emerald-700 font-bold">{correctChars}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-600">गलत अक्षर / Wrong Characters:</span>
              <strong className="text-rose-700 font-bold">{wrongChars}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-600">बैकस्पेस उपयोग / Backspaces used:</span>
              <strong className="text-slate-800 font-bold">{backspaces}</strong>
            </div>
          </div>
        </div>

        {/* Feedback & Improvement Advice */}
        <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#6C63FF]" />
              <span>मार्गदर्शन एवं सुधार सलाह / Performance Advice</span>
            </h4>
            <p className="text-xs text-indigo-900 leading-relaxed">
              {feedback}
            </p>
          </div>

          {weakKeys.length > 0 && (
            <div className="pt-2 border-t border-indigo-200/60">
              <span className="text-[11px] font-bold text-slate-600 mr-2">कमजोर कुंजियाँ (Weak Keys):</span>
              <div className="inline-flex gap-1">
                {weakKeys.map(k => (
                  <span key={k} className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-xs uppercase">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-2 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>पुनः प्रयास करें / Re-attempt Test</span>
        </button>

        <div className="flex items-center gap-3 ml-auto">
          {onGoToDashboard && (
            <button
              type="button"
              onClick={onGoToDashboard}
              className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition"
            >
              Typing Hub डैशबोर्ड
            </button>
          )}

          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#6C63FF] to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition flex items-center gap-2"
            >
              <span>अगला टेस्ट / Next Practice</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypingScorecard;
