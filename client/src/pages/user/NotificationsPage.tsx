import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, ExternalLink, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { Notification } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const data = await api.notifications.getAll(selectedCategory);
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [selectedCategory, user]);

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    try {
      await api.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      // ignore
    }
  };

  const categories = [
    { label: 'All Notices', value: '' },
    { label: 'Competitive Exams', value: 'EXAM' },
    { label: 'Course Batches', value: 'COURSE' },
    { label: 'Academic & Tests', value: 'ACADEMIC' },
    { label: 'General News', value: 'GENERAL' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-[#6C63FF] text-xs font-bold border border-purple-200 mb-2">
          <Bell className="w-4 h-4" />
          <span>Official Announcements & Job Circulars</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Notifications & Alerts
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Stay updated with UPSSSC, Railway, SSC, Police vacancies, exam date sheets, and new study batches.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => setSelectedCategory(c.value)}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${
              selectedCategory === c.value
                ? 'bg-[#6C63FF] text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notif) => {
            const isUrgent = notif.priority === 'URGENT';
            const isHigh = notif.priority === 'HIGH';

            return (
              <div
                key={notif.id}
                className={`p-6 rounded-2xl bg-white border transition-all flex flex-col sm:flex-row items-start justify-between gap-4 ${
                  notif.isRead ? 'border-slate-200 opacity-80' : 'border-purple-200 shadow-sm ring-1 ring-[#6C63FF]/10'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        isUrgent
                          ? 'bg-rose-100 text-rose-700'
                          : isHigh
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-[#6C63FF]'
                      }`}
                    >
                      {notif.priority}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      {notif.category}
                    </span>
                    <span className="text-[11px] text-slate-400">•</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(notif.publishedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {notif.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {notif.message}
                  </p>

                  {notif.linkUrl && (
                    <div className="pt-2">
                      <a
                        href={notif.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 hover:bg-[#6C63FF] text-[#6C63FF] hover:text-white font-bold text-xs transition-all shadow-sm border border-purple-200 hover:border-[#6C63FF]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Download Official PDF Circular / विज्ञप्ति देखें</span>
                      </a>
                    </div>
                  )}
                </div>

                {user && !notif.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-emerald-600 transition-colors whitespace-nowrap"
                    title="Mark as read"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as Read</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl text-center border border-slate-200 max-w-md mx-auto space-y-3">
          <Bell className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800">No Announcements Found</h3>
          <p className="text-xs text-slate-500">There are no notices in this category at this time.</p>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
