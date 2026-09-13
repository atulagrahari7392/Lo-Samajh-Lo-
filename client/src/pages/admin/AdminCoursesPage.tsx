import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  Edit2,
  Trash2,
  Eye,
  Star,
  BookOpen,
  PlayCircle,
  X,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../services/api';
import { Course, CourseLesson } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { formatImageUrl, handleImageError, DEFAULT_COURSE_THUMBNAIL } from '../../utils/image';

export const AdminCoursesPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete modal
  const [deleteCourseId, setDeleteCourseId] = useState<string | null>(null);

  // Lesson Manager modal
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonChapter, setLessonChapter] = useState('');
  const [lessonDuration, setLessonDuration] = useState('15');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonPdfUrl, setLessonPdfUrl] = useState('');
  const [lessonPreview, setLessonPreview] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await api.courses.adminGetAll();
      if (data.success) {
        setCourses(data.courses || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDeleteCourse = async () => {
    if (!deleteCourseId) return;
    try {
      await api.courses.delete(deleteCourseId);
      success('Course deleted successfully.');
      setDeleteCourseId(null);
      await fetchCourses();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete course.');
    }
  };

  const handleToggleStatus = async (course: Course) => {
    const nextStatus = course.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await api.courses.update(course.id, { status: nextStatus });
      success(`Course ${nextStatus.toLowerCase()}!`);
      await fetchCourses();
    } catch (err: any) {
      toastError('Could not update status.');
    }
  };

  const handleToggleFeatured = async (course: Course) => {
    try {
      await api.courses.update(course.id, { featured: !course.featured });
      success(course.featured ? 'Removed from featured.' : 'Marked as featured!');
      await fetchCourses();
    } catch (err: any) {
      toastError('Could not toggle featured status.');
    }
  };

  // Open lesson manager
  const openLessonManager = async (course: Course) => {
    setActiveCourse(course);
    try {
      const data = await api.courses.getBySlug(course.id);
      if (data.success && data.course) {
        setLessons(data.course.lessons || []);
        setShowLessonModal(true);
      }
    } catch (e) {
      toastError('Failed to load lessons.');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse || !lessonTitle.trim()) return;

    try {
      setSavingLesson(true);
      const res = await api.courses.addLesson(activeCourse.id, {
        title: lessonTitle.trim(),
        chapterTitle: lessonChapter.trim() || 'General',
        durationMinutes: parseInt(lessonDuration, 10) || 15,
        videoUrl: lessonVideoUrl.trim() || null,
        pdfUrl: lessonPdfUrl.trim() || null,
        isFreePreview: lessonPreview,
        position: lessons.length + 1,
      });

      if (res.success) {
        success('Lesson added successfully!');
        setLessonTitle('');
        setLessonVideoUrl('');
        setLessonPdfUrl('');
        setLessonPreview(false);
        // Refresh lessons
        const fresh = await api.courses.getBySlug(activeCourse.id);
        if (fresh.success) setLessons(fresh.course.lessons || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Error adding lesson.');
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await api.courses.deleteLesson(lessonId);
      success('Lesson deleted.');
      if (activeCourse) {
        const fresh = await api.courses.getBySlug(activeCourse.id);
        if (fresh.success) setLessons(fresh.course.lessons || []);
      }
    } catch (e) {
      toastError('Error deleting lesson.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Courses Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Create, edit, publish, or modify courses and manage syllabus chapters.
            </p>
          </div>

          <Link
            to="/admin/courses/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs shadow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Course</span>
          </Link>
        </div>

        {/* Courses Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="p-4">Course Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price / Discount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Featured</th>
                  <th className="p-4">Lessons</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={formatImageUrl(course.thumbnail)}
                          alt={course.title}
                          onError={handleImageError(DEFAULT_COURSE_THUMBNAIL)}
                          className="w-14 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                        />
                        <div className="overflow-hidden">
                          <Link to={`/courses/${course.slug}`} className="font-bold text-slate-900 hover:text-[#6C63FF] line-clamp-1">
                            {course.title}
                          </Link>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {course.instructorName} • {course.duration || '60+ Hrs'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-[#6C63FF]">
                        {course.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">
                        ₹{course.discountedPrice !== null ? course.discountedPrice : course.price}
                      </div>
                      {course.discountedPrice && (
                        <span className="text-[11px] text-slate-400 line-through">₹{course.price}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(course)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-colors ${
                          course.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {course.status}
                      </button>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleFeatured(course)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          course.featured ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-slate-400'
                        }`}
                        title="Toggle Featured"
                      >
                        <Star className={`w-4 h-4 ${course.featured ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => openLessonManager(course)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold"
                      >
                        {course._count?.lessons || 0} Lessons
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        to={`/admin/courses/${course.id}/edit`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 inline-block"
                        title="Edit Course Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteCourseId(course.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No courses found in database. Click "Add New Course" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteCourseId !== null}
          title="Delete Course"
          message="Are you sure you want to delete this course? All associated lessons and enrollments will be permanently removed."
          confirmText="Yes, Delete Course"
          onConfirm={handleDeleteCourse}
          onCancel={() => setDeleteCourseId(null)}
        />

        {/* Lesson Manager Modal */}
        {showLessonModal && activeCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowLessonModal(false)} />
            <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Manage Lessons & Syllabus</h3>
                  <p className="text-xs text-slate-500">{activeCourse.title}</p>
                </div>
                <button onClick={() => setShowLessonModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Add Lesson Form */}
              <form onSubmit={handleAddLesson} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Add New Lesson</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="Lesson Title (e.g. Percentage Basics Demo)"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white outline-none focus:border-[#6C63FF]"
                    required
                  />
                  <input
                    type="text"
                    value={lessonChapter}
                    onChange={(e) => setLessonChapter(e.target.value)}
                    placeholder="Chapter Name (e.g. Chapter 1: Arithmetic)"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white outline-none focus:border-[#6C63FF]"
                  />
                  <input
                    type="text"
                    value={lessonVideoUrl}
                    onChange={(e) => setLessonVideoUrl(e.target.value)}
                    placeholder="Video Embed URL (YouTube/Vimeo/Cloud)"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white outline-none focus:border-[#6C63FF]"
                  />
                  <input
                    type="text"
                    value={lessonPdfUrl}
                    onChange={(e) => setLessonPdfUrl(e.target.value)}
                    placeholder="PDF Notes Download URL"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white outline-none focus:border-[#6C63FF]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lessonPreview}
                      onChange={(e) => setLessonPreview(e.target.checked)}
                      className="w-4 h-4 rounded text-[#6C63FF]"
                    />
                    <span>Allow Free Preview (Demo)</span>
                  </label>

                  <button
                    type="submit"
                    disabled={savingLesson}
                    className="px-4 py-2 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs shadow disabled:opacity-50"
                  >
                    {savingLesson ? 'Saving...' : 'Add Lesson'}
                  </button>
                </div>
              </form>

              {/* Lessons List */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Current Lessons ({lessons.length})
                </h4>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto border border-slate-100 rounded-xl">
                  {lessons.map((l, idx) => (
                    <div key={l.id} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-400">{idx + 1}.</span>
                        <div>
                          <p className="font-bold text-slate-800">{l.title}</p>
                          <span className="text-[10px] text-slate-400">{l.chapterTitle} • {l.durationMinutes} mins</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {l.isFreePreview && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                            FREE
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteLesson(l.id)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {lessons.length === 0 && (
                    <p className="text-center py-6 text-slate-400 text-xs">No lessons added yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCoursesPage;
