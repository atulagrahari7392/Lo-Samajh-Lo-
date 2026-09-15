import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Hls from 'hls.js';
import {
  Radio,
  Clock,
  Send,
  Users,
  MessageSquare,
  HelpCircle,
  BarChart2,
  FileText,
  Info,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  ThumbsUp,
  Pin,
  Lock,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Award,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { connectSocket, getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LiveClass, LiveChatMessage, LiveQuestion, LivePoll } from '../../types';

export const LiveClassRoomPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessReason, setAccessReason] = useState('');

  // Player & Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [streamStatus, setStreamStatus] = useState<string>('SCHEDULED');
  const [viewerCount, setViewerCount] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'chat' | 'qa' | 'polls' | 'quiz' | 'resources' | 'info'>('chat');

  // Real-time Chat
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isChatPaused, setIsChatPaused] = useState(false);
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [isMutedUser, setIsMutedUser] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Doubts / Q&A
  const [questions, setQuestions] = useState<LiveQuestion[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // Live Poll
  const [currentPoll, setCurrentPoll] = useState<LivePoll | null>(null);
  const [selectedPollOption, setSelectedPollOption] = useState<string | null>(null);
  const [hasVotedPoll, setHasVotedPoll] = useState(false);

  // Live Quiz
  const [activeQuiz, setActiveQuiz] = useState<{
    questionId: string;
    questionText: string;
    options: string[];
    durationSeconds: number;
    expiresAt: string;
  } | null>(null);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<{
    correctOptionIndex?: number;
    explanation?: string;
  } | null>(null);
  const [quizTimeLeft, setQuizTimeLeft] = useState<number>(0);

  // Countdown timer for scheduled classes
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number; isZero: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isZero: false,
  });

  // Fetch Live Class details
  const fetchClassDetails = async () => {
    try {
      setLoading(true);
      const res = await api.live.getBySlugOrId(slug!);
      if (res.success && res.liveClass) {
        setLiveClass(res.liveClass);
        setStreamStatus(res.liveClass.status);

        if (!res.isAccessGranted) {
          setAccessDenied(true);
          setAccessReason(res.accessReason);
        } else {
          setAccessDenied(false);
        }

        if (res.liveClass.activePoll) {
          setCurrentPoll(res.liveClass.activePoll);
          if (res.liveClass.activePoll.userVotedOptionId) {
            setSelectedPollOption(res.liveClass.activePoll.userVotedOptionId);
            setHasVotedPoll(true);
          }
        }
      } else {
        toastError('Live class session not found');
        navigate('/live-classes');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load classroom');
      navigate('/live-classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchClassDetails();
  }, [slug]);

  // Countdown calculation
  useEffect(() => {
    if (!liveClass || streamStatus === 'LIVE') return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(liveClass.scheduledAt).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0, isZero: true });
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ hours, minutes, seconds, isZero: false });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [liveClass, streamStatus]);

  // Initialize HLS Video Player
  useEffect(() => {
    if (!liveClass || accessDenied) return;

    const hlsUrl = liveClass.session?.hlsPlaybackUrl;
    const video = videoRef.current;

    if (!video || !hlsUrl) return;

    if (Hls.isSupported()) {
      if (hlsRef.current) hlsRef.current.destroy();

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          // Autoplay blocked, wait for user gesture
          setIsPlaying(false);
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS for Safari / iOS
      video.src = hlsUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => setIsPlaying(false));
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [liveClass?.session?.hlsPlaybackUrl, accessDenied]);

  // Real-time Socket & Attendance Lifecycle
  useEffect(() => {
    if (!liveClass || accessDenied) return;

    const socket = connectSocket();

    // 1. Join live class room
    socket.emit('live:join', {
      classId: liveClass.id,
      deviceInfo: navigator.userAgent,
    });

    // 2. Fetch existing doubts/questions
    api.live.getQuestions(liveClass.id).then((res) => {
      if (res.success) setQuestions(res.questions || []);
    });

    // 3. Socket event listeners
    socket.on('live:viewer_count', (data: { count: number }) => {
      setViewerCount(data.count);
    });

    socket.on('live:status_change', (data: { status: string }) => {
      setStreamStatus(data.status);
    });

    socket.on('live:room_state', (data: any) => {
      if (data.isChatPaused !== undefined) setIsChatPaused(data.isChatPaused);
      if (data.isSlowMode !== undefined) setIsSlowMode(data.isSlowMode);
      if (data.isMuted !== undefined) setIsMutedUser(data.isMuted);
    });

    socket.on('chat:new', (msg: LiveChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-150), msg]);
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    });

    socket.on('chat:deleted', (data: { messageId: string }) => {
      setChatMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    });

    socket.on('chat:pinned', (data: { isPinned: boolean; message: string; userName: string }) => {
      if (data.isPinned) {
        setPinnedMessage(`${data.userName}: ${data.message}`);
      } else {
        setPinnedMessage(null);
      }
    });

    socket.on('chat:settings', (data: { isChatPaused?: boolean; isSlowMode?: boolean }) => {
      if (data.isChatPaused !== undefined) setIsChatPaused(data.isChatPaused);
      if (data.isSlowMode !== undefined) setIsSlowMode(data.isSlowMode);
    });

    socket.on('chat:user_muted', (data: { userId: string; isMuted: boolean }) => {
      if (user && data.userId === user.id) {
        setIsMutedUser(data.isMuted);
      }
    });

    socket.on('question:new', (q: LiveQuestion) => {
      setQuestions((prev) => [q, ...prev]);
    });

    socket.on('question:updated', (updated: LiveQuestion) => {
      setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    });

    socket.on('poll:started', (poll: LivePoll) => {
      setCurrentPoll(poll);
      setSelectedPollOption(null);
      setHasVotedPoll(false);
      setActiveTab('polls');
      success('New live poll started!');
    });

    socket.on('poll:tally_update', (poll: LivePoll) => {
      setCurrentPoll(poll);
    });

    socket.on('poll:ended', (poll: LivePoll) => {
      setCurrentPoll(poll);
    });

    socket.on('quiz:started', (quizData: any) => {
      setActiveQuiz(quizData);
      setQuizResult(null);
      setSelectedQuizOption(null);
      setActiveTab('quiz');
      setQuizTimeLeft(quizData.durationSeconds);
      success('Live Quiz Question Launched!');
    });

    socket.on('quiz:result', (resultData: any) => {
      setQuizResult(resultData);
    });

    socket.on('announcement:new', (ann: any) => {
      success(`📢 Announcement: ${ann.message}`);
    });

    // Attendance Heartbeat: triggers every 25 seconds
    const heartbeatInterval = setInterval(() => {
      socket.emit('live:heartbeat', {
        classId: liveClass.id,
        secondsWatched: 25,
      });
      // Fallback REST heartbeat
      api.live.sendHeartbeat(liveClass.id, 25).catch(() => {});
    }, 25000);

    return () => {
      clearInterval(heartbeatInterval);
      socket.off('live:viewer_count');
      socket.off('live:status_change');
      socket.off('live:room_state');
      socket.off('chat:new');
      socket.off('chat:deleted');
      socket.off('chat:pinned');
      socket.off('chat:settings');
      socket.off('chat:user_muted');
      socket.off('question:new');
      socket.off('question:updated');
      socket.off('poll:started');
      socket.off('poll:tally_update');
      socket.off('poll:ended');
      socket.off('quiz:started');
      socket.off('quiz:result');
      socket.off('announcement:new');
    };
  }, [liveClass?.id, accessDenied, user?.id]);

  // Quiz countdown ticker
  useEffect(() => {
    if (!activeQuiz || quizTimeLeft <= 0 || quizResult) return;
    const timer = setInterval(() => {
      setQuizTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuiz, quizTimeLeft, quizResult]);

  // Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !liveClass) return;

    if (!user) {
      toastError('Please login to participate in live chat.');
      return;
    }

    if (isChatPaused && user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') {
      toastError('Chat is currently paused.');
      return;
    }

    if (isMutedUser) {
      toastError('You are muted in this class.');
      return;
    }

    const socket = getSocket();
    socket.emit('chat:send', {
      classId: liveClass.id,
      message: messageInput.trim(),
    });

    setMessageInput('');
  };

  // Submit Doubt Question
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || !liveClass) return;

    if (!user) {
      toastError('Please login to ask a question.');
      return;
    }

    try {
      setSubmittingQuestion(true);
      const res = await api.live.askQuestion(liveClass.id, questionInput.trim());
      if (res.success) {
        setQuestionInput('');
        success('Doubt submitted to teacher.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to submit doubt');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  // Upvote Question
  const handleUpvote = async (qId: string) => {
    if (!liveClass) return;
    try {
      await api.live.upvoteQuestion(liveClass.id, qId);
    } catch {
      // Upvote error
    }
  };

  // Vote in Poll
  const handleVotePoll = (optionId: string) => {
    if (!currentPoll || hasVotedPoll || !liveClass) return;
    if (!user) {
      toastError('Please login to vote in live polls.');
      return;
    }

    const socket = getSocket();
    socket.emit('poll:vote', {
      classId: liveClass.id,
      pollId: currentPoll.id,
      optionId,
    });

    setSelectedPollOption(optionId);
    setHasVotedPoll(true);
    success('Vote recorded!');
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[#6C63FF]" />
        <p className="text-sm font-semibold text-slate-300">Connecting to secure live classroom...</p>
      </div>
    );
  }

  // Access Denied Screen (Phase 18)
  if (accessDenied && liveClass) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">Restricted Live Classroom</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {accessReason === 'LOGIN_REQUIRED'
                ? 'This live interactive class requires an active student account. Please sign in to join.'
                : `This live session is exclusively available for students enrolled in "${liveClass.course?.title || 'this course'}".`}
            </p>
          </div>

          <div className="pt-2 space-y-3">
            {accessReason === 'LOGIN_REQUIRED' ? (
              <Link
                to={`/login?redirect=/live/${liveClass.slug || liveClass.id}`}
                className="w-full py-3 px-5 rounded-2xl bg-[#6C63FF] hover:bg-[#584fd4] text-white text-xs font-bold block transition-all shadow-lg"
              >
                Log In to Access Class
              </Link>
            ) : (
              <Link
                to={`/courses/${liveClass.course?.slug || ''}`}
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#6C63FF] to-indigo-500 hover:opacity-95 text-white text-xs font-bold block transition-all shadow-lg"
              >
                Enroll in Course (₹{liveClass.course?.price || 499})
              </Link>
            )}

            <Link
              to="/live-classes"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white block transition-colors"
            >
              ← Back to Live Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!liveClass) return null;

  const isLiveNow = streamStatus === 'LIVE';
  const isInterrupted = streamStatus === 'STREAM_INTERRUPTED';
  const isEnded = streamStatus === 'ENDED' || streamStatus === 'COMPLETED';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Classroom Bar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            to="/live-classes"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Leave Classroom"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              {isLiveNow ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                  <Radio className="w-3 h-3" />
                  LIVE
                </span>
              ) : isInterrupted ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                  <AlertTriangle className="w-3 h-3" />
                  RECONNECTING
                </span>
              ) : isEnded ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-200">
                  ENDED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                  STARTING SOON
                </span>
              )}

              <h1 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                {liveClass.title}
              </h1>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>{liveClass.instructor}</span>
              {liveClass.course && (
                <>
                  <span>•</span>
                  <span className="text-[#6C63FF]">{liveClass.course.title}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Info: Viewers & Fullscreen */}
        <div className="flex items-center gap-3">
          {isLiveNow && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-bold">
              <Users className="w-3.5 h-3.5 text-rose-400" />
              <span>{viewerCount}</span>
            </div>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Layout: Split Video Area & Interactive Side/Bottom Tabs */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Responsive Video Player Area */}
        <div
          ref={playerContainerRef}
          className="flex-1 bg-black flex flex-col justify-center relative select-none min-h-[260px] sm:min-h-[420px] lg:min-h-full"
        >
          {/* Active Live Video Element */}
          {liveClass.session?.hlsPlaybackUrl && isLiveNow ? (
            <video
              ref={videoRef}
              playsInline
              controls={false}
              className="w-full h-full object-contain max-h-[85vh]"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          ) : (
            /* Non-Live Screen States */
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
              {isEnded ? (
                <div className="space-y-3 max-w-md animate-in fade-in">
                  <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">This Live Class Has Ended</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Thank you for attending! The recording is being processed and will be linked to your course lecture library along with notes and practice sheets.
                  </p>
                  {liveClass.recordedClass && (
                    <Link
                      to={`/courses/${liveClass.course?.slug || 'general'}/learn`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6C63FF] text-white text-xs font-bold shadow-lg hover:bg-[#584fd4] transition-all mt-2"
                    >
                      Watch Recorded Lecture
                    </Link>
                  )}
                </div>
              ) : isInterrupted ? (
                <div className="space-y-3 max-w-sm animate-pulse">
                  <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
                  <h3 className="text-lg font-bold text-white">Stream Temporarily Interrupted</h3>
                  <p className="text-xs text-slate-400">
                    The teacher is reconnecting OBS Studio. Please stay on this screen, the player will resume automatically...
                  </p>
                </div>
              ) : countdown.isZero || streamStatus === 'STARTING' ? (
                <div className="space-y-3 max-w-sm animate-pulse">
                  <Radio className="w-12 h-12 text-rose-500 mx-auto" />
                  <h3 className="text-lg font-bold text-white">Preparing Live Stream...</h3>
                  <p className="text-xs text-slate-400">
                    Broadcaster is connecting. Video will start momentarily.
                  </p>
                </div>
              ) : (
                /* Scheduled Countdown Clock (Phase 17) */
                <div className="space-y-5 max-w-md animate-in zoom-in-95">
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    LIVE CLASS STARTS IN
                  </div>

                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 min-w-[70px] text-center">
                      <div className="text-2xl sm:text-4xl font-black text-white font-mono">
                        {String(countdown.hours).padStart(2, '0')}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">Hours</div>
                    </div>
                    <span className="text-2xl font-bold text-slate-600">:</span>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 min-w-[70px] text-center">
                      <div className="text-2xl sm:text-4xl font-black text-white font-mono">
                        {String(countdown.minutes).padStart(2, '0')}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">Mins</div>
                    </div>
                    <span className="text-2xl font-bold text-slate-600">:</span>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 min-w-[70px] text-center">
                      <div className="text-2xl sm:text-4xl font-black text-rose-400 font-mono">
                        {String(countdown.seconds).padStart(2, '0')}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold mt-1">Secs</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    Scheduled for {new Date(liveClass.scheduledAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Player Custom Controls Overlay when Live */}
          {isLiveNow && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  LIVE
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white transition-colors"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Pinned announcement / alert banner */}
          {pinnedMessage && (
            <div className="absolute top-3 inset-x-3 sm:inset-x-6 z-20 bg-indigo-950/90 border border-indigo-500/40 backdrop-blur-md rounded-2xl p-2.5 px-4 text-xs flex items-center gap-2 text-indigo-200 shadow-xl">
              <Pin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="line-clamp-1 flex-1 font-medium">{pinnedMessage}</span>
            </div>
          )}
        </div>

        {/* Right: Interactive Tabs Drawer */}
        <div className="w-full lg:w-96 xl:w-[420px] bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-[400px] lg:h-auto shrink-0">
          {/* Tab Navigation */}
          <div className="flex items-center border-b border-slate-800 bg-slate-900/60 overflow-x-auto scrollbar-none px-2 py-1.5">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'bg-[#6C63FF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>

            <button
              onClick={() => setActiveTab('qa')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'qa'
                  ? 'bg-[#6C63FF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Doubts ({questions.length})
            </button>

            <button
              onClick={() => setActiveTab('polls')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'polls'
                  ? 'bg-[#6C63FF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Polls {currentPoll?.status === 'LIVE' && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'quiz'
                  ? 'bg-[#6C63FF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Quiz {activeQuiz && !quizResult && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'resources'
                  ? 'bg-[#6C63FF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Notes ({liveClass.resources?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'info'
                  ? 'bg-[#6C63FF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              Info
            </button>
          </div>

          {/* Tab 1: Live Chat */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Messages list */}
              <div
                ref={chatScrollRef}
                className="flex-1 p-3.5 space-y-2.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 text-xs"
              >
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                    <p>Welcome to Live Chat!</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Ask questions, answer teacher prompts, and engage with classmates.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isTeacher = msg.userRole === 'ADMIN' || msg.userRole === 'INSTRUCTOR';
                    return (
                      <div
                        key={msg.id}
                        className={`rounded-xl p-2.5 ${
                          isTeacher
                            ? 'bg-indigo-950/70 border border-indigo-500/40 text-indigo-100'
                            : 'bg-slate-800/50 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span
                            className={`font-bold text-[11px] ${
                              isTeacher ? 'text-indigo-400 flex items-center gap-1' : 'text-slate-300'
                            }`}
                          >
                            {isTeacher && <Sparkles className="w-3 h-3 text-amber-400" />}
                            {msg.userName}
                            {isTeacher && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-extrabold uppercase">
                                Faculty
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs break-words leading-relaxed">{msg.message}</p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
                {isChatPaused ? (
                  <div className="text-center py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
                    Chat is currently paused by the instructor.
                  </div>
                ) : isMutedUser ? (
                  <div className="text-center py-2 px-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-semibold">
                    You have been muted in this session.
                  </div>
                ) : !user ? (
                  <Link
                    to={`/login?redirect=/live/${liveClass.slug || liveClass.id}`}
                    className="block text-center py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                  >
                    Log in to send messages
                  </Link>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={isSlowMode ? 'Slow mode active (5s cooldown)...' : 'Type a live message...'}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      maxLength={300}
                      className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="p-2 bg-[#6C63FF] hover:bg-[#584fd4] text-white rounded-xl transition-colors disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Doubts & Q&A (Phase 8) */}
          {activeTab === 'qa' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                {questions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                    <HelpCircle className="w-8 h-8 mb-2 opacity-30" />
                    <p className="font-semibold text-xs text-slate-400">No doubts posted yet</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Have a doubt on this topic? Ask below and the teacher will answer live.
                    </p>
                  </div>
                ) : (
                  questions.map((q) => (
                    <div
                      key={q.id}
                      className={`p-3 rounded-2xl border text-xs space-y-2 ${
                        q.status === 'ANSWERED'
                          ? 'bg-emerald-950/30 border-emerald-500/30'
                          : 'bg-slate-800/50 border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-300 text-[11px]">{q.userName}</span>
                          <p className="text-slate-100 font-medium">{q.question}</p>
                        </div>
                        <button
                          onClick={() => handleUpvote(q.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
                          title="Upvote doubt"
                        >
                          <ThumbsUp className="w-3 h-3 text-[#6C63FF]" />
                          <span className="text-[10px] font-bold">{q.upvotes}</span>
                        </button>
                      </div>

                      {q.answer && (
                        <div className="bg-emerald-900/40 border-l-2 border-emerald-500 p-2 rounded-r-lg text-emerald-200 text-[11px] space-y-1">
                          <div className="font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Answered by {q.answeredBy || 'Teacher'}
                          </div>
                          <p>{q.answer}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Ask Doubt input */}
              <div className="p-3 bg-slate-900 border-t border-slate-800">
                <form onSubmit={handleAskQuestion} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Ask a question on this lecture..."
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#6C63FF]"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Keep questions focused on the subject</span>
                    <button
                      type="submit"
                      disabled={!questionInput.trim() || submittingQuestion}
                      className="px-4 py-1.5 bg-[#6C63FF] hover:bg-[#584fd4] text-white font-bold rounded-xl disabled:opacity-40"
                    >
                      {submittingQuestion ? 'Submitting...' : 'Post Doubt'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tab 3: Live Polls (Phase 9) */}
          {activeTab === 'polls' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {currentPoll ? (
                <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">
                      {currentPoll.status === 'LIVE' ? '🔴 Live Poll' : 'Ended Poll'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {currentPoll._count?.responses || 0} votes
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white">{currentPoll.question}</h4>

                  {/* Options */}
                  <div className="space-y-2">
                    {currentPoll.options.map((opt) => {
                      const totalVotes = currentPoll._count?.responses || currentPoll.options.reduce((a, b) => a + b.voteCount, 0);
                      const pct = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
                      const isSelected = selectedPollOption === opt.id;

                      return (
                        <div key={opt.id} className="space-y-1">
                          <button
                            disabled={hasVotedPoll || currentPoll.status !== 'LIVE'}
                            onClick={() => handleVotePoll(opt.id)}
                            className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                              isSelected
                                ? 'bg-indigo-950 border-[#6C63FF] text-white'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                            }`}
                          >
                            <span>{opt.optionText}</span>
                            {hasVotedPoll && <span className="font-bold">{pct}%</span>}
                          </button>

                          {/* Result bar */}
                          {hasVotedPoll && (
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isSelected ? 'bg-[#6C63FF]' : 'bg-slate-600'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {hasVotedPoll && (
                    <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 justify-center pt-2">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Your response is submitted
                    </p>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-8">
                  <BarChart2 className="w-10 h-10 mb-2 opacity-30" />
                  <p className="font-bold text-xs text-slate-400">No active poll right now</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    When the teacher launches a poll, it will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Live Quiz / Mini-Test (Phase 10) */}
          {activeTab === 'quiz' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {activeQuiz ? (
                <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                      ⚡ In-Class Quiz
                    </span>

                    {!quizResult && (
                      <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {quizTimeLeft}s left
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-white leading-snug">{activeQuiz.questionText}</h4>

                  {/* Options */}
                  <div className="space-y-2">
                    {activeQuiz.options.map((opt, idx) => {
                      const isSelected = selectedQuizOption === idx;
                      const isCorrect = quizResult?.correctOptionIndex === idx;
                      const isWrong = quizResult && isSelected && quizResult.correctOptionIndex !== idx;

                      return (
                        <button
                          key={idx}
                          disabled={!!quizResult}
                          onClick={() => setSelectedQuizOption(idx)}
                          className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                            isCorrect
                              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                              : isWrong
                              ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                              : isSelected
                              ? 'bg-indigo-950 border-[#6C63FF] text-white'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                          }`}
                        >
                          <span>{opt}</span>
                          {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Result & Explanation */}
                  {quizResult && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-1">
                      <div className="font-bold text-amber-400">Faculty Explanation:</div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{quizResult.explanation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-8">
                  <Award className="w-10 h-10 mb-2 opacity-30" />
                  <p className="font-bold text-xs text-slate-400">No active quiz question</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Integrated with LoSamajhLo Question Bank. Teacher can launch questions at any time.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Resources & Notes (Phase 11) */}
          {activeTab === 'resources' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {liveClass.resources && liveClass.resources.length > 0 ? (
                liveClass.resources.map((res) => (
                  <div
                    key={res.id}
                    className="p-3 bg-slate-800/60 border border-slate-700 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white line-clamp-1">{res.title}</h4>
                        <span className="text-[10px] text-slate-400">
                          {res.resourceType} • {res.fileSize || 'PDF'}
                        </span>
                      </div>
                    </div>

                    <a
                      href={res.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-[#6C63FF] hover:bg-[#584fd4] text-white text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </a>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-8">
                  <FileText className="w-10 h-10 mb-2 opacity-30" />
                  <p className="font-bold text-xs text-slate-400">No lecture notes uploaded yet</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Notes and practice sheets uploaded by the faculty will appear here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 6: Class Information */}
          {activeTab === 'info' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 space-y-3">
                <h4 className="font-bold text-sm text-white">{liveClass.title}</h4>
                {liveClass.description && <p className="text-slate-400 leading-relaxed">{liveClass.description}</p>}

                <div className="pt-2 border-t border-slate-700/60 space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Instructor:</span>
                    <span className="font-bold text-white">{liveClass.instructor}</span>
                  </div>
                  {liveClass.subject && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subject:</span>
                      <span>{liveClass.subject}</span>
                    </div>
                  )}
                  {liveClass.chapter && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Chapter:</span>
                      <span>{liveClass.chapter}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span>{liveClass.durationMinutes} Minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Class Type:</span>
                    <span className="uppercase font-bold text-indigo-400">{liveClass.classType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Language:</span>
                    <span>{liveClass.language}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveClassRoomPage;
