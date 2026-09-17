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
  ChevronLeft,
  ChevronRight,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { NcertBook, NcertChapter } from '../../types';
import { api } from '../../services/api';
import {
  getNcertStaticPdfUrl,
  getNcertCompleteBookZipUrl,
  getNcertEmbedViewerUrl,
  triggerInstantDownload,
} from '../../utils/ncertUtils';

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
  const [selectedChapter, setSelectedChapter] = useState<number>(initialChapter || 1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'desk' | 'viewer' | 'chapters'>('desk');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (book) {
      if (initialChapter !== undefined && initialChapter > 0) {
        setSelectedChapter(initialChapter);
        setViewMode('desk');
      } else if (book.chapters && book.chapters.length > 0) {
        setSelectedChapter(book.chapters[0].chapterNumber);
        setViewMode('desk');
      } else {
        setSelectedChapter(0);
        setViewMode('desk');
      }
      setIframeLoaded(false);
      api.ncert.trackView(book.id).catch(() => {});
    }
  }, [book, initialChapter, isOpen]);

  // Reset iframe loaded status when chapter changes
  useEffect(() => {
    setIframeLoaded(false);
  }, [selectedChapter, viewMode]);

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

  // Active raw target URL
  const activeRawUrl = currentChapter ? currentChapter.pdfUrl : book.officialPdfUrl;

  // Resolved static PDF URL and Embed URL
  const staticPdfUrl = getNcertStaticPdfUrl(activeRawUrl, selectedChapter);
  const embedViewerUrl = getNcertEmbedViewerUrl(activeRawUrl, selectedChapter);

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

  const handleReadChapter = (chapterNum: number) => {
    setSelectedChapter(chapterNum);
    setViewMode('desk');
  };

  const handleDownloadChapter = (ch?: NcertChapter) => {
    const targetChapter = ch || currentChapter;
    const targetNum = targetChapter ? targetChapter.chapterNumber : selectedChapter;
    const rawUrl = targetChapter ? targetChapter.pdfUrl : activeRawUrl;
    const directUrl = getNcertStaticPdfUrl(rawUrl, targetNum);

    setDownloading(true);
    api.ncert.trackDownload(book.id).catch(() => {});

    const cleanTitle = (targetChapter?.title || `Chapter-${targetNum}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `NCERT-Class-${book.classNumber}-${book.subject}-Ch-${targetNum}-${cleanTitle}.pdf`;

    triggerInstantDownload(directUrl || rawUrl, fileName);

    setTimeout(() => {
      setDownloading(false);
    }, 1500);
  };

  const handleDownloadCompleteBook = () => {
    const zipUrl = getNcertCompleteBookZipUrl(book.officialPdfUrl);
    api.ncert.trackDownload(book.id).catch(() => {});
    const fileName = `NCERT-Class-${book.classNumber}-${book.subject}-${book.bookName}.zip`;
    triggerInstantDownload(zipUrl, fileName);
  };

  const handleOpenExternal = (url: string) => {
    api.ncert.trackDownload(book.id).catch(() => {});
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Chapter Navigation Helpers
  const currentIdx = chapters.findIndex((c) => c.chapterNumber === selectedChapter);
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null;
  const nextChapter = currentIdx >= 0 && currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 text-white rounded-2xl shadow-2xl flex flex-col border border-slate-700/80 overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[92vh]'
        }`}
      >
        {/* 1. Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 shrink-0 gap-3">
          {/* Left: Book Metadata */}
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

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Complete Book Download */}
            <button
              onClick={handleDownloadCompleteBook}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
              title="Download Complete NCERT Textbook ZIP"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Complete Book ZIP</span>
              <span className="sm:hidden">ZIP</span>
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

        {/* 2. Navigation / View Mode Toggle Bar */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('desk')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'desk'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chapter Desk (अध्याय केंद्र)</span>
            </button>

            <button
              onClick={() => setViewMode('viewer')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'viewer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Direct PDF (पीडीएफ दर्शक)</span>
            </button>

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
          </div>

          {/* Prev / Next Shortcuts */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => prevChapter && handleReadChapter(prevChapter.chapterNumber)}
              disabled={!prevChapter}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition flex items-center gap-1"
              title="Previous Chapter"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden md:inline">Prev</span>
            </button>

            <span className="text-[11px] font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              Ch {selectedChapter} / {chapters.length || 1}
            </span>

            <button
              onClick={() => nextChapter && handleReadChapter(nextChapter.chapterNumber)}
              disabled={!nextChapter}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition flex items-center gap-1"
              title="Next Chapter"
            >
              <span className="hidden md:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. Official Source Attribution Notice */}
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

        {/* 4. Main Body Content */}
        {viewMode === 'desk' ? (
          /* ================= MODE 1: CHAPTER DESK (Instant, Rich & 100% Reliable) ================= */
          <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* Quick Chapter Selector Pills */}
            {chapters.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Quick Jump to Chapter (अध्याय चुनें):</span>
                  <button
                    onClick={() => setViewMode('chapters')}
                    className="text-blue-400 hover:text-blue-300 underline text-xs"
                  >
                    View All Details
                  </button>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
                  {chapters.map((ch) => {
                    const isActive = ch.chapterNumber === selectedChapter;
                    return (
                      <button
                        key={ch.chapterNumber}
                        onClick={() => handleReadChapter(ch.chapterNumber)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        Ch {ch.chapterNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Chapter Showcase Card */}
            <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-[#131b2e] to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden space-y-5">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Chapter {selectedChapter} • Class {book.classNumber} {book.subject}</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                    {currentChapter?.title || `${book.bookName} - Chapter ${selectedChapter}`}
                  </h3>

                  {currentChapter?.titleHi && (
                    <p className="text-sm sm:text-base font-medium text-blue-200">
                      {currentChapter.titleHi}
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
                    {book.medium} Medium
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                    Verified Syllabus
                  </span>
                </div>
              </div>

              {/* 3 High-Speed Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* 1. Instant Download Button */}
                <button
                  onClick={() => handleDownloadChapter()}
                  disabled={downloading}
                  className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 transition group"
                >
                  <Download className={`w-5 h-5 ${downloading ? 'animate-bounce' : 'group-hover:translate-y-0.5 transition-transform'}`} />
                  <span>{downloading ? 'Downloading...' : 'Instant Download PDF'}</span>
                  <span className="text-[10px] text-blue-200 font-normal">Direct Static PDF • Fast</span>
                </button>

                {/* 2. Embedded Reader View */}
                <button
                  onClick={() => setViewMode('viewer')}
                  className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 border border-slate-700 transition group"
                >
                  <FileText className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>Direct PDF Viewer</span>
                  <span className="text-[10px] text-slate-400 font-normal">Read In-Page with Controls</span>
                </button>

                {/* 3. Open in Dedicated Tab */}
                <button
                  onClick={() => handleOpenExternal(staticPdfUrl || activeRawUrl)}
                  className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 border border-slate-700 transition group"
                >
                  <ExternalLink className="w-5 h-5 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Open in Full Screen</span>
                  <span className="text-[10px] text-slate-400 font-normal">Dedicated Browser Tab</span>
                </button>
              </div>

              {/* Informative Government Server Advisory */}
              <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-900/50 flex items-start gap-3 text-xs text-blue-200/90 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-white">
                    तेज़ और निर्बाध अध्ययन (Fast & Error-Free Study Access)
                  </p>
                  <p>
                    सरकारी सर्वर (NCERT NIC) पर कभी-कभी भारी ट्रैफिक के कारण बाहरी कनेक्शन में देरी हो सकती है। यदि इन-पेज प्रिव्यू धीमा हो, तो <strong>"Instant Download PDF"</strong> बटन दबाकर अध्याय को तुरंत अपने फोन या कंप्यूटर में डाउनलोड करके बिना रुके पढ़ें।
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Navigation Footer inside Desk */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => prevChapter && handleReadChapter(prevChapter.chapterNumber)}
                disabled={!prevChapter}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-300 flex items-center gap-2 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous: Ch {prevChapter ? prevChapter.chapterNumber : ''}</span>
              </button>

              <button
                onClick={() => nextChapter && handleReadChapter(nextChapter.chapterNumber)}
                disabled={!nextChapter}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-white flex items-center gap-2 transition shadow-md"
              >
                <span>Next: Ch {nextChapter ? nextChapter.chapterNumber : ''}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : viewMode === 'viewer' ? (
          /* ================= MODE 2: DIRECT PDF VIEWER (With Smart Fallback) ================= */
          <div className="flex-1 bg-slate-950 relative flex flex-col p-2 sm:p-4 overflow-hidden">
            {/* Viewer Top Sub-Bar */}
            <div className="flex items-center justify-between pb-2 px-1 text-xs text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">
                  Ch {selectedChapter}: {currentChapter?.title || book.bookName}
                </span>
                <span className="hidden sm:inline text-slate-500">|</span>
                <span className="hidden sm:inline text-slate-400">Class {book.classNumber} {book.subject}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadChapter()}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => handleOpenExternal(staticPdfUrl || activeRawUrl)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1 border border-slate-700 transition"
                  title="Open in Full Window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Tab</span>
                </button>
              </div>
            </div>

            {/* Iframe Container with Loading state */}
            <div className="flex-1 w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 relative">
              {!iframeLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-10 space-y-3 p-4 text-center">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-xs sm:text-sm font-bold text-slate-300">
                    Loading Official Document ({book.subject} - Chapter {selectedChapter})...
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm">
                    Connecting to official NCERT document servers. If loading takes more than a few seconds:
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleDownloadChapter()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Direct Download Chapter PDF</span>
                    </button>
                    <button
                      onClick={() => setViewMode('desk')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                    >
                      Chapter Desk
                    </button>
                  </div>
                </div>
              )}

              <iframe
                src={embedViewerUrl}
                title={`${book.bookName} Chapter ${selectedChapter}`}
                className="w-full h-full border-0 bg-white"
                allow="fullscreen"
                onLoad={() => setIframeLoaded(true)}
              />
            </div>

            {/* Quick Recovery Bottom Strip */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 px-1 shrink-0">
              <span className="truncate">
                Stuck or slow? Government servers may throttle previews.
              </span>
              <button
                onClick={() => handleDownloadChapter()}
                className="text-blue-400 hover:text-blue-300 font-bold underline shrink-0 ml-2"
              >
                Download PDF File Directly ⬇
              </button>
            </div>
          </div>
        ) : (
          /* ================= MODE 3: ALL CHAPTERS LIST ================= */
          <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-y-auto space-y-4">
            {/* Quick Hero Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Official Chapter-wise Textbooks (कक्षावार एवं अध्यायवार)</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Select any chapter below to read online or download directly in seconds with zero timeouts.
                </p>
              </div>
              <button
                onClick={handleDownloadCompleteBook}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Complete Book ZIP</span>
              </button>
            </div>

            {/* Chapters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chapters.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-400 text-xs">
                  Full book is available directly. Click "Complete Book ZIP" or open on NCERT portal.
                </div>
              ) : (
                chapters.map((ch) => (
                  <div
                    key={ch.chapterNumber}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 group ${
                      ch.chapterNumber === selectedChapter
                        ? 'bg-blue-950/40 border-blue-500/60'
                        : 'bg-slate-900/80 border-slate-800 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border ${
                        ch.chapterNumber === selectedChapter
                          ? 'bg-blue-600 text-white border-blue-400'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
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

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Read Button -> switches to desk */}
                      <button
                        onClick={() => handleReadChapter(ch.chapterNumber)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition"
                        title="Read Chapter"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </button>

                      {/* Instant Download Button */}
                      <button
                        onClick={() => handleDownloadChapter(ch)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                        title="Download Chapter PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NcertReaderModal;
