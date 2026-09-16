import React, { useState } from 'react';
import { Sparkles, RefreshCw, Eye, Globe, ExternalLink, CheckCircle2 } from 'lucide-react';
import { api } from '../../../services/api';

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
  autonomousMode?: boolean;
  setAutonomousMode?: (v: boolean) => void;
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
  autonomousMode = false,
  setAutonomousMode,
}) => {
  const [testingDryRun, setTestingDryRun] = useState(false);
  const [dryRunData, setDryRunData] = useState<any>(null);

  const handleDryRun = async () => {
    try {
      setTestingDryRun(true);
      const res = await api.aiNewsroom.testResearch({
        organization: researchOrg,
        category: researchCategory,
      });
      if (res.success) {
        setDryRunData(res);
      }
    } catch (err: any) {
      alert(`Dry run failed: ${err.message}`);
    } finally {
      setTestingDryRun(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onRunResearch} className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#6C63FF]" />
            <h2 className="font-black text-sm text-slate-900">Search & Discover Official Updates</h2>
          </div>
          {setAutonomousMode && (
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 select-none">
              <input
                type="checkbox"
                checked={autonomousMode}
                onChange={(e) => setAutonomousMode(e.target.checked)}
                className="w-4 h-4 text-[#6C63FF] rounded border-slate-300 focus:ring-[#6C63FF]"
              />
              <span>Autonomous Multi-Source Mode</span>
            </label>
          )}
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

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleDryRun}
            disabled={testingDryRun}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-[#6C63FF] text-slate-700 hover:text-[#6C63FF] font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {testingDryRun ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>Test Research (Dry Run)</span>
          </button>

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

      {/* Dry Run Inspector Panel (Phase 29) */}
      {dryRunData && (
        <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-sm">
                Dry Run Inspection: {dryRunData.organization} ({dryRunData.discoveryProvider})
              </h3>
            </div>
            <button
              onClick={() => setDryRunData(null)}
              className="text-xs text-slate-400 hover:text-white font-bold"
            >
              Close Inspector ✕
            </button>
          </div>

          <div className="text-xs space-y-3">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Targeted Queries Generated:</span>
              <div className="flex flex-wrap gap-1.5">
                {(dryRunData.queriesGenerated || []).map((q: string, idx: number) => (
                  <span key={idx} className="bg-slate-800 px-2.5 py-1 rounded-md text-slate-300 font-mono text-[11px]">
                    {q}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Candidate Sources Identified:</span>
              <div className="space-y-1.5">
                {(dryRunData.candidateSources || []).map((src: any, idx: number) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white mr-2">{src.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-mono">
                        {src.domain}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {src.authorityLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {dryRunData.extractedFactsSample && (
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">Sample Fact Extraction:</span>
                <p className="font-bold text-sm text-white">{dryRunData.extractedFactsSample.title}</p>
                <p className="text-slate-300 mt-1">{dryRunData.extractedFactsSample.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}

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
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
                      {item.facts.category}
                    </span>
                    {item.isDuplicate && (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-700">
                        Existing Match ({item.duplicateMatch?.detectedEvent || 'DUPLICATE'})
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified High Confidence
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-base text-slate-900">{item.facts.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.facts.summary}</p>
                </div>

                {item.facts.dates && item.facts.dates.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {item.facts.dates.map((d: any, dIdx: number) => (
                      <span key={dIdx} className="px-2.5 py-1 rounded-lg bg-slate-50 text-[11px] font-semibold text-slate-700 border border-slate-100">
                        <strong>{d.label}:</strong> {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <span>Source:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-700">
                      {item.facts.sources?.[0]?.domain || 'Official Portal'}
                    </span>
                  </div>
                  <button
                    onClick={() => onGenerateDraft(item)}
                    disabled={loading}
                    className="px-5 py-2 rounded-xl bg-purple-50 hover:bg-[#6C63FF] text-[#6C63FF] hover:text-white font-bold text-xs transition-colors shadow-xs"
                  >
                    Generate Draft Article →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
