import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Download,
  ExternalLink,
  ShieldCheck,
  Share2,
  Check,
  ChevronRight,
  List,
  Eye,
  Info,
  Calendar,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../../services/api';
import { NcertBook, NcertChapter } from '../../types';
import { NcertReaderModal } from '../../components/ncert/NcertReaderModal';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  getNcertStaticPdfUrl,
  getNcertCompleteBookZipUrl,
  triggerInstantDownload,
} from '../../utils/ncertUtils';

export const NcertBookDetailPage: React.FC = () => {
  const { isHindi, t } = useLanguage();
  const { classNumber, subject, bookSlug, slug } = useParams<{
    classNumber?: string;
    subject?: string;
    bookSlug?: string;
    slug?: string;
  }>();

  const targetSlug = bookSlug || slug;
  const navigate = useNavigate();
  const { success: toastSuccess } = useToast();

  const [book, setBook] = useState<NcertBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Reader Modal
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [initialChapter, setInitialChapter] = useState(0);

  useEffect(() => {
    if (!targetSlug) return;
    setLoading(true);

    api.ncert
      .getByIdOrSlug(targetSlug)
      .then((res) => {
        if (res.success && res.data) {
          setBook(res.data);
          api.ncert.trackView(res.data.id).catch(() => {});
        }
      })
      .catch((err) => {
        console.error('Error fetching book detail:', err);
      })
      .finally(() => setLoading(false));
  }, [targetSlug]);

  // Dynamic SEO title & description
  useEffect(() => {
    if (book) {
      document.title = `NCERT Class ${book.classNumber} ${book.subject} Book (${book.bookName}) — Official PDF | LoSamajhLo`;

      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          `Official NCERT Class ${book.classNumber} ${book.subject} textbook (${book.bookName}) published by the National Council of Educational Research and Training (NCERT). Direct official links and chapter PDFs.`
        );
      }
    }
  }, [book]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toastSuccess('Book URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOfficialDownload = (url?: string, chapterNum?: number) => {
    if (book) {
      api.ncert.trackDownload(book.id).catch(() => {});
    }
    const targetUrl = url || book?.officialPdfUrl || '';
    if (!url || chapterNum === 0 || chapterNum === undefined) {
      // Complete book download
      const zipUrl = getNcertCompleteBookZipUrl(targetUrl);
      const fileName = `NCERT-Class-${book?.classNumber}-${book?.subject}-${book?.bookName}.zip`;
      triggerInstantDownload(zipUrl, fileName);
    } else {
      // Individual chapter download
      const staticPdf = getNcertStaticPdfUrl(targetUrl, chapterNum);
      const fileName = `NCERT-Class-${book?.classNumber}-${book?.subject}-Ch-${chapterNum}.pdf`;
      triggerInstantDownload(staticPdf, fileName);
    }
  };

  const openReader = (chapterNum: number = 0) => {
    setInitialChapter(chapterNum);
    setIsReaderOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">Loading Official NCERT Book...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-16 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 border border-slate-200 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-xl font-black text-slate-900">Book Not Found</h2>
          <p className="text-xs text-slate-600">
            The requested NCERT textbook could not be found or has been moved.
          </p>
          <Link
            to="/study-material/ncert"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md"
          >
            Back to NCERT Library
          </Link>
        </div>
      </div>
    );
  }

  const chapters: NcertChapter[] = book.chapters || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* 1. Official Attribution Bar */}
      <div className="bg-[#0B2A63] text-white border-b border-blue-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-blue-100">
              Source: National Council of Educational Research and Training (NCERT)
            </span>
          </div>
          <div className="flex items-center gap-3 text-blue-200">
            <span>Official Educational Resource</span>
            <a
              href={book.officialPageUrl || 'https://ncert.nic.in/textbook.php'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-300 font-bold underline inline-flex items-center gap-1"
            >
              <span>Verify on ncert.nic.in</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-x-auto pb-1">
          <Link to="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link to="/study-materials" className="hover:text-blue-600 transition">
            Study Material
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link to="/study-material/ncert" className="hover:text-blue-600 transition">
            NCERT Books
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link
            to={`/study-material/ncert/class-${book.classNumber}`}
            className="hover:text-blue-600 transition"
          >
            Class {book.classNumber}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-slate-900 font-bold truncate">{book.bookName}</span>
        </nav>

        {/* Book Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-8 items-start">
          {/* Cover Art */}
          <div className="w-40 sm:w-48 h-56 sm:h-64 rounded-2xl shadow-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 relative group">
            {book.coverImageUrl ? (
              <img
                src={book.coverImageUrl}
                alt={book.bookName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}
            <div className="absolute inset-0 p-4 flex flex-col items-center justify-center bg-gradient-to-b from-blue-700 to-indigo-900 text-white text-center">
              <BookOpen className="w-10 h-10 mb-2 text-blue-200" />
              <span className="text-xs font-black uppercase tracking-wider line-clamp-3">
                {book.bookName}
              </span>
              <span className="text-[10px] text-blue-200 mt-1">Class {book.classNumber}</span>
            </div>
          </div>

          {/* Book Info */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-600 text-white shadow-sm">
                Class {book.classNumber}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                {book.subject}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                {book.medium} Medium
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Official NCERT Source</span>
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {book.bookName}
              </h1>
              {book.bookNameHi && (
                <p className="text-base font-semibold text-slate-600 mt-1">{book.bookNameHi}</p>
              )}
            </div>

            {/* Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Edition</span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {book.edition || 'Latest Edition'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Academic Year</span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {book.academicYear || '2025-26'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Chapters</span>
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {book.chapterCount || chapters.length} Chapters
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">NCERT Code</span>
                <span className="text-xs font-mono font-bold text-blue-600 truncate block">
                  {book.bookCode || 'Official'}
                </span>
              </div>
            </div>

            {/* Official Legal Notice */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Authoritative Educational Content</span>
              </p>
              <p className="text-blue-800/90 text-[11px] leading-relaxed">
                This textbook is published by the National Council of Educational Research and Training (NCERT), New Delhi. LoSamajhLo provides a student-friendly discovery catalog that opens and links directly to official NCERT publications. LoSamajhLo does not own, host, or alter these materials.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => openReader(0)}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 transition"
              >
                <Eye className="w-4 h-4" />
                <span>Read Full Book Online</span>
              </button>

              <button
                onClick={() => handleOfficialDownload()}
                className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center gap-2 shadow-md transition"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <span>Official NCERT PDF</span>
              </button>

              <button
                onClick={handleShare}
                className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                title="Share this book"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Share2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <List className="w-5 h-5 text-blue-600" />
                <span>{t('ncert.chapterCatalogTitle')}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isHindi ? 'ऑनलाइन पढ़ने या आधिकारिक एनसीईआरटी पीडीएफ खोलने के लिए किसी भी अध्याय पर क्लिक करें।' : 'Click any chapter to read online or open official PDF from NCERT.'}
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {chapters.length} {isHindi ? 'अध्याय उपलब्ध' : 'Chapters Available'}
            </span>
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              Chapter breakdown will be loaded directly from the complete textbook. Click "Read Full Book Online" above.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {chapters.map((ch) => (
                <div
                  key={ch.chapterNumber}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-3 rounded-xl transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {ch.chapterNumber}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{ch.title}</h4>
                      {ch.titleHi && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{ch.titleHi}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => openReader(ch.chapterNumber)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read Online</span>
                    </button>
                    <button
                      onClick={() => handleOfficialDownload(ch.pdfUrl, ch.chapterNumber)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white font-bold text-xs flex items-center gap-1.5 transition"
                      title="Download official PDF chapter"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reader Modal */}
      <NcertReaderModal
        book={book}
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
        initialChapter={initialChapter}
      />
    </div>
  );
};

export default NcertBookDetailPage;
