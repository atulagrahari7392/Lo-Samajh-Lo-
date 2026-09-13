import React, { useState, useEffect, useMemo } from 'react';
import {
  Keyboard,
  Building,
  FileText,
  GraduationCap,
  Users,
  BarChart2,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Target,
  ShieldCheck,
  Eye,
  RefreshCw,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../services/api';
import { TypingExam, TypingTest, TypingCourse } from '../../types';
import { useToast } from '../../context/ToastContext';

type AdminTab = 'dashboard' | 'exams' | 'passages' | 'courses' | 'layouts' | 'users';

export const AdminTypingPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [popularExams, setPopularExams] = useState<any[]>([]);
  const [exams, setExams] = useState<TypingExam[]>([]);
  const [passages, setPassages] = useState<TypingTest[]>([]);
  const [courses, setCourses] = useState<TypingCourse[]>([]);
  const [userAnalytics, setUserAnalytics] = useState<any[]>([]);

  // Modals
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examForm, setExamForm] = useState({
    name: '',
    slug: '',
    category: 'SSC',
    post: '',
    department: '',
    language: 'ENGLISH',
    keyboardLayout: 'QWERTY',
    durationSeconds: 600,
    targetSpeed: 35,
    minAccuracy: 95,
    backspaceRule: 'ALLOWED',
    instructions: '',
    description: '',
    isFeatured: true,
  });

  const [showPassageModal, setShowPassageModal] = useState(false);
  const [editingPassageId, setEditingPassageId] = useState<string | null>(null);
  const [passageForm, setPassageForm] = useState({
    title: '',
    slug: '',
    examId: '',
    examCategory: 'GENERAL',
    language: 'ENGLISH',
    keyboardLayout: 'QWERTY',
    category: 'PRACTICE',
    passageText: '',
    difficulty: 'MEDIUM',
    durationSeconds: 60,
    source: '',
    year: '',
    tags: '',
    isFeatured: false,
  });

  // Search & Filter
  const [passageSearch, setPassageSearch] = useState('');
  const [passageLangFilter, setPassageLangFilter] = useState('ALL');

  // Load admin stats & data
  const fetchAll = async () => {
    try {
      setLoading(true);
      const [statsRes, examsRes, passagesRes, coursesRes, usersRes] = await Promise.all([
        api.typing.adminGetStats().catch(() => ({ success: false })),
        api.typing.getExams().catch(() => ({ success: false, exams: [] })),
        api.typing.getAll({ limit: 100 }).catch(() => ({ success: false, tests: [] })),
        api.typing.getCourses().catch(() => ({ success: false, courses: [] })),
        api.typing.adminGetUsers().catch(() => ({ success: false, users: [] })),
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
        setPopularExams(statsRes.popularExams || []);
      }
      if (examsRes.success) setExams(examsRes.exams || []);
      if (passagesRes.success) setPassages(passagesRes.tests || []);
      if (coursesRes.success) setCourses(coursesRes.courses || []);
      if (usersRes.success) setUserAnalytics(usersRes.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Handle Exam Create / Update
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.name.trim()) {
      toastError('Exam name is required');
      return;
    }

    try {
      if (editingExamId) {
        await api.typing.adminUpdateExam(editingExamId, examForm);
        success('Government Exam updated successfully!');
      } else {
        await api.typing.adminCreateExam(examForm);
        success('New Government Exam created successfully!');
      }
      setShowExamModal(false);
      setEditingExamId(null);
      fetchAll();
    } catch (err: any) {
      toastError(err.message || 'Failed to save exam');
    }
  };

  const handleEditExam = (exam: TypingExam) => {
    setEditingExamId(exam.id);
    setExamForm({
      name: exam.name,
      slug: exam.slug,
      category: exam.category,
      post: exam.post,
      department: exam.department || '',
      language: exam.language,
      keyboardLayout: exam.keyboardLayout,
      durationSeconds: exam.durationSeconds,
      targetSpeed: exam.targetSpeed,
      minAccuracy: exam.minAccuracy,
      backspaceRule: exam.backspaceRule,
      instructions: exam.instructions || '',
      description: exam.description || '',
      isFeatured: Boolean(exam.isFeatured),
    });
    setShowExamModal(true);
  };

  const handleDeleteExam = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Exam? Passages linked to it will remain.')) return;
    try {
      await api.typing.adminDeleteExam(id);
      success('Exam deleted successfully!');
      fetchAll();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete exam');
    }
  };

  // Handle Passage Create / Update
  const handleSavePassage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passageForm.title.trim() || !passageForm.passageText.trim()) {
      toastError('Title and passage text are required');
      return;
    }

    try {
      if (editingPassageId) {
        await api.typing.adminUpdateTest(editingPassageId, passageForm);
        success('Passage updated successfully!');
      } else {
        await api.typing.adminCreateTest(passageForm);
        success('New passage added to typing library!');
      }
      setShowPassageModal(false);
      setEditingPassageId(null);
      fetchAll();
    } catch (err: any) {
      toastError(err.message || 'Failed to save passage');
    }
  };

  const handleEditPassage = (p: TypingTest) => {
    setEditingPassageId(p.id);
    setPassageForm({
      title: p.title,
      slug: p.slug || '',
      examId: p.examId || '',
      examCategory: p.examCategory || 'GENERAL',
      language: p.language,
      keyboardLayout: p.keyboardLayout || 'QWERTY',
      category: p.category || 'PRACTICE',
      passageText: p.passageText,
      difficulty: p.difficulty,
      durationSeconds: p.durationSeconds || 60,
      source: p.source || '',
      year: p.year ? String(p.year) : '',
      tags: p.tags || '',
      isFeatured: Boolean(p.isFeatured),
    });
    setShowPassageModal(true);
  };

  const handleDeletePassage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this passage?')) return;
    try {
      await api.typing.adminDeleteTest(id);
      success('Passage deleted!');
      fetchAll();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete passage');
    }
  };

  // Live calculation for passage form
  const passageLiveWordCount = useMemo(() => {
    return passageForm.passageText.trim().split(/\s+/).filter(Boolean).length;
  }, [passageForm.passageText]);

  // Filtered passages
  const filteredPassages = useMemo(() => {
    return passages.filter((p) => {
      if (passageLangFilter !== 'ALL' && p.language !== passageLangFilter) return false;
      if (
        passageSearch &&
        !p.title.toLowerCase().includes(passageSearch.toLowerCase()) &&
        !p.passageText.toLowerCase().includes(passageSearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [passages, passageSearch, passageLangFilter]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#6C63FF] text-xs font-bold border border-purple-200 mb-2">
              <Keyboard className="w-3.5 h-3.5" />
              <span>TYPING MANAGEMENT SUITE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Typing Test & Assessment Administration
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Configure government exams, maintain passage libraries, oversee courses, and analyze candidate speeds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAll}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditingPassageId(null);
                setPassageForm({
                  title: '',
                  slug: '',
                  examId: '',
                  examCategory: 'GENERAL',
                  language: 'ENGLISH',
                  keyboardLayout: 'QWERTY',
                  category: 'PRACTICE',
                  passageText: '',
                  difficulty: 'MEDIUM',
                  durationSeconds: 60,
                  source: '',
                  year: '',
                  tags: '',
                  isFeatured: false,
                });
                setShowPassageModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Passage</span>
            </button>
            <button
              onClick={() => {
                setEditingExamId(null);
                setExamForm({
                  name: '',
                  slug: '',
                  category: 'SSC',
                  post: '',
                  department: '',
                  language: 'ENGLISH',
                  keyboardLayout: 'QWERTY',
                  durationSeconds: 600,
                  targetSpeed: 35,
                  minAccuracy: 95,
                  backspaceRule: 'ALLOWED',
                  instructions: '',
                  description: '',
                  isFeatured: true,
                });
                setShowExamModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#1a1a2e] hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Building className="w-4 h-4" />
              <span>New Exam Preset</span>
            </button>
          </div>
        </div>

        {/* 6 Tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-[#1a1a2e] text-white shadow-sm'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'exams'
                ? 'bg-[#1a1a2e] text-white shadow-sm'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Govt Exams ({exams.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('passages')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'passages'
                ? 'bg-[#1a1a2e] text-white shadow-sm'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Passage Library ({passages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'courses'
                ? 'bg-[#1a1a2e] text-white shadow-sm'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Courses & Modules</span>
          </button>

          <button
            onClick={() => setActiveTab('layouts')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'layouts'
                ? 'bg-[#1a1a2e] text-white shadow-sm'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Keyboard Layouts</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-[#1a1a2e] text-white shadow-sm'
                : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Analytics ({userAnalytics.length})</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: DASHBOARD */}
        {/* ========================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Typing Candidates</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{stats?.usersCount || 0}</div>
                <span className="text-[11px] text-slate-500">Active Profiles</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Sessions</span>
                <div className="text-2xl font-black text-[#6C63FF] mt-1">{stats?.totalAttempts || 0}</div>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  +{stats?.todayAttempts || 0} today
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Platform Avg Speed</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{stats?.avgWpm || 0} WPM</div>
                <span className="text-[11px] text-slate-500">Net Speed</span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase">Avg Accuracy</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{stats?.avgAccuracy || 0}%</div>
                <span className="text-[11px] text-slate-500">Candidate Precision</span>
              </div>
            </div>

            {/* Popular Exam Mocks */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900">Most Attempted Exam Simulators</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {popularExams.map((ex) => (
                  <div key={ex.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <span className="text-[10px] font-black uppercase text-[#6C63FF] bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {ex.category}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1">{ex.name}</h4>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200">
                      <span>{ex._count?.attempts || 0} attempts</span>
                      <span className="font-bold text-slate-700">{ex.targetSpeed} WPM Req.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: EXAMS MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'exams' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">Government Exam Presets</h3>
                <span className="text-xs text-slate-400">{exams.length} Exams Configured</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Exam Name & Post</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Language</th>
                      <th className="p-3.5">Speed / Duration</th>
                      <th className="p-3.5">Accuracy / Backspace</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 text-sm">{exam.name}</div>
                          <div className="text-[11px] text-slate-400">{exam.post}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {exam.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">{exam.language}</td>
                        <td className="p-3.5">
                          <span className="font-black text-[#6C63FF]">{exam.targetSpeed} WPM</span>
                          <span className="text-slate-400 block text-[10px]">
                            {Math.round(exam.durationSeconds / 60)} Mins
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-emerald-600 font-bold">{exam.minAccuracy}% Min</span>
                          <span className="text-slate-400 block text-[10px]">BS: {exam.backspaceRule}</span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleEditExam(exam)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                            title="Edit Exam"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam.id)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600"
                            title="Delete Exam"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PASSAGES LIBRARY */}
        {/* ========================================================= */}
        {activeTab === 'passages' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search passages..."
                  value={passageSearch}
                  onChange={(e) => setPassageSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#6C63FF]"
                />
              </div>

              <div className="flex items-center gap-2">
                {['ALL', 'ENGLISH', 'HINDI'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setPassageLangFilter(l)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      passageLangFilter === l
                        ? 'bg-[#6C63FF] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Passages Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Title & Preview</th>
                      <th className="p-3.5">Language</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Difficulty</th>
                      <th className="p-3.5">Words / Chars</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredPassages.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5 max-w-sm">
                          <div className="font-bold text-slate-900 text-sm line-clamp-1">{p.title}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{p.passageText}</div>
                        </td>
                        <td className="p-3.5 font-bold text-slate-700">{p.language}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              p.difficulty === 'EASY'
                                ? 'bg-emerald-50 text-emerald-700'
                                : p.difficulty === 'HARD'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {p.difficulty}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-800">{p.wordCount || 0} w</span>
                          <span className="text-slate-400 block text-[10px]">{p.characterCount || 0} chars</span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleEditPassage(p)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePassage(p.id)}
                            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: COURSES & MODULES */}
        {/* ========================================================= */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((c) => (
                <div key={c.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#6C63FF] bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
                      {c.language} Track
                    </span>
                    <span className="text-xs font-bold text-slate-400">{c.lessons?.length || 0} Modules</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{c.title}</h3>
                  <p className="text-xs text-slate-500">{c.description}</p>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {(c.lessons || []).slice(0, 6).map((l, i) => (
                      <div
                        key={l.id}
                        className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                      >
                        <span className="font-bold text-slate-800">
                          {i + 1}. {l.title}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">{l.highlightKeys || l.keysCovered || 'Keys'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: KEYBOARD LAYOUTS */}
        {/* ========================================================= */}
        {activeTab === 'layouts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
                <span className="text-[10px] font-black uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Default Layout
                </span>
                <h3 className="font-bold text-base text-slate-900">English QWERTY</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Universal standard for SSC CHSL, Railway NTPC English, and High Court RO/ARO tests. Supported in all practice engines.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-600 border border-slate-100">
                  Home Row: A S D F G H J K L ; '
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
                <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Official Unicode
                </span>
                <h3 className="font-bold text-base text-slate-900">Mangal Inscript / Remington</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Mandatory for UP Police Computer Operator and UPSSSC Junior Assistant exams. Uses Unicode fonts and standard typing layout.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-600 border border-slate-100">
                  Home Row: ो े ् ि ु प र क त च ट
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
                <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Legacy Font Layout
                </span>
                <h3 className="font-bold text-base text-slate-900">Krutidev 010</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Standard ASCII non-unicode layout widely used in Court examinations, Secretariat typist tests, and traditional typing institutes.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-600 border border-slate-100">
                  Home Row: k s d f g h j k l ; '
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: USER ANALYTICS */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">Typing Candidate Performance Roster</h3>
                <span className="text-xs text-slate-400">{userAnalytics.length} candidates tracked</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Candidate Name</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">English Best/Avg</th>
                      <th className="p-3.5">Hindi Best/Avg</th>
                      <th className="p-3.5">Readiness</th>
                      <th className="p-3.5">Streak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {userAnalytics.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                        <td className="p-3.5 text-slate-500">{u.email}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-[#6C63FF]">
                            {u.typingProgress?.bestWpmEng || 0} WPM
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Avg: {u.typingProgress?.avgWpmEng || 0}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-emerald-600">
                            {u.typingProgress?.bestWpmHindi || 0} WPM
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Avg: {u.typingProgress?.avgWpmHindi || 0}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-[#6C63FF] border border-purple-200">
                            {u.typingProgress?.readinessScore || 0}% Ready
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-amber-600">
                          {u.typingProgress?.currentStreak || 0} Days
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: ADD / EDIT EXAM */}
        {/* ========================================================= */}
        {showExamModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900">
                  {editingExamId ? 'Edit Government Exam Preset' : 'Create Government Exam Preset'}
                </h3>
                <button
                  onClick={() => setShowExamModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveExam} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Exam Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SSC CHSL Typing Test (Tier-II)"
                      value={examForm.name}
                      onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={examForm.category}
                      onChange={(e) => setExamForm({ ...examForm, category: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#6C63FF]"
                    >
                      <option value="SSC">SSC</option>
                      <option value="RAILWAY">Railway RRB</option>
                      <option value="HIGH_COURT">High Court</option>
                      <option value="POLICE">UP Police</option>
                      <option value="UPSSSC">UPSSSC</option>
                      <option value="OTHER">Other State Exam</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Post / Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Lower Division Clerk / DEO"
                      value={examForm.post}
                      onChange={(e) => setExamForm({ ...examForm, post: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Language</label>
                    <select
                      value={examForm.language}
                      onChange={(e) => setExamForm({ ...examForm, language: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#6C63FF]"
                    >
                      <option value="ENGLISH">English</option>
                      <option value="HINDI">Hindi</option>
                      <option value="BOTH">Both (Bilingual)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Keyboard Layout</label>
                    <select
                      value={examForm.keyboardLayout}
                      onChange={(e) => setExamForm({ ...examForm, keyboardLayout: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#6C63FF]"
                    >
                      <option value="QWERTY">QWERTY</option>
                      <option value="MANGAL">Mangal (Inscript / Remington)</option>
                      <option value="KRUTIDEV">Krutidev 010</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Speed (WPM)</label>
                    <input
                      type="number"
                      value={examForm.targetSpeed}
                      onChange={(e) => setExamForm({ ...examForm, targetSpeed: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Duration (Seconds)</label>
                    <input
                      type="number"
                      value={examForm.durationSeconds}
                      onChange={(e) => setExamForm({ ...examForm, durationSeconds: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Min Accuracy (%)</label>
                    <input
                      type="number"
                      value={examForm.minAccuracy}
                      onChange={(e) => setExamForm({ ...examForm, minAccuracy: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Backspace Rule</label>
                    <select
                      value={examForm.backspaceRule}
                      onChange={(e) => setExamForm({ ...examForm, backspaceRule: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#6C63FF]"
                    >
                      <option value="ALLOWED">Allowed (Standard)</option>
                      <option value="RESTRICTED">Restricted</option>
                      <option value="DISABLED">Disabled (Strict)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Instructions & Rules</label>
                    <textarea
                      rows={3}
                      placeholder="Official guidelines..."
                      value={examForm.instructions}
                      onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowExamModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                  >
                    {editingExamId ? 'Update Exam' : 'Create Exam'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODAL: ADD / EDIT PASSAGE */}
        {/* ========================================================= */}
        {showPassageModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900">
                  {editingPassageId ? 'Edit Typing Passage' : 'Add Passage to Library'}
                </h3>
                <button
                  onClick={() => setShowPassageModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSavePassage} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Passage Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fundamental Duties and Indian Constitution"
                      value={passageForm.title}
                      onChange={(e) => setPassageForm({ ...passageForm, title: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Language</label>
                    <select
                      value={passageForm.language}
                      onChange={(e) => setPassageForm({ ...passageForm, language: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#6C63FF]"
                    >
                      <option value="ENGLISH">English</option>
                      <option value="HINDI">Hindi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={passageForm.category}
                      onChange={(e) => setPassageForm({ ...passageForm, category: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#6C63FF]"
                    >
                      <option value="PRACTICE">General Practice</option>
                      <option value="EXAM">Government Exam Mock</option>
                      <option value="LESSON">Curriculum Lesson</option>
                      <option value="CHALLENGE">Daily Challenge</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Link to Exam (Optional)</label>
                    <select
                      value={passageForm.examId}
                      onChange={(e) => setPassageForm({ ...passageForm, examId: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#6C63FF]"
                    >
                      <option value="">None (General Library)</option>
                      {exams.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Difficulty</label>
                    <select
                      value={passageForm.difficulty}
                      onChange={(e) => setPassageForm({ ...passageForm, difficulty: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#6C63FF]"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-700">Passage Text *</label>
                      <span className="text-[11px] font-mono text-slate-400">
                        {passageLiveWordCount} Words | {passageForm.passageText.length} Characters
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      required
                      placeholder="Paste or type the typing content here..."
                      value={passageForm.passageText}
                      onChange={(e) => setPassageForm({ ...passageForm, passageText: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-[#6C63FF] leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPassageModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20"
                  >
                    {editingPassageId ? 'Update Passage' : 'Save Passage'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTypingPage;
