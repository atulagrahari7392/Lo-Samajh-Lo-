import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TestTimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
  onTick?: (secondsLeft: number) => void;
}

export const TestTimer: React.FC<TestTimerProps> = ({
  initialSeconds,
  onTimeUp,
  onTick,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        const nextVal = prev - 1;
        if (onTick) onTick(nextVal);
        if (nextVal <= 0) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return nextVal;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onTimeUp, onTick]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const isLow = secondsLeft < 300; // less than 5 minutes

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black shadow-sm transition-colors ${
        isLow
          ? 'bg-rose-100 text-rose-700 animate-pulse border border-rose-300'
          : 'bg-purple-100 text-[#6C63FF] border border-purple-200'
      }`}
    >
      <Clock className="w-4 h-4" />
      <span>{formatTime(secondsLeft)}</span>
    </div>
  );
};

export default TestTimer;
