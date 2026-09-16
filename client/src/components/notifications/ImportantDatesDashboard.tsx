import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

interface DateItem {
  id: string;
  label: string;
  date: string;
  formattedDate: string;
  dateType: string;
  statusText: string;
  badgeColor: string;
  isExpired: boolean;
  daysRemaining: number;
  article?: {
    id: string;
    title: string;
    slug: string;
    examName: string;
    organizationName: string;
    category: string;
  };
}

interface TimelineData {
  TODAY: DateItem[];
  THIS_WEEK: DateItem[];
  CLOSING_SOON: DateItem[];
  UPCOMING: DateItem[];
  EXPIRED: DateItem[];
}

interface Props {
  timeline: TimelineData | null;
  loading?: boolean;
}

export const ImportantDatesDashboard: React.FC<Props> = ({ timeline, loading }) => {
  const [activeTab, setActiveTab] = useState<'CLOSING_SOON' | 'TODAY' | 'THIS_WEEK' | 'UPCOMING' | 'EXPIRED'>('CLOSING_SOON');

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4 shadow-sm">
        <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!timeline) return null;

  const tabs: Array<{ key: typeof activeTab; label: string; count: number; badgeColor: string }> = [
    { key: 'CLOSING_SOON', label: 'Closing Soon (अंतिम दिन)', count: timeline.CLOSING_SOON.length, badgeColor: 'text-orange-600 bg-orange-50' },
    { key: 'TODAY', label: 'Today (आज)', count: timeline.TODAY.length, badgeColor: 'text-rose-600 bg-rose-50' },
    { key: 'THIS_WEEK', label: 'This Week (इस सप्ताह)', count: timeline.THIS_WEEK.length, badgeColor: 'text-indigo-600 bg-indigo-50' },
    { key: 'UPCOMING', label: 'Upcoming (आगामी)', count: timeline.UPCOMING.length, badgeColor: 'text-emerald-600 bg-emerald-50' },
    { key: 'EXPIRED', label: 'Expired (समाप्त)', count: timeline.EXPIRED.length, badgeColor: 'text-slate-500 bg-slate-100' },
  ];

  const currentItems = timeline[activeTab] || [];

  return (
    <div className="bg-white rounded-2xl border border-purple-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-purple-50/50 via-white to-pink-50/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#6C63FF]/10 text-[#6C63FF] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Important Dates Dashboard</h2>
            <p className="text-xs text-slate-500">Live Indian Standard Time (IST) deadline intelligence tracker</p>
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-[#6C63FF] text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : tab.badgeColor
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Date Cards Grid */}
      <div className="p-6">
        {currentItems.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200/80 hover:border-[#6C63FF]/50 bg-white hover:bg-purple-50/30 transition-all flex flex-col justify-between space-y-3 group shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                      {item.article?.organizationName || 'Govt Board'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                      {item.statusText}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#6C63FF] transition-colors line-clamp-2">
                    {item.article?.examName || item.label}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.label}:</span>
                    <span className="font-bold text-slate-700">{item.formattedDate}</span>
                  </div>
                </div>

                {item.article?.slug ? (
                  <Link
                    to={`/notifications/${item.article.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#6C63FF] hover:underline pt-1 border-t border-slate-100"
                  >
                    <span>Check Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            <p>No deadlines currently in this timeframe.</p>
          </div>
        )}
      </div>
    </div>
  );
};
