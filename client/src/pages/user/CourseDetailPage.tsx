import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Star,
  ShoppingBag,
  Heart,
  CheckCircle2,
  PlayCircle,
  FileText,
  ShieldCheck,
  Award,
  ArrowRight,
  Share2,
  Radio,
  Calendar,
  MessageSquare,
  HelpCircle,
  BarChart2,
} from 'lucide-react';
import { api } from '../../services/api';
import { Course, CourseLesson } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import SyllabusAccordion from '../../components/course/SyllabusAccordion';
import { CustomVideoPlayer } from '../../components/video/CustomVideoPlayer';
import { formatImageUrl, handleImageError, DEFAULT_COURSE_THUMBNAIL } from '../../utils/image';
import { useLanguage } from '../../context/LanguageContext';

export const CourseDetailPage: React.FC = () => {
  const { isHindi, t } = useLanguage();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, isInCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { success, error: toastError } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'syllabus' | 'live' | 'overview' | 'reviews'>('syllabus');
  const [previewLesson, setPreviewLesson] = useState<CourseLesson | null>(null);

  // Review submission state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const data = await api.courses.getBySlug(slug);
        if (data.success && data.course) {
          setCourse(data.course);
          // Set first free preview lesson or first playable lesson if enrolled
          const freeLesson = data.course.lessons?.find(
            (l: CourseLesson) => l.isFreePreview || (data.course.isEnrolled && l.videoUrl)
          );
          if (freeLesson) setPreviewLesson(freeLesson);
        }
      } catch (err) {
        console.error('Error fetching course:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">Course Not Found</h2>
        <p className="text-sm text-slate-500">The requested course could not be located.</p>
        <Link to="/courses" className="inline-block px-5 py-2 rounded-xl bg-[#6C63FF] text-white font-bold text-xs">
          Browse Courses
        </Link>
      </div>
    );
  }

  const currentPrice = course.discountedPrice !== null && course.discountedPrice !== undefined
    ? course.discountedPrice
    : course.price;

  const inCart = isInCart(course.id) || course.isInCart;
  const wishlisted = isWishlisted(course.id) || course.isWishlisted;
  const isEnrolled = course.isEnrolled;
  const activeLiveClass = course.liveClasses?.find(
    (c) => c.status === 'LIVE' || c.status === 'STARTING'
  );
  const liveCount = course.liveClasses?.filter(
    (c) => c.status === 'LIVE' || c.status === 'STARTING'
  ).length || 0;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toastError('Please log in to submit a review.');
      return;
    }
    try {
      setSubmittingReview(true);
      await api.reviews.submit({
        courseId: course.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      success('Your review has been submitted for verification!');
      setReviewComment('');
    } catch (err: any) {
      toastError(err.message || 'Error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] pb-20">
      {/* Top Course Banner */}
      <div className="bg-slate-900 text-white pt-10 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <Link to="/courses" className="hover:text-white">Courses</Link>
                <span>/</span>
                <span className="text-[#FF6584]">{course.category?.name}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                {course.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                {course.shortDescription}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span>4.9</span>
                  <span className="text-slate-400 font-normal">({course.reviews?.length || 24} ratings)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-[#6C63FF]" />
                  <span>{course.duration || '60+ Hours'}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400">Faculty:</span>
                  {course.instructorName.split(',').map((inst, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-lg bg-white/10 text-white font-bold text-xs border border-white/10">
                      👨‍🏫 {inst.trim()}
                    </span>
                  ))}
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                  <span>Batch Validity: {course.validityDays} Days (~1 Year Access)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Video Preview, Tabs, Curriculum */}
          <div className="lg:col-span-8 space-y-6">
            {/* Live Streaming Alert Banner if any class is LIVE */}
            {activeLiveClass && (
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-white/20">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Radio className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white text-rose-600 uppercase tracking-wider animate-bounce">
                        ● LIVE NOW
                      </span>
                      <span className="text-xs text-rose-100 font-semibold">
                        Instructor: {activeLiveClass.instructor}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white mt-1">
                      {activeLiveClass.title}
                    </h3>
                  </div>
                </div>

                <Link
                  to={`/live/${activeLiveClass.slug || activeLiveClass.id}`}
                  className="px-5 py-2.5 rounded-xl bg-white text-rose-600 hover:bg-slate-100 font-black text-xs shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5"
                >
                  <Radio className="w-4 h-4 text-rose-600" />
                  <span>Join Live Classroom</span>
                </Link>
              </div>
            )}

            {/* Free Video Preview Box */}
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-[#6C63FF]" />
                  <span>{previewLesson ? previewLesson.title : 'Course Introduction Preview'}</span>
                </h3>
                {previewLesson?.isFreePreview && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    DEMO LESSON
                  </span>
                )}
              </div>

              {/* Video Player with Custom Anti-Download Player */}
              {previewLesson?.videoUrl ? (
                <CustomVideoPlayer
                  url={previewLesson.videoUrl}
                  title={previewLesson.title}
                  chapterTitle={previewLesson.chapterTitle}
                  thumbnail={formatImageUrl(previewLesson.thumbnail || course.thumbnail)}
                  studentPhone={user?.phone || user?.email || ''}
                />
              ) : (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow-inner flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-2">
                  <PlayCircle className="w-12 h-12 text-[#6C63FF]" />
                  <p className="text-sm font-semibold text-white">Interactive Lesson Preview</p>
                  <p className="text-xs text-slate-400">Click any demo or unlocked lecture below to watch</p>
                </div>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
              <button
                onClick={() => setActiveTab('syllabus')}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'syllabus'
                    ? 'border-[#6C63FF] text-[#6C63FF]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Curriculum ({course.lessons?.length || 0} Lessons)
              </button>
              <button
                onClick={() => setActiveTab('live')}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'live'
                    ? 'border-[#6C63FF] text-[#6C63FF]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Radio className={`w-4 h-4 ${liveCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
                <span>Live Classes</span>
                {liveCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {liveCount} LIVE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {course.liveClasses?.length || 0}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-[#6C63FF] text-[#6C63FF]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Detailed Syllabus & Overview
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'reviews'
                    ? 'border-[#6C63FF] text-[#6C63FF]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Student Reviews ({course.reviews?.length || 0})
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'syllabus' && (
              <div className="space-y-4">
                <SyllabusAccordion
                  lessons={course.lessons || []}
                  isEnrolled={Boolean(isEnrolled)}
                  onSelectLesson={(l) => setPreviewLesson(l)}
                  activeLessonId={previewLesson?.id}
                />
              </div>
            )}

            {activeTab === 'live' && (
              <div className="space-y-6">
                {/* Live Class Intro & Feature Card */}
                <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="relative z-10 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-[#FF6584] text-xs font-bold border border-rose-500/30">
                      <span className="w-2 h-2 rounded-full bg-[#FF6584] animate-ping" />
                      INTERACTIVE LIVE CLASSROOM (लाइव कक्षाएं)
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Real-Time Learning & Direct Teacher Interaction
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                      Attend high-definition interactive live classes with zero delay. Clear your doubts directly with educators in real-time, vote in instant polls, solve timed quizzes, and download session PDF notes.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                        <Radio className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-200">HD Low Latency</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                        <MessageSquare className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-200">Live Chat</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                        <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-200">Doubt Clearing</span>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2.5">
                        <BarChart2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-200">Live Polls & Quiz</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* List of Live Classes */}
                {course.liveClasses && course.liveClasses.length > 0 ? (
                  <div className="space-y-4">
                    {course.liveClasses.map((cls) => {
                      const isLive = cls.status === 'LIVE' || cls.status === 'STARTING';
                      const isCompleted = cls.status === 'COMPLETED' || cls.status === 'ENDED';
                      const isScheduled = cls.status === 'SCHEDULED';

                      const scheduleDate = new Date(cls.scheduledAt);
                      const formattedDate = scheduleDate.toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                      const formattedTime = scheduleDate.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={cls.id}
                          className={`p-5 sm:p-6 rounded-3xl bg-white border transition-all ${
                            isLive
                              ? 'border-rose-400 shadow-xl shadow-rose-500/10 ring-2 ring-rose-500/20'
                              : 'border-slate-200 shadow-sm hover:shadow-md'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isLive ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-200">
                                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                                    BROADCASTING LIVE NOW
                                  </span>
                                ) : isScheduled ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                    UPCOMING SESSION
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    COMPLETED
                                  </span>
                                )}

                                <span className="text-xs font-bold text-[#6C63FF] px-2.5 py-0.5 rounded-lg bg-purple-50">
                                  {cls.subject || 'Live Lecture'}
                                </span>
                              </div>

                              <h4 className="font-black text-base sm:text-lg text-slate-900 leading-snug">
                                {cls.title}
                              </h4>

                              {cls.description && (
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                                  {cls.description}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                                <span className="flex items-center gap-1 font-semibold text-slate-700">
                                  👨‍🏫 {cls.instructor}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  {formattedDate} at {formattedTime}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {cls.durationMinutes} Minutes
                                </span>
                              </div>
                            </div>

                            <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                              {isLive ? (
                                <Link
                                  to={`/live/${cls.slug || cls.id}`}
                                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-xs shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
                                >
                                  <Radio className="w-4 h-4 text-white animate-pulse" />
                                  <span>Join Live Classroom</span>
                                </Link>
                              ) : isScheduled ? (
                                <Link
                                  to={`/live/${cls.slug || cls.id}`}
                                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5"
                                >
                                  <span>Open Classroom</span>
                                  <ArrowRight className="w-4 h-4" />
                                </Link>
                              ) : (
                                <Link
                                  to={`/live/${cls.slug || cls.id}`}
                                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5"
                                >
                                  <span>Watch Recording</span>
                                  <PlayCircle className="w-4 h-4" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 text-[#6C63FF] mx-auto flex items-center justify-center shadow-inner">
                      <Radio className="w-7 h-7" />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h4 className="font-bold text-base text-slate-800">
                        Live Interactive Sessions Included
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Live interactive classes, doubt-solving sessions, and revision workshops are held regularly for this course batch. Upcoming classes will be scheduled here.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab('syllabus')}
                        className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                      >
                        <PlayCircle className="w-4 h-4 text-[#6C63FF]" />
                        <span>Browse Recorded Curriculum</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'overview' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 mb-3">Course Overview</h3>
                  <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {course.fullDescription}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-base text-slate-900 mb-3">What You Will Learn</h4>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Complete exam syllabus explained in crystal-clear Hindi</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Fast calculation tricks and shortcut formulas for Math & Reasoning</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Chapter-wise downloadable PDF notes & PYQ sheets</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>Full-length live test series with real-time scoring and rank</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-base text-slate-900 mb-3">
                    {isHindi ? 'अपने शिक्षकों से मिलें' : 'Meet Your Instructors'}
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {course.instructorName.split(',').map((name, i) => (
                      <div key={i} className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] text-white font-black text-base flex items-center justify-center shadow-sm">
                          {name.trim().charAt(0)}
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-slate-900">{name.trim()}</h5>
                          <p className="text-xs text-slate-500">{course.instructorBio || 'Senior Educator, Lo Samajh Lo'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="font-bold text-lg text-slate-900">Student Reviews</h3>

                {course.reviews && course.reviews.length > 0 ? (
                  <div className="space-y-4 divide-y divide-slate-100">
                    {course.reviews.map((rev) => (
                      <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6C63FF] font-bold text-xs flex items-center justify-center">
                              {rev.user?.name.charAt(0) || 'S'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{rev.user?.name}</p>
                              <div className="flex items-center gap-0.5 text-amber-400">
                                {[...Array(rev.rating)].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-current" />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400">Verified Aspirant</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 italic">"{rev.comment}"</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No reviews yet. Be the first to review!</p>
                )}

                {/* Review submission form */}
                {isEnrolled && (
                  <form onSubmit={handleReviewSubmit} className="pt-6 border-t border-slate-100 space-y-3">
                    <h4 className="font-bold text-sm text-slate-800">Leave Your Review</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">Your Rating:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setReviewRating(num)}
                            className={`p-1 ${reviewRating >= num ? 'text-amber-400' : 'text-slate-300'}`}
                          >
                            <Star className="w-5 h-5 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your learning experience..."
                      className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#6C63FF] resize-none h-24"
                      required
                    />
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-5 py-2 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs shadow"
                    >
                      {submittingReview ? 'Submitting...' : 'Post Review'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Right Sticky Purchase Sidebar */}
          <div className="lg:col-span-4 sticky top-24 space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-5">
              {/* Thumbnail */}
              <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100 relative">
                <img
                  src={formatImageUrl(course.thumbnail)}
                  alt={course.title}
                  onError={handleImageError(DEFAULT_COURSE_THUMBNAIL)}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Price */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Course Fee
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  {currentPrice === 0 ? (
                    <span className="text-3xl font-black text-emerald-600">FREE</span>
                  ) : (
                    <>
                      <span className="text-3xl font-black text-slate-900">₹{currentPrice}</span>
                      {course.discountedPrice && course.price > course.discountedPrice && (
                        <span className="text-sm text-slate-400 line-through">₹{course.price}</span>
                      )}
                    </>
                  )}
                </div>
                {course.discountedPrice && course.price > course.discountedPrice && (
                  <p className="text-xs font-bold text-[#FF6584] mt-1">
                    Save ₹{course.price - course.discountedPrice} (
                    {Math.round(((course.price - course.discountedPrice) / course.price) * 100)}% Discount)
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                {isEnrolled ? (
                  <Link
                    to={`/courses/${course.slug}/learn`}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-all"
                  >
                    <PlayCircle className="w-5 h-5" />
                    <span>Start Learning (Enrolled)</span>
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (!inCart) addToCart(course.id);
                        navigate('/cart');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8f88ff] hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-[#6C63FF]/30 transition-all hover:scale-[1.01]"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Enroll & Buy Now</span>
                    </button>

                    {!inCart ? (
                      <button
                        onClick={() => addToCart(course.id)}
                        className="w-full py-3 rounded-xl border-2 border-slate-200 hover:border-[#6C63FF] text-slate-700 hover:text-[#6C63FF] font-bold text-xs transition-colors"
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/cart')}
                        className="w-full py-3 rounded-xl bg-purple-100 text-[#6C63FF] font-bold text-xs"
                      >
                        View in Cart
                      </button>
                    )}
                  </>
                )}

                <button
                  onClick={() => toggleWishlist(course.id)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                    wishlisted
                      ? 'bg-rose-50 text-rose-600 border border-rose-200'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
                  <span>{wishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
                </button>
              </div>

              {/* Course Includes Checklist */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  This Batch Includes:
                </span>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-rose-500 flex-shrink-0 animate-pulse" />
                    <span className="font-bold text-slate-800">Live Interactive Classes & Doubt Solving</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6C63FF]" />
                    <span>{course.duration || '60+ Hours'} on-demand videos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6C63FF]" />
                    <span>Chapter-wise downloadable PDF notes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6C63FF]" />
                    <span>Live mock tests with All India ranking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6C63FF]" />
                    <span>Full {course.validityDays} days continuous access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6C63FF]" />
                    <span>Access on Mobile & Laptop</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
