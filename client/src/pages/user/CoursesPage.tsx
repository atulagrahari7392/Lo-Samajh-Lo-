import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, BookOpen, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Course, Category } from '../../types';
import CourseCard from '../../components/course/CourseCard';

export const CoursesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedSort, setSelectedSort] = useState<string>('newest');
  const [freeOnly, setFreeOnly] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Fetch categories
  useEffect(() => {
    api.categories.getAll().then((data) => {
      if (data.success) setCategories(data.categories || []);
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
