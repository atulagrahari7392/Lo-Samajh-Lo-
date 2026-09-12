import React from 'react';

interface QuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, string>;
  markedForReview: Record<string, boolean>;
  questionIds: string[];
  onSelect: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  totalQuestions,
  currentIndex,
  answers,
  markedForReview,
  questionIds,
  onSelect,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
      <h4 className="font-bold text-slate-800 text-sm mb-3">Question Palette</h4>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mb-4 pb-3 border-b border-slate-100 font-medium">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-emerald-500 inline-block" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-rose-500 inline-block" />
          <span>Not Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-purple-500 inline-block" />
          <span>Review</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-slate-200 inline-block" />
          <span>Not Visited</span>
        </div>
      </div>

      {/* Grid of question buttons */}
      <div className="grid grid-cols-5 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1">
        {questionIds.map((qId, idx) => {
          const isCurrent = currentIndex === idx;
          const isAnswered = answers[qId] !== undefined && answers[qId] !== '';
          const isReview = markedForReview[qId];

          let btnClass = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
          if (isAnswered && isReview) {
            btnClass = 'bg-indigo-600 text-white';
          } else if (isAnswered) {
            btnClass = 'bg-emerald-500 text-white';
          } else if (isReview) {
            btnClass = 'bg-purple-500 text-white';
          }

          if (isCurrent) {
            btnClass += ' ring-2 ring-offset-2 ring-[#6C63FF] font-black scale-105';
          }

          return (
            <button
              key={qId}
              onClick={() => onSelect(idx)}
              className={`h-9 w-full rounded-xl text-xs font-bold transition-all flex items-center justify-center ${btnClass}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionPalette;
