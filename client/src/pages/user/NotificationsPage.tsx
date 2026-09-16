import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  AlertCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { Notification } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ImportantDatesDashboard } from '../../components/notifications/ImportantDatesDashboard';
import { NotificationCard } from '../../components/notifications/NotificationCard';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [timeline, setTimeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [datesLoading, setDatesLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Important Dates Dashboard
  useEffect(() => {
    const fetchDates = async () => {
      try {
        setDatesLoading(true);
        const res = await api.notifications.getDatesDashboard();
        if (res.success && res.timeline) {
          setTimeline(res.timeline);
        }
      } catch (err) {
        console.error('Error fetching dates dashboard:', err);
      } finally {
        setDatesLoading(false);
      }
    };
    fetchDates();
  }, []);

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.notifications.getAll({
        category: selectedCategory || undefined,
        search: debouncedSearch || undefined,
        page,
        limit: 15,
      });

      if (res.success) {
        setNotifications(res.notifications || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotalCount(res.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [selectedCategory, debouncedSearch, page, user]);

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    try {
      await api.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const categories = [
    { label: 'All Updates / सभी सूचनाएं', value: '' },
    { label: 'Competitive Exams (प्रतियोगी परीक्षाएं)', value: 'COMPETITIVE_EXAMS' },
    { label: 'Government Jobs (सरकारी नौकरी)', value: 'GOVT_JOBS' },
    { label: 'Uttar Pradesh (उत्तर प्रदेश विशेष)', value: 'UP_UPDATES' },
    { label: 'Police & Defence (पुलिस एवं रक्षा)', value: 'POLICE' },
    { label: 'Teaching Exams (शिक्षक पात्रता)', value: 'TEACHING' },
    { label: 'University & Admissions (विश्वविद्यालय प्रवेश)', value: 'UNIVERSITY' },
    { label: 'Railway (रेलवे भर्ती)', value: 'RAILWAY' },
    { label: 'Banking (बैंकिंग)', value: 'BANKING' },
    { label: 'Scholarships (छात्रवृत्ति)', value: 'SCHOLARSHIPS' },
    { label: 'Academic & Board (बोर्ड परीक्षाएं)', value: 'ACADEMIC' },
  ];

  const quickFilters = [
    { label: 'All', value: 'ALL' },
    { label: 'Closing Soon (अंतिम तिथि)', value: 'CLOSING_SOON' },
    { label: 'Exam Dates (परीक्षा तिथि)', value: 'EXAM_DATE' },
    { label: 'Admit Cards (प्रवेश पत्र)', value: 'ADMIT_CARD' },
    { label: 'Results (परिणाम)', value: 'RESULT' },
    { label: 'High Priority (महत्वपूर्ण)', value: 'HIGH' },
  ];

  // Client-side quick filter refinement
  const filteredNotifications = notifications.filter((n) => {
    if (selectedQuickFilter === 'ALL') return true;
    if (selectedQuickFilter === 'HIGH') return n.priority === 'HIGH' || n.priority === 'URGENT';
    if (selectedQuickFilter === 'CLOSING_SOON') return n.deadlineStatus && !n.deadlineStatus.isExpired && n.deadlineStatus.daysRemaining <= 7;
    if (selectedQuickFilter === 'EXAM_DATE') return n.title.toLowerCase().includes('exam') || n.title.toLowerCase().includes('तिथि');
    if (selectedQuickFilter === 'ADMIT_CARD') return n.title.toLowerCase().includes('admit') || n.title.toLowerCase().includes('प्रवेश');
    if (selectedQuickFilter === 'RESULT') return n.title.toLowerCase().includes('result') || n.title.toLowerCase().includes('रिजल्ट');
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#141424] via-[#1E1B4B] to-[#2D1B69] text-white space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-bold border border-white/10">
          <Bell className="w-3.5 h-3.5 text-[#FF6584]" />
          <span>AI Education Newsroom 2.0 • Real-Time Verified Updates</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
          Education Updates & Recruitment Notices
        </h1>
        <p className="text-xs sm:text-sm text-purple-200/90 max-w-3xl leading-relaxed">
          Stay updated with UPSSSC, UPPSC, UP Police, Railway, SSC, CTET vacancies, university admission circulars, answer keys, admit cards, and dynamic deadline alerts.
        </p>
      </div>

      {/* 2. Important Dates Dashboard */}
      <ImportantDatesDashboard timeline={timeline} loading={datesLoading} />

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by exam name (PET, SI, CGL, CTET), board (UPSSSC, SSC, NTA), or keyword..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setSelectedCategory(c.value);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === c.value
                  ? 'bg-[#6C63FF] text-white shadow-sm shadow-[#6C63FF]/30'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-bold text-[11px] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Quick Filter:
          </span>
          {quickFilters.map((qf) => (
            <button
              key={qf.value}
              onClick={() => setSelectedQuickFilter(qf.value)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                selectedQuickFilter === qf.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {qf.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Notifications List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <span>
            Showing {filteredNotifications.length} of {totalCount} verified announcements
          </span>
          {loading && (
            <span className="flex items-center gap-1 text-[#6C63FF]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching live updates...
            </span>
          )}
        </div>

        {loading && notifications.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notif) => (
              <NotificationCard
                key={notif.id}
                notification={notif}
                onMarkAsRead={handleMarkAsRead}
                showReadButton={!!user}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6C63FF] mx-auto flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-800">No announcements match your search or filter</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try changing categories, clearing search terms, or check back soon for newly verified circulars.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedQuickFilter('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-purple-50 text-[#6C63FF] font-bold text-xs hover:bg-[#6C63FF] hover:text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* 5. Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-slate-600 px-3">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
