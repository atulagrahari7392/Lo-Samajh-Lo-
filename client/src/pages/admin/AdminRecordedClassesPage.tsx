import React, { useState, useEffect } from 'react';
import {
  Film,
  Plus,
  Play,
  Trash2,
  Edit,
  ExternalLink,
  BookOpen,
  Clock,
  RefreshCw,
  HardDrive,
  Youtube,
  UploadCloud,
  CheckCircle2,
  Eye,
  Sliders,
} from 'lucide-react';
import { api } from '../../services/api';
import { RecordedClass, Course } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { RecordedLectureModal } from '../../components/admin/RecordedLectureModal';
import { formatImageUrl, handleImageError, DEFAULT_LECTURE_THUMBNAIL } from '../../utils/image';

export const AdminRecordedClassesPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [recordedClasses, setRecordedClasses] = useState<RecordedClass[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<RecordedClass | null>(null);

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
    setEditingLecture(null);
    setIsModalOpen(true);
  };

  const openEditModal = (lecture: RecordedClass) => {
    setEditingLecture(lecture);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await api.recorded.delete(deleteId);
      if (res.success) {
        setRecordedClasses((prev) => prev.filter((item) => item.id !== deleteId));
        success('Recorded lecture deleted successfully.');
        setDeleteId(null);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to delete recorded class');
    }
  };

  const togglePublishStatus = async (lecture: RecordedClass) => {
    try {
      const newStatus = !lecture.isPublished;
      const res = await api.recorded.update(lecture.id, { isPublished: newStatus });
      if (res.success) {
        setRecordedClasses((prev) =>
          prev.map((item) => (item.id === lecture.id ? { ...item, isPublished: newStatus } : item))
        );
        success(`Lecture marked as ${newStatus ? 'Published' : 'Draft'}.`);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update lecture status');
    }
  };

  // Helper to determine storage provider from videoUrl
  const getStorageBadge = (url: string) => {
    if (url.includes('drive.google.com')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60">
          <HardDrive className="w-3 h-3 text-emerald-600" />
          Google Drive (5TB)
        </span>
      );
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200/60">
          <Youtube className="w-3 h-3 text-red-600" />
          YouTube
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200/60">
        <UploadCloud className="w-3 h-3 text-[#6C63FF]" />
        Cloud Server
      </span>
    );
  };

  const filteredClasses =
    selectedCourseFilter === 'ALL'
      ? recordedClasses
      : recordedClasses.filter((r) => r.courseId === selectedCourseFilter);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Film className="w-7 h-7 text-[#6C63FF]" />
                Recorded Video Lectures 2.0
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                5 TB Drive Integrated
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Upload and manage course video archives hosted permanently in your Google Drive cloud storage.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by Course */}
            {courses.length > 0 && (
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none shadow-sm"
              >
                <option value="ALL">All Courses ({recordedClasses.length})</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}

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
              Add Recorded Lecture
            </button>
          </div>
        </div>

        {/* Recorded Classes Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Lecture Video</th>
                  <th className="py-3.5 px-4">Chapter</th>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Storage Backend</th>
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
                ) : filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No recorded lectures found. Click "Add Recorded Lecture" to upload one.
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Video Title & Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail / Play Preview */}
                          <div className="w-16 h-10 rounded-xl bg-slate-900 border border-slate-200 overflow-hidden shrink-0 relative flex items-center justify-center shadow-sm">
                            {rec.thumbnail ? (
                              <img
                                src={formatImageUrl(rec.thumbnail, DEFAULT_LECTURE_THUMBNAIL)}
                                alt={rec.title}
                                onError={handleImageError(DEFAULT_LECTURE_THUMBNAIL)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Film className="w-4 h-4 text-slate-500" />
                            )}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <Play className="w-3 h-3 text-white fill-current opacity-80 group-hover:opacity-100" />
                            </div>
                          </div>

                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <p className="font-bold text-slate-900 truncate" title={rec.title}>
                              {rec.title}
                            </p>
                            {rec.description && (
                              <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                {rec.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Chapter */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {rec.chapter || 'Chapter 1'}
                        </span>
                      </td>

                      {/* Course */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 line-clamp-1 max-w-[180px]">
                          {rec.course?.title || 'General Course'}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-slate-600 font-medium text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {rec.durationMinutes} mins
                        </span>
                      </td>

                      {/* Storage Backend */}
                      <td className="py-3 px-4">
                        {getStorageBadge(rec.videoUrl)}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => togglePublishStatus(rec)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all hover:scale-105 cursor-pointer ${
                            rec.isPublished
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                          title="Click to toggle status"
                        >
                          {rec.isPublished ? 'PUBLISHED' : 'DRAFT'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={rec.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-[#6C63FF] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Preview Video Stream"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          <button
                            type="button"
                            onClick={() => openEditModal(rec)}
                            className="p-1.5 text-slate-400 hover:text-[#6C63FF] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Lecture Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteId(rec.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Lecture"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Recorded Lecture Modal 2.0 */}
        <RecordedLectureModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchData();
          }}
          courses={courses}
          initialData={editingLecture}
        />

        {/* Delete Modal */}
        <ConfirmModal
          isOpen={!!deleteId}
          title="Delete Recorded Lecture"
          message="Are you sure you want to delete this recorded lecture from the course repository? If hosted on Google Drive, it will remain safely in Drive Trash."
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
