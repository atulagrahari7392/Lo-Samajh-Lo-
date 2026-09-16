import React, { useState } from 'react';
import { Activity, Sparkles, Database, Globe, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../../services/api';

interface Props {
  dashboardData: any;
  onSelectTab: (tab: any) => void;
  onOpenReview: (id: string) => void;
  onPublish: (id: string) => void;
}

export const NewsroomDashboardTab: React.FC<Props> = ({
  dashboardData,
  onSelectTab,
  onOpenReview,
  onPublish,
}) => {
  const [testingAI, setTestingAI] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<any>(null);

  if (!dashboardData) return null;

  const stats = dashboardData.stats || {};
  const health = dashboardData.health || {};

  const handleTestAI = async () => {
    try {
      setTestingAI(true);
      const res = await api.aiNewsroom.testAI();
      setAiTestResult(res);
    } catch (err: any) {
      setAiTestResult({ connected: false, error: err.message, latencyMs: 0 });
    } finally {
      setTestingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-black text-slate-400 uppercase">Total Articles</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalArticles || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs">
          <span className="text-[10px] font-black text-[#6C63FF] uppercase">Drafts Awaiting</span>
          <p className="text-2xl font-black text-[#6C63FF] mt-1">{stats.draftCount || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs">
          <span className="text-[10px] font-black text-emerald-600 uppercase">Live Published</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.publishedCount || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-blue-100 shadow-xs">
          <span className="text-[10px] font-black text-blue-600 uppercase">Scheduled</span>
          <p className="text-2xl font-black text-blue-600 mt-1">{stats.scheduledCount || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
          <span className="text-[10px] font-black text-rose-600 uppercase">Failed Jobs</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{stats.failedJobsCount || 0}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-amber-100 shadow-xs">
          <span className="text-[10px] font-black text-amber-600 uppercase">Discovered Today</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{stats.todayDiscovered || 0}</p>
        </div>
      </div>

      {/* Subsystem Health & Diagnostics Banner (Phase 26, 27, 28) */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
            <div>
              <h3 className="font-bold text-sm">Newsroom Subsystems Health</h3>
              <p className="text-xs text-slate-400">
                AI Provider: {health.aiProviderName || 'Rule-Based Fallback'} • Model: {health.aiModel || 'deterministic-rules-v2'}
              </p>
            </div>
          </div>
          <button
            onClick={handleTestAI}
            disabled={testingAI}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 transition-colors self-start md:self-auto"
          >
            {testingAI ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
            <span>Test AI Connection</span>
          </button>
        </div>

        {/* Subsystem Status Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* AI Provider Status */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">AI Provider</span>
              <span
                className={`font-black ${
                  health.aiProvider === 'CONNECTED'
                    ? 'text-emerald-400'
                    : health.aiProvider === 'NOT CONFIGURED'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {health.aiProvider || 'ACTIVE'}
              </span>
            </div>
          </div>

          {/* Web Discovery Status */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Web Discovery</span>
              <span
                className={`font-black ${
                  health.webDiscovery === 'ACTIVE' ? 'text-emerald-400' : 'text-blue-300'
                }`}
              >
                {health.webDiscovery || 'CATALOG ONLY'}
              </span>
            </div>
          </div>

          {/* Database Status */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2.5">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Database</span>
              <span className="font-black text-emerald-400">
                {health.database || 'CONNECTED'}
              </span>
            </div>
          </div>

          {/* Scheduler Status */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Scheduler</span>
              <span className="font-black text-emerald-400">
                {health.scheduler || 'RUNNING'}
              </span>
            </div>
          </div>
        </div>

        {/* AI Test Result Feedback */}
        {aiTestResult && (
          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/50 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              {aiTestResult.connected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
              <span>
                <strong>{aiTestResult.provider}</strong> ({aiTestResult.model}):{' '}
                {aiTestResult.connected ? 'Connection verified' : aiTestResult.error || 'Provider not responding'}{' '}
                {aiTestResult.latencyMs ? `• Latency: ${aiTestResult.latencyMs}ms` : ''}
              </span>
            </div>
            <button
              onClick={() => setAiTestResult(null)}
              className="text-slate-400 hover:text-white text-[10px] font-bold"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Recent Articles Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-sm text-slate-900">Recent Educational Circulars</h2>
          <button onClick={() => onSelectTab('DRAFTS')} className="text-xs font-bold text-[#6C63FF] hover:underline">
            View All Drafts →
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {(dashboardData.recentArticles || []).map((art: any) => (
            <div key={art.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-[#6C63FF]">
                    {art.organizationName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                    {art.status}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{art.title}</h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenReview(art.id)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#6C63FF] text-slate-700 hover:text-[#6C63FF] font-bold text-xs transition-colors"
                >
                  Review
                </button>
                {art.status !== 'PUBLISHED' && (
                  <button
                    onClick={() => onPublish(art.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold text-xs transition-colors"
                  >
                    Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
