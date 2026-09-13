import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PlayCircle,
  FileText,
  CheckCircle2,
  ChevronLeft,
  BookOpen,
  Download,
  AlertCircle,
  Shield,
  Lock,
} from 'lucide-react';
import { api } from '../../services/api';
import { Course, CourseLesson } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CustomVideoPlayer } from '../../components/video/CustomVideoPlayer';

export const CoursePlayerPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        const data = await api.courses.getLearningPlayer(slug);
        if (data.success && data.course) {
          setCourse(data.course);
          if (data.course.lessons && data.course.lessons.length > 0) {
            setActiveLesson(data.course.lessons[0]);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Access denied. You may need to enroll in this course first.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlayerData();
  }, [slug]);

  const toggleComplete = (lessonId: string) => {
    setCompletedLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Loading Student Learning Portal...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-lg text-slate-800">Enrollment Required</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error || 'You do not have active enrollment access to this course.'}
        </p>
        <div className="pt-2">
          <Link
            to={`/courses/${slug}`}
            className="inline-block px-5 py-2.5 rounded-xl bg-[#6C63FF] text-white font-bold text-xs shadow"
          >
            Go to Course Enrollment
          </Link>
        </div>
      </div>
    );
  }

  const lessons = course.lessons || [];
  const completedCount = Object.values(completedLessons).filter(Boolean).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Top Learning Bar */}
      <header className="h-16 bg-slate-950 px-4 sm:px-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to={`/courses/${course.slug}`}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Back to Course Details"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="overflow-hidden">
            <h2 className="font-bold text-sm sm:text-base text-white truncate max-w-md">
              {course.title}
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              Lesson: {activeLesson?.title}
            </p>
          </div>
        </div>

        {/* Course Progress */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#6C63FF] to-emerald-400 h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-emerald-400">{progressPercent}% Completed</span>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Video Player & Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Custom Video Player with Resolution, Speed & Anti-Download Protection */}
          {activeLesson ? (
            <CustomVideoPlayer
              url={activeLesson.videoUrl || ''}
              title={activeLesson.title}
              chapterTitle={activeLesson.chapterTitle}
              thumbnail={activeLesson.thumbnail}
              studentPhone={user?.phone || user?.email || ''}
              onEnded={() => {
                if (activeLesson) {
                  setCompletedLessons((prev) => ({ ...prev, [activeLesson.id]: true }));
                }
              }}
            />
          ) : (
            <div className="aspect-video rounded-3xl bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-500">
              <PlayCircle className="w-16 h-16 text-[#6C63FF] mb-2" />
              <p className="text-sm font-semibold text-white">Select a lecture to begin</p>
            </div>
          )}

          {/* Lesson Header & Mark Complete */}
          <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#6C63FF] uppercase tracking-wider">
                {activeLesson?.chapterTitle}
              </span>
              <h1 className="text-xl font-black text-white mt-0.5">{activeLesson?.title}</h1>
              <span className="text-xs text-slate-400">Duration: {activeLesson?.durationMinutes} Mins</span>
            </div>

            <button
              onClick={() => activeLesson && toggleComplete(activeLesson.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeLesson && completedLessons[activeLesson.id]
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{activeLesson && completedLessons[activeLesson.id] ? 'Completed' : 'Mark as Complete'}</span>
            </button>
          </div>

          {/* Downloadable PDF Resource */}
          {activeLesson?.pdfUrl && (
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-[#6C63FF]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Lesson Hand-Written Notes (PDF)</h4>
                  <p className="text-xs text-slate-400">Download and revise offline anytime</p>
                </div>
              </div>
              <a
                href={activeLesson.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6C63FF] text-white text-xs font-bold shadow hover:bg-[#564ec9]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Notes</span>
              </a>
            </div>
          )}

          {/* Lesson Content / Notes */}
          {activeLesson?.content && (
            <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/60 space-y-3">
              <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider">Concept Summary</h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {activeLesson.content}
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar: Lessons List */}
        <aside className="w-full lg:w-80 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800 font-bold text-xs uppercase tracking-wider text-slate-400">
            Course Content ({lessons.length} Lessons)
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
            {lessons.map((lesson, idx) => {
              const isActive = activeLesson?.id === lesson.id;
              const isDone = completedLessons[lesson.id];

              return (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors ${
                    isActive
                      ? 'bg-[#6C63FF]/20 border-l-4 border-[#6C63FF]'
                      : 'hover:bg-slate-900'
                  }`}
                >
                  {lesson.thumbnail ? (
                    <img
                      src={lesson.thumbnail}
                      alt={lesson.title}
                      className="w-12 h-8 rounded-lg object-cover flex-shrink-0 border border-slate-700 mt-0.5"
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-500 mt-0.5 w-5 text-right">{idx + 1}.</span>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {lesson.isRecordedClass && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-500/30 text-purple-300 uppercase tracking-wider">
                          Recorded
                        </span>
                      )}
                      <h4
                        className={`text-xs font-bold line-clamp-2 ${
                          isActive ? 'text-[#6C63FF]' : 'text-slate-200'
                        }`}
                      >
                        {lesson.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {lesson.durationMinutes} mins • {lesson.chapterTitle}
                    </span>
                  </div>
                  {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayerPage;
