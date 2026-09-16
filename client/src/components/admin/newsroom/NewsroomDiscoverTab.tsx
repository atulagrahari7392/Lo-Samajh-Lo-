import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface Props {
  researchOrg: string;
  setResearchOrg: (v: string) => void;
  researchCategory: string;
  setResearchCategory: (v: string) => void;
  researchQuery: string;
  setResearchQuery: (v: string) => void;
  researchCustomUrl: string;
  setResearchCustomUrl: (v: string) => void;
  researching: boolean;
  discoveredResults: any[];
  onRunResearch: (e: React.FormEvent) => void;
  onGenerateDraft: (item: any) => void;
  loading: boolean;
}

export const NewsroomDiscoverTab: React.FC<Props> = ({
  researchOrg,
  setResearchOrg,
  researchCategory,
  setResearchCategory,
  researchQuery,
  setResearchQuery,
  researchCustomUrl,
  setResearchCustomUrl,
  researching,
  discoveredResults,
  onRunResearch,
  onGenerateDraft,
  loading,
}) => {
  return (
    <div className="space-y-6">
      <form onSubmit={onRunResearch} className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sparkles className="w-5 h-5 text-[#6C63FF]" />
          <h2 className="font-black text-sm text-slate-900">Search & Discover Official Updates</h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Select Monitored Board / Org</label>
            <select
              value={researchOrg}
              onChange={(e) => setResearchOrg(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#6C63FF]/30 font-semibold"
            >
              <option value="UPSSSC">UPSSSC (उत्तर प्रदेश अधीनस्थ सेवा)</option>
              <option value="UPPSC">UPPSC (लोक सेवा आयोग उ.प्र.)</option>
              <option value="UPPBPB">UP Police Board (पुलिस भर्ती)</option>
              <option value="SSC">SSC (Staff Selection Commission)</option>
              <option value="UPSC">UPSC (Union Public Service)</option>
              <option value="NTA">NTA (CUET / NEET / JEE / NET)</option>
              <option value="CBSE">CBSE / CTET (शिक्षक पात्रता)</option>
              <option value="RRB">RRB (रेलवे भर्ती बोर्ड)</option>
              <option value="IBPS">IBPS (Banking Personnel)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Target Category</label>
            <select
              value={researchCategory}
              onChange={(e) => setResearchCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#6C63FF]/30 font-semibold"
            >
              <option value="COMPETITIVE_EXAMS">Competitive Exams</option>
              <option value="GOVT_JOBS">Government Jobs</option>
              <option value="POLICE">Police & Defence</option>
              <option value="TEACHING">Teaching Exams</option>
              <option value="UNIVERSITY">University Admissions</option>
              <option value="RAILWAY">Railway</option>
              <option value="BANKING">Banking</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Custom Official Notice URL (Optional)</label>
            <input
              type="url"
              value={researchCustomUrl}
              onChange={(e) => setResearchCustomUrl(e.target.value)}
              placeholder="https://upsssc.gov.in/notice.pdf"
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF]/30 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1 text-xs">Search Keywords (Optional)</label>
          <input
            type="text"
            value={researchQuery}
            onChange={(e) => setResearchQuery(e.target.value)}
            placeholder="e.g. PET 2026, Constable vacancy, Exam Date, Admit Card..."
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF]/30"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={researching}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8077ff] text-white font-bold text-xs shadow-md shadow-[#6C63FF]/20 flex items-center gap-2 hover:opacity-95 disabled:opacity-50"
          >
            {researching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning Official Portals...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Start Web Research</span>
              </>
            )}
          </button>
        </div>
      </form>

      {discoveredResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-black text-sm text-slate-800">
            Discovered Verified Updates ({discoveredResults.length})
          </h3>

          <div className="space-y-4">
            {discoveredResults.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4 hover:border-[#6C63FF]/40 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-purple-100 text-[#6C63FF]">
                      {item.facts.organizationName}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Confidence: {item.facts.confidence}
                    </span>
                    {item.isDuplicate && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800">
                        Duplicate / Update Match Found
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onGenerateDraft(item)}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8077ff] text-white font-bold text-xs shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Article Draft</span>
                  </button>
                </div>

                <h4 className="font-black text-base text-slate-900">{item.facts.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.facts.summary}</p>

                {item.facts.dates && item.facts.dates.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
                    {item.facts.dates.map((d: any, di: number) => (
                      <span key={di} className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-medium text-slate-700">
                        <span className="font-bold text-slate-900">{d.label}:</span>{' '}
                        {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
