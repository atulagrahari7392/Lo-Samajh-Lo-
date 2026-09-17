import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Download,
  ExternalLink,
  ShieldCheck,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Globe,
  Sparkles,
  RotateCcw,
  BookMarked,
  Info,
  List,
  Eye,
} from 'lucide-react';
import { api } from '../../services/api';
import { NcertBook } from '../../types';
import { NcertReaderModal } from '../../components/ncert/NcertReaderModal';
import { useToast } from '../../context/ToastContext';
import { getNcertCompleteBookZipUrl, triggerInstantDownload } from '../../utils/ncertUtils';

export const NcertBooksPage: React.FC = () => {
  const { classNumber: routeClass, subject: routeSubject } = useParams<{
    classNumber?: string;
    subject?: string;
  }>();

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { error: toastError } = useToast();

  // Selected filters
  const parsedClassNumber = routeClass
    ? parseInt(routeClass.replace(/[^0-9]/g, ''), 10) || 10
    : parseInt(searchParams.get('class') || '10', 10);

  const [selectedClass, setSelectedClass] = useState<number>(parsedClassNumber);
  const [selectedSubject, setSelectedSubject] = useState<string>(
    routeSubject ? decodeURIComponent(routeSubject) : searchParams.get('subject') || 'ALL'
  );
  const [selectedMedium, setSelectedMedium] = useState<string>(searchParams.get('medium') || 'ALL');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchParams.get('q') || '');

  // Data state
  const [books, setBooks] = useState<NcertBook[]>([]);
  const [classesInfo, setClassesInfo] = useState<any[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 16, totalPages: 1 });

  // Reader Modal State
  const [readerBook, setReaderBook] = useState<NcertBook | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync route params when URL changes
  useEffect(() => {
    if (routeClass) {
      const cls = parseInt(routeClass.replace(/[^0-9]/g, ''), 10);
      if (cls && cls !== selectedClass) setSelectedClass(cls);
    }
    if (routeSubject) {
      const subj = decodeURIComponent(routeSubject);
      if (subj !== selectedSubject) setSelectedSubject(subj);
    }
  }, [routeClass, routeSubject]);

  // Update dynamic SEO title & meta description
  useEffect(() => {
    const classText = selectedClass ? `Class ${selectedClass}` : 'Classes 1–12';
    const subjectText = selectedSubject && selectedSubject !== 'ALL' ? ` ${selectedSubject}` : '';
    document.title = `NCERT ${classText}${subjectText} Books — Official PDF | LoSamajhLo`;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        `Access official NCERT ${classText}${subjectText} textbooks directly from the official NCERT portal. Fast, student-friendly discovery on LoSamajhLo.`
      );
    }
  }, [selectedClass, selectedSubject]);

  // Fetch classes info on mount
  useEffect(() => {
    api.ncert
      .getClasses()
      .then((res) => {
        if (res.success && res.data) {
          setClassesInfo(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch available subjects when selectedClass changes
  useEffect(() => {
    api.ncert
      .getSubjects(selectedClass)
      .then((res) => {
        if (res.success && res.data) {
          setAvailableSubjects(res.data);
          // If current subject is not in new list, reset to ALL
          if (selectedSubject !== 'ALL' && !res.data.includes(selectedSubject)) {
            setSelectedSubject('ALL');
          }
        }
      })
      .catch(() => {});
  }, [selectedClass]);

  // Fetch books catalog
  useEffect(() => {
    setLoading(true);
    const params: Record<string, any> = {
      classNumber: selectedClass,
      limit: 24,
    };
    if (selectedSubject && selectedSubject !== 'ALL') {
      params.subject = selectedSubject;
    }
    if (selectedMedium && selectedMedium !== 'ALL') {
      params.medium = selectedMedium;
    }
    if (debouncedSearch && debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    api.ncert
      .getAll(params)
      .then((res) => {
        if (res.success) {
          setBooks(res.data || []);
          if (res.pagination) setPagination(res.pagination);
        }
      })
      .catch((err) => {
        console.error('Error fetching NCERT books:', err);
      })
      .finally(() => setLoading(false));
  }, [selectedClass, selectedSubject, selectedMedium, debouncedSearch]);

  const handleClassChange = (classNum: number) => {
    setSelectedClass(classNum);
    setSelectedSubject('ALL');
    navigate(`/study-material/ncert/class-${classNum}`, { replace: true });
  };

  const handleSubjectChange = (subj: string) => {
    setSelectedSubject(subj);
    if (subj === 'ALL') {
      navigate(`/study-material/ncert/class-${selectedClass}`, { replace: true });
    } else {
      navigate(`/study-material/ncert/class-${selectedClass}/${encodeURIComponent(subj.toLowerCase())}`, {
        replace: true,
      });
    }
  };

  const handleOfficialDownload = (e: React.MouseEvent, book: NcertBook) => {
    e.stopPropagation();
    api.ncert.trackDownload(book.id).catch(() => {});
    const zipUrl = getNcertCompleteBookZipUrl(book.officialPdfUrl);
    const fileName = `NCERT-Class-${book.classNumber}-${book.subject}-${book.bookName}.zip`;
    triggerInstantDownload(zipUrl, fileName);
  };

  const openReader = (e: React.MouseEvent, book: NcertBook) => {
    e.stopPropagation();
    setReaderBook(book);
    setIsReaderOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* 1. Official Attribution & Authority Banner */}
      <div className="bg-[#0B2A63] text-white border-b border-blue-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-blue-100">
              आधिकारिक एनसीईआरटी पाठ्यपुस्तक पोर्टल (NCERT Official Textbooks Library)
            </span>
          </div>
          <div className="flex items-center gap-3 text-blue-200">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Source: National Council of Educational Research and Training (NCERT)</span>
            </div>
            <a
              href="https://ncert.nic.in/textbook.php"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-300 font-bold underline inline-flex items-center gap-0.5"
            >
              <span>ncert.nic.in</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Hero Header */}
      <div className="bg-white border-b border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4">
            <Link to="/" className="hover:text-[#6C63FF] transition">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/study-materials" className="hover:text-[#6C63FF] transition">
              Study Material
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-900 font-bold">NCERT Official Books</span>
            {selectedClass && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#6C63FF] font-bold">Class {selectedClass}</span>
              </>
            )}
            {selectedSubject !== 'ALL' && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-900 font-bold">{selectedSubject}</span>
              </>
            )}
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold mb-3">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Classes 1 to 12 • All Subjects • Hindi & English Mediums</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                NCERT Official Books Library
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed">
                कक्षा 1 से 12 तक की सभी आधिकारिक एनसीईआरटी पाठ्यपुस्तकों का संपूर्ण संग्रह। आधिकारिक स्रोत से सीधे ऑनलाइन पढ़ें या मूल पीडीएफ प्राप्त करें।
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  All PDF documents open directly from the official NCERT portal. LoSamajhLo does not re-host or alter NCERT materials.
                </span>
              </p>
            </div>

            {/* Quick Search */}
            <div className="w-full lg:max-w-md">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="खोजें: Science Class 10, गणित, Physics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* 3. Class Navigation Bar (Classes 1 to 12) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Class (कक्षा चुनें):</span>
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Showing books for <strong>Class {selectedClass}</strong>
            </span>
          </div>

          {/* Class Pills (Responsive horizontal scroller) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((cls) => {
              const isSelected = selectedClass === cls;
              return (
                <button
                  key={cls}
                  onClick={() => handleClassChange(cls)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition flex flex-col items-center justify-center min-w-[76px] ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 scale-105'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>Class {cls}</span>
                  <span className={`text-[10px] font-normal ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    कक्षा {cls}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Subject & Medium Filters Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Subjects Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1">
            <span className="text-xs font-bold text-slate-500 shrink-0 uppercase">Subject:</span>
            <button
              onClick={() => handleSubjectChange('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                selectedSubject === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Subjects ({pagination.total})
            </button>
            {availableSubjects.map((subj) => {
              const isSelected = selectedSubject.toLowerCase() === subj.toLowerCase();
              return (
                <button
                  key={subj}
                  onClick={() => handleSubjectChange(subj)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {subj}
                </button>
              );
            })}
          </div>

          {/* Medium Selector (Language) */}
          <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Medium:</span>
            </span>
            {['ALL', 'English', 'Hindi', 'Urdu'].map((med) => {
              const isSelected = selectedMedium === med;
              return (
                <button
                  key={med}
                  onClick={() => setSelectedMedium(med)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {med === 'ALL' ? 'All Mediums' : med}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Books Catalog Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 animate-pulse"
              >
                <div className="h-44 bg-slate-200 rounded-xl" />
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-10 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 space-y-4 max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No NCERT Books Found</h3>
            <p className="text-xs text-slate-600">
              No official textbooks match the current filters for Class {selectedClass}. Try switching to "All Subjects" or searching with a different term.
            </p>
            <button
              onClick={() => {
                setSelectedSubject('ALL');
                setSelectedMedium('ALL');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => {
              const bookDetailUrl = `/study-material/ncert/class-${book.classNumber}/${encodeURIComponent(
                book.subject.toLowerCase()
              )}/${book.slug}`;

              return (
                <div
                  key={book.id}
                  onClick={() => navigate(bookDetailUrl)}
                  className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
                >
                  {/* Card Cover Area */}
                  <div className="relative bg-gradient-to-br from-slate-100 via-blue-50/50 to-indigo-50/30 p-5 flex items-center justify-center border-b border-slate-100 min-h-[200px]">
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shadow-sm">
                        Class {book.classNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-700 border border-slate-200">
                        {book.medium}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 z-10">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>NCERT</span>
                      </span>
                    </div>

                    {/* Book Cover Image */}
                    <div className="w-28 h-36 rounded-lg shadow-md overflow-hidden bg-white border border-slate-200 group-hover:scale-105 transition-transform duration-300 flex items-center justify-center text-center p-2 relative">
                      {book.coverImageUrl ? (
                        <img
                          src={book.coverImageUrl}
                          alt={book.bookName}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if NCERT image fails to load
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 p-2 flex flex-col items-center justify-center bg-gradient-to-b from-blue-700 to-indigo-900 text-white text-center">
                        <BookOpen className="w-6 h-6 mb-1 text-blue-200" />
                        <span className="text-[10px] font-black uppercase tracking-wider line-clamp-2">
                          {book.bookName}
                        </span>
                        <span className="text-[9px] text-blue-200 mt-0.5">Class {book.classNumber}</span>
                      </div>
                    </div>

                    {/* Edition Pill */}
                    {book.edition && (
                      <div className="absolute bottom-2 left-3 right-3 text-center">
                        <span className="text-[10px] font-medium text-slate-500 truncate block">
                          {book.edition}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Subject Tag */}
                      <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                        {book.subject}
                      </div>

                      {/* Book Title */}
                      <h3 className="text-base font-extrabold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {book.bookName}
                      </h3>
                      {book.bookNameHi && (
                        <p className="text-xs font-medium text-slate-500 line-clamp-1 mt-0.5">
                          {book.bookNameHi}
                        </p>
                      )}

                      {/* Metadata row */}
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                        {book.chapterCount > 0 && (
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <List className="w-3 h-3 text-slate-400" />
                            <span>{book.chapterCount} Chapters</span>
                          </span>
                        )}
                        {book.bookCode && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-400">Code: {book.bookCode}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      {/* Read Online */}
                      <button
                        onClick={(e) => openReader(e, book)}
                        className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition duration-200 shadow-sm"
                        title="Read this book online"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read Online</span>
                      </button>

                      {/* Official PDF Download */}
                      <button
                        onClick={(e) => handleOfficialDownload(e, book)}
                        className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition duration-200 shadow-sm"
                        title="Open official NCERT textbook PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-400" />
                        <span className="truncate">Official PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reader Modal */}
      <NcertReaderModal
        book={readerBook}
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
      />
    </div>
  );
};

export default NcertBooksPage;
