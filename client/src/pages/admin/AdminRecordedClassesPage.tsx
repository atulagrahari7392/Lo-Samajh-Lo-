import React, { useState, useEffect } from 'react';
import {
  Film,
  Plus,
  Play,
  Trash2,
  ExternalLink,
  BookOpen,
  Clock,
  RefreshCw,
  X,
  CheckCircle,
  UploadCloud,
  HardDrive,
  Youtube,
  Link as LinkIcon,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { RecordedClass, Course } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const AdminRecordedClassesPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [recordedClasses, setRecordedClasses] = useState<RecordedClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Form / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [chapter, setChapter] = useState('Chapter 1');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoSourceType, setVideoSourceType] = useState<'upload' | 'drive' | 'youtube' | 'custom'>('upload');

  // Helper to normalize and convert Google Drive & YouTube links
  const handleVideoUrlChange = (val: string) => {
    let cleanUrl = val.trim();

    // Check Google Drive
    const driveMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      cleanUrl = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }

    // Check YouTube
    const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]+)/);
    if (ytMatch && ytMatch[1]) {
      cleanUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    }

    setVideoUrl(cleanUrl);
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingVideo(true);
      const res = await api.upload.file(file);
      if (res.success && res.fileUrl) {
        setVideoUrl(res.fileUrl);
        success('Video uploaded from local drive successfully!');
      }
    } catch (err: any) {
      toastError(err.message || 'Video upload failed. Please try again or use Google Drive link.');
    } finally {
      setUploadingVideo(false);
    }
  };

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, courseRes] = await Promise.all([
        api.recorded.adminGetAll(),
        api.courses.adminGetAll(),
      ]);
      if (recRes.success) setRecordedClasses(recRes.classes || []);
      if (courseRes.success) {
        setCourses(courseRes.courses || []);
        if (courseRes.courses?.length > 0 && !courseId) {
          setCourseId(courseRes.courses[0].id);
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load recorded classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setTitle('');
    setChapter('Chapter 1');
    setDurationMinutes(45);
    setVideoUrl('');
    setDescription('');
    setIsPublished(true);
    if (courses.length > 0) setCourseId(courses[0].id);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title.trim() || !videoUrl.trim()) {
      toastError('Course, title, and video URL are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        courseId,
        title: title.trim(),
        chapter: chapter.trim() || 'Chapter 1',
        durationMinutes,
        videoUrl: videoUrl.trim(),
        description: description.trim() || null,
        isPublished,
      };

      const res = await api.recorded.create(payload);
      if (res.success) {
        success('Recorded lecture uploaded successfully!');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save recorded class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await api.recorded.delete(deleteId);
      if (res.success) {
        setRecordedClasses((prev) => prev.filter((item) => item.id !== deleteId));
        success('Recorded class deleted.');
        setDeleteId(null);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to delete recorded class');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Film className="w-7 h-7 text-[#6C63FF]" />
              Recorded Video Lectures
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Organize video lecture archives by course and chapter for on-demand student learning.
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
              Add Recorded Class
            </button>
          </div>
        </div>

        {/* Recorded Classes Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Lecture Title</th>
                  <th className="py-3.5 px-4">Chapter</th>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Video Link</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6C63FF]" />
                      Loading video lectures...
                    </td>
                  </tr>
                ) : recordedClasses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No recorded lectures available. Click "Add Recorded Class" to add one.
                    </td>
                  </tr>
                ) : (
                  recordedClasses.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6C63FF] flex items-center justify-center flex-shrink-0">
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{rec.title}</p>
                            {rec.description && (
                              <p className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">
                                {rec.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {rec.chapter}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 line-clamp-1 max-w-[200px]">
                          {rec.course?.title || 'General Course'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {rec.durationMinutes} mins
                      </td>

                      <td className="py-3.5 px-4">
                        <a
                          href={rec.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#6C63FF] hover:underline font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Watch Video
                        </a>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.isPublished
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {rec.isPublished ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setDeleteId(rec.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Recorded Lecture"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Recorded Lecture */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6C63FF] flex items-center justify-center">
                    <Film className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">Add Recorded Lecture</h3>
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
                  <label className="text-xs font-bold text-slate-700">Select Course *</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                  >
                    {courses.map((crs) => (
                      <option key={crs.id} value={crs.id}>
                        {crs.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Lecture Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Indian National Movement - Part 1"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF]/30 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Chapter / Section</label>
                    <input
                      type="text"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="e.g. Chapter 2 - Modern History"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Duration (Minutes)</label>
                    <input
                      type="number"
                      min={1}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 45)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Video Source Selection & Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Video Source / वीडियो स्रोत चुनें *
                  </label>

                  {/* Tabs */}
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setVideoSourceType('upload')}
                      className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        videoSourceType === 'upload' ? 'bg-white text-[#6C63FF] shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Local Drive Upload</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoSourceType('drive')}
                      className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        videoSourceType === 'drive' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Google Drive (5TB)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoSourceType('youtube')}
                      className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                        videoSourceType === 'youtube' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      <span>YouTube / Other</span>
                    </button>
                  </div>

                  {/* 1. Local Video Upload */}
                  {videoSourceType === 'upload' && (
                    <div className="p-3 bg-purple-50/60 border border-dashed border-purple-200 rounded-2xl space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-xs text-slate-800">Direct Local Video File Upload</div>
                          <div className="text-[10px] text-slate-500">MP4, WebM, MKV (Local drive ya PC se chunein)</div>
                        </div>
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#6C63FF] hover:bg-[#584feb] text-white font-bold text-xs shadow-sm transition-all hover:scale-105 active:scale-95">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>{uploadingVideo ? 'Uploading Video...' : 'Choose Video File'}</span>
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/mkv,video/mov"
                            disabled={uploadingVideo}
                            onChange={handleVideoFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* 2. Google Drive Link */}
                  {videoSourceType === 'drive' && (
                    <div className="p-3 bg-emerald-50/60 border border-dashed border-emerald-200 rounded-2xl space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                        <HardDrive className="w-4 h-4 text-emerald-600" />
                        <span>Google Drive 5TB Storage Connector</span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        अपनी Google Drive फ़ाइल का शेयर लिंक <em>("Anyone with link can view")</em> यहाँ पेस्ट करें। यह सिस्टम स्वतः सुरक्षित प्रीव्यू प्लेयर में बदल देगा।
                      </p>
                    </div>
                  )}

                  {/* Video URL Input */}
                  <div>
                    <input
                      type="url"
                      required
                      value={videoUrl}
                      onChange={(e) => handleVideoUrlChange(e.target.value)}
                      placeholder={
                        videoSourceType === 'drive'
                          ? 'https://drive.google.com/file/d/.../view?usp=sharing'
                          : videoSourceType === 'youtube'
                          ? 'https://www.youtube.com/watch?v=... ya embed url'
                          : 'Video URL or /uploads/filename.mp4'
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF]/30 outline-none"
                    />
                  </div>

                  {/* Detection Feedback */}
                  {videoUrl && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Protected Video Stream Configured: {videoUrl.slice(0, 50)}...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Key concepts discussed in this recorded lecture..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded text-[#6C63FF]"
                  />
                  <label htmlFor="isPublished" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Publish lecture immediately for enrolled students
                  </label>
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
                    {submitting ? 'Uploading...' : 'Save Lecture'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        <ConfirmModal
          isOpen={!!deleteId}
          title="Delete Recorded Lecture"
          message="Are you sure you want to delete this recorded lecture from the course repository?"
          confirmText="Delete Lecture"
          isDestructive={true}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminRecordedClassesPage;
