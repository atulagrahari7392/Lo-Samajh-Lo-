import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Clock,
  Award,
  Trash2,
  Edit2,
  HelpCircle,
  FolderTree,
  X,
  RefreshCw,
  Eye,
  CheckCircle,
  Layers,
  Copy,
  Flame,
  Star,
  Calendar,
  DollarSign,
  Globe,
  Radio,
} from 'lucide-react';
import { api } from '../../services/api';
import { Test, TestSeries, Category, Course } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const AdminTestsPage: React.FC = () => {
  const { success, error: toastError, info } = useToast();

  // Admin Tab: 'series' vs 'tests'
  const [adminTab, setAdminTab] = useState<'series' | 'tests'>('series');

  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');

  // -------------------------------------------------------------
  // Test Series Modal State
  // -------------------------------------------------------------
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<TestSeries | null>(null);
  const [seriesSubmitting, setSeriesSubmitting] = useState(false);

  // Series Fields
  const [seriesTitle, setSeriesTitle] = useState('');
  const [seriesSlug, setSeriesSlug] = useState('');
  const [seriesExamCategory, setSeriesExamCategory] = useState('UP Police');
  const [seriesSubTitle, setSeriesSubTitle] = useState('');
  const [seriesDescription, setSeriesDescription] = useState('');
  const [seriesBadge, setSeriesBadge] = useState('Trending');
  const [seriesTotalTests, setSeriesTotalTests] = useState(100);
  const [seriesFreeTests, setSeriesFreeTests] = useState(3);
  const [seriesEnrolled, setSeriesEnrolled] = useState(1000);
  const [seriesLanguages, setSeriesLanguages] = useState('English, Hindi');
  const [seriesValidityDays, setSeriesValidityDays] = useState(365);
  const [seriesPrice, setSeriesPrice] = useState(0);
  const [seriesOriginalPrice, setSeriesOriginalPrice] = useState(499);
  const [seriesStatus, setSeriesStatus] = useState('PUBLISHED');
  const [seriesIsFeatured, setSeriesIsFeatured] = useState(true);

  // -------------------------------------------------------------
  // Individual Test Modal State
  // -------------------------------------------------------------
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [testSubmitting, setTestSubmitting] = useState(false);

  // Test Fields
  const [testTitle, setTestTitle] = useState('');
  const [testSlug, setTestSlug] = useState('');
  const [testSeriesId, setTestSeriesId] = useState('');
  const [testSubCategory, setTestSubCategory] = useState('FULL_TEST');
  const [testCategoryId, setTestCategoryId] = useState('');
  const [testCourseId, setTestCourseId] = useState('');
  const [testDurationMinutes, setTestDurationMinutes] = useState(120);
  const [testTotalMarks, setTestTotalMarks] = useState(100);
  const [testPassMarks, setTestPassMarks] = useState(33);
  const [testNegativeMarking, setTestNegativeMarking] = useState(0.25);
  const [testIsFree, setTestIsFree] = useState(false);
  const [testIsLive, setTestIsLive] = useState(false);
  const [testScheduledStart, setTestScheduledStart] = useState('');
  const [testScheduledEnd, setTestScheduledEnd] = useState('');
  const [testStatus, setTestStatus] = useState('PUBLISHED');
  const [testInstructions, setTestInstructions] = useState(
    'Each question carries positive marks. Wrong answers carry negative marks. There is a countdown timer for the test.'
  );
  const [testDescription, setTestDescription] = useState('');

  // Delete modal state
  const [deleteSeriesId, setDeleteSeriesId] = useState<string | null>(null);
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [seriesRes, testRes, catRes, courseRes] = await Promise.all([
        api.testSeries.getAll(),
        api.tests.adminGetAll(),
        api.categories.getAll(),
        api.courses.adminGetAll(),
      ]);

      if (seriesRes.success) setSeriesList(seriesRes.series || []);
      if (testRes.success) setTests(testRes.tests || []);
      if (catRes.success) {
        setCategories(catRes.categories || []);
        if (catRes.categories?.length > 0 && !testCategoryId) {
          setTestCategoryId(catRes.categories[0].id);
        }
      }
      if (courseRes.success) setCourses(courseRes.courses || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to load test series');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -------------------------------------------------------------
  // Test Series Package Handlers
  // -------------------------------------------------------------
  const openCreateSeriesModal = () => {
    setEditingSeries(null);
    setSeriesTitle('');
    setSeriesSlug('');
    setSeriesExamCategory('UP Police');
    setSeriesSubTitle('');
    setSeriesDescription('');
    setSeriesBadge('Trending');
    setSeriesTotalTests(100);
    setSeriesFreeTests(3);
    setSeriesEnrolled(1000);
    setSeriesLanguages('English, Hindi');
    setSeriesValidityDays(365);
    setSeriesPrice(0);
    setSeriesOriginalPrice(499);
    setSeriesStatus('PUBLISHED');
    setSeriesIsFeatured(true);
    setIsSeriesModalOpen(true);
  };

  const openEditSeriesModal = (s: TestSeries) => {
    setEditingSeries(s);
    setSeriesTitle(s.title);
    setSeriesSlug(s.slug);
    setSeriesExamCategory(s.examCategory);
    setSeriesSubTitle(s.subTitle || '');
    setSeriesDescription(s.description || '');
    setSeriesBadge(s.badge || '');
    setSeriesTotalTests(s.totalTestsCount);
    setSeriesFreeTests(s.freeTestsCount);
    setSeriesEnrolled(s.enrolledCount);
    setSeriesLanguages(s.languages);
    setSeriesValidityDays(s.validityDays);
    setSeriesPrice(s.price);
    setSeriesOriginalPrice(s.originalPrice || 0);
    setSeriesStatus(s.status);
    setSeriesIsFeatured(s.isFeatured);
    setIsSeriesModalOpen(true);
  };

  const handleSeriesTitleChange = (val: string) => {
    setSeriesTitle(val);
    if (!editingSeries) {
      setSeriesSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesTitle.trim() || !seriesSlug.trim()) {
      toastError('Series title and slug are required.');
      return;
    }

    try {
      setSeriesSubmitting(true);
      const payload = {
        title: seriesTitle.trim(),
        slug: seriesSlug.trim().toLowerCase(),
        examCategory: seriesExamCategory.trim(),
        subTitle: seriesSubTitle.trim() || null,
        description: seriesDescription.trim() || null,
        badge: seriesBadge.trim() || null,
        totalTestsCount: Number(seriesTotalTests) || 0,
        freeTestsCount: Number(seriesFreeTests) || 0,
        enrolledCount: Number(seriesEnrolled) || 0,
        languages: seriesLanguages.trim(),
        validityDays: Number(seriesValidityDays) || 365,
        price: Number(seriesPrice) || 0,
        originalPrice: Number(seriesOriginalPrice) || null,
        status: seriesStatus,
        isFeatured: seriesIsFeatured,
      };

      if (editingSeries) {
        const res = await api.testSeries.adminUpdate(editingSeries.id, payload);
        if (res.success) {
          success('Test series package updated!');
          setIsSeriesModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.testSeries.adminCreate(payload);
        if (res.success) {
          success('New test series package created!');
          setIsSeriesModalOpen(false);
          fetchData();
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save series');
    } finally {
      setSeriesSubmitting(false);
    }
  };

  const handleDeleteSeries = async () => {
    if (!deleteSeriesId) return;
    try {
      const res = await api.testSeries.adminDelete(deleteSeriesId);
      if (res.success) {
        setSeriesList((prev) => prev.filter((s) => s.id !== deleteSeriesId));
        success('Test series deleted successfully.');
        setDeleteSeriesId(null);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to delete test series');
    }
  };

  // -------------------------------------------------------------
  // Individual Test Handlers
  // -------------------------------------------------------------
  const openCreateTestModal = (defaultSeriesId?: string) => {
    setEditingTest(null);
    setTestTitle('');
    setTestSlug('');
    setTestSeriesId(defaultSeriesId || selectedSeriesId || (seriesList.length > 0 ? seriesList[0].id : ''));
    setTestSubCategory('FULL_TEST');
    setTestCourseId('');
    setTestDurationMinutes(120);
    setTestTotalMarks(100);
    setTestPassMarks(33);
    setTestNegativeMarking(0.25);
    setTestIsFree(false);
    setTestIsLive(false);
    setTestScheduledStart('');
    setTestScheduledEnd('');
    setTestStatus('PUBLISHED');
    setTestDescription('');
    if (categories.length > 0) setTestCategoryId(categories[0].id);
    setIsTestModalOpen(true);
  };

  const openEditTestModal = (t: Test) => {
    setEditingTest(t);
    setTestTitle(t.title);
    setTestSlug(t.slug);
    setTestSeriesId(t.seriesId || '');
    setTestSubCategory(t.subCategory || 'FULL_TEST');
    setTestCategoryId(t.categoryId || '');
    setTestCourseId(t.courseId || '');
    setTestDurationMinutes(t.durationMinutes);
    setTestTotalMarks(t.totalMarks);
    setTestPassMarks(t.passMarks);
    setTestNegativeMarking(t.negativeMarking);
    setTestIsFree(t.isFree);
    setTestIsLive(!!t.isLive);
    setTestScheduledStart(t.scheduledStart ? t.scheduledStart.substring(0, 16) : '');
    setTestScheduledEnd(t.scheduledEnd ? t.scheduledEnd.substring(0, 16) : '');
    setTestStatus(t.status);
    setTestInstructions(t.instructions || '');
    setTestDescription(t.description || '');
    setIsTestModalOpen(true);
  };

  const handleTestTitleChange = (val: string) => {
    setTestTitle(val);
    if (!editingTest) {
      setTestSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !testSlug.trim()) {
      toastError('Title and slug are required.');
      return;
    }

    try {
      setTestSubmitting(true);
      const payload = {
        title: testTitle.trim(),
        slug: testSlug.trim().toLowerCase(),
        seriesId: testSeriesId || null,
        subCategory: testSubCategory || 'FULL_TEST',
        categoryId: testCategoryId || null,
        courseId: testCourseId || null,
        durationMinutes: Number(testDurationMinutes) || 60,
        totalMarks: Number(testTotalMarks) || 100,
        passMarks: Number(testPassMarks) || 33,
        negativeMarking: Number(testNegativeMarking) || 0.25,
        isFree: testIsFree,
        isLive: testIsLive,
        scheduledStart: testScheduledStart ? new Date(testScheduledStart).toISOString() : null,
        scheduledEnd: testScheduledEnd ? new Date(testScheduledEnd).toISOString() : null,
        status: testStatus,
        instructions: testInstructions.trim() || null,
        description: testDescription.trim() || null,
      };

      if (editingTest) {
        const res = await api.tests.update(editingTest.id, payload);
        if (res.success) {
          success('Mock test updated successfully!');
          setIsTestModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.tests.create(payload);
        if (res.success) {
          success('New mock test created successfully!');
          setIsTestModalOpen(false);
          fetchData();
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save test');
    } finally {
      setTestSubmitting(false);
    }
  };

  const handleDuplicateTest = async (t: Test) => {
    try {
      const copyTitle = `${t.title} (Copy)`;
      const copySlug = `${t.slug}-copy-${Date.now().toString().slice(-4)}`;
      const payload = {
        title: copyTitle,
        slug: copySlug,
        seriesId: t.seriesId || null,
        subCategory: t.subCategory || 'FULL_TEST',
        categoryId: t.categoryId || null,
        courseId: t.courseId || null,
        durationMinutes: t.durationMinutes,
        totalMarks: t.totalMarks,
        passMarks: t.passMarks,
        negativeMarking: t.negativeMarking,
        isFree: t.isFree,
        isLive: t.isLive,
        status: 'DRAFT',
        instructions: t.instructions,
        description: t.description,
      };

      const res = await api.tests.create(payload);
      if (res.success) {
        success(`Duplicated test as "${copyTitle}"!`);
        fetchData();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to duplicate test');
    }
  };

  const handleDeleteTest = async () => {
    if (!deleteTestId) return;
    try {
      const res = await api.tests.delete(deleteTestId);
      if (res.success) {
        setTests((prev) => prev.filter((t) => t.id !== deleteTestId));
        success('Test deleted successfully.');
        setDeleteTestId(null);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to delete test');
    }
  };

  // Filtered lists
  const filteredSeries = seriesList.filter((s) => {
    return (
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.examCategory.toLowerCase().includes(search.toLowerCase())
    );
  });

  const filteredTests = tests.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.subCategory && t.subCategory.toLowerCase().includes(search.toLowerCase()));
    const matchSeries = !selectedSeriesId || t.seriesId === selectedSeriesId;
    const matchSubCat = !selectedSubCategory || t.subCategory === selectedSubCategory;
    return matchSearch && matchSeries && matchSubCat;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="w-7 h-7 text-cyan-600" />
              <span>Test Series & Mock Examination Management</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Create exam packages, subcategory mock tests, set time limits, negative marking and manage questions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {adminTab === 'series' ? (
              <button
                onClick={openCreateSeriesModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create Test Series Package</span>
              </button>
            ) : (
              <button
                onClick={() => openCreateTestModal()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create Mock Test</span>
              </button>
            )}
          </div>
        </div>

        {/* Top Sub-Tabs: Test Series Packages vs Individual Tests */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setAdminTab('series')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              adminTab === 'series'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Test Series Packages ({seriesList.length})</span>
          </button>

          <button
            onClick={() => setAdminTab('tests')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              adminTab === 'tests'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Individual Mock Tests ({tests.length})</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: TEST SERIES PACKAGES */}
        {/* ------------------------------------------------------------- */}
        {adminTab === 'series' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search series by title or category..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={fetchData}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Series Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Series Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-center">Tests Count</th>
                      <th className="py-3 px-4 text-center">Free Mocks</th>
                      <th className="py-3 px-4 text-center">Users</th>
                      <th className="py-3 px-4 text-center">Price</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {filteredSeries.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No test series packages found.
                        </td>
                      </tr>
                    ) : (
                      filteredSeries.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/60">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              {s.badge && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                                  {s.badge}
                                </span>
                              )}
                              <span>{s.title}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              Slug: /{s.slug}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-[11px] font-bold">
                              {s.examCategory}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                            {s.totalTestsCount}
                          </td>
                          <td className="py-3.5 px-4 text-center text-emerald-600 font-bold">
                            {s.freeTestsCount} Free
                          </td>
                          <td className="py-3.5 px-4 text-center text-slate-600">
                            {s.enrolledCount.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold">
                            {s.price === 0 ? (
                              <span className="text-emerald-600">Free</span>
                            ) : (
                              <span>₹{s.price}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                s.status === 'PUBLISHED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedSeriesId(s.id);
                                  setAdminTab('tests');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 text-[11px] font-bold transition-colors"
                                title="View Tests in this Series"
                              >
                                View Tests ({s.tests?.length || 0})
                              </button>
                              <button
                                onClick={() => openEditSeriesModal(s)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit Series"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteSeriesId(s.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Series"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: INDIVIDUAL MOCK TESTS */}
        {/* ------------------------------------------------------------- */}
        {adminTab === 'tests' && (
          <div className="space-y-4">
            {/* Filters Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative min-w-[200px] flex-1 max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tests..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>

                <select
                  value={selectedSeriesId}
                  onChange={(e) => setSelectedSeriesId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none font-medium"
                >
                  <option value="">All Test Series Packages</option>
                  {seriesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none font-medium"
                >
                  <option value="">All Subcategories</option>
                  <option value="LIVE_TEST">Live Test</option>
                  <option value="CHAPTER_TEST">Chapter Test</option>
                  <option value="SUBJECT_TEST">Subject Test</option>
                  <option value="SECTIONAL_TEST">Sectional Test</option>
                  <option value="FULL_TEST">Full Test</option>
                  <option value="PYP">PYP (Previous Year Paper)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchData}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Tests Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Test Title</th>
                      <th className="py-3 px-4">Series / Subcategory</th>
                      <th className="py-3 px-4 text-center">Duration</th>
                      <th className="py-3 px-4 text-center">Total Marks</th>
                      <th className="py-3 px-4 text-center">Questions</th>
                      <th className="py-3 px-4 text-center">Free / Live</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {filteredTests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No mock tests match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTests.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/60">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <span>{t.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              Slug: /{t.slug}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              {t.series?.title && (
                                <span className="text-slate-600 font-medium block truncate max-w-xs">
                                  {t.series.title}
                                </span>
                              )}
                              <span className="inline-block px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 text-[10px] font-bold uppercase">
                                {(t.subCategory || 'FULL_TEST').replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono">
                            {t.durationMinutes}m
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold">
                            {t.totalMarks}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <Link
                              to={`/admin/tests/${t.id}/questions`}
                              className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6C63FF] font-black text-[11px] inline-flex items-center gap-1.5 transition-all hover:scale-105 border border-purple-200 shadow-xs"
                              title="Click to manage questions directly for this test"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>{t.questionsCount || 0} Qs</span>
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {t.isFree ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                                  FREE
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold uppercase">
                                  PRO
                                </span>
                              )}
                              {t.isLive && (
                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase">
                                  LIVE
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                t.status === 'PUBLISHED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                to={`/admin/tests/${t.id}/questions`}
                                className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-[#6C63FF] rounded-lg transition-colors text-[11px] font-bold inline-flex items-center gap-1 border border-purple-100"
                                title="Manage Questions (Direct Add / Bulk Upload / Bank Import)"
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>Questions</span>
                              </Link>
                              <Link
                                to={`/test-series/${t.id}/attempt`}
                                target="_blank"
                                className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                title="Preview Test CBT"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDuplicateTest(t)}
                                className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                title="Duplicate Test"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditTestModal(t)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit Test"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteTestId(t.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Test"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODAL: CREATE / EDIT TEST SERIES PACKAGE */}
        {/* ------------------------------------------------------------- */}
        {isSeriesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-cyan-600" />
                  <span>{editingSeries ? 'Edit Test Series Package' : 'Create New Test Series Package'}</span>
                </h3>
                <button onClick={() => setIsSeriesModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSeries} className="space-y-4 text-xs">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Series Title *</label>
                    <input
                      type="text"
                      required
                      value={seriesTitle}
                      onChange={(e) => handleSeriesTitleChange(e.target.value)}
                      placeholder="e.g. UP Police ASI Mock Test 2025-26"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">URL Slug *</label>
                    <input
                      type="text"
                      required
                      value={seriesSlug}
                      onChange={(e) => setSeriesSlug(e.target.value)}
                      placeholder="e.g. up-police-asi"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Exam Category *</label>
                    <input
                      type="text"
                      required
                      value={seriesExamCategory}
                      onChange={(e) => setSeriesExamCategory(e.target.value)}
                      placeholder="e.g. UP Police or SSC"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Badge Tag</label>
                    <input
                      type="text"
                      value={seriesBadge}
                      onChange={(e) => setSeriesBadge(e.target.value)}
                      placeholder="e.g. Trending or New Pattern"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Languages</label>
                    <input
                      type="text"
                      value={seriesLanguages}
                      onChange={(e) => setSeriesLanguages(e.target.value)}
                      placeholder="English, Hindi"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Total Tests</label>
                    <input
                      type="number"
                      value={seriesTotalTests}
                      onChange={(e) => setSeriesTotalTests(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Free Tests</label>
                    <input
                      type="number"
                      value={seriesFreeTests}
                      onChange={(e) => setSeriesFreeTests(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={seriesPrice}
                      onChange={(e) => setSeriesPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Validity (Days)</label>
                    <input
                      type="number"
                      value={seriesValidityDays}
                      onChange={(e) => setSeriesValidityDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Subtitle / Highlights</label>
                  <input
                    type="text"
                    value={seriesSubTitle}
                    onChange={(e) => setSeriesSubTitle(e.target.value)}
                    placeholder="Short summary displayed on cards..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={seriesDescription}
                    onChange={(e) => setSeriesDescription(e.target.value)}
                    placeholder="Detailed pattern, syllabus coverage..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsSeriesModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={seriesSubmitting}
                    className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold disabled:opacity-50"
                  >
                    {seriesSubmitting ? 'Saving...' : 'Save Series Package'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODAL: CREATE / EDIT MOCK TEST */}
        {/* ------------------------------------------------------------- */}
        {isTestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-600" />
                  <span>{editingTest ? 'Edit Mock Test' : 'Create New Mock Test'}</span>
                </h3>
                <button onClick={() => setIsTestModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTest} className="space-y-4 text-xs">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Test Title *</label>
                    <input
                      type="text"
                      required
                      value={testTitle}
                      onChange={(e) => handleTestTitleChange(e.target.value)}
                      placeholder="e.g. UP Police ASI Full Test 1"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">URL Slug *</label>
                    <input
                      type="text"
                      required
                      value={testSlug}
                      onChange={(e) => setTestSlug(e.target.value)}
                      placeholder="e.g. up-police-asi-full-test-1"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Assign to Test Series</label>
                    <select
                      value={testSeriesId}
                      onChange={(e) => setTestSeriesId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none bg-white font-medium"
                    >
                      <option value="">No Series Package (Standalone)</option>
                      {seriesList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subcategory Pill *</label>
                    <select
                      value={testSubCategory}
                      onChange={(e) => setTestSubCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none bg-white font-medium"
                    >
                      <option value="LIVE_TEST">Live Test</option>
                      <option value="CHAPTER_TEST">Chapter Test</option>
                      <option value="SUBJECT_TEST">Subject Test</option>
                      <option value="SECTIONAL_TEST">Sectional Test</option>
                      <option value="FULL_TEST">Full Test</option>
                      <option value="PYP">PYP (Previous Year Paper)</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      value={testDurationMinutes}
                      onChange={(e) => setTestDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Total Marks</label>
                    <input
                      type="number"
                      value={testTotalMarks}
                      onChange={(e) => setTestTotalMarks(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pass Marks</label>
                    <input
                      type="number"
                      value={testPassMarks}
                      onChange={(e) => setTestPassMarks(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Negative Marking</label>
                    <input
                      type="number"
                      step="0.01"
                      value={testNegativeMarking}
                      onChange={(e) => setTestNegativeMarking(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={testIsFree}
                      onChange={(e) => setTestIsFree(e.target.checked)}
                      className="w-4 h-4 text-cyan-600 rounded"
                    />
                    <span className="font-bold text-slate-800">Free Mock Test (No paywall)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={testIsLive}
                      onChange={(e) => setTestIsLive(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="font-bold text-slate-800">Live Scheduled Test (अवसर)</span>
                  </label>
                </div>

                {testIsLive && (
                  <div className="grid sm:grid-cols-2 gap-3 p-3 bg-red-50/50 rounded-2xl border border-red-100">
                    <div>
                      <label className="block font-bold text-red-900 mb-1">Live Window Start</label>
                      <input
                        type="datetime-local"
                        value={testScheduledStart}
                        onChange={(e) => setTestScheduledStart(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-red-200 text-xs bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-red-900 mb-1">Live Window End</label>
                      <input
                        type="datetime-local"
                        value={testScheduledEnd}
                        onChange={(e) => setTestScheduledEnd(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-red-200 text-xs bg-white outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instructions</label>
                  <textarea
                    rows={2}
                    value={testInstructions}
                    onChange={(e) => setTestInstructions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsTestModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={testSubmitting}
                    className="px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold disabled:opacity-50"
                  >
                    {testSubmitting ? 'Saving...' : 'Save Mock Test'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modals */}
        <ConfirmModal
          isOpen={!!deleteSeriesId}
          title="Delete Test Series Package"
          message="Are you sure you want to delete this test series package? Tests assigned to it will remain but become unlinked."
          confirmText="Delete Series"
          isDestructive={true}
          onConfirm={handleDeleteSeries}
          onCancel={() => setDeleteSeriesId(null)}
        />

        <ConfirmModal
          isOpen={!!deleteTestId}
          title="Delete Mock Test"
          message="Are you sure you want to delete this mock test? This will remove all questions linked to this test."
          confirmText="Delete Test"
          isDestructive={true}
          onConfirm={handleDeleteTest}
          onCancel={() => setDeleteTestId(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminTestsPage;
