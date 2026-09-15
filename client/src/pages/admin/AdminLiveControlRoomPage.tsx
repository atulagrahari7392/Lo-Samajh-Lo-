import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Hls from 'hls.js';
import {
  Radio,
  Clock,
  Send,
  Users,
  MessageSquare,
  HelpCircle,
  BarChart2,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Trash2,
  Pin,
  Eye,
  Key,
  Copy,
  Check,
  Award,
  Bell,
  ArrowLeft,
  Volume2,
  Maximize2,
  RefreshCw,
  Plus,
  X,
  VolumeX,
  ExternalLink,
  Edit2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../../services/api';
import { connectSocket, getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LiveClass, LiveChatMessage, LiveQuestion, LivePoll, Course } from '../../types';

function extractYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export const AdminLiveControlRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [loading, setLoading] = useState(true);

  // Stream Configuration & State
  const [streamStatus, setStreamStatus] = useState<string>('SCHEDULED');
  const [obsConfig, setObsConfig] = useState<{ rtmpServer: string; streamKey: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [streamUrlInput, setStreamUrlInput] = useState('');
  const [savingStreamUrl, setSavingStreamUrl] = useState(false);
  const [isEditingStream, setIsEditingStream] = useState(false);
  const [showRtmpDetails, setShowRtmpDetails] = useState(false);

  // Real-time Metrics
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [peakViewers, setPeakViewers] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Video Preview Player
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // YouTube Video ID (if streaming via YouTube Live)
  const youtubeVideoId = extractYouTubeVideoId(liveClass?.meetingUrl) || extractYouTubeVideoId(liveClass?.session?.hlsPlaybackUrl);

  // Chat State & Controls
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [isChatPaused, setIsChatPaused] = useState(false);
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Doubts / Q&A
  const [questions, setQuestions] = useState<LiveQuestion[]>([]);
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerInput, setAnswerInput] = useState('');

  // Live Polls
  const [polls, setPolls] = useState<LivePoll[]>([]);
  const [activePoll, setActivePoll] = useState<LivePoll | null>(null);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['Option A', 'Option B', 'Option C', 'Option D']);

  // Live Quiz
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState(['Option 1', 'Option 2', 'Option 3', 'Option 4']);
  const [quizCorrectIndex, setQuizCorrectIndex] = useState(0);
  const [quizDuration, setQuizDuration] = useState(30);
  const [quizExplanation, setQuizExplanation] = useState('');

  // Announcements
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementType, setAnnouncementType] = useState<'NORMAL' | 'PINNED' | 'URGENT'>('NORMAL');

  // Convert to Recording Modal (Phase 13 & 14)
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [recordingChapter, setRecordingChapter] = useState('Chapter 1');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [converting, setConverting] = useState(false);

  // Fetch Class & Stream Config
  const fetchData = async () => {
    try {
      setLoading(true);
      const [classRes, streamRes, questionsRes] = await Promise.all([
        api.live.getBySlugOrId(id!),
        api.live.getStreamConfig(id!),
        api.live.getQuestions(id!),
      ]);

      if (classRes.success && classRes.liveClass) {
        setLiveClass(classRes.liveClass);
        setStreamStatus(classRes.liveClass.status);
        setStreamUrlInput(classRes.liveClass.meetingUrl || '');
        if (classRes.liveClass.activePoll) {
          setActivePoll(classRes.liveClass.activePoll);
        }
      }

      if (streamRes.success && streamRes.streamConfig) {
        setObsConfig({
          rtmpServer: streamRes.streamConfig.rtmpServer,
          streamKey: streamRes.streamConfig.streamKey,
        });
        setRecordingUrl(streamRes.streamConfig.hlsPlaybackUrl || '');
      }

      if (questionsRes.success) {
        setQuestions(questionsRes.questions || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to initialize Control Room');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // Elapsed Time Counter when Live
  useEffect(() => {
    if (streamStatus !== 'LIVE') return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [streamStatus]);

  // Socket Connection & Listeners
  useEffect(() => {
    if (!id) return;
    const socket = connectSocket();

    socket.emit('live:join', { classId: id });

    socket.on('live:viewer_count', (data: { count: number; peak: number }) => {
      setViewerCount(data.count);
      if (data.peak) setPeakViewers(data.peak);
    });

    socket.on('chat:new', (msg: LiveChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-200), msg]);
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    });

    socket.on('chat:deleted', (data: { messageId: string }) => {
      setChatMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    });

    socket.on('question:new', (q: LiveQuestion) => {
      setQuestions((prev) => [q, ...prev]);
    });

    socket.on('question:updated', (updated: LiveQuestion) => {
      setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    });

    socket.on('poll:started', (poll: LivePoll) => {
      setActivePoll(poll);
    });

    socket.on('poll:tally_update', (poll: LivePoll) => {
      setActivePoll(poll);
    });

    socket.on('poll:ended', (poll: LivePoll) => {
      setActivePoll(poll);
    });

    return () => {
      socket.off('live:viewer_count');
      socket.off('chat:new');
      socket.off('chat:deleted');
      socket.off('question:new');
      socket.off('question:updated');
      socket.off('poll:started');
      socket.off('poll:tally_update');
      socket.off('poll:ended');
    };
  }, [id]);

  // Start Live Session
  const handleStartLive = async () => {
    try {
      const res = await api.live.startSession(id!);
      if (res.success) {
        setStreamStatus('LIVE');
        success('Class is now broadcasting LIVE to students!');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to start live session');
    }
  };

  // Mark Stream Interrupted
  const handleMarkInterrupted = async () => {
    try {
      const res = await api.live.interruptedSession(id!);
      if (res.success) {
        setStreamStatus('STREAM_INTERRUPTED');
        success('Stream marked as interrupted.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to mark interrupted');
    }
  };

  // End Live Session
  const handleEndLive = async () => {
    if (!window.confirm('Are you sure you want to end this live broadcast session?')) return;
    try {
      const res = await api.live.endSession(id!);
      if (res.success) {
        setStreamStatus('ENDED');
        success('Live broadcast ended. Prompting to convert to recorded lecture...');
        setIsConvertModalOpen(true);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to end session');
    }
  };

  // Toggle Chat Pause
  const handleToggleChatPause = () => {
    const nextState = !isChatPaused;
    setIsChatPaused(nextState);
    const socket = getSocket();
    socket.emit('chat:mode', {
      classId: id,
      isChatPaused: nextState,
    });
    success(nextState ? 'Chat paused for students' : 'Chat enabled');
  };

  // Toggle Slow Mode
  const handleToggleSlowMode = () => {
    const nextState = !isSlowMode;
    setIsSlowMode(nextState);
    const socket = getSocket();
    socket.emit('chat:mode', {
      classId: id,
      isSlowMode: nextState,
      slowModeSeconds: 5,
    });
    success(nextState ? 'Slow mode active (5s cooldown)' : 'Slow mode disabled');
  };

  // Delete Chat Message
  const handleDeleteChatMessage = (msgId: string) => {
    const socket = getSocket();
    socket.emit('chat:delete', {
      classId: id,
      messageId: msgId,
    });
  };

  // Pin Chat Message
  const handlePinChatMessage = (msgId: string, isPinned: boolean) => {
    const socket = getSocket();
    socket.emit('chat:pin', {
      classId: id,
      messageId: msgId,
      isPinned: !isPinned,
    });
  };

  // Mute User
  const handleMuteUser = (targetUserId: string) => {
    const socket = getSocket();
    socket.emit('chat:mute_user', {
      classId: id,
      targetUserId,
      mute: true,
    });
    success('Student muted from chat');
  };

  // Answer Question
  const handleAnswerQuestion = (qId: string) => {
    if (!answerInput.trim()) return;
    const socket = getSocket();
    socket.emit('question:moderate', {
      classId: id,
      questionId: qId,
      answer: answerInput.trim(),
    });
    setAnsweringQuestionId(null);
    setAnswerInput('');
    success('Doubt answered!');
  };

  // Launch Live Poll
  const handleLaunchPoll = () => {
    if (!pollQuestion.trim()) return;
    const filteredOpts = pollOptions.filter((o) => o.trim().length > 0);
    if (filteredOpts.length < 2) {
      toastError('Poll requires at least 2 options');
      return;
    }

    const socket = getSocket();
    socket.emit('poll:start', {
      classId: id,
      question: pollQuestion.trim(),
      options: filteredOpts,
    });

    setIsPollModalOpen(false);
    setPollQuestion('');
    success('Live Poll broadcasted to students!');
  };

  // End Current Poll
  const handleEndPoll = () => {
    if (!activePoll) return;
    const socket = getSocket();
    socket.emit('poll:end', {
      classId: id,
      pollId: activePoll.id,
    });
    success('Live Poll ended.');
  };

  // Launch Live Quiz
  const handleLaunchQuiz = () => {
    if (!quizQuestion.trim()) return;
    const socket = getSocket();
    socket.emit('quiz:launch', {
      classId: id,
      questionText: quizQuestion.trim(),
      options: quizOptions,
      durationSeconds: quizDuration,
      correctOptionIndex: quizCorrectIndex,
      explanation: quizExplanation.trim() || 'Well done!',
    });

    setIsQuizModalOpen(false);
    setQuizQuestion('');
    success('Quiz launched with live countdown!');
  };

  // Broadcast Announcement
  const handleSendAnnouncement = () => {
    if (!announcementMsg.trim()) return;
    const socket = getSocket();
    socket.emit('announcement:send', {
      classId: id,
      message: announcementMsg.trim(),
      type: announcementType,
    });

    setIsAnnounceModalOpen(false);
    setAnnouncementMsg('');
    success('Announcement broadcasted to all viewers!');
  };

  // Save / Update Live Stream URL (YouTube Live OBS Stream)
  const handleSaveStreamUrl = async () => {
    if (!id) return;
    try {
      setSavingStreamUrl(true);
      const res = await api.live.update(id, {
        meetingUrl: streamUrlInput.trim() || null,
      });
      if (res.success) {
        success('Live Stream URL saved! Students will now see this stream.');
        setLiveClass((prev) => (prev ? { ...prev, meetingUrl: streamUrlInput.trim() || null } : null));
        setIsEditingStream(false);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update stream URL');
    } finally {
      setSavingStreamUrl(false);
    }
  };

  // Convert to Recorded Lecture (Phase 13 & 14)
  const handleConvertToRecording = async () => {
    try {
      setConverting(true);
      const res = await api.live.convertToRecording(id!, {
        chapterTitle: recordingChapter.trim(),
        recordingUrl: recordingUrl.trim(),
      });
      if (res.success) {
        success('Live session converted into official Recorded Lecture!');
        setIsConvertModalOpen(false);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to convert recording');
    } finally {
      setConverting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    success(`${label} copied!`);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const formatElapsed = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#6C63FF]" />
        <p className="text-xs font-bold text-slate-300">Loading Live Broadcast Control Room...</p>
      </div>
    );
  }

  if (!liveClass) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Top Header & Metrics Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/live-classes"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Exit Control Room"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ${
                  streamStatus === 'LIVE'
                    ? 'bg-rose-600 text-white animate-pulse'
                    : streamStatus === 'STREAM_INTERRUPTED'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                {streamStatus === 'LIVE' ? 'LIVE NOW' : streamStatus}
              </span>
              <h1 className="text-sm sm:text-base font-black text-white line-clamp-1">
                {liveClass.title}
              </h1>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{liveClass.instructor}</span>
              {liveClass.course && <span>• {liveClass.course.title}</span>}
              {streamStatus === 'LIVE' && (
                <span className="font-mono text-emerald-400 font-bold">• Elapsed: {formatElapsed(elapsedSeconds)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Broadcast Stats */}
        <div className="flex items-center gap-3 sm:gap-6 bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Current</div>
              <div className="font-black text-white">{viewerCount}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3 sm:pl-6">
            <Eye className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Peak Viewers</div>
              <div className="font-black text-white">{peakViewers || viewerCount}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3 sm:pl-6">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Chat Msgs</div>
              <div className="font-black text-white">{chatMessages.length}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3 sm:pl-6">
            <HelpCircle className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">Doubts</div>
              <div className="font-black text-white">{questions.length}</div>
            </div>
          </div>
        </div>

        {/* Broadcast Action Buttons */}
        <div className="flex items-center gap-2">
          {streamStatus !== 'LIVE' ? (
            <button
              onClick={handleStartLive}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:opacity-95 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-1.5"
            >
              <PlayCircle className="w-4 h-4" />
              Start Broadcasting Live
            </button>
          ) : (
            <>
              <button
                onClick={handleMarkInterrupted}
                className="px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl transition-colors"
                title="OBS Reconnecting"
              >
                Interrupt State
              </button>
              <button
                onClick={handleEndLive}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-1.5"
              >
                <PauseCircle className="w-4 h-4" />
                End Live Session
              </button>
            </>
          )}

          <Link
            to={`/admin/live-classes/${id}/analytics`}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
            title="Class Analytics"
          >
            <BarChart2 className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Control Room Grid: 3-column layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Column 1 (4 cols): OBS Stream Details & Live Controls */}
        <div className="lg:col-span-4 bg-slate-900/60 border-r border-slate-800 p-4 space-y-4 overflow-y-auto">
          {/* Live Stream Source Card (OBS / YouTube Live) */}
          {youtubeVideoId ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="font-bold text-white">Live Broadcast Monitor</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingStream((prev) => !prev)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>{isEditingStream ? 'Cancel' : 'Change Link'}</span>
                </button>
              </div>

              {/* Embedded Video Preview */}
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=0&rel=0&modestbranding=1`}
                  title="Broadcast Preview"
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              </div>

              {/* Edit URL Form if toggled */}
              {isEditingStream && (
                <div className="space-y-2 pt-1 border-t border-slate-800 animate-in fade-in">
                  <input
                    type="url"
                    value={streamUrlInput}
                    onChange={(e) => setStreamUrlInput(e.target.value)}
                    placeholder="Paste YouTube Live URL..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-[#6C63FF]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingStream(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={savingStreamUrl}
                      onClick={handleSaveStreamUrl}
                      className="px-3 py-1.5 rounded-lg bg-[#6C63FF] hover:bg-[#584fd4] text-white text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {savingStreamUrl ? 'Saving...' : 'Update Link'}
                    </button>
                  </div>
                </div>
              )}

              {/* Student Watch Link */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-900">
                <span className="truncate mr-2">Student Link: /live/{liveClass.slug || liveClass.id}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`/live/${liveClass.slug || liveClass.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-white flex items-center gap-0.5 text-[10px]"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/live/${liveClass.slug || liveClass.id}`, 'Student Link')}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    {copySuccess === 'Student Link' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Stream not connected yet: Quick connect card */
            <div className="bg-slate-950 border border-indigo-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                <span>Connect OBS Live Stream</span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <div>1. In OBS Studio: <b>Settings → Stream → Service: YouTube - RTMPS</b></div>
                <div>2. Paste your YouTube stream key & click <b>Start Streaming</b>.</div>
                <div>3. Paste your YouTube Live video URL below:</div>
              </div>
              <div className="space-y-2">
                <input
                  type="url"
                  value={streamUrlInput}
                  onChange={(e) => setStreamUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-[#6C63FF]"
                />
                <button
                  type="button"
                  disabled={savingStreamUrl || !streamUrlInput.trim()}
                  onClick={handleSaveStreamUrl}
                  className="w-full py-2 bg-[#6C63FF] hover:bg-[#584fd4] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {savingStreamUrl ? 'Connecting...' : 'Connect & Preview Stream'}
                </button>
              </div>
            </div>
          )}

          {/* Advanced: Collapsible Custom RTMP Credentials */}
          {obsConfig && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowRtmpDetails((p) => !p)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Key className="w-3 h-3 text-indigo-400" />
                  <span>Advanced: Custom RTMP Server Info</span>
                </span>
                {showRtmpDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showRtmpDetails && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-3 text-xs animate-in fade-in">
                  <p className="text-[10px] text-amber-400/90 leading-relaxed">
                    Note: If OBS gives "Hostname not found", use <b>YouTube Live via OBS</b> above. For self-hosted media servers (MediaMTX / Nginx), use:
                  </p>

                  {/* RTMP Server URL */}
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">RTMP Server</div>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800/80 rounded-xl p-2 px-3 text-[11px] font-mono">
                      <span className="flex-1 truncate text-indigo-300 select-all">{obsConfig.rtmpServer}</span>
                      <button
                        onClick={() => copyToClipboard(obsConfig.rtmpServer, 'Server')}
                        className="text-slate-400 hover:text-white"
                      >
                        {copySuccess === 'Server' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Stream Key */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase font-bold">
                      <span>Stream Key</span>
                      <button
                        type="button"
                        onClick={() => setShowKey((p) => !p)}
                        className="text-indigo-400 hover:text-indigo-300 font-sans normal-case text-[10px]"
                      >
                        {showKey ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800/80 rounded-xl p-2 px-3 text-[11px] font-mono">
                      <span className="flex-1 truncate text-amber-300 select-all">
                        {showKey ? obsConfig.streamKey : '••••••••••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => copyToClipboard(obsConfig.streamKey, 'Key')}
                        className="text-slate-400 hover:text-white"
                      >
                        {copySuccess === 'Key' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Interaction Triggers */}
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 uppercase font-bold">Interactive Tools</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setIsPollModalOpen(true)}
                className="p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-2xl flex items-center gap-2 font-bold text-slate-200 transition-all text-left"
              >
                <BarChart2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Launch Poll</span>
              </button>

              <button
                onClick={() => setIsQuizModalOpen(true)}
                className="p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-2xl flex items-center gap-2 font-bold text-slate-200 transition-all text-left"
              >
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Launch Quiz</span>
              </button>

              <button
                onClick={() => setIsAnnounceModalOpen(true)}
                className="p-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-2xl flex items-center gap-2 font-bold text-slate-200 transition-all text-left"
              >
                <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Announcement</span>
              </button>

              <button
                onClick={() => setIsConvertModalOpen(true)}
                className="p-3 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 rounded-2xl flex items-center gap-2 font-bold text-indigo-200 transition-all text-left"
              >
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Save Recording</span>
              </button>
            </div>
          </div>

          {/* Active Poll Live Monitor */}
          {activePoll && (
            <div className="bg-slate-950 border border-purple-500/30 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-400 flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5" />
                  {activePoll.status === 'LIVE' ? 'Active Poll' : 'Ended Poll'}
                </span>
                {activePoll.status === 'LIVE' && (
                  <button
                    onClick={handleEndPoll}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300"
                  >
                    End Poll
                  </button>
                )}
              </div>

              <div className="text-xs font-semibold text-white">{activePoll.question}</div>

              <div className="space-y-2 text-[11px]">
                {activePoll.options.map((opt) => {
                  const total = activePoll._count?.responses || activePoll.options.reduce((a, b) => a + b.voteCount, 0);
                  const pct = total > 0 ? Math.round((opt.voteCount / total) * 100) : 0;
                  return (
                    <div key={opt.id} className="space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>{opt.optionText}</span>
                        <span className="font-bold">{opt.voteCount} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Column 2 (4 cols): Live Chat Moderation */}
        <div className="lg:col-span-4 bg-slate-950 border-r border-slate-800 flex flex-col h-full overflow-hidden">
          {/* Chat Controls Header */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <MessageSquare className="w-4 h-4 text-[#6C63FF]" />
              Live Chat Stream ({chatMessages.length})
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                onClick={handleToggleChatPause}
                className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                  isChatPaused
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {isChatPaused ? 'Resume' : 'Pause'}
              </button>

              <button
                onClick={handleToggleSlowMode}
                className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                  isSlowMode
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {isSlowMode ? 'Slow 5s' : 'Slow Off'}
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div
            ref={chatScrollRef}
            className="flex-1 p-3.5 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 text-xs"
          >
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                <p>Waiting for student messages...</p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="group bg-slate-900/70 border border-slate-800/80 rounded-xl p-2.5 space-y-1 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-300 text-[11px]">{msg.userName}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handlePinChatMessage(msg.id, msg.isPinned)}
                        className="p-1 text-slate-400 hover:text-indigo-400"
                        title="Pin Message"
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMuteUser(msg.userId)}
                        className="p-1 text-slate-400 hover:text-amber-400"
                        title="Mute Student"
                      >
                        <VolumeX className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteChatMessage(msg.id)}
                        className="p-1 text-slate-400 hover:text-rose-400"
                        title="Delete Message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-200 text-xs break-words">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3 (4 cols): Doubts & Q&A Moderation (Phase 8) */}
        <div className="lg:col-span-4 bg-slate-900/60 flex flex-col h-full overflow-hidden">
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              Student Doubts ({questions.length})
            </div>
            <span className="text-[10px] text-slate-500 font-bold">
              {questions.filter((q) => q.status === 'PENDING').length} Pending
            </span>
          </div>

          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            {questions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                <HelpCircle className="w-8 h-8 mb-2 opacity-30" />
                <p>No student questions posted</p>
              </div>
            ) : (
              questions.map((q) => (
                <div
                  key={q.id}
                  className={`p-3 rounded-2xl border text-xs space-y-2 ${
                    q.status === 'ANSWERED'
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-300 text-[11px]">{q.userName}</div>
                      <p className="text-slate-100 font-medium mt-0.5">{q.question}</p>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-[#6C63FF]">
                      👍 {q.upvotes}
                    </span>
                  </div>

                  {q.answer ? (
                    <div className="text-[11px] text-emerald-400 font-medium">
                      Answered: "{q.answer}"
                    </div>
                  ) : answeringQuestionId === q.id ? (
                    <div className="space-y-1.5 pt-1">
                      <textarea
                        rows={2}
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        placeholder="Type answer for students..."
                        className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white outline-none"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setAnsweringQuestionId(null)}
                          className="px-2.5 py-1 text-[10px] text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAnswerQuestion(q.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px]"
                        >
                          Post Answer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          setAnsweringQuestionId(q.id);
                          setAnswerInput('');
                        }}
                        className="px-3 py-1 bg-[#6C63FF] hover:bg-[#584fd4] text-white text-[10px] font-bold rounded-lg transition-colors"
                      >
                        Answer Live
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Launch Poll (Phase 9) */}
      {isPollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                Launch In-Class Poll
              </h3>
              <button onClick={() => setIsPollModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Poll Question</label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="e.g. Which Article deals with Right to Equality?"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-300">Options</label>
                {pollOptions.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const updated = [...pollOptions];
                      updated[idx] = e.target.value;
                      setPollOptions(updated);
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                  />
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsPollModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLaunchPoll}
                  className="px-5 py-2 bg-[#6C63FF] hover:bg-[#584fd4] text-white font-bold rounded-xl"
                >
                  Broadcast Poll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Launch Quiz (Phase 10) */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Launch Live Mini-Quiz (Question Bank)
              </h3>
              <button onClick={() => setIsQuizModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Question Text</label>
                <input
                  type="text"
                  value={quizQuestion}
                  onChange={(e) => setQuizQuestion(e.target.value)}
                  placeholder="e.g. Which tier of Panchayati Raj is Gram Panchayat?"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-300">Options (Select radio for correct answer)</label>
                {quizOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={quizCorrectIndex === idx}
                      onChange={() => setQuizCorrectIndex(idx)}
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const updated = [...quizOptions];
                        updated[idx] = e.target.value;
                        setQuizOptions(updated);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Timer Duration (Seconds)</label>
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={quizDuration}
                  onChange={(e) => setQuizDuration(parseInt(e.target.value, 10) || 30)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Faculty Explanation</label>
                <textarea
                  rows={2}
                  value={quizExplanation}
                  onChange={(e) => setQuizExplanation(e.target.value)}
                  placeholder="Explanation revealed to students after time expires..."
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsQuizModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLaunchQuiz}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                >
                  Launch Live Quiz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Announcement */}
      {isAnnounceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                Broadcast Class Announcement
              </h3>
              <button onClick={() => setIsAnnounceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Announcement Message</label>
                <textarea
                  rows={3}
                  value={announcementMsg}
                  onChange={(e) => setAnnouncementMsg(e.target.value)}
                  placeholder="e.g. Please open Chapter 3 practice sheet for the next 15 minutes."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Type</label>
                <select
                  value={announcementType}
                  onChange={(e) => setAnnouncementType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                >
                  <option value="NORMAL">Standard Toast</option>
                  <option value="PINNED">Pinned Banner at Top of Screen</option>
                  <option value="URGENT">Urgent Alert</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsAnnounceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendAnnouncement}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl"
                >
                  Send Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Save Recording as Recorded Lecture (Phase 13 & 14) */}
      {isConvertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Publish as Recorded Course Lecture
              </h3>
              <button onClick={() => setIsConvertModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400 leading-relaxed">
                Connects this session's recording to the course lecture repository. All attached notes, practice sheets, and quiz will be inherited.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Chapter Title</label>
                <input
                  type="text"
                  value={recordingChapter}
                  onChange={(e) => setRecordingChapter(e.target.value)}
                  placeholder="e.g. Chapter 4: Fundamental Rights"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Recording Playback URL (or Google Drive Video)</label>
                <input
                  type="url"
                  value={recordingUrl}
                  onChange={(e) => setRecordingUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsConvertModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Skip for Now
                </button>
                <button
                  disabled={converting}
                  onClick={handleConvertToRecording}
                  className="px-5 py-2 bg-[#6C63FF] hover:bg-[#584fd4] text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {converting ? 'Converting...' : 'Publish to Course'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLiveControlRoomPage;
