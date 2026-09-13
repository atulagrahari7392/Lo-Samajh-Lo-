import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Maximize,
  Minimize,
  Shield,
  AlertTriangle,
  PlayCircle,
  Settings,
} from 'lucide-react';

interface CustomVideoPlayerProps {
  url: string;
  title: string;
  chapterTitle?: string;
  thumbnail?: string | null;
  studentPhone?: string;
  onEnded?: () => void;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  url,
  title,
  chapterTitle,
  thumbnail,
  studentPhone = '',
  onEnded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);

  // Drifting watermark position
  const [watermarkPos, setWatermarkPos] = useState({ top: '25%', left: '20%' });

  // Google Drive & YouTube source detection
  const isGoogleDrive = Boolean(url && url.includes('drive.google.com'));
  const isYouTube = Boolean(url && (url.includes('youtube.com') || url.includes('youtu.be')));
  const isDirectVideo =
    Boolean(url) &&
    !isGoogleDrive &&
    !isYouTube &&
    (url.endsWith('.mp4') ||
      url.endsWith('.webm') ||
      url.endsWith('.m3u8') ||
      url.startsWith('/uploads/') ||
      url.includes('blob:'));

  const drivePreviewUrl = isGoogleDrive
    ? url.replace(/\/view(\?.*)?$/, '/preview')
    : url;

  const ytEmbedUrl = isYouTube
    ? url.includes('embed/')
      ? url
      : `https://www.youtube.com/embed/${url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]+)/)?.[1] || ''}`
    : null;

  const triggerSecurityAlert = useCallback((msg: string) => {
    setSecurityAlert(msg);
    const t = setTimeout(() => setSecurityAlert(null), 3500);
    return () => clearTimeout(t);
  }, []);

  // Watermark drifting motion every 6 seconds
  useEffect(() => {
    const coords = [
      { top: '15%', left: '15%' },
      { top: '75%', left: '20%' },
      { top: '30%', left: '65%' },
      { top: '70%', left: '60%' },
      { top: '48%', left: '35%' },
      { top: '20%', left: '50%' },
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % coords.length;
      setWatermarkPos(coords[i]);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut blocking (Ctrl+S, Ctrl+U, F12, DevTools)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'u' || e.key === 'p')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        triggerSecurityAlert('Security Notice: Video download and source inspection are disabled.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSecurityAlert]);

  // Fullscreen change detection
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
      } catch (err) {
        console.warn('Fullscreen request failed:', err);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <div className="flex flex-col space-y-3 select-none">
      {/* Main Video Frame Container */}
      <div
        ref={containerRef}
        onContextMenu={(e) => {
          e.preventDefault();
          triggerSecurityAlert('🔒 Content Protected: Video downloading and right-click are strictly disabled.');
        }}
        className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-slate-800 group"
      >
        {/* Anti-Piracy Watermark: ONLY Student Mobile Number */}
        {studentPhone && (
          <div
            style={{ top: watermarkPos.top, left: watermarkPos.left }}
            className="absolute pointer-events-none z-30 transition-all duration-1000 ease-in-out opacity-40 select-none text-xs sm:text-sm font-mono font-bold text-white bg-black/75 px-3 py-1 rounded-lg border border-white/10 shadow-lg tracking-wider"
          >
            📱 {studentPhone}
          </div>
        )}

        {/* Security Badge Top-Left */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>DRM Protected</span>
        </div>

        {/* Security Alert Popup */}
        {securityAlert && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{securityAlert}</span>
          </div>
        )}

        {/* Video Rendering */}
        {isGoogleDrive ? (
          <div className="relative w-full h-full">
            {/* Embedded Google Drive player (with HD quality & speed controls built-in) */}
            <iframe
              src={drivePreviewUrl}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            {/* Shield overlay for top-right corner to block Google Drive popout/download button */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                triggerSecurityAlert('Anti-Download Shield: Direct video download is restricted.');
              }}
              className="absolute top-0 right-0 w-24 h-16 z-20 cursor-not-allowed bg-transparent"
              title="Direct download is disabled for this course lecture"
            />
          </div>
        ) : isYouTube && ytEmbedUrl ? (
          <div className="relative w-full h-full">
            <iframe
              src={ytEmbedUrl}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div
              onClick={(e) => {
                e.stopPropagation();
                triggerSecurityAlert('Anti-Download Shield: Video download is disabled.');
              }}
              className="absolute top-0 right-0 w-24 h-16 z-20 cursor-not-allowed bg-transparent"
              title="Protected course content"
            />
          </div>
        ) : isDirectVideo ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              src={url}
              poster={thumbnail || undefined}
              controls
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              onEnded={onEnded}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2 text-slate-400">
            <PlayCircle className="w-16 h-16 text-[#6C63FF] opacity-80" />
            <h4 className="text-white font-bold text-base">{title || 'Course Lecture'}</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Please select a lecture from the course curriculum to begin playing.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Info Bar: Clean, Single Bar without duplicate buttons */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-white">
        {/* Lecture Meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {chapterTitle && (
              <span className="text-[10px] font-bold text-[#6C63FF] uppercase tracking-wider bg-[#6C63FF]/15 px-2 py-0.5 rounded-md">
                {chapterTitle}
              </span>
            )}
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" /> Anti-Piracy Shield
            </span>
          </div>
          <h3 className="font-bold text-sm sm:text-base text-white truncate mt-1">{title}</h3>
        </div>

        {/* Right Info & Fullscreen (Single Clean Place) */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/50">
            <Settings className="w-3.5 h-3.5 text-[#6C63FF]" />
            <span>Speed (0.5x–2x) & HD Quality in player ⚙️</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Expand Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
