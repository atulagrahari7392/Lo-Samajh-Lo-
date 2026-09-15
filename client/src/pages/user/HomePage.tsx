import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  FileText,
  CheckCircle2,
  PlayCircle,
  Award,
  Video,
  ArrowRight,
  Star,
  Users,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
  Download,
} from 'lucide-react';
import { api } from '../../services/api';
import { Course, Category, Material, Test, Review, Notification } from '../../types';
import CourseCard from '../../components/course/CourseCard';
import { HeroSlider } from '../../components/home/HeroSlider';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<Material[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [catsRes, coursesRes, matsRes, testsRes, revsRes, notifsRes] =
          await Promise.all([
            api.categories.getAll(),
            api.courses.getAll({ limit: 6 }),
            api.materials.getAll(),
            api.tests.getAll(),
            api.reviews.getFeatured(),
            api.notifications.getAll(),
          ]);

        if (catsRes.success) setCategories(catsRes.categories || []);
        if (coursesRes.success) setFeaturedCourses(coursesRes.courses || []);
        if (matsRes.success) setStudyMaterials((matsRes.materials || []).slice(0, 4));
        if (testsRes.success) setTests((testsRes.tests || []).slice(0, 3));
        if (revsRes.success) setReviews(revsRes.reviews || []);
        if (notifsRes.success) setNotifications((notifsRes.notifications || []).slice(0, 3));
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Notifications Marquee Ticker */}
      {notifications.length > 0 && (
        <div className="bg-slate-900 text-white text-xs py-2.5 px-4 overflow-hidden border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-[#FF6584] text-white font-extrabold uppercase tracking-wider text-[10px] flex-shrink-0">
              LATEST UPDATES
            </span>
            <div className="overflow-hidden whitespace-nowrap text-slate-300 flex gap-8 animate-marquee">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  to="/notifications"
                  className="hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]"></span>
                  <span>{n.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured Banner Slider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mb-6">
        <HeroSlider />
      </div>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-[#6C63FF] text-xs font-bold">
                <Sparkles className="w-4 h-4 text-[#FF6584]" />
                <span>India's #1 Learning Engine • भारत का अग्रणी शिक्षा मंच</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Learn <span className="text-[#6C63FF]">Smarter</span>,
                <br />
                Score <span className="text-[#FF6584]">Higher.</span>
                <span className="block text-xl sm:text-2xl font-bold text-slate-500 mt-2">
                  स्मार्ट पढ़ें, निश्चित सफलता पाएं
                </span>
              </h1>

              <p className="text-slate-600 text-base sm:text-lg max-w-xl leading-relaxed">
                Dedicated preparation for <span className="font-semibold text-slate-800">UPSSSC PET, Railway NTPC & Group D, SSC GD, UP Police</span> and University Graduation studies. Interactive video courses, live mock tests, and bilingual notes.
              </p>

              {/* Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200 max-w-lg flex items-center gap-2"
              >
                <Search className="w-5 h-5 text-slate-400 ml-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search courses, exams, tests (e.g. UPSSSC PET 2026)..."
                  className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs shadow-md shadow-[#6C63FF]/30 transition-transform active:scale-95"
                >
                  Search
                </button>
              </form>

              {/* Quick Exam Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider">Popular:</span>
                {['UPSSSC PET', 'RRB NTPC', 'SSC GD', 'UP Police', 'Science PYQ'].map((tag) => (
                  <Link
                    key={tag}
                    to={`/courses?search=${encodeURIComponent(tag)}`}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-[#6C63FF] text-slate-700 font-medium transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/80">
                <div>
                  <h4 className="text-2xl font-black text-slate-900">50K+</h4>
                  <p className="text-xs text-slate-500 font-medium">Enrolled Students</p>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-[#6C63FF]">100%</h4>
                  <p className="text-xs text-slate-500 font-medium">Bilingual Syllabus</p>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-[#FF6584]">4.9 / 5</h4>
                  <p className="text-xs text-slate-500 font-medium">Student Rating</p>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] p-1 shadow-2xl">
                <div className="bg-slate-900 rounded-[22px] p-6 text-white space-y-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black">
                        LS
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Live Learning Feed</p>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          Platform Active
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-300">
                      2026 Batches
                    </span>
                  </div>

                  {/* Featured Mock Widget */}
                  <div className="bg-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#FF6584]">TODAY'S FREE MOCK</span>
                      <span className="text-[10px] text-slate-300 font-mono">120 Mins</span>
                    </div>
                    <h4 className="font-bold text-sm text-white">UPSSSC PET 2026 All India Live Mock #1</h4>
                    <p className="text-xs text-slate-300">Test your percentile against 5,000+ aspirants across UP.</p>
                    <Link
                      to="/test-series"
                      className="block w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8f88ff] text-white font-bold text-xs shadow-md"
                    >
                      Attempt Free Test Now
                    </Link>
                  </div>

                  {/* Typing Test Quick Widget */}
                  <div className="bg-white/10 rounded-2xl p-4 space-y-2 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">SKILL ENGINE</span>
                      <span className="text-[10px] text-slate-300">Hindi / English</span>
                    </div>
                    <h4 className="font-bold text-sm text-white">Speed Typing Test Drill</h4>
                    <p className="text-xs text-slate-300">Check your WPM and accuracy for SSC & Police benchmarks.</p>
                    <Link
                      to="/typing-test"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6584] hover:underline"
                    >
                      Start 1-Min Typing Test <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PhysicsWallah (PW.live) Inspired Quick Action Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-3 sm:p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Link
            to="/test-series"
            className="flex items-center gap-3 p-3 rounded-2xl bg-purple-50/60 hover:bg-[#6C63FF] hover:text-white transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-white text-[#6C63FF] flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-white leading-tight">
                Test Series
              </h4>
              <p className="text-[11px] text-slate-500 group-hover:text-purple-100">
                Online Mock CBT
              </p>
            </div>
          </Link>

          <Link
            to="/courses"
            className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50/60 hover:bg-indigo-600 hover:text-white transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-white text-indigo-600 flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-white leading-tight">
                Recorded Class
              </h4>
              <p className="text-[11px] text-slate-500 group-hover:text-indigo-100">
                Chapter Lectures
              </p>
            </div>
          </Link>

          <Link
            to="/courses"
            className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50/60 hover:bg-[#FF6584] hover:text-white transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-white text-[#FF6584] flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-white leading-tight">
                Live Classes
              </h4>
              <p className="text-[11px] text-slate-500 group-hover:text-rose-100">
                Marathon & Doubts
              </p>
            </div>
          </Link>

          <Link
            to="/study-materials"
            className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-50/60 hover:bg-emerald-600 hover:text-white transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-white text-emerald-600 flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-white leading-tight">
                Study Materials
              </h4>
              <p className="text-[11px] text-slate-500 group-hover:text-emerald-100">
                Drishti-Style PDFs
              </p>
            </div>
          </Link>

          <Link
            to="/typing-test"
            className="col-span-2 sm:col-span-1 flex items-center gap-3 p-3 rounded-2xl bg-amber-50/60 hover:bg-amber-600 hover:text-white transition-all group"
          >
            <div className="w-11 h-11 rounded-xl bg-white text-amber-600 flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-white leading-tight">
                Typing Test
              </h4>
              <p className="text-[11px] text-slate-500 group-hover:text-amber-100">
                Hindi & English Drill
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* 3. Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Explore by Exam Category</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select your goal to find specialized batches and mock tests
            </p>
          </div>
          <Link
            to="/courses"
            className="text-xs sm:text-sm font-bold text-[#6C63FF] hover:underline flex items-center gap-1"
          >
            All Courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/courses?category=${cat.slug}`}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-[#6C63FF] shadow-sm hover:shadow-lg transition-all group flex flex-col items-center text-center space-y-3"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"
                style={{ backgroundColor: cat.color || '#6C63FF' }}
              >
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-[#6C63FF] transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  {cat._count?.courses || 0} Courses
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Featured Courses */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#6C63FF]">
              POPULAR BATCHES
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Featured & Selection Courses
            </h2>
          </div>
          <Link
            to="/courses"
            className="text-xs sm:text-sm font-bold text-[#6C63FF] hover:underline flex items-center gap-1"
          >
            View All Batches <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featuredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* 5. Free Study Materials Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              FREE RESOURCES
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Hand-Written Notes & PYQ Guides
            </h2>
          </div>
          <Link
            to="/study-materials"
            className="text-xs sm:text-sm font-bold text-[#6C63FF] hover:underline flex items-center gap-1"
          >
            All Free Downloads <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {studyMaterials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {mat.fileType} • {mat.fileSize}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {mat.downloadsCount} downloads
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                  {mat.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {mat.description}
                </p>
              </div>

              <a
                href={mat.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => api.materials.incrementDownload(mat.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 hover:border-[#6C63FF] hover:bg-purple-50 text-slate-700 hover:text-[#6C63FF] text-xs font-bold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Student Reviews & Success Stories */}
      {reviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FF6584]">
              TESTIMONIALS
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              Loved by Thousands of Aspirants
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Hear from students who achieved high scores and government selection with Lo Samajh Lo
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    "{rev.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] text-white font-bold flex items-center justify-center text-xs">
                    {rev.user?.name.charAt(0) || 'S'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{rev.user?.name}</h4>
                    <p className="text-[10px] text-slate-400">{rev.course?.title || 'Verified Student'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#6C63FF] via-[#564ec9] to-[#FF6584] p-8 sm:p-12 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl shadow-[#6C63FF]/20">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-black">
              Ready to clear your government exam?
            </h3>
            <p className="text-sm text-purple-100 leading-relaxed">
              Start learning today with Lo Samajh Lo. Use coupon code <span className="font-bold underline">WELCOME10</span> for an instant 10% discount on any course.
            </p>
          </div>
          <Link
            to="/register"
            className="px-8 py-3.5 rounded-2xl bg-white text-[#6C63FF] hover:bg-purple-50 font-black text-sm shadow-xl transition-transform hover:scale-105"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
