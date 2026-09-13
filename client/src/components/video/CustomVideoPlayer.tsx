import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  Sliders,
  Gauge,
  Shield,
  AlertTriangle,
  Check,
  Tv,
} from 'lucide-react';

interface CustomVideoPlayerProps {
  url: string;
  title: string;
  chapterTitle?: string;
  thumbnail?: string | null;
  studentName?: string;
  studentContact?: string;
  studentId?: string;
  onEnded?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

const QUALITY_OPTIONS = [
  { label: 'Auto (Recommended)', value: 'Auto', badge: 'AUTO' },
  { label: '1080p Full HD', value: '1080p', badge: 'FHD' },
  { label: '720p HD', value: '720p', badge: 'HD' },
  { label: '480p Standard', value: '480p', badge: 'SD' },
  { label: '360p Data Saver', value: '360p', badge: 'DATA' },
];

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  url,
  title,
  chapterTitle,
  thumbnail,
  studentName = 'Student',
  studentContact = '',
  studentId = '',
  onEnded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [quality, setQuality] = useState(() => {
    return localStorage.getItem('preferred_video_quality') || 'Auto';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);

  // Notification overlay in player
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);

  // Drifting watermark position
  const [watermarkPos, setWatermarkPos] = useState({ top: '22%', left: '20%' });

  // Buffering state
  const [isBuffering, setIsBuffering] = useState(false);

  // Google Drive fileId extraction & stream conversion
  const driveMatch = url
    ? url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      url.match(/id=([a-zA-Z0-9_-]+)/) ||
      url.match(/\/d\/([a-zA-Z0-9_-]+)/)
    : null;
  const driveFileId = driveMatch ? driveMatch[1] : null;

  // Direct video stream URL (converts raw Google Drive links to native streaming endpoint)
  const streamUrl = driveFileId ? `/api/google-drive/stream/${driveFileId}` : url;

  const isYouTube = Boolean(url && (url.includes('youtube.com') || url.includes('youtu.be')));
  const isDirectVideo = Boolean(streamUrl) && !isYouTube;

  const ytEmbedUrl = isYouTube
    ? url.includes('embed/')
      ? url
      : `https://www.youtube.com/embed/${url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]+)/)?.[1] || ''}`
    : null;

  const showTemporaryNotice = useCallback((msg: string) => {
    setNoticeMessage(msg);
    const t = setTimeout(() => setNoticeMessage(null), 2500);
    return () => clearTimeout(t);
  }, []);

  const triggerSecurityAlert = useCallback((msg: string) => {
    setSecurityAlert(msg);
    const t = setTimeout(() => setSecurityAlert(null), 3500);
    return () => clearTimeout(t);
  }, []);

  // Watermark drifting motion
  useEffect(() => {
    const coords = [
      { top: '15%', left: '15%' },
      { top: '72%', left: '18%' },
      { top: '28%', left: '60%' },
      { top: '68%', left: '55%' },
      { top: '45%', left: '35%' },
      { top: '20%', left: '45%' },
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
        triggerSecurityAlert('Security Notice: Source inspection and saving are disabled.');
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

  // Auto-hide controls
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (!speedMenuOpen && !qualityMenuOpen) {
          setShowControls(false);
        }
      }, 2800);
    }
  };

  // Direct video controls
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeekDelta = (seconds: number) => {
    if (!videoRef.current) return;
    const nextTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
    showTemporaryNotice(`${seconds > 0 ? `+${seconds}s` : `${seconds}s`}`);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.buffered.length > 0) {
      const end = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered((end / (videoRef.current.duration || 1)) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    videoRef.current.playbackRate = playbackSpeed;
  };

  const handleProgressScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressTrackRef.current || !videoRef.current) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * (duration || 0);
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVol;
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const targetMute = !isMuted;
    setIsMuted(targetMute);
    videoRef.current.muted = targetMute;
  };

  const handleSpeedSelect = (speed: number) => {
    setPlaybackSpeed(speed);
    setSpeedMenuOpen(false);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    showTemporaryNotice(`⚡ Playback Speed: ${speed}x`);
  };

  const handleQualitySelect = (qual: string) => {
    setQuality(qual);
    setQualityMenuOpen(false);
    localStorage.setItem('preferred_video_quality', qual);
    showTemporaryNotice(`📺 Video Quality: ${qual}`);
  };

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

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col space-y-3 select-none">
      {/* Main Video Frame Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onContextMenu={(e) => {
          e.preventDefault();
          triggerSecurityAlert('🔒 Content Protected: Right-click and downloading are disabled.');
        }}
        className="relative aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-slate-800 group"
      >
        {/* Anti-Piracy Watermark (Drifts across screen) */}
        <div
          style={{ top: watermarkPos.top, left: watermarkPos.left }}
          className="absolute pointer-events-none z-30 transition-all duration-1000 ease-in-out opacity-25 text-[10px] sm:text-xs font-mono font-bold text-white bg-black/60 px-3 py-1 rounded-lg border border-white/10 shadow-lg tracking-wider"
        >
          🔒 Lo Samajh Lo Student: {studentName} • {studentContact || 'Verified'} • {studentId || 'ID-7392'}
        </div>

        {/* Security Badge Top-Left */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>DRM Protected</span>
        </div>

        {/* Active Quality Badge Top-Right */}
        <div className="absolute top-3 right-3 z-20 pointer-events-none flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-extrabold text-[#6C63FF] border border-[#6C63FF]/30">
          <Tv className="w-3 h-3" />
          <span>{quality}</span>
        </div>

        {/* Security Alert Popup */}
        {securityAlert && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{securityAlert}</span>
          </div>
        )}

        {/* Temporary Notice Overlay (e.g. +10s, Speed 1.5x) */}
        {noticeMessage && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 px-5 py-2.5 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 text-white text-sm font-extrabold shadow-2xl animate-fade-in pointer-events-none">
            {noticeMessage}
          </div>
        )}

        {/* Buffering Indicator */}
        {isBuffering && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30 pointer-events-none space-y-3">
            <div className="w-12 h-12 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-200">Buffering high-definition stream...</span>
          </div>
        )}

        {/* Video Rendering */}
        {isYouTube && ytEmbedUrl ? (
          <div className="relative w-full h-full">
            <iframe
              src={ytEmbedUrl}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            {/* Shield overlay */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                triggerSecurityAlert('Anti-Download Shield: Direct video download is restricted.');
              }}
              className="absolute top-0 right-0 w-28 h-16 z-25 cursor-not-allowed bg-transparent"
              title="Protected course content"
            />
          </div>
        ) : isDirectVideo ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              src={streamUrl}
              poster={thumbnail || undefined}
              controls={false}
              controlsList="nodownload noplaybackrate nofullscreen"
              disablePictureInPicture
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => {
                setIsBuffering(false);
                setIsPlaying(true);
              }}
              onCanPlay={() => setIsBuffering(false)}
              onEnded={() => {
                setIsPlaying(false);
                if (onEnded) onEnded();
              }}
              onClick={togglePlay}
              className="w-full h-full object-contain cursor-pointer"
            />

            {/* Central Play/Pause Watermark Button on Hover or Paused */}
            {(!isPlaying || showControls) && (
              <button
                onClick={togglePlay}
                className={`absolute p-4 rounded-full bg-black/60 hover:bg-[#6C63FF] text-white backdrop-blur-md transition-all duration-200 transform hover:scale-110 shadow-2xl ${
                  isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                }`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 fill-current ml-0.5" />}
              </button>
            )}

            {/* Custom Control Bar for Direct Video */}
            <div
              className={`absolute bottom-0 left-0 right-0 z-30 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent transition-opacity duration-300 ${
                showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Progress Scrubber */}
              <div
                ref={progressTrackRef}
                onClick={handleProgressScrub}
                className="relative h-2 bg-slate-700/80 hover:h-2.5 rounded-full cursor-pointer transition-all mb-3 group/track overflow-hidden"
              >
                {/* Buffered Track */}
                <div
                  className="absolute top-0 left-0 bottom-0 bg-slate-500/50 rounded-full"
                  style={{ width: `${buffered}%` }}
                />
                {/* Played Track */}
                <div
                  className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#6C63FF] to-pink-500 rounded-full"
                  style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                />
              </div>

              {/* Bottom Buttons Row */}
              <div className="flex items-center justify-between gap-2 text-white">
                {/* Left Controls: Play/Pause, -10s, +10s, Time */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>

                  <button
                    onClick={() => handleSeekDelta(-10)}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors flex items-center gap-0.5 text-xs font-bold"
                    title="Rewind 10 seconds"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline text-[10px]">10s</span>
                  </button>

                  <button
                    onClick={() => handleSeekDelta(10)}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors flex items-center gap-0.5 text-xs font-bold"
                    title="Skip 10 seconds"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span className="hidden sm:inline text-[10px]">10s</span>
                  </button>

                  {/* Volume */}
                  <div className="flex items-center gap-1.5 group/vol">
                    <button
                      onClick={toggleMute}
                      className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
                      ) : volume < 0.5 ? (
                        <Volume1 className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-14 sm:w-20 accent-[#6C63FF] h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Time Display */}
                  <span className="text-[11px] font-mono text-slate-300 tracking-tight">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Right Controls: Speed, Quality, Fullscreen */}
                <div className="flex items-center gap-2 relative">
                  {/* Speed Selector */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setSpeedMenuOpen(!speedMenuOpen);
                        setQualityMenuOpen(false);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-extrabold transition-colors"
                      title="Playback Speed"
                    >
                      <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{playbackSpeed}x</span>
                    </button>

                    {speedMenuOpen && (
                      <div className="absolute bottom-full right-0 mb-2 w-32 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 divide-y divide-slate-800">
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Speed
                        </div>
                        <div className="pt-1">
                          {SPEED_OPTIONS.map((spd) => (
                            <button
                              key={spd}
                              onClick={() => handleSpeedSelect(spd)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                playbackSpeed === spd
                                  ? 'bg-[#6C63FF] text-white'
                                  : 'text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <span>{spd}x</span>
                              {playbackSpeed === spd && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quality Selector */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setQualityMenuOpen(!qualityMenuOpen);
                        setSpeedMenuOpen(false);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-extrabold transition-colors"
                      title="Video Resolution"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#6C63FF]" />
                      <span>{quality}</span>
                    </button>

                    {qualityMenuOpen && (
                      <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 divide-y divide-slate-800">
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Resolution / Quality
                        </div>
                        <div className="pt-1 space-y-0.5">
                          {QUALITY_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => handleQualitySelect(opt.value)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                quality === opt.value
                                  ? 'bg-[#6C63FF] text-white'
                                  : 'text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {quality === opt.value && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fullscreen Button */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                    title={isFullscreen ? 'Exit Fullscreen (f)' : 'Fullscreen (f)'}
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2 text-slate-400">
            <Shield className="w-16 h-16 text-[#6C63FF] opacity-80" />
            <h4 className="text-white font-bold text-base">{title || 'Course Lecture'}</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Please select a lecture from the course curriculum to begin streaming.
            </p>
          </div>
        )}
      </div>

      {/* Universal Control Toolbar (Especially beneficial for Google Drive streams) */}
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

        {/* Video Speed & Pixel Quality Toolbar Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Speed Preset Chips */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 px-2 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-emerald-400" /> Speed:
            </span>
            {[1.0, 1.25, 1.5, 2.0].map((spd) => (
              <button
                key={spd}
                onClick={() => handleSpeedSelect(spd)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                  playbackSpeed === spd
                    ? 'bg-[#6C63FF] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Quality Preset Chips */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 px-2 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-[#6C63FF]" /> Quality:
            </span>
            {['Auto', '720p', '1080p'].map((res) => (
              <button
                key={res}
                onClick={() => handleQualitySelect(res)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                  quality === res
                    ? 'bg-[#6C63FF] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {res}
              </button>
            ))}
          </div>

          {/* Fullscreen Button */}
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
