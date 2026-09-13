import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { api } from '../../services/api';
import { Test } from '../../types';
import { useAuth } from '../../context/AuthContext';

// Exam Packages matching User's Specification Document
const RECENT_AND_POPULAR_PACKAGES = [
  {
    id: 'up-police-asi',
    slug: 'up-police',
    title: 'UP Police ASI Mock Test 2025 - 26',
    category: 'UP Police',
    totalTests: '374 Total Tests',
    freeTests: '3 FREE TESTS',
    users: '49.3k Users',
    languages: 'English, Hindi',
    attempted: '3/374 Tests',
    progressPercent: 1,
    subCategories: [
      { name: 'Live Test', count: 1, type: 'live' },
      { name: 'Chapter Test', count: 173, type: 'chapter' },
      { name: 'Subject Test', count: 35, type: 'subject' },
      { name: 'Sectional Test', count: 20, type: 'sectional' },
      { name: 'Full Test', count: 15, type: 'full' },
    ],
  },
  {
    id: 'bssc-cgl',
    slug: 'bssc',
    title: 'BSSC CGL Mock Test 2025',
    category: 'SSC & State Exams',
    totalTests: '350 Total Tests',
    freeTests: '5 FREE TESTS',
    users: '62.4k Users',
    languages: 'English, Hindi',
    attempted: '4/350 Tests',
    progressPercent: 1,
    subCategories: [
      { name: 'Live Test', count: 2, type: 'live' },
      { name: 'Chapter Test', count: 140, type: 'chapter' },
      { name: 'Subject Test', count: 42, type: 'subject' },
      { name: 'Sectional Test', count: 25, type: 'sectional' },
      { name: 'Full Test', count: 20, type: 'full' },
    ],
  },
  {
    id: 'bssc-inter',
    slug: 'bssc',
    title: 'Bihar SSC (BSSC) Inter Level Mock Test 2024 - 26',
    category: 'SSC & State Exams',
    totalTests: '616 Total Tests',
    freeTests: '4 FREE TESTS',
    users: '110k Users',
    languages: 'English, Hindi',
    attempted: '1/616 Tests',
    progressPercent: 0,
    subCategories: [
      { name: 'Live Test', count: 1, type: 'live' },
      { name: 'Chapter Test', count: 210, type: 'chapter' },
      { name: 'Subject Test', count: 60, type: 'subject' },
      { name: 'Sectional Test', count: 30, type: 'sectional' },
      { name: 'Full Test', count: 25, type: 'full' },
    ],
  },
  {
    id: 'up-police-computer',
    slug: 'up-police',
    title: 'UP Police Computer Operator Grade A Mock...',
    category: 'UP Police',
    totalTests: '196 Total Tests',
    freeTests: '2 FREE TESTS',
    users: '34.8k Users',
    languages: 'English, Hindi',
    attempted: '3/196 Tests',
    progressPercent: 2,
    subCategories: [
      { name: 'Live Test', count: 1, type: 'live' },
      { name: 'Chapter Test', count: 85, type: 'chapter' },
      { name: 'Subject Test', count: 20, type: 'subject' },
      { name: 'Sectional Test', count: 15, type: 'sectional' },
      { name: 'Full Test', count: 12, type: 'full' },
    ],
  },
  {
    id: 'upsssc-pet',
    slug: 'upsssc',
    title: 'UPSSSC PET Mock Test Series 2026 (New Pattern)',
    category: 'UPSSSC Exams',
    totalTests: '287 Total Tests',
    freeTests: '4 FREE TESTS',
    users: '227.2k Users',
    languages: 'English, Hindi',
    attempted: '5/287 Tests',
    progressPercent: 2,
    subCategories: [
      { name: 'Live Test', count: 2, type: 'live' },
      { name: 'Chapter Test', count: 110, type: 'chapter' },
      { name: 'Subject Test', count: 45, type: 'subject' },
      { name: 'Sectional Test', count: 30, type: 'sectional' },
      { name: 'Full Test', count: 20, type: 'full' },
    ],
  },
  {
    id: 'railway-ntpc',
    slug: 'railway',
    title: 'RRB NTPC & Group D 2026 CBT Mega Mock Series',
    category: 'Railway RRB',
    totalTests: '616 Total Tests',
    freeTests: '6 FREE TESTS',
    users: '482.1k Users',
    languages: 'English, Hindi',
    attempted: '2/616 Tests',
    progressPercent: 1,
    subCategories: [
      { name: 'Live Test', count: 3, type: 'live' },
      { name: 'Chapter Test', count: 230, type: 'chapter' },
      { name: 'Subject Test', count: 50, type: 'subject' },
      { name: 'Sectional Test', count: 40, type: 'sectional' },
      { name: 'Full Test', count: 30, type: 'full' },
    ],
  },
];

export const TestSeriesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected package state for Page 2 & 3
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [mainTab, setMainTab] = useState<'mock_tests' | 'pyps'>('mock_tests');
  const [activeSubFilter, setActiveSubFilter] = useState<string>('Live Test');

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const data = await api.tests.getAll();
        if (data.success) {
          setTests(data.tests || []);
        }
      } catch (err) {
        console.error('Error fetching tests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const handleStartTest = (testId: string) => {
    if (!user) {
      navigate('/login');
    } else {
      navigate(`/test-series/${testId}/attempt`);
    }
  };

  // If a package is selected, render Page 2 & 3 (Package Overview & Tests)
  if (selectedPackage) {
    const subCategories = selectedPackage.subCategories || [
      { name: 'Live Test', count: 1 },
      { name: 'Chapter Test', count: 173 },
      { name: 'Subject Test', count: 35 },
      { name: 'Sectional Test', count: 20 },
      { name: 'Full Test', count: 15 },
    ];

    // Find actual tests matching this package or seeded tests
    const relevantTests = tests.filter((t) =>
      t.title.toLowerCase().includes(selectedPackage.slug) ||
      t.category?.name.toLowerCase().includes(selectedPackage.slug)
    );
    const fallbackTestId = tests.length > 0 ? tests[0].id : 'sample-test-1';

    return (
      <div className="min-h-screen bg-slate-50/80 pb-20 selection:bg-cyan-500 selection:text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-slate-500">
            <button
              onClick={() => setSelectedPackage(null)}
              className="hover:text-cyan-600 font-semibold flex items-center gap-1"
            >
              <span>Home</span>
            </button>
            <span>&gt;</span>
            <span className="text-slate-600">{selectedPackage.category}</span>
            <span>&gt;</span>
            <span className="text-slate-900 font-bold">{selectedPackage.title}</span>
          </nav>

          {/* Page 2 Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>{selectedPackage.title} :</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Last updated on Sep 13, 2026
                </p>
              </div>

              <button
                onClick={() => setSelectedPackage(null)}
                className="self-start md:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>All Test Series</span>
              </button>
            </div>

            {/* Chips & Stats Row */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                {selectedPackage.totalTests}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-xs uppercase tracking-wider">
                {selectedPackage.freeTests}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 font-semibold text-xs border border-slate-200">
                Sections Info ∨
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 font-semibold text-xs border border-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-600" />
                {selectedPackage.users}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 font-semibold text-xs border border-slate-200">
                {selectedPackage.languages}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="pt-2 max-w-md space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>{selectedPackage.attempted}</span>
                <span>{selectedPackage.progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(selectedPackage.progressPercent, 2)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Section: All Tests Title */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-900">
              {selectedPackage.title} All Tests ({selectedPackage.totalTests.split(' ')[0]})
            </h2>

            {/* Main Tabs: Mock Tests vs PYPs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => setMainTab('mock_tests')}
                className={`px-5 py-2 rounded-full font-bold text-xs transition-all ${
                  mainTab === 'mock_tests'
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Mock Tests
              </button>
              <button
                onClick={() => setMainTab('pyps')}
                className={`px-5 py-2 rounded-full font-bold text-xs transition-all ${
                  mainTab === 'pyps'
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                PYPs (Previous Year Papers)
              </button>
            </div>

            {/* Sub-Category Pills Row (Scrollable with Chevron) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {subCategories.map((sub: any) => {
                const isSelected = activeSubFilter === sub.name;
                return (
                  <button
                    key={sub.name}
                    onClick={() => setActiveSubFilter(sub.name)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-100 text-cyan-800 border-2 border-cyan-400 shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <span>{sub.name}</span>
                    <span className="text-[11px] opacity-75">({sub.count})</span>
                  </button>
                );
              })}
              <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Test Cards List (Page 2 & 3 Items) */}
            <div className="space-y-4 pt-2">
              {/* Card 1: Live Test Item (Shown if Live Test or All) */}
              {(activeSubFilter === 'Live Test' || activeSubFilter === 'All') && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        LIVE TEST
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                        FREE
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {selectedPackage.title.replace('Mock Test', '')} (अवसर) : Mini Live Test
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span>60 Questions</span>
                      <span>•</span>
                      <span>120 Marks</span>
                      <span>•</span>
                      <span>50 Mins</span>
                      <span>•</span>
                      <span className="text-slate-400">15 Sep, 9:00 to 17 Sep, 21:00</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="text-cyan-600 font-semibold">English, Hindi</span>
                      <button className="hover:text-slate-600 flex items-center gap-1">
                        <Share2 className="w-3.5 h-3.5" /> Share
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={() => handleStartTest(fallbackTestId)}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                      Register / Start Now
                    </button>
                  </div>
                </div>
              )}

              {/* Card 2: Full Test 1 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {selectedPackage.title.replace('Mock Test', '')} Full Test 1
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">4.6k Users</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>200 Questions</span>
                    <span>•</span>
                    <span>400 Marks</span>
                    <span>•</span>
                    <span>150 Mins</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="text-cyan-600 font-semibold cursor-pointer hover:underline">
                      Syllabus
                    </span>
                    <span>•</span>
                    <span className="text-slate-500">English, Hindi</span>
                    <button className="hover:text-slate-600 flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleStartTest(fallbackTestId)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    Resume Now
                  </button>
                </div>
              </div>

              {/* Card 3: Full Test 2 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {selectedPackage.title.replace('Mock Test', '')} Full Test 2
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">2.8k Users</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>200 Questions</span>
                    <span>•</span>
                    <span>400 Marks</span>
                    <span>•</span>
                    <span>150 Mins</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="text-cyan-600 font-semibold cursor-pointer hover:underline">
                      Syllabus
                    </span>
                    <span>•</span>
                    <span className="text-slate-500">English, Hindi</span>
                    <button className="hover:text-slate-600 flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleStartTest(fallbackTestId)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    Start Now
                  </button>
                </div>
              </div>

              {/* Card 4: Full Test 3 */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {selectedPackage.title.replace('Mock Test', '')} Full Test 3
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">1.5k Users</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>200 Questions</span>
                    <span>•</span>
                    <span>400 Marks</span>
                    <span>•</span>
                    <span>150 Mins</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="text-cyan-600 font-semibold cursor-pointer hover:underline">
                      Syllabus
                    </span>
                    <span>•</span>
                    <span className="text-slate-500">English, Hindi</span>
                    <button className="hover:text-slate-600 flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleStartTest(fallbackTestId)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
                  >
                    Start Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Page 1 View (Recent Test Series & Exam Search Portal)
  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 selection:bg-cyan-500 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {/* Search Bar matching Page 1 screenshot */}
        <div className="max-w-2xl mx-auto">
          <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm p-2 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for your Exam..."
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Section: Your Recent Test Series (Matching Screenshot Page 1) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Your Recent Test Series</h2>
            <Link to="/dashboard" className="text-xs font-bold text-cyan-600 hover:underline">
              View all Attempted Tests
            </Link>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RECENT_AND_POPULAR_PACKAGES.slice(0, 4).map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
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
                      <span>{pkg.attempted}</span>
                      <span>{pkg.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full rounded-full"
                        style={{ width: `${Math.max(pkg.progressPercent, 2)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPackage(pkg)}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02] active:scale-95 text-center"
                >
                  Go To Test Series
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section: All Exam Test Series Packages */}
        <div className="space-y-6 pt-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Explore All Test Packages</h2>
            <p className="text-xs text-slate-500">
              Select your targeted competitive exam to access chapter tests, previous year papers, and full CBT mocks.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RECENT_AND_POPULAR_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-purple-50 text-[#6C63FF] text-xs font-bold">
                      {pkg.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase">
                      {pkg.freeTests}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 leading-snug">
                    {pkg.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="font-semibold text-slate-700">{pkg.totalTests}</span>
                    <span>•</span>
                    <span>{pkg.users}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPackage(pkg)}
                  className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-600 text-white font-black text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>Go To Test Series</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSeriesPage;
