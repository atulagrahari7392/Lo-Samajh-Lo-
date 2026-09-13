import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  ExternalLink,
  FileText,
  Bookmark,
  Share2,
  Check,
} from 'lucide-react';
import { Material } from '../../types';
import { api } from '../../services/api';

interface PdfReaderModalProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onBookmarkToggle?: (materialId: string) => void;
}

export const PdfReaderModal: React.FC<PdfReaderModalProps> = ({
  material,
  isOpen,
  onClose,
  onBookmarkToggle,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(material?.isBookmarked || false);

  useEffect(() => {
    if (material) {
      setIsBookmarked(!!material.isBookmarked);
      setZoomLevel(100);
      // Track view
      api.materials.incrementView(material.id).catch(() => {});
    }
  }, [material]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen || !material) return null;

  const handleDownload = async () => {
    try {
      await api.materials.incrementDownload(material.id);
    } catch (err) {
      console.error(err);
    }
    const link = document.createElement('a');
    link.href = material.fileUrl;
    link.target = '_blank';
    link.download = `${material.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/study-materials/${material.slug || material.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await api.materials.toggleBookmark(material.id);
      if (res.success) {
        setIsBookmarked(res.isBookmarked);
        if (onBookmarkToggle) onBookmarkToggle(material.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Determine PDF Viewer URL
  const pdfUrl = material.fileUrl;
  let viewerUrl = pdfUrl;

  if (pdfUrl.includes('drive.google.com')) {
    // Transform Google Drive links to /preview for clean iframe embedding
    const match = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || pdfUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      viewerUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
    } else {
      viewerUrl = pdfUrl.replace(/\/view(\?.*)?$/, '/preview');
    }
  } else if (!pdfUrl.toLowerCase().endsWith('.pdf') && !pdfUrl.includes('/uploads/')) {
    viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 text-white rounded-2xl shadow-2xl flex flex-col transition-all duration-200 border border-slate-700/80 overflow-hidden ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[92vh]'
        }`}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700 shrink-0 gap-2">
          {/* Document Info */}
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-[#6C63FF]/20 border border-[#6C63FF]/30 flex items-center justify-center text-[#8f88ff] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-md md:max-w-xl">
                {material.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-700/80 text-slate-300 font-medium">
                  {material.materialType?.replace('_', ' ') || 'NOTES'}
                </span>
                <span>•</span>
                <span>{material.subject}</span>
                {material.classGrade && (
                  <>
                    <span>•</span>
                    <span>{material.classGrade}</span>
                  </>
                )}
                <span>•</span>
                <span>{material.fileSize}</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Controls (Desktop only) */}
            <div className="hidden md:flex items-center gap-1 bg-slate-700/60 rounded-xl px-2 py-1 border border-slate-600/50">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 15))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-600 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-200 px-1 min-w-[3rem] text-center">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(200, prev + 15))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-600 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(100)}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-600 transition ml-0.5"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bookmark Toggle */}
            <button
              type="button"
              onClick={handleBookmark}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
                isBookmarked
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-slate-700/60 text-slate-300 border-slate-600 hover:text-white hover:bg-slate-600'
              }`}
              title={isBookmarked ? 'Saved to Library' : 'Save / Bookmark'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-700/60 text-slate-300 border border-slate-600 hover:text-white hover:bg-slate-600 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Share Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>

            {/* Direct Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#6C63FF] to-indigo-600 text-white font-bold text-xs shadow-md hover:brightness-110 transition flex items-center gap-1.5"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/70 transition hidden sm:block"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Open in external tab */}
            <a
              href={material.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/70 transition"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-300 transition"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Frame */}
        <div className="relative flex-1 w-full bg-slate-950 overflow-auto flex items-center justify-center">
          <div
            className="w-full h-full flex justify-center transition-transform duration-150 origin-top"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            <object
              data={`${viewerUrl}#toolbar=1&navpanes=0`}
              type="application/pdf"
              className="w-full h-full min-h-[600px] border-none bg-slate-900"
            >
              {/* Fallback iframe */}
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(
                  material.fileUrl.startsWith('http') ? material.fileUrl : window.location.origin + material.fileUrl
                )}&embedded=true`}
                title={material.title}
                className="w-full h-full min-h-[600px] border-none bg-white"
              />
            </object>
          </div>

          {/* Quick Notice bottom overlay */}
          <div className="absolute bottom-3 left-4 right-4 pointer-events-none flex justify-between items-center text-[11px] text-slate-400/80 bg-slate-900/60 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800">
            <span>Lo Samajh Lo Digital Study Library • Reader Mode</span>
            <span>{material.pageCount || 1} Pages • {material.fileType}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
