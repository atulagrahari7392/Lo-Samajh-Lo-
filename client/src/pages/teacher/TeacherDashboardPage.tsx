import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  PlusCircle,
  TrendingUp,
  Users,
  ExternalLink,
  ChevronRight,
  Send,
  Calendar,
  Layers,
  UploadCloud,
  X,
} from 'lucide-react';
import TeacherLayout from '../../components/teacher/TeacherLayout';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TeacherDashboardStats } from '../../types';

export const TeacherDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);
  const [courses, setCourses] = useState<any[]>([]);

  // Modals state
  const [modalType, setModalType] = useState<'lecture' | 'material' | 'test' | 'live' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedCourseId, setSelectedCourseId] = useState('');
  // Lecture Form
  const [lectureTitle, setLectureTitle] = useState('');
  const [chapterTitle, setChapterTitle] = useState('Chapter 1');
  const [lectureDuration, setLectureDuration] = useState(30);
  const [lectureVideoUrl, setLectureVideoUrl] = useState('');
  const [lecturePdfUrl, setLecturePdfUrl] = useState('');
  const [lectureFreePreview, setLectureFreePreview] = useState(false);
  // Material Form
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState('NOTES');
  const [materialFileUrl, setMaterialFileUrl] = useState('');
  // Live Class Form
  const [liveTitle, setLiveTitle] = useState('');
  const [liveScheduledAt, setLiveScheduledAt] = useState('');
  const [liveDuration, setLiveDuration] = useState(60);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, coursesRes] = await Promise.all([
        api.teacher.getDashboardStats(),
        api.teacher.getMyCourses(),
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }
      if (coursesRes.success) {
        setCourses(coursesRes.data || []);
        if (coursesRes.data && coursesRes.data.length > 0) {
          setSelectedCourseId(coursesRes.data[0].id);
        }
      }
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      toastError(err.message || 'Failed to load teacher dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return toastError('Please select a course.');
    try {
      setSubmitting(true);
      const res = await api.teacher.createLecture({
        courseId: selectedCourseId,
        title: lectureTitle,
        chapterTitle,
        durationMinutes: Number(lectureDuration),
        videoUrl: lectureVideoUrl,
        pdfUrl: lecturePdfUrl || undefined,
        isFreePreview: lectureFreePreview,
      });
      if (res.success) {
        success('Lecture submitted for review! Quality team will inspect it.');
        setModalType(null);
        resetForms();
        fetchDashboardData();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to submit lecture.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return toastError('Please select a course.');
    try {
      setSubmitting(true);
      const res = await api.teacher.createMaterial({
        courseId: selectedCourseId,
        title: materialTitle,
        resourceType: materialType,
        fileUrl: materialFileUrl,
      });
      if (res.success) {
        success('Study material submitted for quality approval!');
        setModalType(null);
        resetForms();
        fetchDashboardData();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to submit study material.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLiveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return toastError('Please select a course.');
    try {
      setSubmitting(true);
      const res = await api.teacher.createLiveClass({
        courseId: selectedCourseId,
        title: liveTitle,
        scheduledAt: liveScheduledAt,
        estimatedDurationMinutes: Number(liveDuration),
      });
      if (res.success) {
        success('Live class scheduled and submitted for review!');
        setModalType(null);
        resetForms();
        fetchDashboardData();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to schedule live class.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForms = () => {
    setLectureTitle('');
    setChapterTitle('Chapter 1');
    setLectureDuration(30);
    setLectureVideoUrl('');
    setLecturePdfUrl('');
    setLectureFreePreview(false);
    setMaterialTitle('');
    setMaterialType('NOTES');
    setMaterialFileUrl('');
    setLiveTitle('');
    setLiveScheduledAt('');
    setLiveDuration(60);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <TeacherLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#1E1B4B] via-[#312E81] to-[#4338CA] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Instructor Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-black">
              {getGreeting()}, {user?.name || 'Teacher'} 👋
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm max-w-xl">
              Manage your assigned syllabus, submit lecture recordings & class notes, schedule live interactions,
              and track student feedback.
            </p>
          </div>

          {/* Quick Action Trigger Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setModalType('lecture')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow-md hover:bg-indigo-50 transition-colors"
            >
              <Video className="w-4 h-4 text-[#6C63FF]" />
              <span>+ Upload Lecture</span>
            </button>
            <button
              onClick={() => setModalType('material')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-800/80 hover:bg-indigo-800 text-white font-bold text-xs transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-300" />
              <span>+ Add Notes</span>
            </button>
            <button
              onClick={() => setModalType('live')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-800/80 hover:bg-indigo-800 text-white font-bold text-xs transition-colors"
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>+ Schedule Live</span>
            </button>
          </div>
        </div>

        {/* 6 Key Performance Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats?.assignedCourses ?? courses.length}
            </div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Assigned Courses
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats?.totalLectures ?? 0}
            </div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Lectures Made
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats?.totalMaterials ?? 0}
            </div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Notes & PDFs
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats?.totalTests ?? 0}
            </div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tests Created
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-2 bg-amber-50/20">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-amber-700">
              {stats?.pendingReview ?? 0}
            </div>
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Under Review
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-2 bg-emerald-50/20">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {stats?.approvedContent ?? 0}
            </div>
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Approved / Live
            </div>
          </div>
        </div>

        {/* Assigned Courses Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Your Assigned Courses</h2>
                <p className="text-xs text-slate-500">Courses mapped to you by Academic Administration</p>
              </div>
            </div>
            <Link
              to="/teacher/courses"
              className="text-xs font-bold text-[#6C63FF] hover:underline inline-flex items-center gap-1"
            >
              <span>View All Courses</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600">No courses assigned yet.</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Once an administrator maps courses to your profile, they will appear here along with syllabus management tools.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow bg-white flex flex-col justify-between"
                >
                  <div>
                    <div className="h-36 bg-slate-100 relative overflow-hidden">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xl">
                          {course.title.charAt(0)}
                        </div>
                      )}
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 backdrop-blur-sm text-slate-800 shadow-sm">
                        {course.category?.name || 'General'}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{course.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {course.shortDescription || course.description || 'No description provided.'}
                      </p>
                      <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-slate-400" />
                          <span>{course._count?.lessons || 0} Lessons</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{course._count?.enrollments || 0} Students</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setModalType('lecture');
                      }}
                      className="text-xs font-bold text-[#6C63FF] hover:underline"
                    >
                      + Add Lesson
                    </button>
                    <Link
                      to={`/courses/${course.slug}`}
                      target="_blank"
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <span>Public View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Review Activity Table */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Content Review Activity</h2>
              <p className="text-xs text-slate-500">
                Track status of submitted lectures, study notes, tests, and reviewer remarks.
              </p>
            </div>
            <Link
              to="/teacher/content-approval"
              className="text-xs font-bold text-[#6C63FF] hover:underline inline-flex items-center gap-1"
            >
              <span>View Review Queue</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {stats?.recentReviews && stats.recentReviews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Content Title</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Course</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Reviewer Notes</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentReviews.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-3 font-semibold text-slate-800">{item.title}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.contentType || item.type || 'LESSON'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{item.courseTitle || '—'}</td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.approvalStatus === 'CHANGES_REQUESTED'
                              ? 'bg-amber-100 text-amber-800'
                              : item.approvalStatus === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-100 text-[#6C63FF]'
                          }`}
                        >
                          {item.approvalStatus || 'PENDING_REVIEW'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 max-w-xs truncate">
                        {item.reviewerComment || '—'}
                      </td>
                      <td className="py-3 text-slate-400 text-[11px]">
                        {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No recent content submissions. Click the upload buttons above to submit your first lecture or notes!
            </div>
          )}
        </div>

        {/* Modal: Upload Lecture */}
        {modalType === 'lecture' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#6C63FF]" />
                  <h3 className="font-black text-slate-900 text-base">Upload Video Lecture</h3>
                </div>
                <button
                  onClick={() => setModalType(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateLecture} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Course *</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#6C63FF]"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lecture Title *</label>
                  <input
                    type="text"
                    required
                    value={lectureTitle}
                    onChange={(e) => setLectureTitle(e.target.value)}
                    placeholder="e.g., Introduction to Quadratic Equations"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#6C63FF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Chapter / Unit *</label>
                    <input
                      type="text"
                      required
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      placeholder="Chapter 1"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#6C63FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={lectureDuration}
                      onChange={(e) => setLectureDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#6C63FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Video URL (YouTube, Vimeo, HLS, or Drive) *
                  </label>
                  <input
                    type="url"
                    required
                    value={lectureVideoUrl}
                    onChange={(e) => setLectureVideoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#6C63FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Accompanying PDF / Handout URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={lecturePdfUrl}
                    onChange={(e) => setLecturePdfUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#6C63FF]"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={lectureFreePreview}
                    onChange={(e) => setLectureFreePreview(e.target.checked)}
                    className="rounded text-[#6C63FF] focus:ring-[#6C63FF]"
                  />
                  <span className="text-xs font-bold text-slate-700">Allow as Free Preview Lecture</span>
                </label>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5b52e0] text-white text-xs font-bold shadow-md transition-colors disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Submit for Admin Review'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Study Material */}
        {modalType === 'material' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-slate-900 text-base">Add Study Material / Notes</h3>
                </div>
                <button
                  onClick={() => setModalType(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateMaterial} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Course *</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    placeholder="e.g., Complete Formula Sheet & Practice Questions"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Resource Type</label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="NOTES">Lecture Handwritten Notes</option>
                    <option value="PRACTICE_SHEET">Practice Sheet / DPP</option>
                    <option value="WORKSHEET">Worksheet</option>
                    <option value="OTHER">Other Reference Material</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Document File URL *</label>
                  <input
                    type="url"
                    required
                    value={materialFileUrl}
                    onChange={(e) => setMaterialFileUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Submit Material'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Schedule Live Class */}
        {modalType === 'live' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-600" />
                  <h3 className="font-black text-slate-900 text-base">Schedule Live Class Session</h3>
                </div>
                <button
                  onClick={() => setModalType(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateLiveClass} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Course *</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class Title *</label>
                  <input
                    type="text"
                    required
                    value={liveTitle}
                    onChange={(e) => setLiveTitle(e.target.value)}
                    placeholder="e.g., Live Doubt Resolution & Mock Paper Solving"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={liveScheduledAt}
                      onChange={(e) => setLiveScheduledAt(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Est. Duration (Mins)</label>
                    <input
                      type="number"
                      value={liveDuration}
                      onChange={(e) => setLiveDuration(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Scheduling...' : 'Schedule for Approval'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherDashboardPage;
