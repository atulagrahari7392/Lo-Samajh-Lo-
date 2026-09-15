import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart2,
  Users,
  Clock,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  Radio,
  ArrowLeft,
  RefreshCw,
  Award,
  Smartphone,
  Calendar,
  UserCheck,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../services/api';
import { LiveClass, LiveAttendance } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminLiveClassAnalyticsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    liveClass: LiveClass;
    totalJoined: number;
    peakViewers: number;
    avgWatchMinutes: number;
    avgCompletion: number;
    chatCount: number;
    questionCount: number;
    pollCount: number;
    attendances: LiveAttendance[];
  } | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.live.getAnalytics(id!);
      if (res.success && res.analytics) {
        setData(res.analytics);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAnalytics();
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-24 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#6C63FF]" />
          Loading class analytics...
        </div>
      </AdminLayout>
    );
  }

  if (!data || !data.liveClass) {
    return (
      <AdminLayout>
        <div className="py-24 text-center space-y-3">
          <p className="text-slate-500">Live class not found</p>
          <Link to="/admin/live-classes" className="text-[#6C63FF] font-bold text-xs">
            ← Back to Live Classes
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const { liveClass, totalJoined, peakViewers, avgWatchMinutes, avgCompletion, chatCount, questionCount, attendances } = data;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/live-classes"
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-[#6C63FF]">
                  Live Class Analytics
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {new Date(liveClass.scheduledAt).toLocaleDateString('en-IN')}
                </span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                {liveClass.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/admin/live-classes/${id}/control-room`}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              Open Control Room
            </Link>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#6C63FF]" />
              Total Joined
            </div>
            <div className="text-2xl font-black text-slate-900">{totalJoined}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-rose-500" />
              Peak Viewers
            </div>
            <div className="text-2xl font-black text-slate-900">{peakViewers}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Avg Watch Time
            </div>
            <div className="text-2xl font-black text-slate-900">{avgWatchMinutes} mins</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Avg Completion
            </div>
            <div className="text-2xl font-black text-slate-900">{avgCompletion}%</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              Chat Messages
            </div>
            <div className="text-2xl font-black text-slate-900">{chatCount}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
              Doubts Asked
            </div>
            <div className="text-2xl font-black text-slate-900">{questionCount}</div>
          </div>
        </div>

        {/* Student Attendance Roster (Phase 20) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#6C63FF]" />
              Student Attendance & Participation Log ({attendances.length})
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">First Joined</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4">Watch Time</th>
                  <th className="py-3 px-4">Completion %</th>
                  <th className="py-3 px-4">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No attendee attendance recorded for this session yet.
                    </td>
                  </tr>
                ) : (
                  attendances.map((att) => {
                    const watchMins = Math.round(att.totalWatchSeconds / 60);
                    return (
                      <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {att.user?.name || 'Student'}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          <div>{att.user?.email || '—'}</div>
                          <div className="text-[10px] text-slate-400">{att.user?.phone || ''}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {new Date(att.joinedAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {new Date(att.lastSeenAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {watchMins} mins ({att.totalWatchSeconds}s)
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">{att.completionPercentage}%</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#6C63FF] rounded-full"
                                style={{ width: `${Math.min(att.completionPercentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {att.deviceInfo || 'Browser'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLiveClassAnalyticsPage;
