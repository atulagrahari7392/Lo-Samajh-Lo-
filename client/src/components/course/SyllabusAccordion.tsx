import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PlayCircle, FileText, Lock, CheckCircle2 } from 'lucide-react';
import { CourseLesson } from '../../types';

interface SyllabusAccordionProps {
  lessons: CourseLesson[];
  isEnrolled: boolean;
  onSelectLesson?: (lesson: CourseLesson) => void;
  activeLessonId?: string;
}

export const SyllabusAccordion: React.FC<SyllabusAccordionProps> = ({
  lessons,
  isEnrolled,
  onSelectLesson,
  activeLessonId,
}) => {
  // Group lessons by chapterTitle
  const chapters: Record<string, CourseLesson[]> = {};
  lessons.forEach((l) => {
    const ch = l.chapterTitle || 'General Chapter';
    if (!chapters[ch]) chapters[ch] = [];
    chapters[ch].push(l);
  });

  const chapterNames = Object.keys(chapters);
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({
    [chapterNames[0] || '']: true,
  });

  const toggleChapter = (name: string) => {
    setOpenChapters((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="space-y-3">
      {chapterNames.map((chapterName, idx) => {
        const chapterLessons = chapters[chapterName];
        const isOpen = openChapters[chapterName];
        const totalDuration = chapterLessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);

        return (
          <div
            key={chapterName}
            className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm"
          >
            {/* Chapter Header */}
            <button
              onClick={() => toggleChapter(chapterName)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-50/70 hover:bg-slate-100/70 transition-colors"
            >
              <div>
                <span className="text-xs font-bold text-[#6C63FF] uppercase tracking-wider">
                  Chapter {idx + 1}
                </span>
                <h4 className="font-bold text-slate-800 text-sm sm:text-base mt-0.5">
                  {chapterName}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {chapterLessons.length} Lessons • {totalDuration} Mins
                </p>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {/* Lessons List */}
            {isOpen && (
              <div className="divide-y divide-slate-100">
                {chapterLessons.map((lesson) => {
                  const canAccess = isEnrolled || lesson.isFreePreview;
                  const isActive = activeLessonId === lesson.id;

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        if (canAccess && onSelectLesson) {
                          onSelectLesson(lesson);
                        }
                      }}
                      className={`flex items-center justify-between p-3.5 sm:p-4 text-xs sm:text-sm transition-colors ${
                        canAccess ? 'cursor-pointer hover:bg-purple-50/50' : 'cursor-not-allowed opacity-75'
                      } ${isActive ? 'bg-purple-50 font-semibold text-[#6C63FF]' : 'text-slate-700'}`}
                    >
                      <div className="flex items-center gap-3">
                        {lesson.isFreePreview || isEnrolled ? (
                          <PlayCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-[#6C63FF]' : 'text-emerald-500'}`} />
                        ) : (
                          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                        )}
                        <div>
                          <p className="line-clamp-1">{lesson.title}</p>
                          <span className="text-[11px] text-slate-400">
                            {lesson.durationMinutes} minutes
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {lesson.isFreePreview && !isEnrolled && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            FREE PREVIEW
                          </span>
                        )}
                        {lesson.pdfUrl && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <FileText className="w-3.5 h-3.5" /> PDF
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SyllabusAccordion;
