import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Download,
  FileText,
  BookOpen,
  Sparkles,
  Layers,
  Brain,
  FlaskConical,
  Dna,
  TrendingUp,
  Scale,
  Users,
  Globe,
  Landmark,
  BookMarked,
  CheckCircle2,
  Bookmark,
  Eye,
  ShieldCheck,
  Filter,
  X,
  ChevronDown,
  Archive,
  CheckSquare,
  HelpCircle,
  Zap,
  List,
  GraduationCap,
  Trophy,
  ArrowUpDown,
  Share2,
  RotateCcw,
  SlidersHorizontal,
  FolderTree,
} from 'lucide-react';
import { api } from '../../services/api';
import { Material, Category, CurrentAffairs, NcertBook } from '../../types';
import { PdfReaderModal } from '../../components/materials/PdfReaderModal';
import { NcertReaderModal } from '../../components/ncert/NcertReaderModal';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { getNcertCompleteBookZipUrl, triggerInstantDownload } from '../../utils/ncertUtils';

export const StudyMaterialsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const { language, isHindi, t } = useLanguage();

  // State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentAffairs, setCurrentAffairs] = useState<CurrentAffairs[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });

  // Curated Tab: 'all' | 'featured' | 'most-downloaded' | 'trending' | 'recent' | 'ncert' | 'pyq' | 'current-affairs' | 'my-library'
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'all');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedExam, setSelectedExam] = useState(searchParams.get('exam') || '');
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('lang') || '');
  const [selectedFreeOnly, setSelectedFreeOnly] = useState(searchParams.get('free') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest');

  // NCERT State
  const [ncertBooks, setNcertBooks] = useState<NcertBook[]>([]);
  const [ncertClassNumber, setNcertClassNumber] = useState<number>(7);
  const [ncertSubject, setNcertSubject] = useState<string>('ALL');
  const [ncertMedium, setNcertMedium] = useState<string>('ALL');
  const [availableNcertSubjects, setAvailableNcertSubjects] = useState<string[]>([]);
  const [ncertReaderBook, setNcertReaderBook] = useState<NcertBook | null>(null);
  const [isNcertReaderOpen, setIsNcertReaderOpen] = useState(false);

  // PYQ Hierarchical Explorer State
  const [pyqExam, setPyqExam] = useState('UPSSSC PET');
  const [pyqYear, setPyqYear] = useState<string>('2025');

  // Current Affairs Sub-tab
  const [caCategory, setCaCategory] = useState('');

  // User Library State
  const [savedMaterials, setSavedMaterials] = useState<Material[]>([]);
  const [downloadHistory, setDownloadHistory] = useState<Material[]>([]);
  const [librarySubTab, setLibrarySubTab] = useState<'saved' | 'history'>('saved');

  // Mobile Filter Drawer
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // PDF Reader Modal
  const [readerMaterial, setReaderMaterial] = useState<Material | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync state into URL query params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (activeTab && activeTab !== 'all') params.tab = activeTab;
    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedCategory) params.category = selectedCategory;
    if (selectedType) params.type = selectedType;
    if (selectedClass) params.class = selectedClass;
    if (selectedSubject) params.subject = selectedSubject;
    if (selectedExam) params.exam = selectedExam;
    if (selectedLanguage) params.lang = selectedLanguage;
    if (selectedFreeOnly) params.free = selectedFreeOnly;
    if (sortBy && sortBy !== 'latest') params.sort = sortBy;
    setSearchParams(params, { replace: true });
  }, [
    activeTab,
    debouncedSearch,
    selectedCategory,
    selectedType,
    selectedClass,
    selectedSubject,
    selectedExam,
    selectedLanguage,
    selectedFreeOnly,
    sortBy,
  ]);

  // Main Categories definition (Phase 2 & 3)
  const categoryTiles = [
    { id: 'NCERT', name: 'NCERT Textbooks', nameHi: 'एनसीईआरटी पुस्तकें व समाधान', icon: BookOpen, color: 'from-blue-600 to-indigo-600' },
    { id: 'E_BOOK', name: 'E-Books & Guides', nameHi: 'मानक ई-बुक्स एवं संदर्भ गाइड', icon: BookMarked, color: 'from-purple-600 to-pink-600' },
    { id: 'CLASS_NOTES', name: 'Class Notes', nameHi: 'हस्तलिखित क्लास नोट्स', icon: FileText, color: 'from-emerald-600 to-teal-600' },
    { id: 'CURRENT_AFFAIRS', name: 'Current Affairs', nameHi: 'समसामयिकी एवं मासिक पत्रिका', icon: Sparkles, color: 'from-amber-500 to-orange-600' },
    { id: 'PYQ', name: 'Previous Year Papers', nameHi: 'विगत वर्षों के हल प्रश्न पत्र (PYQ)', icon: Archive, color: 'from-rose-600 to-red-600' },
    { id: 'PRACTICE_SET', name: 'Practice Sets', nameHi: 'विषयवार प्रैक्टिस सेट्स', icon: CheckSquare, color: 'from-violet-600 to-purple-700' },
    { id: 'QUESTION_BANK', name: 'Question Banks', nameHi: '1000+ वस्तुनिष्ठ प्रश्न बैंक', icon: HelpCircle, color: 'from-cyan-600 to-blue-600' },
    { id: 'SHORT_NOTES', name: 'Short Notes & Mind Maps', nameHi: 'शॉर्ट नोट्स व माइंड मैप्स', icon: Zap, color: 'from-orange-500 to-amber-600' },
    { id: 'ONE_LINER', name: 'One Liners', nameHi: 'क्विक रिवीजन वन-लाइनर्स', icon: List, color: 'from-teal-600 to-emerald-700' },
    { id: 'SCHOOL_MATERIAL', name: 'School Material', nameHi: 'कक्षा 6 से 12 स्कूल सामग्री', icon: GraduationCap, color: 'from-green-600 to-teal-600' },
    { id: 'COMPETITIVE_EXAMS', name: 'Competitive Exams', nameHi: 'प्रतियोगी परीक्षा विशेषांक', icon: Trophy, color: 'from-indigo-600 to-blue-700' },
  ];

  // Subject quick pills
  const subjectPills = [
    { id: '', label: isHindi ? 'सभी विषय' : 'All Subjects' },
    { id: 'Science', label: isHindi ? 'विज्ञान' : 'Science' },
    { id: 'Mathematics', label: isHindi ? 'गणित' : 'Mathematics' },
    { id: 'History', label: isHindi ? 'इतिहास' : 'History' },
    { id: 'Geography', label: isHindi ? 'भूगोल' : 'Geography' },
    { id: 'Polity', label: isHindi ? 'राजव्यवस्था' : 'Polity' },
    { id: 'Economics', label: isHindi ? 'अर्थशास्त्र' : 'Economics' },
    { id: 'General Hindi', label: isHindi ? 'सामान्य हिन्दी' : 'General Hindi' },
    { id: 'English', label: isHindi ? 'अंग्रेजी' : 'English' },
    { id: 'Reasoning', label: isHindi ? 'तर्कशक्ति' : 'Reasoning' },
    { id: 'General Awareness', label: isHindi ? 'सामान्य ज्ञान' : 'General Awareness' },
  ];

  // Classes list
  const classesList = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10 (Board)', 'Class 11', 'Class 12 (Board)', 'Competitive Exams', 'Graduation / College'];

  // Exams list
  const examsList = ['UPSSSC PET', 'SSC CGL', 'Railway RRB', 'UP Police', 'UPSC / UPPSC', 'Teaching (TET)', 'Banking'];

  // Fetch materials
  const fetchMaterials = async (page = 1, explicitSearch?: string) => {
    try {
      setLoading(true);

      // Dedicated tabs
      if (activeTab === 'featured') {
        const res = await api.materials.getFeatured();
        if (res.success) setMaterials(res.materials || []);
        return;
      }
      if (activeTab === 'trending') {
        const res = await api.materials.getTrending();
        if (res.success) setMaterials(res.materials || []);
        return;
      }
      if (activeTab === 'most-downloaded') {
        const res = await api.materials.getMostDownloaded();
        if (res.success) setMaterials(res.materials || []);
        return;
      }
      if (activeTab === 'recent') {
        const res = await api.materials.getRecent();
        if (res.success) setMaterials(res.materials || []);
        return;
      }
      if (activeTab === 'my-library') {
        try {
          const libRes = await api.materials.getUserLibrary();
          if (libRes.success) {
            setSavedMaterials(libRes.savedMaterials || []);
            setDownloadHistory(libRes.downloadHistory || []);
          }
        } catch {
          // not logged in
        }
        return;
      }
      const searchEffective = (explicitSearch !== undefined ? explicitSearch : debouncedSearch).trim();

      if (activeTab === 'current-affairs') {
        const caParams: any = {};
        if (caCategory) caParams.category = caCategory;
        if (searchEffective) caParams.search = searchEffective;
        const res = await api.currentAffairs.getAll(caParams);
        if (res.success) setCurrentAffairs(res.items || []);
        return;
      }

      // Default / Filtered search
      const params: any = {
        page,
        limit: 12,
        sort: sortBy,
      };

      if (searchEffective) params.search = searchEffective;
      if (selectedCategory) params.category = selectedCategory;

      if (activeTab === 'ncert') {
        const ncertParams: Record<string, any> = {
          limit: 36,
        };
        if (searchEffective) {
          ncertParams.search = searchEffective;
        } else {
          ncertParams.classNumber = ncertClassNumber;
        }
        if (ncertSubject && ncertSubject !== 'ALL') {
          ncertParams.subject = ncertSubject;
        }
        if (ncertMedium && ncertMedium !== 'ALL') {
          ncertParams.medium = ncertMedium;
        }
        const ncertRes = await api.ncert.getAll(ncertParams);
        if (ncertRes.success) {
          setNcertBooks(ncertRes.data || []);
          if (ncertRes.pagination) {
            setPagination(ncertRes.pagination);
          }
        }
        setMaterials([]);
        return;
      } else if (activeTab === 'pyq') {
        params.materialType = 'PYQ';
        if (pyqExam) params.examName = pyqExam;
        if (pyqYear) params.year = pyqYear;
      } else {
        if (selectedType) params.materialType = selectedType;
        if (selectedClass) params.classGrade = selectedClass;
        if (selectedSubject) params.subject = selectedSubject;
        if (selectedExam) params.examName = selectedExam;
      }

      if (selectedLanguage) params.language = selectedLanguage;
      if (selectedFreeOnly) params.isFree = selectedFreeOnly;

      const res = await api.materials.getAll(params);
      if (res.success) {
        setMaterials(res.materials || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      }
    } catch (err) {
      console.error('Error loading materials:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load categories
  useEffect(() => {
    api.categories.getAll().then(res => {
      if (res.success) setCategories(res.categories || []);
    }).catch(() => {});
  }, []);

  // Fetch NCERT subjects when ncertClassNumber changes
  useEffect(() => {
    if (activeTab === 'ncert') {
      api.ncert.getSubjects(ncertClassNumber).then(res => {
        if (res.success && res.data) {
          setAvailableNcertSubjects(res.data);
        }
      }).catch(() => {});
    }
  }, [ncertClassNumber, activeTab]);

  // Fetch when filters or tab change
  useEffect(() => {
    fetchMaterials(1);
  }, [
    activeTab,
    debouncedSearch,
    selectedCategory,
    selectedType,
    selectedClass,
    selectedSubject,
    selectedExam,
    selectedLanguage,
    selectedFreeOnly,
    sortBy,
    ncertClassNumber,
    ncertSubject,
    ncertMedium,
    pyqExam,
    pyqYear,
    caCategory,
  ]);

  const handleDownload = async (mat: Material) => {
    try {
      await api.materials.incrementDownload(mat.id);
    } catch (e) {
      console.error(e);
    }
    const link = document.createElement('a');
    link.href = mat.fileUrl;
    link.target = '_blank';
    link.download = `${mat.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Download started!');
  };

  const handleToggleBookmark = async (mat: Material) => {
    try {
      const res = await api.materials.toggleBookmark(mat.id);
      if (res.success) {
        // Update local state
        setMaterials(prev =>
          prev.map(m => (m.id === mat.id ? { ...m, isBookmarked: res.isBookmarked } : m))
        );
        toastSuccess(res.isBookmarked ? 'Saved to My Library' : 'Removed from Saved');
      }
    } catch (err: any) {
      toastError(err.message || 'Please log in to save study materials');
    }
  };

  const handleOpenReader = (mat: Material) => {
    setReaderMaterial(mat);
    setIsReaderOpen(true);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSelectedType('');
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedExam('');
    setSelectedLanguage('');
    setSelectedFreeOnly('');
    setSortBy('latest');
    setActiveTab('all');
  };

  const hasActiveFilters = Boolean(
    debouncedSearch ||
      selectedCategory ||
      selectedType ||
      selectedClass ||
      selectedSubject ||
      selectedExam ||
      selectedLanguage ||
      selectedFreeOnly ||
      sortBy !== 'latest'
  );

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    setDebouncedSearch(q);

    // If search query mentions NCERT or a school class (e.g. "Science Class 7", "Class 10", "NCERT", "Class 6 Maths"),
    // auto-switch to the NCERT Books tab, set class, and smoothly scroll down to the NCERT books
    const isNcertQuery = /ncert/i.test(q) || /\bclass\s*[-_]?\s*([1-9]|1[0-2])\b/i.test(q);
    if (isNcertQuery) {
      const match = q.match(/\bclass\s*[-_]?\s*([1-9]|1[0-2])\b/i);
      if (match) {
        setNcertClassNumber(parseInt(match[1], 10));
      }
      setActiveTab('ncert');
      setTimeout(() => {
        document.getElementById('ncert-explorer-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      fetchMaterials(1, q);
      return;
    }

    fetchMaterials(1, q);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 space-y-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Hero Banner Area (Phase 3A) */}
        <div className="bg-gradient-to-br from-slate-900 via-[#1E1E38] to-[#121226] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-[#6C63FF]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#6C63FF]/25 border border-[#6C63FF]/40 text-[#a59eff] text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5 text-[#6C63FF]" />
              <span>{t('study.heroBadge')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {t('study.heroTitle')}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              {t('study.heroSubtitle')}
            </p>

            {/* Prominent Search Bar (Phase 3A & 3E) */}
            <form onSubmit={handleSearchSubmit} className="pt-2">
              <div className="flex items-center gap-2 bg-white text-slate-900 rounded-2xl p-2 sm:p-2.5 shadow-2xl border border-slate-200">
                <Search className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('study.searchPlaceholder')}
                  className="w-full bg-transparent text-sm sm:text-base placeholder-slate-400 outline-none px-2 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setDebouncedSearch('');
                      fetchMaterials(1, '');
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                    title={t('common.clearSearch')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition shrink-0"
                >
                  {t('common.search')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Category Cards Section (Phase 2 & Phase 3B) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#6C63FF]" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
                {t('study.exploreCategories')}
              </h2>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-bold text-rose-600 hover:underline inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('common.clearFilters')}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categoryTiles.map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedType === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (cat.id === 'NCERT') {
                      setActiveTab('ncert');
                      setSelectedType('');
                      setTimeout(() => {
                        document.getElementById('ncert-explorer-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                      return;
                    } else if (cat.id === 'PYQ') {
                      setActiveTab('pyq');
                      setSelectedType('');
                    } else if (cat.id === 'CURRENT_AFFAIRS') {
                      setActiveTab('current-affairs');
                      setSelectedType('');
                    } else {
                      setActiveTab('all');
                      setSelectedType(isSelected ? '' : cat.id);
                    }
                    setTimeout(() => {
                      document.getElementById('materials-catalog-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all group relative overflow-hidden flex flex-col justify-between ${
                    isSelected || (activeTab === cat.id.toLowerCase())
                      ? 'bg-gradient-to-br ' + cat.color + ' text-white border-transparent shadow-md scale-[1.02]'
                      : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${
                    isSelected || (activeTab === cat.id.toLowerCase()) ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#6C63FF]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold line-clamp-1 leading-tight">
                      {isHindi ? cat.nameHi : cat.name}
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Navigation Tabs Bar (Phase 3C & Phase 12) */}
        <div id="materials-catalog-section" className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { id: 'all', label: t('study.allMaterials'), count: pagination.total },
              { id: 'ncert', label: t('study.ncertBooks'), icon: BookOpen },
              { id: 'pyq', label: t('study.pyqPapers'), icon: Archive },
              { id: 'current-affairs', label: t('study.currentAffairs'), icon: Sparkles },
              { id: 'featured', label: t('study.featured'), icon: Trophy },
              { id: 'most-downloaded', label: t('study.topDownloaded'), icon: Download },
              { id: 'my-library', label: t('study.myLibrarySaved'), icon: Bookmark },
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== 'all') {
                      setSelectedType('');
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {TabIcon && <TabIcon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Filter Trigger Button (Mobile Drawer) */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="md:hidden px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#6C63FF]" />
            <span>{t('common.filters')}</span>
          </button>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: NCERT Hierarchical Explorer (Classes 1–12) */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'ncert' && (
          <div id="ncert-explorer-section" className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>{t('study.ncertSectionTitle')}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('study.ncertSectionSubtitle')}
                </p>
              </div>

              <Link
                to={`/study-material/ncert/class-${ncertClassNumber}`}
                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition shrink-0 border border-blue-200"
              >
                <span>{t('study.dedicatedNcertPortal')} ↗</span>
              </Link>
            </div>

            {/* Class Pills (Classes 1 to 12) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-500 uppercase flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('study.selectClass')}:</span>
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {t('study.showingBooksFor')} <strong>{isHindi ? `कक्षा ${ncertClassNumber}` : `Class ${ncertClassNumber}`}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((cls) => {
                  const isSelected = ncertClassNumber === cls;
                  return (
                    <button
                      key={cls}
                      onClick={() => {
                        setNcertClassNumber(cls);
                        setNcertSubject('ALL');
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center justify-center min-w-[70px] ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{isHindi ? `कक्षा ${cls}` : `Class ${cls}`}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject Selector & Medium Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-slate-100">
              {/* Subjects */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1">
                <span className="text-xs font-extrabold text-slate-500 uppercase shrink-0">{t('study.subject')}:</span>
                <button
                  onClick={() => setNcertSubject('ALL')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 border ${
                    ncertSubject === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {t('study.allSubjects')}
                </button>
                {(availableNcertSubjects.length > 0
                  ? availableNcertSubjects
                  : ['Science', 'Mathematics', 'Social Science', 'Hindi', 'English', 'Sanskrit']
                ).map((s) => (
                  <button
                    key={s}
                    onClick={() => setNcertSubject(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 border ${
                      ncertSubject === s
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Medium */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                <span className="text-xs font-extrabold text-slate-500 uppercase flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('study.medium')}:</span>
                </span>
                {['ALL', 'English', 'Hindi', 'Urdu'].map((med) => (
                  <button
                    key={med}
                    onClick={() => setNcertMedium(med)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      ncertMedium === med
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {med === 'ALL' ? t('common.all') : med}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: PYQ Hierarchical Explorer (Phase 8) */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'pyq' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Archive className="w-5 h-5 text-rose-600" />
                  <span>{isHindi ? 'विगत वर्ष प्रश्न पत्र (PYQ) एक्सप्लोरर' : 'Previous Year Papers (PYQ) Explorer'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isHindi ? 'आयोग द्वारा आयोजित वास्तविक परीक्षाओं के हल किए गए प्रश्न पत्र (परीक्षा → वर्ष → पेपर → शिफ्ट)।' : 'Official previous years solved question papers (Exam → Year → Paper → Shift).'}
                </p>
              </div>

              {/* Exam Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['UPSSSC PET', 'SSC CGL', 'Railway RRB', 'UP Police', 'UPSC / UPPSC'].map(e => (
                  <button
                    key={e}
                    onClick={() => setPyqExam(e)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      pyqExam === e
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-extrabold text-slate-500 uppercase shrink-0">{t('study.year')}:</span>
              {['2026', '2025', '2024', '2023', '2022', '2021'].map(y => (
                <button
                  key={y}
                  onClick={() => setPyqYear(y)}
                  className={`px-3.5 py-1 rounded-full text-xs font-bold transition shrink-0 border ${
                    pyqYear === y
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: Current Affairs System (Phase 7) */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'current-affairs' && (
          <div className="space-y-6">
            {/* Category Pills */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center gap-2 overflow-x-auto">
              {[
                { id: '', label: isHindi ? 'समस्त करेंट अफेयर्स' : 'All Current Affairs' },
                { id: 'NATIONAL', label: isHindi ? 'राष्ट्रीय' : 'National' },
                { id: 'INTERNATIONAL', label: isHindi ? 'अंतर्राष्ट्रीय' : 'International' },
                { id: 'ECONOMY', label: isHindi ? 'अर्थव्यवस्था' : 'Economy & Banking' },
                { id: 'SCIENCE_TECH', label: isHindi ? 'विज्ञान व तकनीक' : 'Science & Tech' },
                { id: 'SPORTS', label: isHindi ? 'खेलकूद' : 'Sports' },
                { id: 'AWARDS', label: isHindi ? 'पुरस्कार' : 'Awards' },
                { id: 'SCHEMES', label: isHindi ? 'सरकारी योजनाएं' : 'Govt Schemes' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCaCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
                    caCategory === cat.id
                      ? 'bg-[#6C63FF] text-white border-[#6C63FF] shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Current Affairs Articles Grid */}
            {currentAffairs.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
                <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">
                  {isHindi ? 'कोई समसामयिकी लेख नहीं मिला' : 'No current affairs articles found'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isHindi ? 'आपके चुने गए फ़िल्टर के अनुसार कोई समसामयिकी लेख उपलब्ध नहीं है।' : 'No current affairs articles match your selected filter.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentAffairs.map(item => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                          {item.category}
                        </span>
                        <span className="text-slate-400 font-medium">
                          {new Date(item.date).toLocaleDateString(isHindi ? 'hi-IN' : 'en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {item.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 whitespace-pre-line">
                        {item.content}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold italic">
                        {isHindi ? 'स्रोत' : 'Source'}: {item.source || (isHindi ? 'आधिकारिक बुलेटिन' : 'Official Bulletin')}
                      </span>
                      {item.pdfUrl ? (
                        <a
                          href={item.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isHindi ? 'मासिक PDF' : 'Monthly PDF'}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          👁️ {item.viewsCount || 0} Readers
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: User Library (Phase 12) */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'my-library' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-rose-500" />
                  <span>{t('study.myLibrary')}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('study.myLibrarySubtitle')}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setLibrarySubTab('saved')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                    librarySubTab === 'saved' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {t('study.saved')} ({savedMaterials.length})
                </button>
                <button
                  onClick={() => setLibrarySubTab('history')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    librarySubTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {t('study.downloadHistory')} ({downloadHistory.length})
                </button>
              </div>
            </div>

            {librarySubTab === 'saved' ? (
              savedMaterials.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
                  <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">{t('study.noSavedMaterials')}</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {t('study.noSavedMaterialsDesc')}
                  </p>
                  <button
                    onClick={() => setActiveTab('all')}
                    className="mt-4 px-5 py-2 rounded-xl bg-[#6C63FF] text-white font-bold text-xs"
                  >
                    {t('study.exploreStudyMaterials')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedMaterials.map(mat => (
                    <MaterialCard
                      key={mat.id}
                      material={mat}
                      onReadOnline={handleOpenReader}
                      onDownload={handleDownload}
                      onBookmark={handleToggleBookmark}
                    />
                  ))}
                </div>
              )
            ) : downloadHistory.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80">
                <Download className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">{t('study.noHistory')}</h3>
                <p className="text-xs text-slate-500 mt-1">{t('study.noHistoryDesc')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {downloadHistory.map(mat => (
                  <MaterialCard
                    key={mat.id}
                    material={mat}
                    onReadOnline={handleOpenReader}
                    onDownload={handleDownload}
                    onBookmark={handleToggleBookmark}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* MAIN BODY: Subject Explorer & Materials Grid */}
        {/* ---------------------------------------------------- */}
        {activeTab !== 'current-affairs' && activeTab !== 'my-library' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Desktop Filters Sidebar (Phase 3D & 25) */}
            <div className="hidden lg:block space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6 sticky top-24">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <Filter className="w-4 h-4 text-[#6C63FF]" />
                    <span>{t('study.smartFilters')}</span>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      {t('study.reset')}
                    </button>
                  )}
                </div>

                {/* Filter 1: Subject */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    {t('study.subject')}
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#6C63FF]"
                  >
                    <option value="">{t('study.allSubjects')}</option>
                    {subjectPills.filter(s => s.id).map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Filter 2: Class */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    {t('study.classGrade')}
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#6C63FF]"
                  >
                    <option value="">{t('study.allClasses')}</option>
                    {classesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Filter 3: Exam */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    {t('study.targetExam')}
                  </label>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#6C63FF]"
                  >
                    <option value="">{t('study.allExams')}</option>
                    {examsList.map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>

                {/* Filter 4: Language */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    {t('study.language')}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['', 'HINDI', 'ENGLISH'].map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setSelectedLanguage(lang)}
                        className={`py-1.5 rounded-lg text-xs font-bold border text-center transition ${
                          selectedLanguage === lang
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {lang === '' ? t('common.all') : lang === 'HINDI' ? (isHindi ? 'हिन्दी' : 'Hindi') : 'English'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter 5: Free vs Premium */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    {t('study.access')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedFreeOnly(selectedFreeOnly === 'true' ? '' : 'true')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition ${
                        selectedFreeOnly === 'true'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isHindi ? 'केवल मुफ़्त' : '100% Free Only'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFreeOnly(selectedFreeOnly === 'false' ? '' : 'false')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition ${
                        selectedFreeOnly === 'false'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isHindi ? 'केवल प्रीमियम' : 'Premium Only'}
                    </button>
                  </div>
                </div>

                {/* Sort Option */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>{t('study.sortBy')}</span>
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none"
                  >
                    <option value="latest">{t('study.sortNewest')}</option>
                    <option value="popular">{t('study.sortDownloaded')}</option>
                    <option value="views">{t('study.sortViewed')}</option>
                    <option value="oldest">{t('study.sortOldest')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column: Materials Cards Grid */}
            <div className="lg:col-span-3 space-y-6">
              {/* Quick Subject Filter Pills Row (General Materials) */}
              {activeTab !== 'ncert' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {subjectPills.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubject(sub.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border ${
                        selectedSubject === sub.id
                          ? 'bg-[#6C63FF] text-white border-[#6C63FF] shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Status info row */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  {activeTab === 'ncert' ? (
                    <>
                      {isHindi ? 'दिखाई जा रही हैं:' : 'Showing:'} <strong className="text-slate-800">{ncertBooks.length}</strong> {isHindi ? `आधिकारिक NCERT पुस्तकें (कक्षा ${ncertClassNumber})` : `official NCERT books (Class ${ncertClassNumber})`}
                    </>
                  ) : (
                    <>
                      {isHindi ? 'दिखाए जा रहे हैं:' : 'Showing:'} <strong className="text-slate-800">{materials.length}</strong> {isHindi ? 'परिणाम' : 'results'}
                      {pagination.total > 0 && ` (${isHindi ? 'कुल' : 'Total'} ${pagination.total})`}
                    </>
                  )}
                </span>
                {activeTab === 'ncert' ? (
                  ncertSubject !== 'ALL' && (
                    <span className="font-semibold text-blue-600">
                      {t('study.subject')}: {ncertSubject}
                    </span>
                  )
                ) : (
                  selectedSubject && (
                    <span className="font-semibold text-[#6C63FF]">
                      {t('study.subject')}: {selectedSubject}
                    </span>
                  )
                )}
              </div>

              {/* Cards Grid */}
              {activeTab === 'ncert' ? (
                loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4">
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-20 bg-slate-100 rounded-2xl"></div>
                        <div className="h-8 bg-slate-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : ncertBooks.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-4">
                    <BookOpen className="w-14 h-14 text-slate-300 mx-auto" />
                    <h3 className="text-lg font-bold text-slate-800">
                      {isHindi ? `कक्षा ${ncertClassNumber} के लिए कोई पुस्तक नहीं मिली` : `No textbooks found for Class ${ncertClassNumber}`}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      {isHindi ? 'चयनित विषय अथवा माध्यम में कोई पुस्तक नहीं मिली। कृपया फ़िल्टर रीसेट करें।' : 'No textbooks found matching your selected subject or medium. Try resetting filters.'}
                    </p>
                    <button
                      onClick={() => {
                        setNcertSubject('ALL');
                        setNcertMedium('ALL');
                      }}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md hover:bg-blue-700 transition"
                    >
                      {t('common.clearFilters')}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ncertBooks.map(book => (
                      <NcertBookGridCard
                        key={book.id}
                        book={book}
                        onReadOnline={(b) => {
                          setNcertReaderBook(b);
                          setIsNcertReaderOpen(true);
                        }}
                        onDownload={(b) => {
                          api.ncert.trackDownload(b.id).catch(() => {});
                          const zipUrl = getNcertCompleteBookZipUrl(b.officialPdfUrl);
                          const fileName = `NCERT-Class-${b.classNumber}-${b.subject}-${b.bookName}.zip`;
                          triggerInstantDownload(zipUrl, fileName);
                        }}
                      />
                    ))}
                  </div>
                )
              ) : loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4">
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                      <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-20 bg-slate-100 rounded-2xl"></div>
                      <div className="h-8 bg-slate-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : materials.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-4">
                  <FileText className="w-14 h-14 text-slate-300 mx-auto" />
                  <h3 className="text-lg font-bold text-slate-800">{t('study.noMaterialsFound')}</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {t('study.tryResettingFilters')}
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-2.5 rounded-xl bg-[#6C63FF] text-white font-bold text-xs shadow-md hover:opacity-90 transition"
                  >
                    {t('common.clearFilters')}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {materials.map(mat => (
                    <MaterialCard
                      key={mat.id}
                      material={mat}
                      onReadOnline={handleOpenReader}
                      onDownload={handleDownload}
                      onBookmark={handleToggleBookmark}
                    />
                  ))}
                </div>
              )}

              {/* Server-Side Pagination (Phase 13 & 23) */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-200">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => fetchMaterials(pagination.page - 1)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    ← {t('common.previous')}
                  </button>

                  <span className="text-xs font-bold text-slate-600 px-3">
                    {t('common.page')} {pagination.page} {t('common.of')} {pagination.totalPages}
                  </span>

                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchMaterials(pagination.page + 1)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition"
                  >
                    {t('common.next')} →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Filters Drawer / Sheet (Phase 25) */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm lg:hidden">
          <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6 shadow-2xl ml-auto flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#6C63FF]" />
                  <span>{t('study.filterSettings')}</span>
                </h3>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{t('study.subject')}</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                >
                  <option value="">{t('study.allSubjects')}</option>
                  {subjectPills.filter(s => s.id).map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Class */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{t('study.classGrade')}</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                >
                  <option value="">{t('study.allClasses')}</option>
                  {classesList.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Exam */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{t('study.targetExam')}</label>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                >
                  <option value="">{t('study.allExams')}</option>
                  {examsList.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">{t('study.language')}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['', 'HINDI', 'ENGLISH'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`py-1.5 rounded-lg text-xs font-bold border text-center ${
                        selectedLanguage === lang ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {lang === '' ? t('common.all') : lang === 'HINDI' ? (isHindi ? 'हिन्दी' : 'Hindi') : 'Eng'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={clearAllFilters}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                {t('study.reset')}
              </button>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#6C63FF] text-white font-bold text-xs shadow-md"
              >
                {t('study.applyFilters')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Browser PDF Reader Modal (Phase 11) */}
      <PdfReaderModal
        material={readerMaterial}
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
        onBookmarkToggle={(id) => {
          setMaterials(prev =>
            prev.map(m => (m.id === id ? { ...m, isBookmarked: !m.isBookmarked } : m))
          );
        }}
      />

      {/* NCERT Official Reader Modal */}
      <NcertReaderModal
        book={ncertReaderBook}
        isOpen={isNcertReaderOpen}
        onClose={() => setIsNcertReaderOpen(false)}
      />
    </div>
  );
};

// ----------------------------------------------------
// Reusable Material Card Component (Phase 4 & 5)
// ----------------------------------------------------
interface MaterialCardProps {
  material: Material;
  onReadOnline: (m: Material) => void;
  onDownload: (m: Material) => void;
  onBookmark: (m: Material) => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onReadOnline,
  onDownload,
  onBookmark,
}) => {
  const { isHindi, t } = useLanguage();

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group space-y-4 relative">
      {/* Top Badges */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] text-[11px] font-extrabold tracking-wide uppercase">
            {material.materialType?.replace('_', ' ') || 'NOTES'}
          </span>

          <div className="flex items-center gap-1.5">
            {material.isFree ? (
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                {t('common.free')}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-extrabold border border-purple-200">
                {t('common.paid')}
              </span>
            )}

            {/* Bookmark button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBookmark(material);
              }}
              className={`p-1.5 rounded-lg border transition ${
                material.isBookmarked
                  ? 'bg-rose-50 text-rose-600 border-rose-200'
                  : 'text-slate-400 hover:text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title={material.isBookmarked ? 'Saved to library' : 'Save material'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${material.isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <Link
          to={`/study-materials/${material.slug || material.id}`}
          className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#6C63FF] line-clamp-2 transition leading-snug"
        >
          {material.title}
        </Link>

        {/* Description / Topic Snippet */}
        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
          {material.description || t('study.defaultDesc')}
        </p>

        {/* Metadata Specs Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11px] text-slate-600 font-medium">
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            {material.subject}
          </span>
          {material.classGrade && (
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {material.classGrade}
            </span>
          )}
          {material.language && (
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              {material.language}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer: Metrics & Action Buttons */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>{material.fileSize} • {material.pageCount || 1} {isHindi ? 'पृष्ठ' : 'pp.'}</span>
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <Download className="w-3 h-3" />
            {(material.downloadsCount || 0).toLocaleString()} {isHindi ? 'डाउनलोड' : 'Downloads'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Read Online Button */}
          <button
            type="button"
            onClick={() => onReadOnline(material)}
            className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#6C63FF]" />
            <span>{t('study.readOnline')}</span>
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={() => onDownload(material)}
            className="flex-1 py-2 rounded-xl bg-[#6C63FF] hover:bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('common.download')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Reusable NCERT Book Grid Card Component
// ----------------------------------------------------
interface NcertBookGridCardProps {
  book: NcertBook;
  onReadOnline: (b: NcertBook) => void;
  onDownload: (b: NcertBook) => void;
}

const NcertBookGridCard: React.FC<NcertBookGridCardProps> = ({
  book,
  onReadOnline,
  onDownload,
}) => {
  const { isHindi, t } = useLanguage();
  const detailUrl = `/study-material/ncert/class-${book.classNumber}/${encodeURIComponent(
    book.subject.toLowerCase()
  )}/${book.slug}`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group space-y-4">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-extrabold tracking-wide">
              {isHindi ? `कक्षा ${book.classNumber}` : `Class ${book.classNumber}`}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-extrabold border border-slate-200">
              {book.medium}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>{isHindi ? 'आधिकारिक NCERT' : 'Official NCERT'}</span>
          </span>
        </div>

        {/* Thumbnail + Title Row */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-20 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt={book.bookName}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <BookOpen className="w-7 h-7 text-blue-600/60" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <Link
              to={detailUrl}
              className="text-sm font-bold text-slate-900 group-hover:text-blue-600 line-clamp-2 transition leading-snug"
            >
              {book.bookName}
            </Link>
            {book.bookNameHi && (
              <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                {book.bookNameHi}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-600">
              <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {book.subject}
              </span>
              <span>•</span>
              <span>{book.chapterCount || (book.chapters ? book.chapters.length : 0)} {isHindi ? 'अध्याय' : 'Chapters'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onReadOnline(book)}
            className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t('study.readOnline')}</span>
          </button>

          <button
            type="button"
            onClick={() => onDownload(book)}
            className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
            title="Download complete NCERT book ZIP"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('study.downloadBook')} ⬇</span>
          </button>
        </div>

        <Link
          to={detailUrl}
          className="w-full py-1.5 rounded-lg text-slate-500 hover:text-blue-600 text-[11px] font-bold flex items-center justify-center gap-1 transition"
        >
          <span>{t('study.viewAllChapters')} →</span>
        </Link>
      </div>
    </div>
  );
};

export default StudyMaterialsPage;
