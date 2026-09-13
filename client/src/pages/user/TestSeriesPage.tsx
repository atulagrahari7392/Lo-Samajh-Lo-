import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Award,
  Clock,
  AlertTriangle,
  Play,
  Search,
  BookOpen,
  Sparkles,
  TrendingUp,
  Globe,
  CheckCircle,
  Layers,
  ChevronRight,
  ChevronLeft,
  Filter,
  Zap,
  Users,
  ShieldCheck,
  X,
  Share2,
  Calendar,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Star,
  FileText,
  BarChart3,
  Flame,
  Info,
} from 'lucide-react';
import { api } from '../../services/api';
import { Test, TestSeries } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const TestSeriesPage: React.FC = () => {
  const { user } = useAuth();
  const { info } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [allTests, setAllTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Tests');
  const [activeTestTypeFilter, setActiveTestTypeFilter] = useState<string>('All');

  // Selected series state for Detail View (Page 2 & 3)
  const [selectedSeries, setSelectedSeries] = useState<TestSeries | null>(null);
  const [seriesTests, setSeriesTests] = useState<Test[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mainTab, setMainTab] = useState<'mock_tests' | 'pyps'>('mock_tests');
  const [activeSubFilter, setActiveSubFilter] = useState<string>('All');
  const [showSectionsModal, setShowSectionsModal] = useState(false);

  // Read series param from URL if present
  const seriesParam = searchParams.get('series');

  // Fetch all series packages and individual mock/subject tests on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [seriesData, testsData] = await Promise.all([
          api.testSeries.getAll(),
          api.tests.getAll(),
        ]);
        if (seriesData.success && seriesData.series) {
          setSeriesList(seriesData.series);
        }
        if (testsData.success && testsData.tests) {
          setAllTests(testsData.tests);
        }
      } catch (err) {
        console.error('Error fetching test data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle URL deep-link to a specific series
  useEffect(() => {
    if (seriesParam) {
      loadSeriesDetail(seriesParam);
    } else {
      setSelectedSeries(null);
      setSeriesTests([]);
    }
  }, [seriesParam, allTests]);

  const loadSeriesDetail = async (idOrSlug: string) => {
    try {
      setDetailLoading(true);
      const data = await api.testSeries.getById(idOrSlug);
      if (data.success && data.series) {
        setSelectedSeries(data.series);
        let tList = data.tests || data.series?.tests || [];
        // Fallback to allTests matching series.id or examCategory if empty
        if (tList.length === 0) {
          tList = allTests.filter(
            (t) =>
              t.seriesId === data.series.id ||
              (t.category?.name && t.category.name.toLowerCase().includes(data.series.examCategory.toLowerCase()))
          );
        }
        setSeriesTests(tList);
        setActiveSubFilter('All');
      }
    } catch (err) {
      console.error('Error loading series detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelectSeries = (series: TestSeries) => {
    setSearchParams({ series: series.slug || series.id });
  };

  const handleBackToAllSeries = () => {
    setSearchParams({});
    setSelectedSeries(null);
  };

  const handleStartTest = (testId: string) => {
    navigate(`/tests/${testId}/attempt`);
  };

  const normalizeSubCat = (cat?: string) => {
    if (!cat) return '';
    const c = cat.toUpperCase().replace(/[\s-]+/g, '_');
    if (c.includes('LIVE')) return 'LIVE_TEST';
    if (c.includes('CHAPTER')) return 'CHAPTER_TEST';
    if (c.includes('SUBJECT')) return 'SUBJECT_TEST';
    if (c.includes('SECTION')) return 'SECTIONAL_TEST';
    if (c.includes('FULL') || c.includes('MOCK')) return 'FULL_TEST';
    if (c.includes('PYP') || c.includes('PREVIOUS')) return 'PYP';
    return c;
  };

  // Categories list combining both Exam Packages and individual tests
  const categoryFilters = useMemo(() => {
    const cats = new Set<string>();
    seriesList.forEach((s) => {
      if (s.examCategory) cats.add(s.examCategory);
    });
    allTests.forEach((t) => {
      if (t.category?.name) cats.add(t.category.name);
    });
    return ['All Tests', ...Array.from(cats)];
  }, [seriesList, allTests]);

  // Filtered individual tests for direct test list view
  const filteredIndividualTests = useMemo(() => {
    return allTests.filter((t) => {
      const matchSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.category?.name && t.category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const catName = t.category?.name || '';
      const matchCategory =
        selectedCategory === 'All' ||
        selectedCategory === 'All Tests' ||
        catName.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        selectedCategory.toLowerCase().includes(catName.toLowerCase());

      const norm = normalizeSubCat(t.subCategory);
      let matchType = true;
      if (activeTestTypeFilter === 'Live Test') matchType = norm === 'LIVE_TEST' || !!t.isLive;
      else if (activeTestTypeFilter === 'Chapter Test') matchType = norm === 'CHAPTER_TEST';
      else if (activeTestTypeFilter === 'Subject Test') matchType = norm === 'SUBJECT_TEST';
      else if (activeTestTypeFilter === 'Sectional Test') matchType = norm === 'SECTIONAL_TEST';
      else if (activeTestTypeFilter === 'Full Test' || activeTestTypeFilter === 'Mock Tests') {
        matchType = norm === 'FULL_TEST';
      } else if (activeTestTypeFilter === 'PYPs') matchType = norm === 'PYP';

      return matchSearch && matchCategory && matchType;
    });
  }, [allTests, searchQuery, selectedCategory, activeTestTypeFilter]);

  // Sub-type filter tabs for individual tests
  const testTypeTabs = useMemo(() => {
    return [
      { name: 'All', count: filteredIndividualTests.length },
      { name: 'Subject Test', count: allTests.filter((t) => normalizeSubCat(t.subCategory) === 'SUBJECT_TEST').length },
      { name: 'Mock Tests', count: allTests.filter((t) => normalizeSubCat(t.subCategory) === 'FULL_TEST').length },
      { name: 'Live Test', count: allTests.filter((t) => normalizeSubCat(t.subCategory) === 'LIVE_TEST' || t.isLive).length },
      { name: 'Chapter Test', count: allTests.filter((t) => normalizeSubCat(t.subCategory) === 'CHAPTER_TEST').length },
      { name: 'Sectional Test', count: allTests.filter((t) => normalizeSubCat(t.subCategory) === 'SECTIONAL_TEST').length },
      { name: 'PYPs', count: allTests.filter((t) => normalizeSubCat(t.subCategory) === 'PYP').length },
    ].filter((tab) => tab.name === 'All' || tab.count > 0);
  }, [allTests, filteredIndividualTests]);

  // Filtered series list for Page 1
  const filteredSeries = useMemo(() => {
    return seriesList.filter((s) => {
      const matchSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.examCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.subTitle && s.subTitle.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory =
        selectedCategory === 'All' ||
        selectedCategory === 'All Tests' ||
        s.examCategory.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        selectedCategory.toLowerCase().includes(s.examCategory.toLowerCase());
      return matchSearch && matchCategory;
    });
  }, [seriesList, searchQuery, selectedCategory]);

  // Recent / Enrolled series
  const recentSeries = useMemo(() => {
    const withProgress = seriesList.filter((s) => (s.userStats?.attemptedCount || 0) > 0);
    if (withProgress.length > 0) return withProgress;
    return seriesList.slice(0, 4);
  }, [seriesList]);

  // Sub-categories for selected series
  const subCategoryTabs = useMemo(() => {
    if (!selectedSeries) return [];
    const counts: Record<string, number> = {
      All: seriesTests.length,
      'Live Test': seriesTests.filter((t) => normalizeSubCat(t.subCategory) === 'LIVE_TEST' || t.isLive).length,
      'Chapter Test': seriesTests.filter((t) => normalizeSubCat(t.subCategory) === 'CHAPTER_TEST').length,
      'Subject Test': seriesTests.filter((t) => normalizeSubCat(t.subCategory) === 'SUBJECT_TEST').length,
      'Sectional Test': seriesTests.filter((t) => normalizeSubCat(t.subCategory) === 'SECTIONAL_TEST').length,
      'Full Test': seriesTests.filter((t) => normalizeSubCat(t.subCategory) === 'FULL_TEST').length,
      'PYPs': seriesTests.filter((t) => normalizeSubCat(t.subCategory) === 'PYP').length,
    };

    const tabs = [{ name: 'All', count: counts['All'] }];
    if (counts['Live Test'] > 0) tabs.push({ name: 'Live Test', count: counts['Live Test'] });
    if (counts['Chapter Test'] > 0) tabs.push({ name: 'Chapter Test', count: counts['Chapter Test'] });
    if (counts['Subject Test'] > 0) tabs.push({ name: 'Subject Test', count: counts['Subject Test'] });
    if (counts['Sectional Test'] > 0) tabs.push({ name: 'Sectional Test', count: counts['Sectional Test'] });
    if (counts['Full Test'] > 0) tabs.push({ name: 'Full Test', count: counts['Full Test'] });
    if (counts['PYPs'] > 0) tabs.push({ name: 'PYPs', count: counts['PYPs'] });

    return tabs;
  }, [selectedSeries, seriesTests]);

  // Filtered tests in detail view
  const filteredTests = useMemo(() => {
    return seriesTests.filter((t) => {
      const normCat = normalizeSubCat(t.subCategory);
      // Main Tab filter
      if (mainTab === 'pyps') {
        if (normCat !== 'PYP') return false;
      } else {
        // Mock Tests view shows non-PYP or everything if only non-PYP
        if (mainTab === 'mock_tests' && normCat === 'PYP' && activeSubFilter !== 'PYPs') {
          return false;
        }
      }

      // Sub-filter pill
      if (activeSubFilter === 'All') return true;
      if (activeSubFilter === 'Live Test') return normCat === 'LIVE_TEST' || t.isLive;
      if (activeSubFilter === 'Chapter Test') return normCat === 'CHAPTER_TEST';
      if (activeSubFilter === 'Subject Test') return normCat === 'SUBJECT_TEST';
      if (activeSubFilter === 'Sectional Test') return normCat === 'SECTIONAL_TEST';
      if (activeSubFilter === 'Full Test') return normCat === 'FULL_TEST';
      if (activeSubFilter === 'PYPs') return normCat === 'PYP';
      return true;
    });
  }, [seriesTests, mainTab, activeSubFilter]);

  // -------------------------------------------------------------
  // PAGE 2 & 3: Selected Series Detail View
  // -------------------------------------------------------------
  if (selectedSeries || detailLoading) {
    if (detailLoading) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-sm text-center space-y-3 max-w-sm border border-slate-200">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-800">Loading Test Series...</p>
            <p className="text-xs text-slate-400">Fetching scheduled tests, questions, and attempts</p>
          </div>
        </div>
      );
    }

    if (!selectedSeries) return null;

    const attemptedCount = selectedSeries.userStats?.attemptedCount || 0;
    const totalCount = selectedSeries.totalTestsCount || seriesTests.length || 1;
    const progressPercent = Math.min(100, Math.round((attemptedCount / totalCount) * 100));

    return (
      <div className="min-h-screen bg-slate-50/80 pb-20 selection:bg-cyan-500 selection:text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <button
              onClick={handleBackToAllSeries}
              className="hover:text-cyan-600 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Home</span>
            </button>
            <span>&gt;</span>
            <button
              onClick={handleBackToAllSeries}
              className="hover:text-cyan-600 font-semibold transition-colors"
            >
              Test Series
            </button>
            <span>&gt;</span>
            <span className="text-slate-600">{selectedSeries.examCategory}</span>
            <span>&gt;</span>
            <span className="text-slate-900 font-bold truncate max-w-xs sm:max-w-md">
              {selectedSeries.title}
            </span>
          </nav>

          {/* Series Header Card (Matching Page 2 Blueprint) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedSeries.badge && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-600" />
                      {selectedSeries.badge}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">
                    {selectedSeries.examCategory}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{selectedSeries.title}</span>
                </h1>

                {selectedSeries.subTitle && (
                  <p className="text-xs text-slate-500 max-w-3xl">
                    {selectedSeries.subTitle}
                  </p>
                )}

                <p className="text-xs text-slate-400">
                  Last updated on {new Date(selectedSeries.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    info('Link copied to clipboard!');
                  }}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                  title="Share Series"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleBackToAllSeries}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>All Series</span>
                </button>
              </div>
            </div>

            {/* Chips & Stats Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs">
                {selectedSeries.totalTestsCount || seriesTests.length} Total Tests
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-500 text-white font-black text-xs uppercase tracking-wider">
                {selectedSeries.freeTestsCount || 3} FREE TESTS
              </span>
              <button
                onClick={() => setShowSectionsModal(!showSectionsModal)}
                className="px-3 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1 transition-colors"
              >
                <span>Sections Info</span>
                <Info className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <span className="px-3 py-1 rounded-xl bg-slate-50 text-slate-600 font-semibold text-xs border border-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-600" />
                {selectedSeries.enrolledCount.toLocaleString()} Users
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-50 text-slate-600 font-semibold text-xs border border-slate-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                {selectedSeries.languages || 'English, Hindi'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="pt-2 max-w-md space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Attempted: {attemptedCount}/{totalCount} Tests</span>
                <span>{progressPercent}% Completed</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(progressPercent, 2)}%` }}
                />
              </div>
            </div>

            {/* Sections Info Dropdown/Modal */}
            {showSectionsModal && (
              <div className="mt-4 p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 text-xs text-slate-700 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between font-bold text-cyan-900">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-600" />
                    Examination Pattern & Sectional Blueprint
                  </span>
                  <button onClick={() => setShowSectionsModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  This mock test series contains comprehensive coverage of General Hindi / Computer Knowledge (50 Qs), General Awareness & Current Affairs (50 Qs), Numerical & Mental Ability (50 Qs), and Mental Aptitude / Reasoning (50 Qs).
                </p>
                <div className="flex flex-wrap gap-2 pt-1 font-semibold text-[11px] text-cyan-800">
                  <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-cyan-100">• Negative Marking: 0.25</span>
                  <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-cyan-100">• Duration: 120-150 mins</span>
                  <span className="bg-white/80 px-2.5 py-1 rounded-lg border border-cyan-100">• Real-Time National Rank</span>
                </div>
              </div>
            )}
          </div>

          {/* Section: All Tests Title & Subcategory Tabs */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {selectedSeries.title} All Tests ({filteredTests.length})
              </h2>
            </div>

            {/* Main Tabs: Mock Tests vs PYPs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => {
                  setMainTab('mock_tests');
                  setActiveSubFilter('All');
                }}
                className={`px-5 py-2 rounded-full font-bold text-xs transition-all ${
                  mainTab === 'mock_tests'
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Mock Tests
              </button>
              <button
                onClick={() => {
                  setMainTab('pyps');
                  setActiveSubFilter('PYPs');
                }}
                className={`px-5 py-2 rounded-full font-bold text-xs transition-all ${
                  mainTab === 'pyps'
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                PYPs (Previous Year Papers)
              </button>
            </div>

            {/* Sub-Category Pills Row (Scrollable) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {subCategoryTabs.map((sub) => {
                const isSelected = activeSubFilter === sub.name;
                return (
                  <button
                    key={sub.name}
                    onClick={() => setActiveSubFilter(sub.name)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-100 text-cyan-800 border-2 border-cyan-400 shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <span>{sub.name}</span>
                    <span className="text-[11px] opacity-75">({sub.count})</span>
                  </button>
                );
              })}
            </div>

            {/* Test Cards List */}
            {filteredTests.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-slate-200 shadow-xs">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-base text-slate-800">No Tests in this Category</h3>
                <p className="text-xs text-slate-400">
                  No tests found for the selected filter. Try choosing "All" or a different subcategory tab.
                </p>
                <button
                  onClick={() => {
                    setMainTab('mock_tests');
                    setActiveSubFilter('All');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {filteredTests.map((test) => {
                  const isLive = test.isLive || test.subCategory === 'LIVE_TEST';
                  const attempt = test.userAttempt;
                  const isCompleted = attempt?.status === 'COMPLETED';
                  const isInProgress = attempt?.status === 'IN_PROGRESS';

                  return (
                    <div
                      key={test.id}
                      className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isLive && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                              LIVE TEST
                            </span>
                          )}

                          {test.subCategory && (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                              {test.subCategory.replace('_', ' ')}
                            </span>
                          )}

                          {test.isFree ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                              FREE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black uppercase">
                              PRO
                            </span>
                          )}

                          {isCompleted && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Completed (Score: {attempt?.score})
                            </span>
                          )}

                          {isInProgress && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                              In Progress
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {test.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">
                            {test.questionsCount || 100} Questions
                          </span>
                          <span>•</span>
                          <span>{test.totalMarks || 200} Marks</span>
                          <span>•</span>
                          <span>{test.durationMinutes || 60} Mins</span>
                          {test.scheduledStart && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400">
                                {new Date(test.scheduledStart).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
                          <span className="text-cyan-600 font-semibold cursor-pointer hover:underline">
                            Syllabus & Details
                          </span>
                          <span>•</span>
                          <span className="text-slate-500">English, Hindi</span>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(window.location.origin + `/test-series/${test.id}/attempt`);
                              info('Test link copied!');
                            }}
                            className="hover:text-slate-600 flex items-center gap-1"
                          >
                            <Share2 className="w-3.5 h-3.5" /> Share
                          </button>
                        </div>
                      </div>

                      {/* Smart Action Buttons */}
                      <div className="shrink-0 flex items-center gap-2 flex-wrap">
                        {isCompleted ? (
                          <>
                            <button
                              onClick={() => navigate(`/test-series/${test.id}/result/${attempt.id}`)}
                              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                              <span>View Result</span>
                            </button>
                            <button
                              onClick={() => navigate(`/test-series/${test.id}/result/${attempt.id}?view=solutions`)}
                              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Solutions</span>
                            </button>
                            <button
                              onClick={() => handleStartTest(test.id)}
                              className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all hover:scale-105 active:scale-95"
                              title="Reattempt Test"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : isInProgress ? (
                          <button
                            onClick={() => handleStartTest(test.id)}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Resume Now</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartTest(test.id)}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Start Now</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // PAGE 1: Student Test Series Explorer View
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 selection:bg-cyan-500 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>NTA & TCS Pattern CBT Mock Platform</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Comprehensive <span className="text-cyan-600">Online Test Series</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real exam simulation with bilingual questions, sectional cutoffs, instant percentile, and detailed step-by-step solutions.
          </p>
        </div>

        {/* Search Bar matching Page 1 screenshot */}
        <div className="max-w-2xl mx-auto">
          <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm p-2 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for your Exam (e.g. UP Police ASI, BSSC CGL, Railway RRB)..."
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none flex-wrap">
          {categoryFilters.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Section: Available Subject & Mock Tests (Direct Exam Simulator) */}
        <div className="space-y-5 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  {selectedCategory === 'All Tests' || selectedCategory === 'All' ? 'All Practice & Mock Tests' : `${selectedCategory} Tests`}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-xs font-black">
                  {filteredIndividualTests.length} Tests
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Attempt chapter tests, subject tests, and full mock simulations with instant CBT evaluation.
              </p>
            </div>

            {/* Sub-type Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-wrap">
              {testTypeTabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTestTypeFilter(tab.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTestTypeFilter === tab.name
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{tab.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      activeTestTypeFilter === tab.name ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Test Cards Grid */}
          {filteredIndividualTests.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center space-y-3 border border-slate-200">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="font-bold text-base text-slate-800">No Tests in this Category</h3>
              <p className="text-xs text-slate-400">
                No mock tests or subject tests found matching "{selectedCategory}" with filter "{activeTestTypeFilter}".
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All Tests');
                  setActiveTestTypeFilter('All');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs"
              >
                Show All Tests
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredIndividualTests.map((t) => {
                const isLive = !!t.isLive;
                const isCompleted =
                  t.userAttempt?.status === 'EVALUATED' ||
                  t.userAttempt?.status === 'SUBMITTED' ||
                  t.userAttempt?.status === 'COMPLETED';
                const isInProgress = t.userAttempt?.status === 'IN_PROGRESS';
                const subCatLabel = (t.subCategory || t.testType || 'Mock Test').replace('_', ' ');

                return (
                  <div
                    key={t.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group hover:border-cyan-200"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isLive && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              LIVE
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-[#6C63FF] text-[10px] font-bold uppercase tracking-wider">
                            {subCatLabel}
                          </span>
                          {t.category?.name && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                              {t.category.name}
                            </span>
                          )}
                        </div>

                        {t.isFree ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                            FREE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase">
                            PRO
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-cyan-600 transition-colors line-clamp-2">
                        {t.title}
                      </h3>

                      {t.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                        <span className="font-semibold text-slate-700">
                          {t.questionsCount || 0} Questions
                        </span>
                        <span>•</span>
                        <span>{t.totalMarks || 100} Marks</span>
                        <span>•</span>
                        <span>{t.durationMinutes || 60} Mins</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-medium text-slate-400">
                        Bilingual (EN/HI)
                      </span>

                      {isCompleted && t.userAttempt ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/test-series/${t.id}/result/${t.userAttempt!.id}`)}
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span>Result</span>
                          </button>
                          <button
                            onClick={() => handleStartTest(t.id)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                            title="Reattempt Test"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : isInProgress ? (
                        <button
                          onClick={() => handleStartTest(t.id)}
                          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Resume</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartTest(t.id)}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Test</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: Your Recent Test Series (Matching Screenshot Page 1) */}
        {recentSeries.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Your Recent Test Series</h2>
                <p className="text-xs text-slate-400">Pick up where you left off</p>
              </div>
              <Link to="/dashboard" className="text-xs font-bold text-cyan-600 hover:underline">
                View all Attempted Tests →
              </Link>
            </div>

            {/* Recent Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentSeries.map((pkg) => {
                const attempted = pkg.userStats?.attemptedCount || 0;
                const total = pkg.totalTestsCount || 100;
                const pct = Math.min(100, Math.round((attempted / total) * 100));

                return (
                  <div
                    key={pkg.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6C63FF] flex items-center justify-center font-bold text-sm">
                        <Award className="w-5 h-5" />
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-cyan-600 transition-colors">
                        {pkg.title}
                      </h3>

                      {/* Progress info */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                          <span>{attempted}/{total} Tests</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectSeries(pkg)}
                      className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.02] active:scale-95 text-center"
                    >
                      Go To Test Series
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section: All Exam Test Series Packages Grid */}
        <div className="space-y-6 pt-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Explore All Test Packages</h2>
            <p className="text-xs text-slate-500">
              Select your targeted competitive exam to access chapter tests, previous year papers, and full CBT mocks.
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading Available Test Series...</p>
            </div>
          ) : filteredSeries.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-slate-200">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="font-bold text-base text-slate-800">No Test Series Found</h3>
              <p className="text-xs text-slate-400">No test packages match your current search and filter criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSeries.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-lg transition-all space-y-5 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-purple-50 text-[#6C63FF] text-xs font-bold">
                        {pkg.examCategory}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                        {pkg.freeTestsCount || 3} FREE TESTS
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-cyan-600 transition-colors">
                      {pkg.title}
                    </h3>

                    {pkg.subTitle && (
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {pkg.subTitle}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="font-semibold text-slate-700">
                        {pkg.totalTestsCount || 100} Total Tests
                      </span>
                      <span>•</span>
                      <span>{pkg.enrolledCount.toLocaleString()} Users</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {pkg.rating || 4.8}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectSeries(pkg)}
                    className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-black text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Go To Test Series</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestSeriesPage;
