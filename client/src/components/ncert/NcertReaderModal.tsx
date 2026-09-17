import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  BookOpen,
  Share2,
  Check,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Download,
  FileText,
  AlertCircle,
  List,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { NcertBook, NcertChapter } from '../../types';
import { api } from '../../services/api';

interface NcertReaderModalProps {
  book: NcertBook | null;
  isOpen: boolean;
  onClose: () => void;
  initialChapter?: number;
}

export const NcertReaderModal: React.FC<NcertReaderModalProps> = ({
  book,
  isOpen,
  onClose,
  initialChapter,
}) => {
  const [selectedChapter, setSelectedChapter] = useState<number>(initialChapter || 0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'chapters' | 'preview'>('chapters');

  useEffect(() => {
    if (book) {
      setSelectedChapter(initialChapter || 0);
      api.ncert.trackView(book.id).catch(() => {});
    }
  }, [book, initialChapter]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFullscreen) setIsFullscreen(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen || !book) return null;

  const chapters: NcertChapter[] = book.chapters || [];
  const currentChapter = chapters.find((c) => c.chapterNumber === selectedChapter);

  // Active target PDF URL on official NCERT domain
  const activeUrl = currentChapter ? currentChapter.pdfUrl : book.officialPdfUrl;

  const handleShare = () => {
    const url = `${window.location.origin}/study-material/ncert/class-${book.classNumber}/${encodeURIComponent(
      book.subject.toLowerCase()
    )}/${book.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openChapterDirectly = (url: string) => {
    api.ncert.trackDownload(book.id).catch(() => {});
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 text-white rounded-2xl shadow-2xl flex flex-col border border-slate-700/80 overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[90vh]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 shrink-0 gap-3">
          {/* Left: Book Meta */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md md:max-w-lg">
                  {book.bookName} {book.bookNameHi ? `(${book.bookNameHi})` : ''}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> Official NCERT
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-blue-400 font-semibold">Class {book.classNumber}</span>
                <span>•</span>
                <span>{book.subject}</span>
                <span>•</span>
                <span>{book.medium} Medium</span>
                {book.academicYear && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">Session {book.academicYear}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Open Full Book on Official NCERT */}
            <button
              onClick={() => openChapterDirectly(book.officialPdfUrl)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
              title="Open full book on official NCERT server"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Complete Book</span>
              <span className="sm:hidden">Full Book</span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Share Book Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition hidden sm:flex"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
              title="Close Reader"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode Toggle Bar */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('chapters')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'chapters'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>All Chapters ({chapters.length})</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'preview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Direct Preview</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Directly from official National Council of Educational Research and Training (NCERT)
          </span>
        </div>

        {/* Official Source Attribution Notice */}
        <div className="px-4 py-1.5 bg-blue-950/60 border-b border-blue-900/40 text-[11px] text-blue-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">
              <strong>Source:</strong> National Council of Educational Research and Training (NCERT), New Delhi.
            </span>
          </div>
          <a
            href={book.officialPageUrl || 'https://ncert.nic.in/textbook.php'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-300 hover:text-white underline font-semibold shrink-0"
          >
            <span>ncert.nic.in</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Main Content Area */}
        {viewMode === 'chapters' ? (
          <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-y-auto space-y-4">
            {/* Quick Hero Banner inside modal */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Official Chapter-wise Textbooks (कक्षावार एवं अध्यायवार)</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Select any chapter below to open and read directly from the official NCERT portal with zero errors.
                </p>
              </div>
              <button
                onClick={() => openChapterDirectly(book.officialPdfUrl)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition shadow-md"
              >
                <span>Full Book / Index ↗</span>
              </button>
            </div>

            {/* Chapters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chapters.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-400 text-xs">
                  Full book is available directly on the official portal. Click the "Open Complete Book" button above.
                </div>
              ) : (
                chapters.map((ch) => (
                  <div
                    key={ch.chapterNumber}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/60 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                        {ch.chapterNumber}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                          {ch.title}
                        </h4>
                        {ch.titleHi && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{ch.titleHi}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => openChapterDirectly(ch.pdfUrl)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 shadow-sm transition"
                      title="Read Chapter Online"
                    >
                      <span>Read ↗</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-slate-950 relative flex flex-col items-center justify-center p-4">
            <div className="w-full h-full rounded-xl overflow-hidden border border-slate-800 bg-white flex flex-col">
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(activeUrl)}&embedded=true`}
                title={`${book.bookName} Official PDF`}
                className="w-full h-full border-0"
                allow="fullscreen"
              />
            </div>

            {/* Fallback Action */}
            <div className="absolute bottom-6 px-4 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-xl flex items-center gap-3 text-xs text-slate-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Best experience: Open directly on NCERT's official portal</span>
              <button
                onClick={() => openChapterDirectly(activeUrl)}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold inline-flex items-center gap-1 transition"
              >
                <span>Open in Full Screen</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NcertReaderModal;
