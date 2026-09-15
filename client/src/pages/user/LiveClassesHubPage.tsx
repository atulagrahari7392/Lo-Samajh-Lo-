import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Radio,
  Calendar,
  Clock,
  User,
  BookOpen,
  ArrowRight,
  Search,
  Filter,
  Users,
  PlayCircle,
  FileText,
  HelpCircle,
  Lock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { LiveClass } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const LiveClassesHubPage: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [metrics, setMetrics] = useState({ liveNow: 0, upcoming: 0, completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'past'>('live');
  const [searchQuery, setSearchQuery] = useState('');
  const [classTypeFilter, setClassTypeFilter] = useState('');

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await api.live.getAll({
        tab: activeTab === 'all' ? undefined : activeTab,
        search: searchQuery || undefined,
        classType: classTypeFilter || undefined,
      });

      if (res.success) {
        setClasses(res.classes || []);
        if (res.metrics) {
          setMetrics(res.metrics);
        }
      }
    } catch (err) {
      console.error('Failed to load live classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [activeTab, classTypeFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClasses();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const liveNowClasses = classes.filter((c) => ['LIVE', 'STARTING', 'STREAM_INTERRUPTED'].includes(c.status));
  const upcomingClasses = classes.filter((c) => c.status === 'SCHEDULED');
  const pastClasses = classes.filter((c) => ['COMPLETED', 'ENDED', 'PROCESSING'].includes(c.status));

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-indigo-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(108,99,255,0.15),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black tracking-wide uppercase animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                Live Interactive Classroom
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Learn Real-Time with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C63FF] to-indigo-400">Top Educators</span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Attend scheduled live lectures, participate in live polls & quizzes, ask real-time doubts, and download lecture notes instantly.
              </p>
            </div>

            {/* Live Metrics Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 bg-white/5 border border-white/10 p-4 sm:p-5 rounded-3xl backdrop-blur-md">
              <div className="text-center px-2 sm:px-4">
                <div className="flex items-center justify-center gap-1.5 text-rose-400 font-bold text-xs uppercase mb-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Live Now
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{metrics.liveNow}</div>
              </div>
              <div className="text-center px-2 sm:px-4 border-x border-white/10">
                <div className="text-indigo-300 font-bold text-xs uppercase mb-1 flex items-center justify-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Upcoming
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{metrics.upcoming}</div>
              </div>
              <div className="text-center px-2 sm:px-4">
                <div className="text-emerald-400 font-bold text-xs uppercase mb-1 flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Recorded
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{metrics.completed}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'live'
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              Live Now
              {metrics.liveNow > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black">
                  {metrics.liveNow}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'upcoming'
                  ? 'bg-[#6C63FF]/10 text-[#6C63FF] border border-[#6C63FF]/30 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Upcoming Classes
              {metrics.upcoming > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#6C63FF] text-white font-bold">
                  {metrics.upcoming}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'past'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Past & Recordings
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-slate-200 text-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Sessions
            </button>
          </div>

          {/* Search & Class Type filter */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search live classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50/60 focus:bg-white focus:ring-2 focus:ring-[#6C63FF]/20 outline-none"
              />
            </div>

            <select
              value={classTypeFilter}
              onChange={(e) => setClassTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none"
            >
              <option value="">All Types</option>
              <option value="REGULAR">Regular Class</option>
              <option value="DOUBT">Doubt Clearing</option>
              <option value="REVISION">Revision</option>
              <option value="CURRENT_AFFAIRS">Current Affairs</option>
              <option value="LIVE_TEST">Live Test & Quiz</option>
              <option value="WEBINAR">Open Webinar</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="bg-white rounded-3xl border border-slate-200/80 p-5 space-y-4 animate-pulse">
                <div className="h-44 bg-slate-200 rounded-2xl" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-10 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : classes.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center mx-auto">
              <Video className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No live sessions found</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              {activeTab === 'live'
                ? 'There are no active live sessions broadcasting right now. Check upcoming scheduled classes.'
                : 'No classes match your search criteria. Check back soon for upcoming lectures.'}
            </p>
            {activeTab === 'live' && (
              <button
                onClick={() => setActiveTab('upcoming')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6C63FF] text-white text-xs font-bold shadow-md hover:bg-[#584fd4] transition-all"
              >
                <Calendar className="w-4 h-4" />
                View Upcoming Schedule
              </button>
            )}
          </div>
        ) : (
          /* Class Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => {
              const isLive = ['LIVE', 'STARTING', 'STREAM_INTERRUPTED'].includes(cls.status);
              const isPast = ['COMPLETED', 'ENDED'].includes(cls.status);
              const targetUrl = isPast && cls.recordedClass
                ? `/courses/${cls.course?.slug || 'general'}/learn`
                : `/live/${cls.slug || cls.id}`;

              return (
                <div
                  key={cls.id}
                  className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail & Badge Header */}
                    <div className="relative aspect-video bg-slate-900 overflow-hidden">
                      {cls.thumbnail ? (
                        <img
                          src={cls.thumbnail}
                          alt={cls.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-900 text-slate-400 p-4 text-center">
                          <Video className="w-10 h-10 text-indigo-400 mb-2 opacity-60" />
                          <span className="text-xs font-bold text-slate-300 line-clamp-1">{cls.subject || 'Live Class'}</span>
                        </div>
                      )}

                      {/* Status Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-600 text-white shadow-lg animate-pulse tracking-wide uppercase">
                            <Radio className="w-3 h-3" />
                            LIVE NOW
                          </span>
                        ) : isPast ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800/90 text-slate-200 backdrop-blur-sm">
                            <PlayCircle className="w-3 h-3 text-emerald-400" />
                            RECORDING AVAILABLE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-600/90 text-white backdrop-blur-sm">
                            <Clock className="w-3 h-3" />
                            UPCOMING
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/50 text-white backdrop-blur-sm uppercase">
                          {cls.classType}
                        </span>
                      </div>

                      {/* Access lock badge if restricted */}
                      {!cls.isAccessGranted && (
                        <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-amber-300 backdrop-blur-sm" title="Course Enrolled Only">
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      )}

                      {/* Viewer count for live session */}
                      {isLive && (
                        <div className="absolute bottom-3 right-3 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-[11px] font-bold flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-rose-400" />
                          <span>{cls._count?.attendances || 1} watching</span>
                        </div>
                      )}
                    </div>

                    {/* Class Details */}
                    <div className="p-5 space-y-3">
                      {/* Course / Subject tag */}
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-[#6C63FF] bg-indigo-50 px-2.5 py-0.5 rounded-md line-clamp-1">
                          {cls.course?.title || cls.subject || 'Special Lecture'}
                        </span>
                        <span className="text-slate-400">{cls.language}</span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-[#6C63FF] transition-colors">
                        {cls.title}
                      </h3>

                      {/* Description */}
                      {cls.description && (
                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                          {cls.description}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="font-semibold text-slate-700">{cls.instructor}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(cls.scheduledAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(cls.scheduledAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })} ({cls.durationMinutes}m)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card CTA Footer */}
                  <div className="p-5 pt-0">
                    <Link
                      to={targetUrl}
                      className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                        isLive
                          ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white shadow-rose-200'
                          : isPast
                          ? 'bg-slate-900 hover:bg-slate-800 text-white'
                          : 'bg-[#6C63FF] hover:bg-[#584fd4] text-white shadow-indigo-200'
                      }`}
                    >
                      {isLive ? (
                        <>
                          <Radio className="w-4 h-4 animate-spin" />
                          Join Live Class Now
                        </>
                      ) : isPast ? (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          Watch Recording & Notes
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4" />
                          Class Details & Countdown
                        </>
                      )}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveClassesHubPage;
