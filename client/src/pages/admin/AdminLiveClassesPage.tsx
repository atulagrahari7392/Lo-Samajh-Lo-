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
  Upload,
  Image,
  CheckCircle2,
  Loader2,
  Share2,
  Sparkles,
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
  const [thumbnailAssetId, setThumbnailAssetId] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [classType, setClassType] = useState('REGULAR');
  const [language, setLanguage] = useState('HINDI');

  // Form Fields - Step 2: Schedule
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [meetingUrl, setMeetingUrl] = useState('');

  // Form Fields - Step 3: Access
  const [accessType, setAccessType] = useState('PUBLIC');

  // Form Fields - Step 4: Resources
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceFileUrl, setResourceFileUrl] = useState('');
  const [resourceType, setResourceType] = useState('NOTES');
  const [resourcesList, setResourcesList] = useState<Array<{ title: string; fileUrl: string; resourceType: string; fileAssetId?: string; fileSize?: string }>>([]);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  // Form Fields - Step 5: Notifications
  const [notifyStudents, setNotifyStudents] = useState(true);

  // OBS Setup Quick Modal
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [activeStreamTab, setActiveStreamTab] = useState<'YOUTUBE' | 'RTMP'>('YOUTUBE');
  const [obsMeetingUrlInput, setObsMeetingUrlInput] = useState('');
  const [savingObsStream, setSavingObsStream] = useState(false);
  const [activeObsConfig, setActiveObsConfig] = useState<{
    id: string;
    title: string;
    slug?: string | null;
    rtmpServer: string;
    streamKey: string;
    hlsPlaybackUrl: string;
    streamStatus: string;
    meetingUrl?: string | null;
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
    setThumbnailAssetId(null);
    setUploadingThumbnail(false);
    setThumbnailProgress(0);
    setUploadingPdf(false);
    setPdfProgress(0);
    setClassType('REGULAR');
    setLanguage('HINDI');

    // Default 1 hour ahead
    const nextHour = new Date(Date.now() + 60 * 60 * 1000);
    const tzOffset = nextHour.getTimezoneOffset() * 60000;
    const localISOTime = new Date(nextHour.getTime() - tzOffset).toISOString().slice(0, 16);
    setScheduledAt(localISOTime);
    setDurationMinutes(60);
    setTimezone('Asia/Kolkata');
    setMeetingUrl('');
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
    setThumbnailAssetId(c.thumbnailAssetId || null);
    setUploadingThumbnail(false);
    setThumbnailProgress(0);
    setUploadingPdf(false);
    setPdfProgress(0);
    setClassType(c.classType || 'REGULAR');
    setLanguage(c.language || 'HINDI');

    const dateObj = new Date(c.scheduledAt);
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    const localISOTime = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
    setScheduledAt(localISOTime);
    setDurationMinutes(c.durationMinutes);
    setTimezone(c.timezone || 'Asia/Kolkata');
    setMeetingUrl(c.meetingUrl || '');
    setAccessType(c.accessType || 'PUBLIC');
    setResourcesList([]);
    setNotifyStudents(false);
    setIsModalOpen(true);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastError('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toastError('Image file size must be less than 10MB');
      return;
    }

    try {
      setUploadingThumbnail(true);
      setThumbnailProgress(0);
      const res = await api.upload.uploadWithProgress(
        file,
        { category: 'LIVE_CLASSES', entityType: 'LIVE_CLASS' },
        (progress) => {
          setThumbnailProgress(progress.percent);
        }
      );

      if (res.success && res.fileUrl) {
        setThumbnail(res.fileUrl);
        if (res.assetId) setThumbnailAssetId(res.assetId);
        success('Thumbnail uploaded directly to Google Drive!');
      } else {
        toastError(res.message || 'Failed to upload thumbnail');
      }
    } catch (err: any) {
      toastError(err.message || 'Error uploading thumbnail to Google Drive');
    } finally {
      setUploadingThumbnail(false);
      setThumbnailProgress(0);
      e.target.value = '';
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];
    const fileExt = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      toastError('Allowed formats: PDF, DOC, DOCX, PPT, PPTX');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toastError('Document file size must be under 100MB');
      return;
    }

    try {
      setUploadingPdf(true);
      setPdfProgress(0);
      const res = await api.upload.uploadWithProgress(
        file,
        { category: 'MATERIALS', entityType: 'LIVE_CLASS_RESOURCE' },
        (progress) => {
          setPdfProgress(progress.percent);
        }
      );

      if (res.success && res.fileUrl) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        setResourcesList((prev) => [
          ...prev,
          {
            title: cleanName,
            fileUrl: res.fileUrl,
            resourceType: resourceType || 'NOTES',
            fileAssetId: res.assetId,
            fileSize: sizeFormatted,
          },
        ]);
        success(`"${file.name}" uploaded to Google Drive and attached!`);
      } else {
        toastError(res.message || 'Failed to upload document');
      }
    } catch (err: any) {
      toastError(err.message || 'Error uploading document to Google Drive');
    } finally {
      setUploadingPdf(false);
      setPdfProgress(0);
      e.target.value = '';
    }
  };

  const handleAddResource = () => {
    if (!resourceTitle.trim() || !resourceFileUrl.trim()) {
      toastError('Please enter both resource title and file URL');
      return;
    }
    setResourcesList((prev) => [
      ...prev,
      { title: resourceTitle.trim(), fileUrl: resourceFileUrl.trim(), resourceType },
    ]);
    setResourceTitle('');
    setResourceFileUrl('');
    success('Resource link attached!');
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
        thumbnailAssetId: thumbnailAssetId || null,
        meetingUrl: meetingUrl.trim() || null,
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
          success('Live class scheduled! OBS stream credentials are ready below.');
          setIsModalOpen(false);
          fetchData();

          // Immediately pop open the OBS Streaming Setup modal with all credentials
          if (res.streamConfig) {
            setActiveObsConfig({
              id: res.liveClass?.id || '',
              title: res.liveClass?.title || title,
              slug: res.liveClass?.slug || null,
              rtmpServer: res.streamConfig.rtmpServer,
              streamKey: res.streamConfig.streamKey,
              hlsPlaybackUrl: res.streamConfig.hlsPlaybackUrl,
              streamStatus: res.streamConfig.streamStatus || 'IDLE',
              meetingUrl: res.streamConfig.meetingUrl || meetingUrl || '',
            });
            setObsMeetingUrlInput(res.streamConfig.meetingUrl || meetingUrl || '');
            setShowStreamKey(false);
            setActiveStreamTab('YOUTUBE');
            setObsModalOpen(true);
          } else if (res.liveClass) {
            openObsSetup(res.liveClass);
          }
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
          slug: c.slug,
          rtmpServer: res.streamConfig.rtmpServer,
          streamKey: res.streamConfig.streamKey,
          hlsPlaybackUrl: res.streamConfig.hlsPlaybackUrl,
          streamStatus: res.streamConfig.streamStatus,
          meetingUrl: res.streamConfig.meetingUrl || c.meetingUrl || '',
        });
        setObsMeetingUrlInput(res.streamConfig.meetingUrl || c.meetingUrl || '');
        setShowStreamKey(false);
        setActiveStreamTab('YOUTUBE');
        setObsModalOpen(true);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch OBS configuration');
    }
  };

  const handleSaveStreamSource = async () => {
    if (!activeObsConfig) return;
    try {
      setSavingObsStream(true);
      const res = await api.live.update(activeObsConfig.id, {
        meetingUrl: obsMeetingUrlInput.trim() || null,
      });
      if (res.success) {
        success('Live Stream URL saved! Students will now see this stream.');
        setActiveObsConfig((prev) => (prev ? { ...prev, meetingUrl: obsMeetingUrlInput.trim() || null } : null));
        fetchData();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save stream URL');
    } finally {
      setSavingObsStream(false);
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
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                            <span className="uppercase font-bold text-indigo-600">{cls.classType}</span>
                            {cls.subject && <span>• {cls.subject}</span>}
                            {!cls.courseId && (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                Open Webinar
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#6C63FF]" />
                            {cls.instructor}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {cls.course?.title ? (
                              <span>Course: {cls.course.title}</span>
                            ) : (
                              <span className="text-amber-600 font-medium">Free Open Webinar (All Students)</span>
                            )}
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-[#6C63FF] text-xs font-bold transition-all shadow-sm group"
                            title="View RTMP Server URL and Stream Key for OBS Studio"
                          >
                            <Key className="w-3.5 h-3.5 text-[#6C63FF] group-hover:rotate-12 transition-transform" />
                            <span>OBS Setup & Key</span>
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

                        {/* Actions: Copy Link, Analytics, Preview, Edit, Delete */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  `${window.location.origin}/live/${cls.slug || cls.id}`,
                                  `Student Link (${cls.title})`
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Copy Student Classroom Link"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

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
                              title="Open Student Classroom Page"
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5 text-[#6C63FF]" />
                        <span>Class Thumbnail</span>
                      </label>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Stored securely on Google Drive
                      </span>
                    </div>

                    {/* If thumbnail is uploaded or present */}
                    {thumbnail ? (
                      <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video max-h-44 flex items-center justify-center">
                        <img
                          src={thumbnail}
                          alt="Thumbnail Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <label className="px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-800 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-lg">
                            <Upload className="w-3.5 h-3.5 text-[#6C63FF]" />
                            <span>Change Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleThumbnailUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setThumbnail('');
                              setThumbnailAssetId(null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Drag & Drop / Click to Upload Box */
                      <div className="space-y-2">
                        <label
                          className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                            uploadingThumbnail
                              ? 'border-[#6C63FF] bg-indigo-50/40'
                              : 'border-slate-300 hover:border-[#6C63FF] hover:bg-indigo-50/20 bg-slate-50/60'
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleThumbnailUpload}
                            disabled={uploadingThumbnail}
                            className="hidden"
                          />
                          {uploadingThumbnail ? (
                            <div className="flex flex-col items-center py-2 space-y-2">
                              <Loader2 className="w-6 h-6 text-[#6C63FF] animate-spin" />
                              <div className="text-xs font-bold text-slate-700">
                                Uploading to Google Drive ({thumbnailProgress}%)...
                              </div>
                              <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#6C63FF] transition-all"
                                  style={{ width: `${thumbnailProgress}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center py-2 text-center space-y-1">
                              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center mb-1 shadow-sm">
                                <Upload className="w-5 h-5" />
                              </div>
                              <span className="font-bold text-slate-800 text-xs">
                                Choose Image from Computer / Local Drive
                              </span>
                              <span className="text-[11px] text-slate-500">
                                PNG, JPG, WebP up to 10MB • Auto-uploaded directly to Google Drive
                              </span>
                            </div>
                          )}
                        </label>

                        {/* Collapsible or Secondary: Enter Image URL */}
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            value={thumbnail}
                            onChange={(e) => setThumbnail(e.target.value)}
                            placeholder="Or paste external image URL (https://...)"
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 outline-none text-xs"
                          />
                        </div>
                      </div>
                    )}
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

                  {/* YouTube Live / OBS Stream Source (Optional) */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <Radio className="w-3.5 h-3.5 text-[#6C63FF]" />
                        <span>YouTube Live Stream Link (Optional)</span>
                      </label>
                      <span className="text-[10px] font-semibold text-[#6C63FF] bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                        OBS Compatible
                      </span>
                    </div>
                    <input
                      type="url"
                      value={meetingUrl}
                      onChange={(e) => setMeetingUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none text-xs focus:border-[#6C63FF]"
                    />
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Stream from OBS Studio to YouTube Live (Unlisted mode). Students watch inside LoSamajhLo without ever opening YouTube! You can also connect this later.
                    </p>
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#6C63FF]" />
                        <span>Attach Lecture Notes / PDFs</span>
                      </label>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Stored securely on Google Drive
                      </span>
                    </div>

                    {/* Option A: Upload PDF/Document directly from Local Drive / Computer */}
                    <label
                      className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                        uploadingPdf
                          ? 'border-[#6C63FF] bg-indigo-50/40'
                          : 'border-slate-300 hover:border-[#6C63FF] hover:bg-indigo-50/20 bg-slate-50/60'
                      }`}
                    >
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        onChange={handlePdfUpload}
                        disabled={uploadingPdf}
                        className="hidden"
                      />
                      {uploadingPdf ? (
                        <div className="flex flex-col items-center py-2 space-y-2">
                          <Loader2 className="w-6 h-6 text-[#6C63FF] animate-spin" />
                          <div className="text-xs font-bold text-slate-700">
                            Uploading PDF to Google Drive ({pdfProgress}%)...
                          </div>
                          <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#6C63FF] transition-all"
                              style={{ width: `${pdfProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-1 text-center space-y-1">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center mb-0.5 shadow-sm">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-slate-800 text-xs">
                            Choose PDF / Lecture Notes from Computer
                          </span>
                          <span className="text-[11px] text-slate-500">
                            PDF, DOC, DOCX, PPT up to 100MB • Directly stored in Google Drive
                          </span>
                        </div>
                      )}
                    </label>

                    {/* Option B: Or Add via Existing File Link/URL */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="font-bold text-slate-700 text-[11px]">
                        Or Add External File Link:
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Document Title (e.g. Fundamental Rights Handout)"
                          value={resourceTitle}
                          onChange={(e) => setResourceTitle(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                        />
                        <select
                          value={resourceType}
                          onChange={(e) => setResourceType(e.target.value)}
                          className="px-2 py-2 rounded-xl border border-slate-200 bg-white outline-none text-xs"
                        >
                          <option value="NOTES">Notes</option>
                          <option value="PRACTICE_SHEET">Practice Sheet</option>
                          <option value="WORKSHEET">Worksheet</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Google Drive link or PDF URL (https://...)"
                          value={resourceFileUrl}
                          onChange={(e) => setResourceFileUrl(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 outline-none text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddResource}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors shrink-0 text-xs shadow-sm"
                        >
                          + Add Link
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Attached Resources List */}
                  {resourcesList.length > 0 && (
                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                      <div className="font-bold text-slate-700 text-[11px] flex items-center justify-between">
                        <span>Attached Resources ({resourcesList.length})</span>
                        <span className="text-[10px] text-emerald-600 font-medium">Ready to attach on schedule</span>
                      </div>
                      {resourcesList.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#6C63FF] flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-800 truncate">{r.title}</div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-semibold text-[9px]">{r.resourceType}</span>
                                {r.fileSize && <span>• {r.fileSize}</span>}
                                <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Google Drive
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setResourcesList((prev) => prev.filter((_, idx) => idx !== i))}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors ml-2 shrink-0"
                            title="Remove attached resource"
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

        {/* OBS Studio Setup Modal */}
        {obsModalOpen && activeObsConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">OBS Studio Live Stream Setup</h3>
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

              {/* Mode Switcher Tabs */}
              <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveStreamTab('YOUTUBE')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeStreamTab === 'YOUTUBE'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span>YouTube Live via OBS (Recommended)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStreamTab('RTMP')}
                  className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    activeStreamTab === 'RTMP'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Custom RTMP</span>
                </button>
              </div>

              {/* Tab 1: YouTube Live via OBS */}
              {activeStreamTab === 'YOUTUBE' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 text-slate-200 rounded-2xl p-4 text-xs space-y-3 font-sans">
                    <div className="text-[12px] text-rose-400 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      How to stream via OBS in 3 simple steps (100% Free):
                    </div>
                    <div className="space-y-2 text-[11px] text-slate-300">
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                        <span>Open <b>OBS Studio</b> → Click <b>Settings</b> → <b>Stream</b>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                        <div>
                          Set <b>Service:</b> <span className="text-white font-semibold">YouTube - RTMPS</span>, click <b>Use Stream Key</b> and paste your YouTube key, then click <b>Start Streaming</b> in OBS.
                          <div className="text-[10px] text-slate-400 mt-0.5">(Tip: Set visibility to <b>Unlisted</b> on YouTube so only your website students can see it).</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                        <span>Copy your YouTube Live video link and paste it below:</span>
                      </div>
                    </div>
                  </div>

                  {/* Connect Stream Link Input */}
                  <div className="space-y-2 p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                    <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Paste YouTube Live URL</span>
                      {activeObsConfig.meetingUrl && (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Connected
                        </span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={obsMeetingUrlInput}
                        onChange={(e) => setObsMeetingUrlInput(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-[#6C63FF]"
                      />
                      <button
                        type="button"
                        disabled={savingObsStream || !obsMeetingUrlInput.trim()}
                        onClick={handleSaveStreamSource}
                        className="px-4 py-2 bg-[#6C63FF] hover:bg-[#584fd4] text-white text-xs font-bold rounded-xl transition-all shrink-0 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                      >
                        {savingObsStream ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Stream</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Students will watch your stream inside LoSamajhLo with live chat, polls, and doubt solving!
                    </p>
                  </div>

                  {/* Student Classroom Link */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                    <div className="flex items-center justify-between text-[10px] text-indigo-900 uppercase font-bold">
                      <span>Student Live Classroom Link</span>
                      <a
                        href={`/live/${activeObsConfig.slug || activeObsConfig.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#6C63FF] hover:underline normal-case flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Preview Classroom
                      </a>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-indigo-200/80 rounded-xl p-2 px-3">
                      <span className="flex-1 select-all text-indigo-900 font-mono text-[11px] truncate">
                        {`${window.location.origin}/live/${activeObsConfig.slug || activeObsConfig.id}`}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${window.location.origin}/live/${activeObsConfig.slug || activeObsConfig.id}`,
                            'Student Link'
                          )
                        }
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Copy Student Link"
                      >
                        {copySuccess === 'Student Link' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Custom RTMP Server */}
              {activeStreamTab === 'RTMP' && (
                <div className="space-y-4">
                  {/* Explanation Banner for Hostname Error */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-amber-800">
                      <span>⚠️ Note on RTMP Streaming:</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Render web servers do not run an RTMP live media port (1935). To avoid the OBS <i>"Hostname not found"</i> error, we recommend using <b>YouTube Live via OBS</b> (Tab 1). If you have your own dedicated RTMP server (e.g., MediaMTX, Nginx-RTMP, Cloudflare Stream), use the credentials below:
                    </p>
                  </div>

                  <div className="bg-slate-950 text-slate-200 rounded-2xl p-4 text-xs space-y-3 font-mono">
                    {/* RTMP Server URL */}
                    <div className="space-y-1">
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

                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={handleRotateKey}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                    >
                      Regenerate RTMP Stream Key
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setObsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/live-classes/${activeObsConfig.id}/control-room`}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#6C63FF] hover:bg-[#584fd4] transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Open Control Room →</span>
                  </Link>
                </div>
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
