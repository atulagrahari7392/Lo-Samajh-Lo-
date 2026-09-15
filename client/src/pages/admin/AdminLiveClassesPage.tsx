import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Check,
  Settings,
  Sliders,
  BarChart2,
  Key,
  Lock,
  Layers,
  FileText,
  Bell,
  Search,
  Users,
  Award,
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

  // Summary widgets stats
  const [stats, setStats] = useState({
    liveNow: 0,
    upcomingToday: 0,
    totalClasses: 0,
    completedCount: 0,
    avgAttendance: 0,
  });

  // Tab & Filters
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  // Multi-step Creation / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [editingClass, setEditingClass] = useState<LiveClass | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields - Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [instructor, setInstructor] = useState('Atul Agrahari');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [classType, setClassType] = useState('REGULAR');
  const [language, setLanguage] = useState('HINDI');

  // Form Fields - Step 2: Schedule
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Form Fields - Step 3: Access
  const [accessType, setAccessType] = useState('PUBLIC');

  // Form Fields - Step 4: Resources
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceFileUrl, setResourceFileUrl] = useState('');
  const [resourceType, setResourceType] = useState('NOTES');
  const [resourcesList, setResourcesList] = useState<Array<{ title: string; fileUrl: string; resourceType: string }>>([]);

  // Form Fields - Step 5: Notifications
  const [notifyStudents, setNotifyStudents] = useState(true);

  // OBS Setup Quick Modal (Phase 4)
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [activeObsConfig, setActiveObsConfig] = useState<{
    id: string;
    title: string;
    rtmpServer: string;
    streamKey: string;
    hlsPlaybackUrl: string;
    streamStatus: string;
  } | null>(null);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [liveRes, courseRes] = await Promise.all([
        api.live.adminGetAll({
          status: activeTab === 'ALL' ? undefined : activeTab,
          courseId: selectedCourse || undefined,
          search: searchQuery || undefined,
        }),
        api.courses.adminGetAll(),
      ]);

      if (liveRes.success) {
        setLiveClasses(liveRes.classes || []);
        if (liveRes.stats) setStats(liveRes.stats);
      }
      if (courseRes.success) setCourses(courseRes.courses || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to load live classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedCourse]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openCreateModal = () => {
    setEditingClass(null);
    setCurrentStep(1);
    setTitle('');
    setCourseId('');
    setSubject('');
    setChapter('');
    setInstructor('Atul Agrahari');
    setDescription('');
    setThumbnail('');
    setClassType('REGULAR');
    setLanguage('HINDI');

    // Default 1 hour ahead
    const nextHour = new Date(Date.now() + 60 * 60 * 1000);
    const tzOffset = nextHour.getTimezoneOffset() * 60000;
    const localISOTime = new Date(nextHour.getTime() - tzOffset).toISOString().slice(0, 16);
    setScheduledAt(localISOTime);
    setDurationMinutes(60);
    setTimezone('Asia/Kolkata');
    setAccessType('PUBLIC');
    setResourcesList([]);
    setNotifyStudents(true);
    setIsModalOpen(true);
  };

  const openEditModal = (c: LiveClass) => {
    setEditingClass(c);
    setCurrentStep(1);
    setTitle(c.title);
    setCourseId(c.courseId || '');
    setSubject(c.subject || '');
    setChapter(c.chapter || '');
    setInstructor(c.instructor);
    setDescription(c.description || '');
    setThumbnail(c.thumbnail || '');
    setClassType(c.classType || 'REGULAR');
    setLanguage(c.language || 'HINDI');

    const dateObj = new Date(c.scheduledAt);
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    const localISOTime = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
    setScheduledAt(localISOTime);
    setDurationMinutes(c.durationMinutes);
    setTimezone(c.timezone || 'Asia/Kolkata');
    setAccessType(c.accessType || 'PUBLIC');
    setResourcesList([]);
    setNotifyStudents(false);
    setIsModalOpen(true);
  };

  const handleAddResource = () => {
    if (!resourceTitle.trim() || !resourceFileUrl.trim()) {
      toastError('Resource title and file URL required');
      return;
    }
    setResourcesList((prev) => [
      ...prev,
      { title: resourceTitle.trim(), fileUrl: resourceFileUrl.trim(), resourceType },
    ]);
    setResourceTitle('');
    setResourceFileUrl('');
  };

  const handleSaveClass = async () => {
    if (!title.trim() || !scheduledAt) {
      toastError('Class title and scheduled time are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        courseId: courseId || null,
        subject: subject.trim() || null,
        chapter: chapter.trim() || null,
        instructor: instructor.trim() || 'Atul Agrahari',
        description: description.trim() || null,
        thumbnail: thumbnail.trim() || null,
        classType,
        language,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        timezone,
        accessType,
        resources: resourcesList,
        notifyStudents,
      };

      if (editingClass) {
        const res = await api.live.update(editingClass.id, payload);
        if (res.success) {
          success('Live class updated successfully!');
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.live.create(payload);
        if (res.success) {
          success('Live class scheduled with OBS stream credentials generated!');
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

  const openObsSetup = async (c: LiveClass) => {
    try {
      const res = await api.live.getStreamConfig(c.id);
      if (res.success && res.streamConfig) {
        setActiveObsConfig({
          id: c.id,
          title: c.title,
          rtmpServer: res.streamConfig.rtmpServer,
          streamKey: res.streamConfig.streamKey,
          hlsPlaybackUrl: res.streamConfig.hlsPlaybackUrl,
          streamStatus: res.streamConfig.streamStatus,
        });
        setShowStreamKey(false);
        setObsModalOpen(true);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch OBS configuration');
    }
  };

  const handleRotateKey = async () => {
    if (!activeObsConfig) return;
    try {
      const res = await api.live.rotateStreamKey(activeObsConfig.id);
      if (res.success && res.streamConfig) {
        setActiveObsConfig((prev) =>
          prev ? { ...prev, streamKey: res.streamConfig.streamKey } : null
        );
        success('Stream key rotated. Old key is invalidated.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to rotate key');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    success(`${label} copied to clipboard!`);
    setTimeout(() => setCopySuccess(null), 2000);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Video className="w-7 h-7 text-[#6C63FF]" />
              Live Class Management Hub
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              OBS Studio streaming configuration, live control rooms, student polls, quizzes, and automated recording conversions.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6C63FF] to-[#8f88ff] text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Schedule Live Class
            </button>
          </div>
        </div>

        {/* Dashboard Statistics Widgets (Phase 50) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-rose-600 font-bold text-[11px] uppercase">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Live Now
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.liveNow}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-[11px] uppercase">
              <Calendar className="w-3.5 h-3.5" />
              Upcoming Today
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.upcomingToday}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px] uppercase">
              <Clock className="w-3.5 h-3.5" />
              Completed
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.completedCount}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[11px] uppercase">
              <Video className="w-3.5 h-3.5" />
              Total Sessions
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.totalClasses}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-purple-600 font-bold text-[11px] uppercase">
              <Users className="w-3.5 h-3.5" />
              Avg Attendance
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.avgAttendance} students</div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {['ALL', 'SCHEDULED', 'LIVE', 'COMPLETED', 'DRAFT'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-[#6C63FF] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab === 'LIVE' ? '🔴 Live Now' : tab}
                </button>
              ))}
            </div>

            {/* Search & Course Filter */}
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search live classes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-1 focus:ring-[#6C63FF]"
                />
              </div>

              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 outline-none"
              >
                <option value="">All Courses</option>
                {courses.map((crs) => (
                  <option key={crs.id} value={crs.id}>
                    {crs.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Live Classes Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Live Class Title</th>
                  <th className="py-3.5 px-4">Instructor & Course</th>
                  <th className="py-3.5 px-4">Scheduled Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Access</th>
                  <th className="py-3.5 px-4 text-center">OBS Streaming</th>
                  <th className="py-3.5 px-4 text-center">Live Control Room</th>
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
                      No live sessions found. Click "Schedule Live Class" to create one.
                    </td>
                  </tr>
                ) : (
                  liveClasses.map((cls) => {
                    const isLive = cls.status === 'LIVE';
                    return (
                      <tr key={cls.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 line-clamp-1">{cls.title}</div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="uppercase font-bold text-indigo-600">{cls.classType}</span>
                            {cls.subject && <span>• {cls.subject}</span>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#6C63FF]" />
                            {cls.instructor}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {cls.course?.title || 'Open Webinar'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-800">
                            {new Date(cls.scheduledAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {new Date(cls.scheduledAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            ({cls.durationMinutes}m)
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isLive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-600 animate-pulse">
                              <Radio className="w-3 h-3" />
                              LIVE NOW
                            </span>
                          ) : cls.status === 'SCHEDULED' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#6C63FF]">
                              SCHEDULED
                            </span>
                          ) : cls.status === 'COMPLETED' ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              COMPLETED
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              {cls.status}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {cls.accessType}
                          </span>
                        </td>

                        {/* OBS Streaming Ingest Button */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => openObsSetup(cls)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors shadow-sm"
                          >
                            <Key className="w-3.5 h-3.5 text-indigo-600" />
                            OBS Setup
                          </button>
                        </td>

                        {/* Open Live Control Room Button */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <Link
                            to={`/admin/live-classes/${cls.id}/control-room`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white text-xs font-bold transition-all shadow-sm"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            Control Room
                          </Link>
                        </td>

                        {/* Actions: Analytics, Preview, Edit, Delete */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/admin/live-classes/${cls.id}/analytics`}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Attendance & Analytics"
                            >
                              <BarChart2 className="w-4 h-4" />
                            </Link>

                            <Link
                              to={`/live/${cls.slug || cls.id}`}
                              target="_blank"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Preview Student Page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => openEditModal(cls)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Class"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeleteId(cls.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Class"
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

        {/* Multi-Step Modal: Create / Edit Live Class (Phase 3) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {editingClass ? 'Edit Live Class' : 'Schedule New Live Class'}
                    </h3>
                    <p className="text-[11px] text-slate-500">Step {currentStep} of 5</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step indicator bar */}
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all ${
                      s <= currentStep ? 'bg-[#6C63FF]' : 'bg-slate-100'
                    }`}
                  />
                ))}
              </div>

              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-4 text-xs animate-in fade-in">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Class Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Masterclass on Indian Constitution & Polity"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#6C63FF]/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Linked Course</label>
                      <select
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
                      >
                        <option value="">Open Webinar (No Course)</option>
                        {courses.map((crs) => (
                          <option key={crs.id} value={crs.id}>
                            {crs.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Teacher / Instructor *</label>
                      <input
                        type="text"
                        value={instructor}
                        onChange={(e) => setInstructor(e.target.value)}
                        placeholder="Atul Agrahari"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Subject</label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. Indian Polity"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Chapter / Topic</label>
                      <input
                        type="text"
                        value={chapter}
                        onChange={(e) => setChapter(e.target.value)}
                        placeholder="e.g. Fundamental Rights"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Class Type</label>
                      <select
                        value={classType}
                        onChange={(e) => setClassType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
                      >
                        <option value="REGULAR">Regular Class</option>
                        <option value="DOUBT">Doubt Clearing</option>
                        <option value="REVISION">Revision</option>
                        <option value="CURRENT_AFFAIRS">Current Affairs</option>
                        <option value="LIVE_TEST">Live Test & Quiz</option>
                        <option value="WEBINAR">Open Webinar</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Language</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
                      >
                        <option value="HINDI">Hindi (हिंदी)</option>
                        <option value="ENGLISH">English</option>
                        <option value="BILINGUAL">Bilingual (Hinglish)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Custom Thumbnail URL</label>
                    <input
                      type="url"
                      value={thumbnail}
                      onChange={(e) => setThumbnail(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Description</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Key concepts to be covered in this session..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Schedule & Time */}
              {currentStep === 2 && (
                <div className="space-y-4 text-xs animate-in fade-in">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Scheduled Date & Start Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Expected Duration (Minutes)</label>
                      <input
                        type="number"
                        min={15}
                        max={360}
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Timezone</label>
                      <input
                        type="text"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Access Control */}
              {currentStep === 3 && (
                <div className="space-y-4 text-xs animate-in fade-in">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Who can watch this class?</label>
                    <div className="space-y-2 mt-2">
                      {[
                        { id: 'PUBLIC', label: 'Public (Open to All)', desc: 'Anyone visiting the site can join and watch.' },
                        { id: 'AUTHENTICATED', label: 'Logged-in Students Only', desc: 'Requires free account registration.' },
                        { id: 'COURSE', label: 'Enrolled Course Students Only', desc: 'Enforces paid enrollment check server-side.' },
                      ].map((item) => (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                            accessType === item.id
                              ? 'bg-indigo-50/60 border-[#6C63FF] text-slate-900'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="accessType"
                            checked={accessType === item.id}
                            onChange={() => setAccessType(item.id)}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{item.label}</div>
                            <div className="text-[11px] text-slate-500">{item.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Class Resources */}
              {currentStep === 4 && (
                <div className="space-y-4 text-xs animate-in fade-in">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Attach Lecture Notes / PDFs (Google Drive / FileAsset)</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        placeholder="Resource Title (e.g. Fundamental Rights Notes)"
                        value={resourceTitle}
                        onChange={(e) => setResourceTitle(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 outline-none"
                      />
                      <select
                        value={resourceType}
                        onChange={(e) => setResourceType(e.target.value)}
                        className="px-2 py-2 rounded-xl border border-slate-200 bg-white outline-none"
                      >
                        <option value="NOTES">Notes</option>
                        <option value="PRACTICE_SHEET">Practice Sheet</option>
                        <option value="WORKSHEET">Worksheet</option>
                      </select>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input
                        type="url"
                        placeholder="File / Google Drive PDF URL (https://...)"
                        value={resourceFileUrl}
                        onChange={(e) => setResourceFileUrl(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddResource}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors shrink-0"
                      >
                        + Add File
                      </button>
                    </div>
                  </div>

                  {resourcesList.length > 0 && (
                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                      <div className="font-bold text-slate-700 text-[11px]">Attached Resources ({resourcesList.length})</div>
                      {resourcesList.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                          <span className="font-medium text-slate-800 line-clamp-1">{r.title} ({r.resourceType})</span>
                          <button
                            type="button"
                            onClick={() => setResourcesList((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Notifications & Confirmation */}
              {currentStep === 5 && (
                <div className="space-y-4 text-xs animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                    <div className="font-bold text-indigo-900 text-sm">Class Summary</div>
                    <div className="text-slate-700 space-y-1">
                      <div><span className="font-semibold">Title:</span> {title}</div>
                      <div><span className="font-semibold">Instructor:</span> {instructor}</div>
                      <div><span className="font-semibold">Scheduled:</span> {new Date(scheduledAt).toLocaleString('en-IN')}</div>
                      <div><span className="font-semibold">Access:</span> {accessType}</div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyStudents}
                      onChange={(e) => setNotifyStudents(e.target.checked)}
                      className="rounded text-[#6C63FF]"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Broadcast website notification</div>
                      <div className="text-[11px] text-slate-500">Alert enrolled students that this class has been scheduled.</div>
                    </div>
                  </label>
                </div>
              )}

              {/* Modal Navigation Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
                  disabled={currentStep === 1}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-30"
                >
                  Back
                </button>

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStep === 1 && !title.trim()) {
                        toastError('Class title is required');
                        return;
                      }
                      if (currentStep === 2 && !scheduledAt) {
                        toastError('Scheduled time is required');
                        return;
                      }
                      setCurrentStep((prev) => Math.min(prev + 1, 5));
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6C63FF] hover:bg-[#584fd4] transition-colors shadow-sm"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSaveClass}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6C63FF] hover:bg-[#584fd4] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Scheduling...' : editingClass ? 'Update Live Class' : 'Schedule Live Class'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* OBS Studio Setup Modal (Phase 4) */}
        {obsModalOpen && activeObsConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">OBS Studio Streaming Setup</h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{activeObsConfig.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setObsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* OBS Setup Instructions Box */}
              <div className="bg-slate-950 text-slate-200 rounded-2xl p-4 text-xs space-y-3 font-mono">
                <div className="text-[11px] text-indigo-400 font-sans font-bold flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  Configure in OBS Studio:
                </div>
                <div className="space-y-1 text-[11px] text-slate-400 font-sans">
                  <div>1. Open OBS Studio → <b>Settings</b> → <b>Stream</b></div>
                  <div>2. Set <b>Service:</b> <span className="text-white font-mono">Custom...</span></div>
                  <div>3. Paste the <b>Server</b> and <b>Stream Key</b> below:</div>
                </div>

                {/* RTMP Server URL */}
                <div className="space-y-1 pt-2">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Server (RTMP Ingest)</div>
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2 px-3">
                    <span className="flex-1 select-all text-indigo-300 font-mono text-[11px] truncate">
                      {activeObsConfig.rtmpServer}
                    </span>
                    <button
                      onClick={() => copyToClipboard(activeObsConfig.rtmpServer, 'RTMP Server')}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Copy RTMP Server"
                    >
                      {copySuccess === 'RTMP Server' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Stream Key */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold">
                    <span>Stream Key (Private)</span>
                    <button
                      type="button"
                      onClick={() => setShowStreamKey((prev) => !prev)}
                      className="text-indigo-400 hover:text-indigo-300 normal-case font-sans"
                    >
                      {showStreamKey ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2 px-3">
                    <span className="flex-1 select-all text-amber-300 font-mono text-[11px] truncate">
                      {showStreamKey ? activeObsConfig.streamKey : '••••••••••••••••••••••••••••••••'}
                    </span>
                    <button
                      onClick={() => copyToClipboard(activeObsConfig.streamKey, 'Stream Key')}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Copy Stream Key"
                    >
                      {copySuccess === 'Stream Key' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Key Rotation & Warning */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleRotateKey}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  Regenerate Stream Key
                </button>

                <Link
                  to={`/admin/live-classes/${activeObsConfig.id}/control-room`}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#6C63FF] hover:bg-[#584fd4] transition-colors shadow-sm"
                >
                  Open Control Room →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteId}
          title="Delete Live Class"
          message="Are you sure you want to delete this live class session? This will remove all associated chat logs, doubts, and poll records."
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
