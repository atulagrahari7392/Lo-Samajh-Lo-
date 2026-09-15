import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, BookOpen, AlertCircle, Radio, Clock, Calendar, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { Course, Category, LiveClass } from '../../types';
import CourseCard from '../../components/course/CourseCard';

export const CoursesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedSort, setSelectedSort] = useState<string>('newest');
  const [freeOnly, setFreeOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Fetch categories and live sessions
  useEffect(() => {
    api.categories.getAll().then((data) => {
      if (data.success) setCategories(data.categories || []);
    });

    api.live.getAll().then((data) => {
      if (data.success && Array.isArray(data.classes)) {
        // Show live or scheduled sessions
        const active = data.classes.filter(
          (c: LiveClass) => c.status === 'LIVE' || c.status === 'SCHEDULED' || c.status === 'UPCOMING'
        );
        setLiveClasses(active);
      }
    }).catch((err) => {
      console.warn('Could not load live sessions:', err);
    });
  }, []);

  // Fetch courses with filters
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (freeOnly) params.isFree = 'true';
      if (selectedSort) params.sort = selectedSort;

      const data = await api.courses.getAll(params);
      if (data.success) {
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [selectedCategory, selectedSort, freeOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#6C63FF]">
          EXPLORE CATALOG
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
          Government Exam Batches & Courses
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Step-by-step video courses, chapter-wise notes, and full test series designed by expert faculty.
        </p>
      </div>

      {/* Active & Scheduled Live Sessions Section */}
      {liveClasses.length > 0 && (
        <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white shadow-xl border border-indigo-500/20 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>🔴 Live & Scheduled Interactive Sessions</span>
                </h2>
                <p className="text-xs text-slate-300">
                  Attend real-time faculty lectures, ask doubts live, and access study materials.
                </p>
              </div>
            </div>
            <Link
              to="/live-classes"
              className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>View All Live Classes</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {liveClasses.slice(0, 3).map((cls) => {
              const isLive = cls.status === 'LIVE';
              return (
                <div
                  key={cls.id}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#6C63FF]/50 rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                          <Radio className="w-3 h-3" />
                          LIVE NOW
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#6C63FF]/30 text-indigo-200 border border-[#6C63FF]/40">
                          <Clock className="w-3 h-3 text-indigo-300" />
                          {new Date(cls.scheduledAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}{' '}
                          •{' '}
                          {new Date(cls.scheduledAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}

                      {!cls.courseId ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          Open Webinar
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-slate-300 truncate max-w-[120px]">
                          {cls.course?.title}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-white line-clamp-2 group-hover:text-indigo-200 transition-colors">
                      {cls.title}
                    </h3>

                    <div className="text-[11px] text-slate-300 flex items-center justify-between">
                      <span>👨‍🏫 {cls.instructor}</span>
                      {cls.chapter && <span className="text-slate-400 truncate max-w-[130px]">{cls.chapter}</span>}
                    </div>
                  </div>

                  <Link
                    to={`/live/${cls.slug || cls.id}`}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs text-center transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                      isLive
                        ? 'bg-rose-600 hover:bg-rose-700 text-white animate-bounce'
                        : 'bg-[#6C63FF] hover:bg-[#584fd4] text-white'
                    }`}
                  >
                    {isLive ? (
                      <>
                        <Radio className="w-3.5 h-3.5" />
                        <span>Join Live Classroom</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>View Class Details</span>
                      </>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course title or exam name..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#6C63FF] text-white font-bold text-xs shadow"
            >
              Search
            </button>
          </form>

          {/* Sort & Free Toggles */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={freeOnly}
                onChange={(e) => setFreeOnly(e.target.checked)}
                className="w-4 h-4 rounded text-[#6C63FF] focus:ring-0 cursor-pointer"
              />
              <span>Free Batches Only</span>
            </label>

            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="title">Course Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
              selectedCategory === ''
                ? 'bg-[#6C63FF] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Exams
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                selectedCategory === c.slug
                  ? 'bg-[#6C63FF] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#6C63FF] mx-auto flex items-center justify-center">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Courses Found</h3>
          <p className="text-xs text-slate-500">
            We couldn't find any courses matching your search criteria. Try removing filters or searching for another keyword.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('');
              setSearchQuery('');
              setFreeOnly(false);
            }}
            className="px-5 py-2 rounded-xl bg-[#6C63FF] text-white font-bold text-xs"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
