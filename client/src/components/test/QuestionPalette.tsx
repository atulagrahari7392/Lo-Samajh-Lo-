import React from 'react';
import { User, CheckCircle, HelpCircle, EyeOff, Bookmark, Check } from 'lucide-react';

interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, string>;
  markedForReview: Record<string, boolean>;
  visitedQuestions: Record<string, boolean>;
  questionIds: string[];
  candidateName?: string;
  candidateAvatar?: string | null;
  onSelect: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  totalQuestions,
  currentIndex,
  answers,
  markedForReview,
  visitedQuestions,
  questionIds,
  candidateName = 'Student Candidate',
  candidateAvatar,
  onSelect,
}) => {
  // Count the 5 Testbook states
  let answeredCount = 0;
  let notAnsweredCount = 0;
  let notVisitedCount = 0;
  let reviewCount = 0;
  let answeredAndReviewCount = 0;

  questionIds.forEach((qId) => {
    const isAnswered = answers[qId] !== undefined && answers[qId] !== '';
    const isReview = !!markedForReview[qId];
    const isVisited = !!visitedQuestions[qId];

    if (isAnswered && isReview) {
      answeredAndReviewCount++;
    } else if (isAnswered) {
      answeredCount++;
    } else if (isReview) {
      reviewCount++;
    } else if (isVisited) {
      notAnsweredCount++;
    } else {
      notVisitedCount++;
    }
  });

  return (
    <div className="apple-liquid-glass rounded-3xl p-5 sm:p-6 space-y-5 border border-white/80 shadow-lg">
      {/* Candidate Profile Card (Testbook CBT Layout) */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/50 border border-white/60">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
          {candidateAvatar ? (
            <img src={candidateAvatar} alt={candidateName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-xs text-slate-900 truncate">{candidateName}</h4>
          <span className="text-[10px] text-cyan-700 font-semibold bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100 inline-block">
            CBT Roll: 2026-LSL-8921
          </span>
        </div>
      </div>

      {/* Official Testbook 5-State Legend */}
      <div className="space-y-2">
        <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
          Question Palette Legend
        </h5>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700 bg-white/40 p-3 rounded-2xl border border-white/60">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
              {answeredCount}
            </span>
            <span>Answered</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-lg bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
              {notAnsweredCount}
            </span>
            <span>Not Answered</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-lg bg-purple-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
              {reviewCount}
            </span>
            <span>Marked Review</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold border border-slate-300 shadow-xs">
              {notVisitedCount}
            </span>
            <span>Not Visited</span>
          </div>

          <div className="col-span-2 flex items-center gap-2 pt-1 border-t border-slate-200/50">
            <span className="relative w-4 h-4 rounded-lg bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
              {answeredAndReviewCount}
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 border border-white" />
            </span>
            <span className="text-[10px] text-purple-900 leading-tight">
              Answered &amp; Marked for Review <em className="text-emerald-700">(evaluated)</em>
            </span>
          </div>
        </div>
      </div>

      {/* Grid of question buttons with Apple Liquid Glass styling */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Choose a Question</span>
          <span className="text-[11px] text-cyan-600">Total: {totalQuestions}</span>
        </div>

        <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
          {questionIds.map((qId, idx) => {
            const isCurrent = currentIndex === idx;
            const isAnswered = answers[qId] !== undefined && answers[qId] !== '';
            const isReview = !!markedForReview[qId];
            const isVisited = !!visitedQuestions[qId];

            let btnStyle = 'bg-white/80 border border-slate-200 text-slate-700 hover:bg-white shadow-xs';
            let hasEvaluatedBadge = false;

            if (isAnswered && isReview) {
              btnStyle = 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white border border-purple-400 shadow-sm';
              hasEvaluatedBadge = true;
            } else if (isAnswered) {
              btnStyle = 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white border border-emerald-400 shadow-sm';
            } else if (isReview) {
              btnStyle = 'bg-gradient-to-tr from-purple-500 to-fuchsia-600 text-white border border-purple-400 shadow-sm';
            } else if (isVisited) {
              btnStyle = 'bg-gradient-to-tr from-rose-500 to-red-600 text-white border border-rose-400 shadow-sm';
            }

            if (isCurrent) {
              btnStyle += ' ring-2 ring-offset-2 ring-cyan-500 font-black scale-105';
            }

            return (
              <button
                key={qId}
                onClick={() => onSelect(idx)}
                className={`relative h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${btnStyle}`}
              >
                <span>{idx + 1}</span>
                {hasEvaluatedBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white shadow-xs" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuestionPalette;
