import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Maximize2,
  Minimize2,
  Keyboard as KeyboardIcon,
  ShieldAlert,
} from 'lucide-react';
import { TypingTest, TypingExam } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { VirtualKeyboard } from './VirtualKeyboard';
import { TypingScorecard } from './TypingScorecard';

interface TypingEngineProps {
  test: TypingTest;
  exam?: TypingExam | null;
  mode?: string;
  onFinished?: () => void;
  onGoToDashboard?: () => void;
}

export const TypingEngine: React.FC<TypingEngineProps> = ({
  test,
  exam,
  mode = 'STANDARD',
  onFinished,
  onGoToDashboard,
}) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const passage = test.passageText;
  const initialDuration = test.durationSeconds || 60;

  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [showKeyboard, setShowKeyboard] = useState(test.category === 'LESSON');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Scorecard state when finished
  const [scorecard, setScorecard] = useState<any>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<any>(null);
  const passageContainerRef = useRef<HTMLDivElement>(null);

  // Real-time error counting & stats
  const totalCharsTyped = userInput.length;
  let errors = 0;
  let correctChars = 0;
  const mistypedKeys: Record<string, number> = {};

  for (let i = 0; i < userInput.length; i++) {
    if (userInput[i] === passage[i]) {
      correctChars++;
    } else {
      errors++;
      const targetKey = passage[i]?.toLowerCase();
      if (targetKey) {
        mistypedKeys[targetKey] = (mistypedKeys[targetKey] || 0) + 1;
      }
    }
  }

  const wrongChars = errors;
  const accuracy = totalCharsTyped > 0 ? Math.round((correctChars / totalCharsTyped) * 100) : 100;

  const timeElapsed = initialDuration - timeLeft;
  const minutesElapsed = Math.max(timeElapsed / 60, 0.05);
  // Standard metric: 5 keystrokes = 1 word
  const grossWpm = Math.round((totalCharsTyped / 5) / minutesElapsed);
  const netWpm = Math.max(0, Math.round(((totalCharsTyped / 5) - (errors / 5)) / minutesElapsed));

  // Current active character in passage
  const currentTargetChar = passage[userInput.length] || '';

  // Focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [test.id]);

  // Handle keystrokes & anti-paste
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isCompleted || isPaused) return;

    if (e.key === 'Backspace') {
      setBackspaceCount(prev => prev + 1);

      // Controlled backspace rules
      if (exam?.backspaceRule === 'DISABLED') {
        e.preventDefault();
        return;
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isCompleted || isPaused) return;

    const val = e.target.value;

    // Start timer on first keystroke
    if (!isActive && val.length > 0) {
      setIsActive(true);
    }

    setUserInput(val);

    // Auto-scroll passage view to follow caret
    if (passageContainerRef.current) {
      const activeSpan = passageContainerRef.current.querySelector('#active-caret');
      if (activeSpan) {
        (activeSpan as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    // Complete if passage finished
    if (val.length >= passage.length) {
      finishTest(val);
    }
  };

  const finishTest = async (finalInput = userInput) => {
    setIsActive(false);
    setIsCompleted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const finalChars = finalInput.length;
    let finalErrors = 0;
    for (let i = 0; i < finalInput.length; i++) {
      if (finalInput[i] !== passage[i]) finalErrors++;
    }
    const finalCorrect = Math.max(0, finalChars - finalErrors);
    const finalAcc = finalChars > 0 ? Math.round((finalCorrect / finalChars) * 100) : 100;
    const finalMins = Math.max((initialDuration - timeLeft) / 60, 0.05);
    const finalGross = Math.round((finalChars / 5) / finalMins);
    const finalNet = Math.max(0, Math.round(((finalChars / 5) - (finalErrors / 5)) / finalMins));

    const weakKeysArray = Object.entries(mistypedKeys)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([k]) => k);

    const finalScorecard = {
      grossWpm: finalGross,
      netWpm: finalNet,
      accuracy: finalAcc,
      errors: finalErrors,
      correctChars: finalCorrect,
      wrongChars: finalErrors,
      backspaces: backspaceCount,
      timeSpentSeconds: initialDuration - timeLeft,
      resultStatus: finalNet >= (exam?.targetSpeed || 35) && finalAcc >= (exam?.minAccuracy || 90) ? 'QUALIFIED' : 'FAILED',
      readinessScore: Math.min(100, Math.round((finalNet / (exam?.targetSpeed || 35)) * 60 + (finalAcc / (exam?.minAccuracy || 90)) * 40)),
      weakKeys: weakKeysArray,
    };

    setScorecard(finalScorecard);

    // Save attempt to server
    try {
      await api.typing.saveAttempt({
        typingTestId: test.id,
        examId: exam?.id || test.examId || null,
        mode,
        grossWpm: finalGross,
        netWpm: finalNet,
        accuracy: finalAcc,
        errors: finalErrors,
        correctChars: finalCorrect,
        wrongChars: finalErrors,
        backspaces: backspaceCount,
        totalCharacters: finalChars,
        durationSeconds: initialDuration,
        timeSpentSeconds: initialDuration - timeLeft,
        mistakeDetails: weakKeysArray,
      });
      if (onFinished) onFinished();
    } catch (e) {
      console.error(e);
    }
  };

  // Timer interval
  useEffect(() => {
    if (isActive && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, timeLeft]);

  // Restart test
  const handleRestart = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setUserInput('');
    setTimeLeft(initialDuration);
    setIsActive(false);
    setIsPaused(false);
    setIsCompleted(false);
    setBackspaceCount(0);
    setScorecard(null);
    if (inputRef.current) inputRef.current.focus();
  };

  // If completed, show scorecard
  if (isCompleted && scorecard) {
    return (
      <TypingScorecard
        test={test}
        exam={exam}
        scorecard={scorecard}
        onRetry={handleRestart}
        onGoToDashboard={onGoToDashboard}
      />
    );
  }

  const minsLeft = Math.floor(timeLeft / 60);
  const secsLeft = timeLeft % 60;
  const timeDisplay = `${minsLeft}:${secsLeft < 10 ? '0' : ''}${secsLeft}`;

  return (
    <div
      className={`bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none p-6 bg-slate-900 text-white' : 'p-6 sm:p-8'
      }`}
    >
      {/* Top Header / Control Bar (Phase 18) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF] text-[11px] font-extrabold uppercase">
              {test.language} • {test.keyboardLayout || 'QWERTY'}
            </span>
            {exam && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                Target: {exam.targetSpeed} WPM ({exam.name})
              </span>
            )}
          </div>
          <h2 className={`font-black text-lg sm:text-xl truncate max-w-lg ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
            {test.title}
          </h2>
        </div>

        {/* Live Timer & Action Controls */}
        <div className="flex items-center gap-2">
          {/* Live Timer Countdown */}
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-sm">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-mono text-lg font-black tracking-wider">{timeDisplay}</span>
          </div>

          {/* Pause / Resume (Only in standard practice mode) */}
          {mode === 'PRACTICE' && (
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
              title={isPaused ? 'Resume Test' : 'Pause'}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-600" /> : <Pause className="w-4 h-4 text-slate-600" />}
            </button>
          )}

          {/* Restart */}
          <button
            type="button"
            onClick={handleRestart}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Restart Test"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Keyboard Toggle */}
          <button
            type="button"
            onClick={() => setShowKeyboard(!showKeyboard)}
            className={`p-2.5 rounded-xl border transition ${
              showKeyboard ? 'bg-[#6C63FF] text-white border-[#6C63FF]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle Visual Keyboard"
          >
            <KeyboardIcon className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition hidden sm:block"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Live Stats Header Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-4 text-center">
        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Net Speed</span>
          <p className="text-xl font-black text-[#6C63FF]">{netWpm} <span className="text-[10px] font-normal text-slate-500">WPM</span></p>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</span>
          <p className={`text-xl font-black ${accuracy >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>{accuracy}%</p>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Gross WPM</span>
          <p className="text-xl font-black text-slate-800">{grossWpm}</p>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Errors (त्रुटियाँ)</span>
          <p className="text-xl font-black text-rose-600">{errors}</p>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Backspaces</span>
          <p className="text-xl font-black text-slate-700">{backspaceCount}</p>
        </div>
      </div>

      {/* Middle: Passage Area with Live Character Highlight & Caret */}
      <div
        ref={passageContainerRef}
        className={`p-6 rounded-2xl max-h-56 overflow-y-auto leading-relaxed font-mono text-base sm:text-lg select-none border transition-colors ${
          isFullscreen ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200/90 text-slate-800'
        }`}
        style={{ letterSpacing: '0.02em', lineHeight: '1.9' }}
      >
        {passage.split('').map((char, index) => {
          const isTyped = index < userInput.length;
          const isCurrent = index === userInput.length;
          const isCorrect = isTyped && userInput[index] === char;
          const isWrong = isTyped && userInput[index] !== char;

          return (
            <span
              key={index}
              id={isCurrent ? 'active-caret' : undefined}
              className={`relative ${
                isCorrect
                  ? 'text-emerald-600 bg-emerald-100/50 rounded-sm'
                  : isWrong
                  ? 'text-rose-600 bg-rose-200/80 rounded-sm font-bold underline decoration-rose-500'
                  : isCurrent
                  ? 'bg-blue-200/80 text-blue-900 font-black ring-2 ring-blue-500 rounded-sm animate-pulse'
                  : 'opacity-70'
              }`}
            >
              {char}
            </span>
          );
        })}
      </div>

      {/* Bottom: Typing Input Area */}
      <div className="pt-5 space-y-3">
        <textarea
          ref={inputRef}
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={(e) => {
            e.preventDefault();
            toastError('Anti-Cheat: Paste is disabled in typing tests.');
          }}
          disabled={isCompleted || isPaused}
          rows={3}
          placeholder="यहाँ टाइप करना शुरू करें... / Start typing here (Timer begins automatically on first keypress)"
          className={`w-full p-4 rounded-2xl font-mono text-sm sm:text-base outline-none border transition-all resize-none ${
            isFullscreen
              ? 'bg-slate-800 text-white border-slate-700 focus:border-[#6C63FF]'
              : 'bg-white text-slate-900 border-slate-300 focus:border-[#6C63FF] focus:ring-4 focus:ring-[#6C63FF]/10'
          }`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            टाइप किए गए अक्षर: <strong>{totalCharsTyped}</strong> / {passage.length}
          </span>
          <span className="italic">
            पेस्ट निषिद्ध है (Anti-Paste Enabled) • Backspace: {exam?.backspaceRule || 'Allowed'}
          </span>
        </div>
      </div>

      {/* Optional Visual Keyboard Display (Phase 8 & 10) */}
      {showKeyboard && (
        <div className="pt-6 border-t border-slate-200">
          <VirtualKeyboard
            activeChar={currentTargetChar}
            layout={test.keyboardLayout}
          />
        </div>
      )}
    </div>
  );
};

export default TypingEngine;
