import React from 'react';
import { X, ShieldCheck, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  article: any;
  loading: boolean;
  onPublish: (id: string) => void;
  onRegenerate: (id: string, section?: string) => void;
  onOpenEdit: () => void;
}

export const NewsroomReviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  article,
  loading,
  onPublish,
  onRegenerate,
  onOpenEdit,
}) => {
  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h3 className="font-black text-base">Editorial Review & Verification Panel</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Body */}
        <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-y-auto flex-1">
          {/* LEFT: Rendered Article Preview */}
          <div className="lg:col-span-2 p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-purple-100 text-[#6C63FF]">
                  {article.organizationName}
                </span>
                <span className="text-xs text-slate-400">Exam: {article.examName}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {article.title}
              </h2>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 text-xs text-slate-700 leading-relaxed font-medium">
              {article.excerpt}
            </div>

            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line text-xs sm:text-sm font-sans">
              {article.content}
            </div>
          </div>

          {/* RIGHT: Fact Verification Panel */}
          <div className="p-6 bg-slate-50 space-y-6 overflow-y-auto text-xs">
            <div className="space-y-3">
              <h3 className="font-black text-sm text-slate-900 border-b border-slate-200 pb-2">
                Fact Verification & Locking
              </h3>

              <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Confidence Rating</span>
                <p className="font-black text-emerald-600 text-sm">{article.confidenceScore || 'HIGH'}</p>
              </div>

              {/* Detected Dates & Locking */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase text-[10px]">Extracted Dates</span>
                <div className="space-y-1.5">
                  {(article.dates || []).map((d: any, di: number) => (
                    <div key={di} className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">{d.label}</p>
                        <p className="text-[11px] text-slate-400">{new Date(d.date).toLocaleDateString('en-IN')}</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Locked
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Links */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase text-[10px]">Official Links</span>
                <div className="space-y-1.5">
                  {(article.links || []).map((l: any, li: number) => (
                    <div key={li} className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                      <p className="font-bold text-slate-800 truncate">{l.label}</p>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#6C63FF] hover:underline truncate block">
                        {l.url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Regenerate Action */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <button
                onClick={() => onRegenerate(article.id, 'CONTENT')}
                disabled={loading}
                className="w-full py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-[#6C63FF] text-[#6C63FF] hover:text-white font-bold text-xs transition-colors"
              >
                Regenerate (Preserve Facts)
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100"
          >
            Close Review
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenEdit}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs text-slate-700 hover:bg-slate-100"
            >
              Edit Content
            </button>

            <button
              onClick={() => onPublish(article.id)}
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
            >
              Approve & Publish Live
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
