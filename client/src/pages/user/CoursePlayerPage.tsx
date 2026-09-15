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
  HelpCircle,
  ExternalLink,
  Radio,
  Clock,
} from 'lucide-react';
import { api } from '../../services/api';
import { Course, CourseLesson, ClassResource } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { CustomVideoPlayer } from '../../components/video/CustomVideoPlayer';
import { formatImageUrl } from '../../utils/image';
import { PdfReaderModal } from '../../components/materials/PdfReaderModal';

export const CoursePlayerPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // In-app Document Viewer
  const [selectedPdfResource, setSelectedPdfResource] = useState<any | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

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
  const activeLiveSession = course.liveClasses?.find(
    (c) => c.status === 'LIVE' || c.status === 'STARTING'
  );
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
          {/* Active Live Session Alert Banner */}
          {activeLiveSession && (
            <div className="bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 rounded-3xl p-4 sm:p-5 text-white flex flex-wrap items-center justify-between gap-4 shadow-xl border border-white/20">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Radio className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white text-rose-600 uppercase tracking-wider animate-bounce">
                      ● LIVE STREAMING NOW
                    </span>
                    <span className="text-xs text-rose-100 font-semibold">
                      Faculty: {activeLiveSession.instructor}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-1">
                    {activeLiveSession.title}
                  </h3>
                </div>
              </div>

              <Link
                to={`/live/${activeLiveSession.slug || activeLiveSession.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl bg-white text-rose-600 hover:bg-slate-100 font-black text-xs shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
                <span>Join Live Classroom</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Custom Video Player with Resolution, Speed & Anti-Download Protection */}
          {activeLesson ? (
            <CustomVideoPlayer
              url={activeLesson.videoUrl || ''}
              title={activeLesson.title}
              chapterTitle={activeLesson.chapterTitle}
              thumbnail={formatImageUrl(activeLesson.thumbnail || course?.thumbnail)}
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

          {/* Class Study Resources & Related Quiz Action Bar */}
          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#6C63FF]" />
                Class Learning Resources & Quiz
              </span>
              {(activeLesson?.quizId || activeLesson?.quiz) && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Quiz Available
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Class Notes */}
              {activeLesson?.resources?.filter((r) => r.resourceType === 'NOTES').map((notesRes) => (
                <button
                  key={notesRes.id}
                  onClick={() => {
                    setSelectedPdfResource({
                      id: notesRes.id,
                      title: `${activeLesson.title} — ${notesRes.title || 'Class Notes'}`,
                      fileUrl: notesRes.fileUrl,
                      materialType: 'CLASS_NOTES',
                      subject: activeLesson.chapterTitle || 'General',
                      fileSize: notesRes.fileSize || 'PDF',
                    });
                    setIsPdfModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Class Notes (PDF)</span>
                </button>
              ))}

              {/* Practice Sheet */}
              {activeLesson?.resources?.filter((r) => r.resourceType === 'PRACTICE_SHEET').map((psRes) => (
                <button
                  key={psRes.id}
                  onClick={() => {
                    setSelectedPdfResource({
                      id: psRes.id,
                      title: `${activeLesson.title} — ${psRes.title || 'Practice Sheet'}`,
                      fileUrl: psRes.fileUrl,
                      materialType: 'PRACTICE_SET',
                      subject: activeLesson.chapterTitle || 'General',
                      fileSize: psRes.fileSize || 'PDF',
                    });
                    setIsPdfModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Practice Sheet (PDF)</span>
                </button>
              ))}

              {/* Other Attached Resources */}
              {activeLesson?.resources?.filter((r) => r.resourceType !== 'NOTES' && r.resourceType !== 'PRACTICE_SHEET').map((otherRes) => (
                <button
                  key={otherRes.id}
                  onClick={() => {
                    setSelectedPdfResource({
                      id: otherRes.id,
                      title: `${activeLesson.title} — ${otherRes.title}`,
                      fileUrl: otherRes.fileUrl,
                      materialType: otherRes.resourceType,
                      subject: activeLesson.chapterTitle || 'General',
                      fileSize: otherRes.fileSize || 'Document',
                    });
                    setIsPdfModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>{otherRes.title}</span>
                </button>
              ))}

              {/* Fallback for legacy single pdfUrl if resources list is empty */}
              {(!activeLesson?.resources || activeLesson.resources.length === 0) && activeLesson?.pdfUrl && (
                <button
                  onClick={() => {
                    setSelectedPdfResource({
                      id: activeLesson.id,
                      title: `${activeLesson.title} — Hand-Written Notes`,
                      fileUrl: activeLesson.pdfUrl!,
                      materialType: 'CLASS_NOTES',
                      subject: activeLesson.chapterTitle || 'General',
                      fileSize: 'PDF',
                    });
                    setIsPdfModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Class Notes (PDF)</span>
                </button>
              )}

              {/* Take Quiz Button */}
              {(activeLesson?.quizId || activeLesson?.quiz) && (
                <Link
                  to={`/test-series/${activeLesson.quizId || activeLesson.quiz?.id}/attempt`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black shadow-md shadow-amber-500/20 transition-all ml-auto hover:scale-105 active:scale-95"
                >
                  <HelpCircle className="w-4 h-4 text-white" />
                  <span>Take Quiz</span>
                </Link>
              )}

              {/* Empty notice if no study resources attached */}
              {(!activeLesson?.resources || activeLesson.resources.length === 0) && !activeLesson?.pdfUrl && !activeLesson?.quizId && !activeLesson?.quiz && (
                <span className="text-xs text-slate-400 italic">No notes or quiz attached for this class.</span>
              )}
            </div>
          </div>

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

        {/* Right Sidebar: Lessons List & Live Sessions */}
        <aside className="w-full lg:w-80 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col">
          {/* Live Sessions Header Section */}
          {course.liveClasses && course.liveClasses.length > 0 && (
            <div className="border-b border-slate-800 bg-slate-900/80 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  Live Sessions ({course.liveClasses.length})
                </span>
                {activeLiveSession && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500 text-white animate-pulse">
                    LIVE NOW
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {course.liveClasses.map((cls) => {
                  const isLive = cls.status === 'LIVE' || cls.status === 'STARTING';
                  return (
                    <Link
                      key={cls.id}
                      to={`/live/${cls.slug || cls.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block p-2.5 rounded-xl border text-xs transition-all ${
                        isLive
                          ? 'bg-rose-500/20 border-rose-500/50 text-white hover:bg-rose-500/30'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider ${
                            isLive ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {isLive ? '🔴 LIVE STREAM' : '📅 UPCOMING'}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(cls.scheduledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="font-bold line-clamp-1 text-white">{cls.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        👨‍🏫 {cls.instructor}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

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
                    {/* Badges for study resources and quiz */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {lesson.isRecordedClass && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-300 uppercase tracking-wider">
                          Recorded
                        </span>
                      )}
                      {((lesson.resources && lesson.resources.length > 0) || lesson.pdfUrl) && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 flex items-center gap-0.5">
                          <FileText className="w-2.5 h-2.5" /> PDF
                        </span>
                      )}
                      {(lesson.quizId || lesson.quiz) && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 flex items-center gap-0.5">
                          <HelpCircle className="w-2.5 h-2.5" /> Quiz
                        </span>
                      )}
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
