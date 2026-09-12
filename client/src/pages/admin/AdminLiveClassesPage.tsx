import React, { useState, useEffect } from 'react';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  User,
  ExternalLink,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Radio,
  Copy,
} from 'lucide-react';
import { api } from '../../services/api';
import { LiveClass, Course } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const AdminLiveClassesPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Form / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<LiveClass | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [instructor, setInstructor] = useState('Atul Agrahari');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [meetingUrl, setMeetingUrl] = useState('https://meet.google.com/lsl-live');
  const [status, setStatus] = useState<'UPCOMING' | 'LIVE' | 'COMPLETED'>('UPCOMING');
  const [description, setDescription] = useState('');

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [liveRes, courseRes] = await Promise.all([
        api.live.adminGetAll(),
        api.courses.adminGetAll(),
      ]);
      if (liveRes.success) setLiveClasses(liveRes.classes || []);
      if (courseRes.success) setCourses(courseRes.courses || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to load live classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingClass(null);
    setTitle('');
    setCourseId('');
    setInstructor('Atul Agrahari');
    // Default scheduledAt to 1 hour from now
    const nextHour = new Date(Date.now() + 60 * 60 * 1000);
    const tzOffset = nextHour.getTimezoneOffset() * 60000;
    const localISOTime = new Date(nextHour.getTime() - tzOffset).toISOString().slice(0, 16);
    setScheduledAt(localISOTime);
    setDurationMinutes(60);
    setMeetingUrl('https://meet.google.com/lsl-live');
    setStatus('UPCOMING');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: LiveClass) => {
    setEditingClass(c);
    setTitle(c.title);
    setCourseId(c.courseId || '');
    setInstructor(c.instructor);
    const dateObj = new Date(c.scheduledAt);
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    const localISOTime = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
    setScheduledAt(localISOTime);
    setDurationMinutes(c.durationMinutes);
    setMeetingUrl(c.meetingUrl);
    setStatus(c.status);
    setDescription(c.description || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) {
      toastError('Title and scheduled time are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        courseId: courseId || null,
        instructor: instructor.trim() || 'Atul Agrahari',
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        meetingUrl: meetingUrl.trim(),
        status,
        description: description.trim() || null,
      };

      if (editingClass) {
        const res = await api.live.update(editingClass.id, payload);
        if (res.success) {
          success('Live class session updated!');
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.live.create(payload);
        if (res.success) {
          success('Live class scheduled successfully!');
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save live class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await api.live.delete(deleteId);
      if (res.success) {
        setLiveClasses((prev) => prev.filter((item) => item.id !== deleteId));
        success('Live class deleted.');
        setDeleteId(null);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to delete live class');
    }
  };

  const copyMeeting = (url: string) => {
    navigator.clipboard.writeText(url);
    success('Meeting URL copied to clipboard!');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Video className="w-7 h-7 text-[#6C63FF]" />
              Live Interactive Classes
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Schedule real-time video lectures, broadcast Google Meet / Zoom sessions, and toggle active status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6C63FF] to-[#8f88ff] text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Schedule Live Class
            </button>
          </div>
        </div>

        {/* Live Classes Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Session Title</th>
                  <th className="py-3.5 px-4">Instructor</th>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Scheduled Date & Time</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Join Link</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6C63FF]" />
                      Loading live classes...
                    </td>
                  </tr>
                ) : liveClasses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No live sessions scheduled yet. Click "Schedule Live Class" above.
                    </td>
                  </tr>
                ) : (
                  liveClasses.map((c) => {
                    const isNow = c.status === 'LIVE';
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{c.title}</div>
                          {c.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">{c.description}</p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-purple-500" />
                            {c.instructor}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 line-clamp-1 max-w-[150px]">
                            {c.course?.title || 'Open Webinar'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-medium">
                          {new Date(c.scheduledAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {c.durationMinutes} mins
                        </td>

                        <td className="py-3.5 px-4">
                          {isNow ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-600 animate-pulse">
                              <Radio className="w-3 h-3" />
                              HAPPENING NOW
                            </span>
                          ) : c.status === 'UPCOMING' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#6C63FF]">
                              UPCOMING
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                              COMPLETED
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={c.meetingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Join
                            </a>
                            <button
                              onClick={() => copyMeeting(c.meetingUrl)}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"
                              title="Copy URL"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(c)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(c.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Schedule / Edit Live Class */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6C63FF] flex items-center justify-center">
                    <Video className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingClass ? 'Edit Live Class' : 'Schedule New Live Class'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Class Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Masterclass on Indian Polity & Constitution"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF]/30 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Instructor Name *</label>
                    <input
                      type="text"
                      required
                      value={instructor}
                      onChange={(e) => setInstructor(e.target.value)}
                      placeholder="Atul Agrahari"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Linked Course</label>
                    <select
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                    >
                      <option value="">Open Webinar (No Course)</option>
                      {courses.map((crs) => (
                        <option key={crs.id} value={crs.id}>
                          {crs.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Scheduled Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Duration (Minutes)</label>
                    <input
                      type="number"
                      min={10}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Live Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                    >
                      <option value="UPCOMING">UPCOMING</option>
                      <option value="LIVE">LIVE (Broadcasting Now)</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Meeting / Stream URL *</label>
                    <input
                      type="url"
                      required
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Session Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Key concepts, doubt clearance agenda..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#6C63FF] hover:bg-[#584fd4] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingClass ? 'Update Session' : 'Schedule Session'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        <ConfirmModal
          isOpen={!!deleteId}
          title="Delete Live Class"
          message="Are you sure you want to delete this live class session?"
          confirmText="Delete Session"
          isDestructive={true}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminLiveClassesPage;
