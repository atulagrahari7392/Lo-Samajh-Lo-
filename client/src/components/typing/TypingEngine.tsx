import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Award, CheckCircle2, AlertTriangle, Clock, Zap } from 'lucide-react';
import { TypingTest } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface TypingEngineProps {
  test: TypingTest;
  onFinished?: () => void;
}

export const TypingEngine: React.FC<TypingEngineProps> = ({ test, onFinished }) => {
  const { user } = useAuth();
  const { success } = useToast();

  const passage = test.passageText;
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(test.durationSeconds || 60);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(test.durationSeconds || 60);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<any>(null);

  // Live calculation stats
  const totalCharsTyped = userInput.length;
  let errors = 0;
  for (let i = 0; i < userInput.length; i++) {
    if (userInput[i] !== passage[i]) {
      errors++;
    }
  }

  const correctChars = Math.max(0, totalCharsTyped - errors);
  const accuracy = totalCharsTyped > 0 ? Math.round((correctChars / totalCharsTyped) * 100) : 100;

  const timeElapsed = selectedDuration - timeLeft;
  const minutesElapsed = Math.max(timeElapsed / 60, 0.05);
  // Standard standard: 5 characters = 1 word
  const grossWpm = Math.round((totalCharsTyped / 5) / minutesElapsed);
  const netWpm = Math.max(0, Math.round(((totalCharsTyped / 5) - (errors / 5)) / minutesElapsed));

  // Start test on first keystroke
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isCompleted) return;

    const val = e.target.value;
    if (!isActive && val.length > 0) {
      setIsActive(true);
    }

    setUserInput(val);

    // If reached end of passage
    if (val.length >= passage.length) {
      finishTest();
    }
  };

  const finishTest = async () => {
    setIsActive(false);
    setIsCompleted(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Send attempt to server
    try {
      await api.typing.saveAttempt({
        typingTestId: test.id,
        wpm: grossWpm,
        netWpm,
        accuracy,
        errors,
        totalCharacters: totalCharsTyped,
        durationSeconds: selectedDuration,
      });
      success('Typing speed score saved!');
      if (onFinished) onFinished();
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
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
  }, [isActive, timeLeft]);

  const handleReset = (newDuration?: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const dur = newDuration || selectedDuration;
    setSelectedDuration(dur);
    setTimeLeft(dur);
    setUserInput('');
    setIsActive(false);
    setIsCompleted(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
      {/* Test Controls Bar */}
      <div className="bg-slate-50 p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-100 text-[#6C63FF]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{test.title}</h3>
            <p className="text-xs text-slate-500">
              Language: <span className="font-semibold text-slate-700">{test.language}</span> • Level: <span className="font-semibold text-slate-700">{test.difficulty}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Duration Selector */}
          {!isActive && !isCompleted && (
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs font-bold">
              {[60, 120, 300].map((dur) => (
                <button
                  key={dur}
                  onClick={() => handleReset(dur)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    selectedDuration === dur
                      ? 'bg-[#6C63FF] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dur / 60} min
                </button>
              ))}
            </div>
          )}

          {/* Countdown Clock */}
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-mono font-bold text-sm shadow">
            <Clock className="w-4 h-4 text-[#FF6584]" />
            <span>{timeLeft}s</span>
          </div>

          <button
            onClick={() => handleReset()}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Restart Test"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 border-b border-slate-100 bg-slate-50/50">
        <div className="p-4 text-center">
          <span className="text-xs text-slate-500 font-semibold uppercase">Net Speed</span>
          <p className="text-2xl sm:text-3xl font-black text-[#6C63FF] mt-0.5">{netWpm} <span className="text-xs font-medium text-slate-400">WPM</span></p>
        </div>
        <div className="p-4 text-center">
          <span className="text-xs text-slate-500 font-semibold uppercase">Gross Speed</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-0.5">{grossWpm} <span className="text-xs font-medium text-slate-400">WPM</span></p>
        </div>
        <div className="p-4 text-center">
          <span className="text-xs text-slate-500 font-semibold uppercase">Accuracy</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-0.5">{accuracy}<span className="text-xs font-medium text-slate-400">%</span></p>
        </div>
        <div className="p-4 text-center">
          <span className="text-xs text-slate-500 font-semibold uppercase">Errors</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-500 mt-0.5">{errors}</p>
        </div>
      </div>

      {/* Interactive Text Display & Input Area */}
      <div className="p-6 sm:p-8 space-y-6">
        {/* Render Passage with Highlights */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200/80 font-sans text-base sm:text-lg leading-relaxed select-none max-h-56 overflow-y-auto">
          {passage.split('').map((char, index) => {
            let style = 'text-slate-500';
            if (index < userInput.length) {
              style = userInput[index] === char ? 'text-emerald-700 bg-emerald-100/60 font-medium' : 'text-white bg-rose-500 font-bold';
            } else if (index === userInput.length) {
              style = 'text-slate-900 bg-[#6C63FF]/20 border-b-2 border-[#6C63FF] animate-pulse';
            }
            return (
              <span key={index} className={`rounded-sm transition-colors ${style}`}>
                {char}
              </span>
            );
          })}
        </div>

        {/* Input Box */}
        {!isCompleted ? (
          <div>
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={handleInputChange}
              disabled={isCompleted}
              placeholder="Click here and start typing the passage above..."
              className="w-full h-32 p-4 rounded-2xl border-2 border-slate-200 focus:border-[#6C63FF] focus:ring-4 focus:ring-[#6C63FF]/10 outline-none transition-all text-base text-slate-800 placeholder-slate-400 font-sans resize-none"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-2 flex items-center justify-between">
              <span>Timer starts automatically as soon as you type the first letter.</span>
              <span>{totalCharsTyped} / {passage.length} characters</span>
            </p>
          </div>
        ) : (
          /* Results Card */
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-pink-50 border border-purple-200 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] text-white flex items-center justify-center shadow-lg">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-900">Typing Test Completed!</h4>
              <p className="text-sm text-slate-600 mt-1">
                {netWpm >= 35
                  ? '🎉 Outstanding! You qualify for SSC / Police Typing Benchmarks (35+ WPM)!'
                  : netWpm >= 25
                  ? '👍 Good speed! Keep practicing daily to reach the 35 WPM threshold.'
                  : 'Keep practicing! Regular typing drills build high speed and muscle memory.'}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 py-3">
              <div className="text-center">
                <span className="text-xs text-slate-500 font-bold">NET SPEED</span>
                <p className="text-3xl font-black text-[#6C63FF]">{netWpm} WPM</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-slate-500 font-bold">ACCURACY</span>
                <p className="text-3xl font-black text-emerald-600">{accuracy}%</p>
              </div>
              <div className="text-center">
                <span className="text-xs text-slate-500 font-bold">ERRORS</span>
                <p className="text-3xl font-black text-rose-500">{errors}</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleReset()}
                className="px-6 py-3 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-sm shadow-md shadow-[#6C63FF]/30 transition-all hover:scale-[1.02]"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypingEngine;
