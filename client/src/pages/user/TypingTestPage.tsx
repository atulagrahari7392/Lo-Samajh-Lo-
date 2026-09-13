import React, { useState, useEffect, useMemo } from 'react';
import {
  Keyboard,
  Award,
  Clock,
  History,
  CheckCircle2,
  Zap,
  ArrowRight,
  BookOpen,
  Target,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Flame,
  Play,
  Filter,
  RefreshCw,
  BarChart2,
  Star,
  ChevronRight,
  AlertCircle,
  Compass,
  FileText,
  RotateCcw,
  Check,
  Building,
  GraduationCap,
  Layers,
  Percent,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  TypingTest,
  TypingExam,
  TypingAttempt,
  TypingCourse,
  TypingLesson,
  TypingUserProgress,
  TypingDailyChallenge,
} from '../../types';
import TypingEngine from '../../components/typing/TypingEngine';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

type TabType = 'dashboard' | 'exams' | 'learn' | 'practice' | 'placement' | 'challenge' | 'history';

export const TypingTestPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(true);

  // Active typing test in engine
  const [activeTest, setActiveTest] = useState<TypingTest | null>(null);
  const [activeExam, setActiveExam] = useState<TypingExam | null>(null);
  const [activeMode, setActiveMode] = useState<string>('PRACTICE');

  // Data states
  const [exams, setExams] = useState<TypingExam[]>([]);
  const [courses, setCourses] = useState<TypingCourse[]>([]);
  const [tests, setTests] = useState<TypingTest[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<TypingDailyChallenge | null>(null);
  const [userProgress, setUserProgress] = useState<TypingUserProgress | null>(null);
  const [history, setHistory] = useState<TypingAttempt[]>([]);

  // Filter states
  const [examCategoryFilter, setExamCategoryFilter] = useState<string>('ALL');
  const [learnTrackLang, setLearnTrackLang] = useState<'ENGLISH' | 'HINDI'>('ENGLISH');
  const [practiceLang, setPracticeLang] = useState<string>('ALL');
  const [practiceDiff, setPracticeDiff] = useState<string>('ALL');
  const [practiceDuration, setPracticeDuration] = useState<number>(60);

  // Selected Exam for details modal
  const [selectedExamDetail, setSelectedExamDetail] = useState<TypingExam | null>(null);

  // Goal update state
  const [targetWpmInput, setTargetWpmInput] = useState<number>(35);
  const [targetMinsInput, setTargetMinsInput] = useState<number>(20);
  const [savingGoal, setSavingGoal] = useState(false);

  // Fetch all initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [examsRes, coursesRes, testsRes, challengeRes] = await Promise.all([
        api.typing.getExams().catch(() => ({ success: false, exams: [] })),
        api.typing.getCourses().catch(() => ({ success: false, courses: [] })),
        api.typing.getAll({ limit: 50 }).catch(() => ({ success: false, tests: [] })),
        api.typing.getDailyChallenge().catch(() => ({ success: false, challenge: null })),
      ]);

      if (examsRes.success && examsRes.exams) setExams(examsRes.exams);
      if (coursesRes.success && coursesRes.courses) setCourses(coursesRes.courses);
      if (testsRes.success && testsRes.tests) setTests(testsRes.tests);
      if (challengeRes.success && challengeRes.challenge) setDailyChallenge(challengeRes.challenge);

      if (user) {
        const [dashRes, histRes] = await Promise.all([
          api.typing.getUserDashboard().catch(() => ({ success: false })),
          api.typing.getMyHistory(20).catch(() => ({ success: false, attempts: [] })),
        ]);
        if (dashRes.success && (dashRes.stats || dashRes.progress)) {
          const p = dashRes.stats || dashRes.progress;
          setUserProgress(p);
          if (p.targetSpeed || p.targetWpm) setTargetWpmInput(p.targetSpeed || p.targetWpm);
          if (p.dailyGoalMinutes || p.dailyTargetMins) setTargetMinsInput(p.dailyGoalMinutes || p.dailyTargetMins);
        }
        if (histRes.success && histRes.attempts) {
          setHistory(histRes.attempts);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Start a specific test in the engine
  const startTest = (test: TypingTest, exam: TypingExam | null = null, mode = 'PRACTICE') => {
    setActiveTest(test);
    setActiveExam(exam);
    setActiveMode(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start 1-Minute Placement Test
  const startPlacementTest = (lang: 'ENGLISH' | 'HINDI' = 'ENGLISH') => {
    const placementTest: TypingTest = {
      id: `placement-${lang.toLowerCase()}`,
      title: `${lang === 'ENGLISH' ? 'English' : 'Hindi'} 1-Minute Baseline Placement Test`,
      slug: `placement-test-${lang.toLowerCase()}`,
      language: lang,
      difficulty: 'MEDIUM',
      category: 'PLACEMENT',
      durationSeconds: 60,
      passageText:
        lang === 'ENGLISH'
          ? 'Consistency and precision are the true foundations of touch typing mastery. When preparing for competitive government examinations such as SSC, Railway NTPC, or High Court clerk positions, candidates must develop instinctive muscle memory rather than glancing down at the keyboard. Maintain an upright posture, keep your wrists slightly elevated above the desk, and strike each key with a light, rhythmic touch. Speed naturally follows accuracy when you practice deliberately every day.'
          : 'सटीकता और निरंतरता ही कंप्यूटर टाइपिंग दक्षता की वास्तविक नींव हैं। जब आप सरकारी प्रतियोगी परीक्षाओं जैसे एसएससी, रेलवे अथवा उच्च न्यायालय की लिपिक संवर्ग परीक्षाओं की तैयारी करते हैं, तब उंगलियों का सही अभ्यास सबसे महत्वपूर्ण सिद्ध होता है।',
      wordCount: lang === 'ENGLISH' ? 76 : 38,
      characterCount: lang === 'ENGLISH' ? 512 : 240,
      keyboardLayout: lang === 'ENGLISH' ? 'QWERTY' : 'MANGAL',
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
    };
    startTest(placementTest, null, 'PLACEMENT');
  };

  // Start Daily Challenge
  const startChallenge = () => {
    if (!dailyChallenge) {
      toastError("Today's challenge is not available yet.");
      return;
    }
    const challengeTest: TypingTest = {
      id: dailyChallenge.id,
      title: dailyChallenge.title,
      slug: `challenge-${dailyChallenge.id}`,
      language: dailyChallenge.language || 'ENGLISH',
      difficulty: 'MEDIUM',
      category: 'CHALLENGE',
      durationSeconds: dailyChallenge.durationSeconds || 300,
      passageText: dailyChallenge.passageText,
      wordCount: dailyChallenge.passageText.trim().split(/\s+/).length,
      characterCount: dailyChallenge.passageText.length,
      keyboardLayout: 'QWERTY',
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
    };
    startTest(challengeTest, null, 'CHALLENGE');
  };

  // Start a course lesson
  const startLesson = (lesson: TypingLesson) => {
    const text = lesson.practiceText || lesson.content || 'Practice touch typing keys.';
    const lessonTest: TypingTest = {
      id: lesson.id,
      title: lesson.title,
      slug: `lesson-${lesson.id}`,
      language: activeCourse?.language || 'ENGLISH',
      difficulty: 'EASY',
      category: 'LESSON',
      durationSeconds: lesson.durationSeconds || 120,
      passageText: text,
      wordCount: text.trim().split(/\s+/).length,
      characterCount: text.length,
      keyboardLayout: activeCourse?.keyboardLayout || 'QWERTY',
      status: 'PUBLISHED',
      createdAt: new Date().toISOString(),
    };
    startTest(lessonTest, null, 'LESSON');
  };

  // Handle saving goals
  const handleSaveGoal = async () => {
    if (!user) {
      toastError('Please sign in to set personal typing goals.');
      return;
    }
    setSavingGoal(true);
    try {
      const res = await api.typing.updateGoal({
        targetWpm: targetWpmInput,
        dailyTargetMins: targetMinsInput,
      });
      if (res.success) {
        success('Personal typing goal updated successfully!');
        setUserProgress(res.progress);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save goal.');
    } finally {
      setSavingGoal(false);
    }
  };

  // Filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      if (examCategoryFilter === 'ALL') return true;
      return e.category === examCategoryFilter;
    });
  }, [exams, examCategoryFilter]);

  // Filtered practice tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      if (practiceLang !== 'ALL' && t.language !== practiceLang) return false;
      if (practiceDiff !== 'ALL' && t.difficulty !== practiceDiff) return false;
      return true;
    });
  }, [tests, practiceLang, practiceDiff]);

  // Selected course for learn tab
  const activeCourse = useMemo(() => {
    return courses.find((c) => c.language === learnTrackLang) || courses[0] || null;
  }, [courses, learnTrackLang]);

  // If active test is running in engine, show engine with top bar
  if (activeTest) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Top Engine Navigation Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActiveTest(null);
                  setActiveExam(null);
                  fetchData();
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                <span>Exit to Hub</span>
              </button>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#6C63FF] bg-purple-50 px-2 py-0.5 rounded border border-purple-200 mr-2">
                  {activeMode}
                </span>
                <span className="font-bold text-slate-800 text-sm">{activeTest.title}</span>
              </div>
            </div>

            {activeExam && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Target: {activeExam.targetSpeed} WPM | Min Accuracy: {activeExam.minAccuracy}%</span>
              </div>
            )}
          </div>

          {/* Typing Engine */}
          <TypingEngine
            key={activeTest.id}
            test={{
              ...activeTest,
              durationSeconds: activeTest.durationSeconds || practiceDuration,
            }}
            exam={activeExam}
            mode={activeMode}
            onFinished={() => {
              fetchData();
            }}
            onGoToDashboard={() => {
              setActiveTest(null);
              setActiveExam(null);
              setActiveTab('dashboard');
              fetchData();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Banner & Hub Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-[#6C63FF] text-xs font-extrabold border border-purple-200 mb-2">
                <Keyboard className="w-4 h-4" />
                <span>OFFICIAL GOVT EXAM TYPING HUB & LEARNING ECOSYSTEM</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Typing Hub & Assessment Engine
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-3xl">
                Simulate SSC, Railway NTPC, High Court, and UP Police official typing tests. Learn touch typing from scratch in English and Hindi (Mangal & Krutidev).
              </p>
            </div>

            {/* Placement Test Quick CTA */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => startPlacementTest('ENGLISH')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:from-indigo-600 hover:to-indigo-700 flex items-center gap-2 transition-all"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>1-Min Placement Test</span>
              </button>
            </div>
          </div>

          {/* Navigation Hub Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto mt-6 pt-2 border-t border-slate-100 scrollbar-none text-xs font-bold text-slate-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-[#1a1a2e] text-white shadow-sm'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('exams')}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'exams'
                  ? 'bg-[#1a1a2e] text-white shadow-sm'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Building className="w-4 h-4 text-amber-400" />
              <span>Govt Exams ({exams.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('learn')}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'learn'
                  ? 'bg-[#1a1a2e] text-white shadow-sm'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <span>Learn Typing (12 Modules)</span>
            </button>

            <button
              onClick={() => setActiveTab('practice')}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'practice'
                  ? 'bg-[#1a1a2e] text-white shadow-sm'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Practice Engine</span>
            </button>

            <button
              onClick={() => setActiveTab('placement')}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'placement'
                  ? 'bg-[#1a1a2e] text-white shadow-sm'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Placement Test</span>
            </button>

            <button
              onClick={() => setActiveTab('challenge')}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'challenge'
                  ? 'bg-[#1a1a2e] text-white shadow-sm'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Daily Challenge</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-[#1a1a2e] text-white shadow-sm'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4 text-blue-400" />
              <span>My Progress ({history.length})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW / DASHBOARD */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Two Primary Pathways (Prominent Cards as requested in spec) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pathway 1: Govt Exam Prep */}
              <div
                onClick={() => setActiveTab('exams')}
                className="group relative bg-gradient-to-br from-[#1a1a2e] to-[#252542] rounded-3xl p-7 text-white cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-indigo-950/20 transition-all border border-slate-800 flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C63FF]/10 rounded-full blur-3xl group-hover:scale-125 transition-transform" />
                <div className="relative space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                    <Building className="w-3.5 h-3.5" />
                    <span>OFFICIAL MOCK EXAMS</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight group-hover:text-amber-300 transition-colors">
                      Prepare for Government Exams
                    </h3>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                      Simulate official typing environments for SSC CHSL, RRB NTPC, Allahabad High Court, UP Police, and UPSSSC. Practice with authentic passages, official speed criteria, and real backspace restrictions.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-[11px] font-semibold bg-white/10 px-2.5 py-1 rounded-lg">
                      SSC CHSL (35 WPM)
                    </span>
                    <span className="text-[11px] font-semibold bg-white/10 px-2.5 py-1 rounded-lg">
                      RRB NTPC (30 WPM)
                    </span>
                    <span className="text-[11px] font-semibold bg-white/10 px-2.5 py-1 rounded-lg">
                      High Court RO/ARO
                    </span>
                    <span className="text-[11px] font-semibold bg-white/10 px-2.5 py-1 rounded-lg">
                      UP Police Inscript
                    </span>
                  </div>
                </div>

                <div className="relative pt-6 flex items-center justify-between text-xs font-bold text-amber-300">
                  <span>Explore 5 Exam Presets</span>
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-slate-900 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Pathway 2: Learn Typing from Zero */}
              <div
                onClick={() => setActiveTab('learn')}
                className="group relative bg-gradient-to-br from-[#6C63FF] to-indigo-700 rounded-3xl p-7 text-white cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-indigo-500/20 transition-all border border-indigo-500 flex flex-col justify-between overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform" />
                <div className="relative space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold border border-white/30">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>TOUCH TYPING ACADEMY</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight group-hover:text-white transition-colors">
                      Learn Typing from Zero
                    </h3>
                    <p className="text-sm text-indigo-100 mt-2 leading-relaxed">
                      Master touch typing step-by-step. 12 structured English modules from Home Row to High-Speed Drills, plus Hindi Mangal and Krutidev keyboard layout mastery with on-screen visual finger guidance.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-[11px] font-semibold bg-black/20 px-2.5 py-1 rounded-lg">
                      Home Row Basics
                    </span>
                    <span className="text-[11px] font-semibold bg-black/20 px-2.5 py-1 rounded-lg">
                      Top & Bottom Rows
                    </span>
                    <span className="text-[11px] font-semibold bg-black/20 px-2.5 py-1 rounded-lg">
                      Hindi Mangal Remington
                    </span>
                    <span className="text-[11px] font-semibold bg-black/20 px-2.5 py-1 rounded-lg">
                      Krutidev 010
                    </span>
                  </div>
                </div>

                <div className="relative pt-6 flex items-center justify-between text-xs font-bold text-white">
                  <span>Start Module 1 Now</span>
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-[#6C63FF] transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase">English Net WPM</span>
                  <Zap className="w-4 h-4 text-[#6C63FF]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">
                    {userProgress?.english?.bestSpeed || userProgress?.bestWpmEng || 0}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Avg: {userProgress?.english?.avgSpeed || userProgress?.avgWpmEng || 0}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase">Hindi Net WPM</span>
                  <Keyboard className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">
                    {userProgress?.hindi?.bestSpeed || userProgress?.bestWpmHindi || 0}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Avg: {userProgress?.hindi?.avgSpeed || userProgress?.avgWpmHindi || 0}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase">Avg Accuracy</span>
                  <Target className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">
                    {userProgress?.english?.accuracy || userProgress?.avgAccuracy || 95}%
                  </span>
                  <span className="text-xs font-semibold text-emerald-600">Goal: 95%</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase">Daily Streak</span>
                  <Flame className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">
                    {userProgress?.streakDays || userProgress?.currentStreak || 1}
                  </span>
                  <span className="text-xs font-semibold text-amber-600">Days Active</span>
                </div>
              </div>
            </div>

            {/* Quick Practice & Placement Prompt */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Placement Test Prompt Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase mb-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Level Assessment</span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900">
                    Find Your Benchmark Level
                  </h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Take our standard 60-second placement assessment. We will instantly measure your Net WPM, identify error tendencies, and place you in the right curriculum module.
                  </p>
                </div>
                <div className="pt-5 flex gap-2">
                  <button
                    onClick={() => startPlacementTest('ENGLISH')}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>English (60s)</span>
                  </button>
                  <button
                    onClick={() => startPlacementTest('HINDI')}
                    className="flex-1 py-2.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-slate-800 font-black text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Hindi (60s)</span>
                  </button>
                </div>
              </div>

              {/* Daily Challenge Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-rose-500 flex items-center gap-1.5">
                      <Flame className="w-4 h-4" /> Today's Challenge
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {dailyChallenge?.language || 'ENGLISH'}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 line-clamp-1">
                    {dailyChallenge?.title || 'Daily High Speed Paragraph'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {dailyChallenge?.passageText ||
                      'Compete with fellow aspirants today. Achieve top accuracy and maintain your streak!'}
                  </p>
                </div>

                <div className="pt-5 flex items-center justify-between border-t border-slate-100 mt-4">
                  <span className="text-xs text-slate-500 font-semibold">
                    {dailyChallenge?.participantsCount || 42} candidates competed
                  </span>
                  <button
                    onClick={startChallenge}
                    className="px-4 py-2 rounded-xl bg-[#1a1a2e] hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Take Challenge</span>
                  </button>
                </div>
              </div>

              {/* Weak Keys & Adaptive Recommendation */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase text-[#6C63FF] flex items-center gap-1.5">
                      <Target className="w-4 h-4" /> Adaptive Insights
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {userProgress?.readinessScore ? `${userProgress.readinessScore}% Ready` : 'Evaluating'}
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900">
                    Weak Keys & Focus Area
                  </h4>
                  <div className="mt-3">
                    {userProgress?.weakKeys && userProgress.weakKeys.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {userProgress.weakKeys.slice(0, 6).map((k) => (
                          <span
                            key={k}
                            className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs flex items-center justify-center uppercase shadow-sm"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        No major weak keys detected yet! Complete more tests to generate your personalized error heatmap.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 mt-4">
                  <button
                    onClick={() => setActiveTab('practice')}
                    className="w-full py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[#6C63FF] font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Launch Adaptive Drills</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Featured Govt Exam Presets Showcase */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Popular Exam Simulators</h3>
                  <p className="text-xs text-slate-500">Official time limits, backspace criteria, and pass thresholds</p>
                </div>
                <button
                  onClick={() => setActiveTab('exams')}
                  className="text-xs font-bold text-[#6C63FF] hover:underline flex items-center gap-1"
                >
                  <span>View All Exams</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {exams.slice(0, 3).map((ex) => (
                  <div
                    key={ex.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {ex.category}
                        </span>
                        <span className="text-xs font-bold text-[#6C63FF]">
                          {ex.targetSpeed} WPM Req.
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">
                        {ex.name}
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <span className="block text-[10px] text-slate-400">Duration:</span>
                          <span className="font-bold text-slate-700">{Math.round(ex.durationSeconds / 60)} Mins</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">Min Accuracy:</span>
                          <span className="font-bold text-slate-700">{ex.minAccuracy}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => {
                          const test = ex.tests?.[0] || tests[0];
                          if (test) startTest(test, ex, 'EXAM');
                        }}
                        className="flex-1 py-2 rounded-xl bg-[#1a1a2e] hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Mock</span>
                      </button>
                      <button
                        onClick={() => setSelectedExamDetail(ex)}
                        className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors"
                      >
                        Rules
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: GOVERNMENT EXAMS PREPARATION */}
        {/* ========================================================= */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Government Typing Examinations</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Official exam guidelines, time constraints, allowed error thresholds, and authentic passages
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['ALL', 'SSC', 'RAILWAY', 'HIGH_COURT', 'POLICE', 'UPSSSC'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setExamCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      examCategoryFilter === cat
                        ? 'bg-[#6C63FF] text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Exam Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-50 text-[#6C63FF] border border-purple-200">
                        {exam.category}
                      </span>
                      <span className="text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full">
                        {exam.language}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 leading-snug">
                      {exam.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {exam.description || exam.department}
                    </p>

                    {/* Criteria Details */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold">Speed Req.</span>
                        <span className="font-black text-slate-900 text-xs">{exam.targetSpeed} WPM</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold">Duration</span>
                        <span className="font-black text-slate-900 text-xs">
                          {Math.round(exam.durationSeconds / 60)} Mins
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-semibold">Accuracy</span>
                        <span className="font-black text-slate-900 text-xs">{exam.minAccuracy}%</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 bg-amber-50/70 border border-amber-200/70 rounded-xl p-2.5 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Backspace: <strong>{exam.backspaceRule}</strong> | Layout: <strong>{exam.keyboardLayout}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5">
                    <button
                      onClick={() => {
                        const test = exam.tests?.[0] || tests.find((t) => t.examId === exam.id) || tests[0];
                        if (test) startTest(test, exam, 'EXAM');
                        else toastError('No mock passage attached to this exam yet.');
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Official Mock</span>
                    </button>
                    <button
                      onClick={() => setSelectedExamDetail(exam)}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
                    >
                      Guidelines
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Exam Detail & Rules Modal */}
            {selectedExamDetail && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#6C63FF] bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200">
                        {selectedExamDetail.category} Syllabus
                      </span>
                      <h3 className="text-xl font-black text-slate-900 mt-1">
                        {selectedExamDetail.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedExamDetail(null)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                      <span className="block text-[10px] text-slate-400">Target Speed</span>
                      <span className="font-black text-sm text-slate-900">{selectedExamDetail.targetSpeed} WPM</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                      <span className="block text-[10px] text-slate-400">Test Duration</span>
                      <span className="font-black text-sm text-slate-900">
                        {Math.round(selectedExamDetail.durationSeconds / 60)} Mins
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                      <span className="block text-[10px] text-slate-400">Min Accuracy</span>
                      <span className="font-black text-sm text-slate-900">{selectedExamDetail.minAccuracy}%</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                      <span className="block text-[10px] text-slate-400">Backspace</span>
                      <span className="font-black text-sm text-slate-900">{selectedExamDetail.backspaceRule}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-slate-900">Official Instructions & Rules</h4>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                      {selectedExamDetail.instructions ||
                        '1. You must achieve the required net typing speed within the allotted duration.\n2. Accuracy below the specified minimum will result in automatic disqualification.\n3. Errors are penalized as per official Commission rules.'}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedExamDetail(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        const test =
                          selectedExamDetail.tests?.[0] ||
                          tests.find((t) => t.examId === selectedExamDetail.id) ||
                          tests[0];
                        setSelectedExamDetail(null);
                        if (test) startTest(test, selectedExamDetail, 'EXAM');
                      }}
                      className="px-6 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Mock Test Now</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: LEARN TYPING (12 Structured Modules & Hindi Tracks) */}
        {/* ========================================================= */}
        {activeTab === 'learn' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Touch Typing Academy</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Master muscle memory step-by-step with real-time on-screen keyboard & finger positioning
                </p>
              </div>

              {/* Language Track Selector */}
              <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setLearnTrackLang('ENGLISH')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    learnTrackLang === 'ENGLISH'
                      ? 'bg-[#6C63FF] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>English (12 Modules)</span>
                </button>
                <button
                  onClick={() => setLearnTrackLang('HINDI')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    learnTrackLang === 'HINDI'
                      ? 'bg-[#6C63FF] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Hindi (Mangal & Krutidev)</span>
                </button>
              </div>
            </div>

            {/* Active Track Overview */}
            {activeCourse ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded bg-purple-50 text-[#6C63FF] border border-purple-200">
                      {activeCourse.layoutType || activeCourse.keyboardLayout} Layout
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1.5">
                      {activeCourse.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">{activeCourse.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-semibold">Total Modules</span>
                      <span className="text-lg font-black text-slate-800">{activeCourse.lessons?.length || 12}</span>
                    </div>
                  </div>
                </div>

                {/* Lessons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(activeCourse.lessons || []).map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="bg-slate-50 rounded-2xl border border-slate-200 p-4 hover:bg-white hover:border-[#6C63FF] hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black uppercase text-[#6C63FF] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            Module {lesson.lessonOrder || lesson.orderIndex || idx + 1}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">
                            Target: {lesson.targetSpeed} WPM
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                          {lesson.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {lesson.instructions || lesson.description || 'Practice key placements, finger discipline, and rhythmic keystrokes.'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {lesson.highlightKeys || lesson.keysCovered || 'A S D F J K L ;'}
                        </span>
                        <button
                          onClick={() => startLesson(lesson)}
                          className="px-3 py-1.5 rounded-xl bg-[#1a1a2e] hover:bg-[#6C63FF] text-white font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>Start Lesson</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200">
                <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-700">Course Lessons Loading...</h4>
                <p className="text-xs text-slate-400 mt-1">Select a language track above</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PRACTICE ENGINE (Adaptive Filters, Custom Durations) */}
        {/* ========================================================= */}
        {activeTab === 'practice' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Custom Practice Engine</h2>
              <p className="text-xs text-slate-500 mt-1">
                Filter by language, difficulty, and duration. Train with focused drills to target weak spots.
              </p>
            </div>

            {/* Practice Configuration Bar */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
              {/* Language */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase text-slate-400">Language</span>
                <div className="flex gap-2">
                  {['ALL', 'ENGLISH', 'HINDI'].map((l) => (
                    <button
                      key={l}
                      onClick={() => setPracticeLang(l)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        practiceLang === l
                          ? 'bg-[#6C63FF] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase text-slate-400">Difficulty</span>
                <div className="flex gap-2">
                  {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setPracticeDiff(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        practiceDiff === d
                          ? 'bg-[#6C63FF] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase text-slate-400">Duration</span>
                <div className="flex gap-2">
                  {[
                    { label: '1 Min', val: 60 },
                    { label: '3 Min', val: 180 },
                    { label: '5 Min', val: 300 },
                    { label: '10 Min', val: 600 },
                    { label: '15 Min', val: 900 },
                  ].map((dur) => (
                    <button
                      key={dur.val}
                      onClick={() => setPracticeDuration(dur.val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        practiceDuration === dur.val
                          ? 'bg-[#1a1a2e] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Passages List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTests.map((test) => (
                <div
                  key={test.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-[#6C63FF] border border-purple-200">
                        {test.language}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">{test.difficulty}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{test.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {test.passageText}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">
                      {test.wordCount || Math.round(test.passageText.split(/\s+/).length)} words
                    </span>
                    <button
                      onClick={() => startTest(test, null, 'PRACTICE')}
                      className="px-4 py-2 rounded-xl bg-[#6C63FF] hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start ({Math.round(practiceDuration / 60)}m)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: 1-MINUTE PLACEMENT TEST */}
        {/* ========================================================= */}
        {activeTab === 'placement' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                <Zap className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#6C63FF] bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                  Adaptive Skill Level Evaluation
                </span>
                <h2 className="text-3xl font-black text-slate-900">
                  1-Minute Typing Placement Assessment
                </h2>
                <p className="text-sm text-slate-600 max-w-xl mx-auto">
                  Take this 60-second diagnostic test to establish your verified Net WPM, accuracy percentile, and recommended learning curriculum.
                </p>
              </div>

              {/* Skill Classification Tiers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400">Tier 1</span>
                  <div className="font-bold text-xs text-slate-800 mt-1">Beginner</div>
                  <span className="text-[11px] text-slate-500 block">&lt; 20 WPM</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-blue-500">Tier 2</span>
                  <div className="font-bold text-xs text-slate-800 mt-1">Intermediate</div>
                  <span className="text-[11px] text-slate-500 block">20 - 30 WPM</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-[#6C63FF]">Tier 3</span>
                  <div className="font-bold text-xs text-slate-800 mt-1">Advanced</div>
                  <span className="text-[11px] text-slate-500 block">30 - 40 WPM</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-black uppercase text-emerald-600">Tier 4</span>
                  <div className="font-bold text-xs text-emerald-900 mt-1">Exam Ready</div>
                  <span className="text-[11px] text-emerald-700 block">40+ WPM</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => startPlacementTest('ENGLISH')}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-[#6C63FF] hover:bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4" />
                  <span>Take English Assessment (60s)</span>
                </button>
                <button
                  onClick={() => startPlacementTest('HINDI')}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Keyboard className="w-4 h-4 text-emerald-600" />
                  <span>Take Hindi Assessment (60s)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: DAILY CHALLENGE & STREAK */}
        {/* ========================================================= */}
        {activeTab === 'challenge' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2b2b48] rounded-3xl p-8 text-white shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span>DAILY COMMUNITY SHOWDOWN</span>
                </div>
                <span className="text-xs font-bold text-slate-300">
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tight">
                  {dailyChallenge?.title || "Today's Speed & Accuracy Challenge"}
                </h2>
                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Every day at midnight, a fresh standardized passage is posted. Complete the test once to record your score on today's leaderboard and extend your streak!
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Language</span>
                  <span className="text-base font-black text-white">
                    {dailyChallenge?.language || 'ENGLISH'}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Duration</span>
                  <span className="text-base font-black text-white">
                    {dailyChallenge?.durationSeconds || 300} Seconds
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Participants</span>
                  <span className="text-base font-black text-amber-300">
                    {dailyChallenge?.participantsCount || 42} Aspirants
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Streak Reward</span>
                  <span className="text-base font-black text-rose-400">+1 Day Streak</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={startChallenge}
                  className="px-8 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm shadow-lg shadow-rose-500/20 flex items-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Daily Challenge Now</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: MY PROGRESS & HISTORY */}
        {/* ========================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Your Typing Performance Analytics</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Historical session logs, speed progression, accuracy metrics, and personal goal setting
                </p>
              </div>
            </div>

            {/* Goal Setting Widget */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#6C63FF]" />
                  <h3 className="font-bold text-base text-slate-900">Personal Typing Target</h3>
                </div>
                <span className="text-xs text-slate-400 font-semibold">Stay accountable</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Target Net Speed (WPM)
                  </label>
                  <input
                    type="number"
                    value={targetWpmInput}
                    onChange={(e) => setTargetWpmInput(Number(e.target.value))}
                    min={15}
                    max={150}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Daily Practice Goal (Minutes)
                  </label>
                  <input
                    type="number"
                    value={targetMinsInput}
                    onChange={(e) => setTargetMinsInput(Number(e.target.value))}
                    min={5}
                    max={180}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleSaveGoal}
                    disabled={savingGoal}
                    className="w-full py-2.5 rounded-xl bg-[#6C63FF] hover:bg-indigo-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{savingGoal ? 'Saving...' : 'Update Daily Target'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Attempt History Table */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">Session Logs & Results</h3>
                <span className="text-xs text-slate-400 font-medium">{history.length} attempts recorded</span>
              </div>

              {history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5 rounded-l-xl">Test / Exam Title</th>
                        <th className="p-3.5">Net Speed</th>
                        <th className="p-3.5">Gross Speed</th>
                        <th className="p-3.5">Accuracy</th>
                        <th className="p-3.5">Errors</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 rounded-r-xl">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {history.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900">
                            {att.typingTest?.title || 'Typing Practice'}
                          </td>
                          <td className="p-3.5 font-black text-[#6C63FF] text-sm">
                            {att.netWpm} WPM
                          </td>
                          <td className="p-3.5 text-slate-700">{att.grossWpm || att.wpm} WPM</td>
                          <td className="p-3.5 text-emerald-600 font-bold">{att.accuracy}%</td>
                          <td className="p-3.5 text-rose-500 font-bold">{att.errors}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                att.resultStatus === 'PASSED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {att.resultStatus || 'COMPLETED'}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400">
                            {new Date(att.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No typing attempts recorded yet. Take a test or assessment to see your history here!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypingTestPage;
