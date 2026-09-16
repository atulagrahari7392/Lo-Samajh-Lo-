import React from 'react';

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
  if (!dashboardData) return null;

  const stats = dashboardData.stats || {};

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

      {/* Health & Engine Status Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
          <div>
            <h3 className="font-bold text-sm">Newsroom Subsystems Operational</h3>
            <p className="text-xs text-slate-400">AI Provider: Rule-Based + OpenAI Fallback • Background Scheduler: Active (60s loop)</p>
          </div>
        </div>
        <span className="text-xs font-mono bg-white/10 px-3 py-1 rounded-lg text-emerald-300">
          PostgreSQL Database Connected
        </span>
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
