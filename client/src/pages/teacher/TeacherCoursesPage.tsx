import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Video,
  FileText,
  Users,
  Search,
  ExternalLink,
  PlusCircle,
  Clock,
  CheckCircle,
  Tag,
  ChevronRight,
  Layers,
} from 'lucide-react';
import TeacherLayout from '../../components/teacher/TeacherLayout';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const TeacherCoursesPage: React.FC = () => {
  const { error: toastError } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await api.teacher.getMyCourses();
        if (res.success) {
          setCourses(res.data || []);
        }
      } catch (err: any) {
        toastError(err.message || 'Failed to fetch assigned courses.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((c) =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <TeacherLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">My Assigned Courses</h1>
            <p className="text-xs text-slate-500 mt-1">
              Courses mapped to your teaching profile by the administrative management.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search course title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF] outline-none"
            />
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500 mt-3">Loading assigned courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Courses Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search
                ? 'No assigned courses match your search criteria.'
                : 'You have not been assigned to any active courses yet. Reach out to the admin panel for syllabus mapping.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 bg-slate-100 relative overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-2xl">
                        {course.title.charAt(0)}
                      </div>
                    )}
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm">
                      {course.category?.name || 'General'}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-extrabold text-slate-900 text-base line-clamp-1">{course.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {course.shortDescription || course.description || 'Comprehensive syllabus designed for examination mastery.'}
                    </p>

                    <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-slate-600 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-[#6C63FF]" />
                        <span>{course._count?.lessons || 0} Lectures</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span>{course._count?.enrollments || 0} Enrolled</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                  <Link
                    to={`/courses/${course.slug}`}
                    target="_blank"
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <span>View Public Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <Link
                    to="/teacher/dashboard"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#6C63FF] hover:bg-[#5b52e0] text-white text-xs font-bold transition-colors"
                  >
                    <span>Add Content</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherCoursesPage;
