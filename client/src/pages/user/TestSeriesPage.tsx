import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Filter,
  Zap,
  Users,
  ShieldCheck,
  X
} from 'lucide-react';
import { api } from '../../services/api';
import { Test } from '../../types';
import { useAuth } from '../../context/AuthContext';

// Exam Packages metadata matching Testbook's structured packages
const EXAM_PACKAGES = [
  {
    id: 'upsssc-pet',
    slug: 'upsssc',
    title: 'UPSSSC PET Mock Test Series 2026 (New Pattern)',
    category: 'UPSSSC Exams',
    users: '227.2k Users',
    trending: true,
    logoBg: 'from-blue-500 to-indigo-600',
    iconLetter: 'PET',
    totalTests: '287 Total Tests',
    freeTests: '4 Free Tests',
    languages: 'English, Hindi',
    features: [
      '2 All India Live Tests',
      '15 Full Length Mocks (Latest 2026 Syllabus)',
      '79 Chapter & Sectional Speed Tests',
      '5 Years Previous Year Papers (PYQ)'
    ],
  },
  {
    id: 'railway-ntpc',
    slug: 'railway',
    title: 'RRB NTPC & Group D 2026 CBT Mega Mock Series',
    category: 'Railway RRB',
    users: '482.1k Users',
    trending: true,
    logoBg: 'from-emerald-500 to-teal-700',
    iconLetter: 'RRB',
    totalTests: '616 Total Tests',
    freeTests: '6 Free Tests',
    languages: 'English, Hindi',
    features: [
      '4 Ultimate CBT-1 Live Tests',
      '30 Full Length New Pattern Tests',
      '170 Chapter Wise Tests',
      'TCS iON CBT Exam Interface Simulator'
    ],
  },
  {
    id: 'ssc-cgl',
    slug: 'ssc',
    title: 'SSC CGL Mock Test Series 2026 (Tier I & Tier II)',
    category: 'SSC Exams',
    users: '714.3k Users',
    trending: true,
    logoBg: 'from-rose-500 to-pink-600',
    iconLetter: 'SSC',
    totalTests: '2345 Total Tests',
    freeTests: '8 Free Tests',
    languages: 'English, Hindi',
    features: [
      '3 Live All India Tests',
      '25 Tier-1 Full Length Mocks',
      '22 Tricky Fast Quant & Reasoning Tests',
      'Detailed Short Trick Solutions'
    ],
  },
  {
    id: 'up-police',
    slug: 'up-police',
    title: 'UP Police Constable & SI खाकी वर्दी Test Series',
    category: 'UP Police',
    users: '312.5k Users',
    trending: false,
    logoBg: 'from-amber-500 to-orange-600',
    iconLetter: 'UPP',
    totalTests: '320 Total Tests',
    freeTests: '5 Free Tests',
    languages: 'English, Hindi',
    features: [
      '2 All-UP Rank Live Tests',
      '20 Full Length Mocks with Negative Marking',
      'Special UP GK & Current Affairs Sectionals',
      'Time Management & Accuracy Analytics'
    ],
  },
];

const CATEGORIES = [
  'All Exams',
  'UPSSSC Exams',
  'Railway RRB',
  'SSC Exams',
  'UP Police',
  'Graduation (B.A./B.Sc.)',
  'General Studies & Science'
];

export const TestSeriesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Exams');
  const [selectedTab, setSelectedTab] = useState<'packages' | 'all-tests' | 'free-tests'>('packages');
  const [activePackageModal, setActivePackageModal] = useState<any | null>(null);

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

  // Filter logic
  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All Exams' ||
      t.category?.name.toLowerCase() === selectedCategory.toLowerCase() ||
      t.category?.slug.toLowerCase() === selectedCategory.toLowerCase();

    const matchesTab =
      selectedTab === 'packages' ||
      selectedTab === 'all-tests' ||
      (selectedTab === 'free-tests' && t.isFree);

    return matchesSearch && matchesCategory && matchesTab;
  });

  const filteredPackages = EXAM_PACKAGES.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All Exams' ||
      p.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleStartTest = (testId: string) => {
    if (!user) {
      navigate('/login');
    } else {
      navigate(`/test-series/${testId}/attempt`);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50/70 pb-20 selection:bg-cyan-500 selection:text-white">
      {/* Apple macOS Sequoia / iOS 18 Ambient Liquid Water Drops & Blur Blobs */}
      <div className="water-ambient-blob w-96 h-96 bg-cyan-300/40 top-0 left-10" />
      <div className="water-ambient-blob w-[32rem] h-[32rem] bg-indigo-300/30 top-40 right-10" style={{ animationDelay: '-3s' }} />
      <div className="water-ambient-blob w-80 h-80 bg-sky-200/50 bottom-20 left-1/3" style={{ animationDelay: '-6s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">

        {/* 1. Testbook Hero Section with Apple Liquid Glass */}
        <div className="apple-liquid-glass rounded-3xl p-6 sm:p-10 relative overflow-hidden">
          {/* Subtle Water Shimmer highlight bar */}
          <div className="apple-water-shimmer absolute inset-0 opacity-40 pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 text-xs font-bold tracking-wide backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
              <span>INDIA'S STRUCTURED ONLINE TEST SERIES PLATFORM</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Boost Exam Preparation with{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600">
                Live CBT Mocks
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Prepare for <strong>UPSSSC PET, Railway RRB, SSC, UP Police</strong> & State competitive exams. Experience actual exam timer, negative marking, instant All-India rank & detailed bilingual solutions.
            </p>

            {/* Apple Liquid Glass Search Bar */}
            <div className="pt-2 max-w-xl">
              <div className="relative flex items-center bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-1.5 focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-500/15 transition-all">
                <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for your Exam (e.g. PET, Railway, SSC, Police)..."
                  className="w-full bg-transparent px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 mr-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Metric Highlights Pill Row */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>850+ Exams Covered</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>50,000+ Mock Tests Attempted</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>100% Free Demos Available</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Apple Segmented Control: View Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="inline-flex p-1.5 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-sm">
            {[
              { id: 'packages', label: 'Popular Test Series', icon: Layers },
              { id: 'all-tests', label: 'All Mock Tests', icon: BookOpen },
              { id: 'free-tests', label: '100% Free Tests', icon: Zap },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'apple-capsule-active shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{selectedTab === 'packages' ? filteredPackages.length : filteredTests.length}</span> items
          </div>
        </div>

        {/* 3. Category Filter Chips (Horizontal Scrollable) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 pr-2 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`apple-capsule px-4 py-1.5 text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'apple-capsule-active'
                  : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 4. Display Content based on Selected Tab */}
        {selectedTab === 'packages' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="apple-glass-card p-6 flex flex-col justify-between space-y-5 group cursor-pointer"
                  onClick={() => setActivePackageModal(pkg)}
                >
                  <div className="space-y-4">
                    {/* Header: Logo & Badge */}
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${pkg.logoBg} text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform`}>
                        {pkg.iconLetter}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {pkg.trending && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> Trending
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-slate-400">{pkg.users}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-snug line-clamp-2 group-hover:text-cyan-600 transition-colors">
                        {pkg.title}
                      </h3>
                      <span className="text-[11px] font-bold text-[#6C63FF] mt-1 inline-block">
                        {pkg.category}
                      </span>
                    </div>

                    {/* Overview Counts */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-black text-slate-800">{pkg.totalTests}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        {pkg.freeTests}
                      </span>
                    </div>

                    {/* Language Support */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <span>{pkg.languages}</span>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-2 pt-2 border-t border-slate-200/50 text-xs text-slate-600">
                      {pkg.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="pt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Find matching test from backend or open modal
                        const match = tests.find(t => t.category?.slug.toLowerCase().includes(pkg.slug));
                        if (match) {
                          handleStartTest(match.id);
                        } else if (tests.length > 0) {
                          handleStartTest(tests[0].id);
                        } else {
                          setActivePackageModal(pkg);
                        }
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition-all group-hover:scale-[1.02]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Free Mock</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Live Individual Mock Tests Grid */}
        {(selectedTab === 'all-tests' || selectedTab === 'free-tests') && (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 rounded-3xl apple-liquid-glass animate-pulse" />
                ))}
              </div>
            ) : filteredTests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTests.map((test) => (
                  <div
                    key={test.id}
                    className="apple-glass-card p-6 flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/10 text-[#6C63FF] border border-purple-500/20">
                          {test.category?.name || 'All India Live Test'}
                        </span>
                        {test.isFree ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                            FREE MOCK
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-500/10 text-amber-700 border border-amber-500/20">
                            PRO PASS
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base text-slate-900 line-clamp-2 leading-snug">
                        {test.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {test.description || 'Full length examination simulator with section switching, exact timer, and negative marking.'}
                      </p>

                      {/* Key CBT Metrics */}
                      <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-600 bg-white/40 p-3 rounded-2xl border border-white/60">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-cyan-600" />
                          <span>{test.durationMinutes} Mins</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-purple-600" />
                          <span>{test.totalMarks} Marks</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{test.questionsCount || 10} Questions</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          <span>-{test.negativeMarking} Negative</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="pt-4 border-t border-slate-200/50 flex items-center justify-between gap-3">
                      <div>
                        {test.userHighestScore !== null && test.userHighestScore !== undefined ? (
                          <span className="text-xs font-bold text-purple-700 bg-purple-100/70 px-2.5 py-1 rounded-xl">
                            Best: {test.userHighestScore} pts
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Not taken yet</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleStartTest(test.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all hover:scale-105"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Take Test</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="apple-glass-card p-12 text-center max-w-md mx-auto space-y-3">
                <Award className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-800">No Tests Found</h3>
                <p className="text-xs text-slate-500">No test matches your search filter. Try clearing your search.</p>
              </div>
            )}
          </div>
        )}

        {/* 6. Package Details Modal (Testbook Style Test Drawer) */}
        {activePackageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity"
              onClick={() => setActivePackageModal(null)}
            />
            <div className="relative apple-liquid-glass rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${activePackageModal.logoBg} text-white font-black text-sm flex items-center justify-center shadow-md`}>
                    {activePackageModal.iconLetter}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{activePackageModal.title}</h3>
                    <span className="text-xs text-cyan-600 font-bold">{activePackageModal.category} • {activePackageModal.totalTests}</span>
                  </div>
                </div>
                <button
                  onClick={() => setActivePackageModal(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200/50 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Package highlights */}
              <div className="bg-white/50 rounded-2xl p-4 border border-white/60 space-y-2 text-xs">
                <h4 className="font-bold text-slate-800">What is included in this series:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activePackageModal.features.map((f: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Tests for this Exam */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-800 flex items-center justify-between">
                  <span>Available Mocks in this Package</span>
                  <span className="text-xs text-slate-400 font-normal">{tests.length} tests ready</span>
                </h4>

                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {tests.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-2xl bg-white/70 border border-white/80 flex items-center justify-between gap-3 hover:border-cyan-400 transition-colors"
                    >
                      <div className="space-y-1">
                        <h5 className="font-bold text-xs text-slate-800 line-clamp-1">{t.title}</h5>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{t.durationMinutes} Mins</span>
                          <span>•</span>
                          <span>{t.totalMarks} Marks</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-bold">Free Test</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartTest(t.id)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs flex items-center gap-1 shrink-0 shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Attempt</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    if (tests.length > 0) handleStartTest(tests[0].id);
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Free Live Mock Test Now</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TestSeriesPage;
