import React from 'react';

interface VirtualKeyboardProps {
  activeChar?: string;
  layout?: 'QWERTY' | 'MANGAL' | 'KRUTIDEV' | string;
  className?: string;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  activeChar = '',
  layout = 'QWERTY',
  className = '',
}) => {
  const normalizedChar = activeChar.toLowerCase();

  // Keyboard Rows definition
  const qwertyRows = [
    ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
    ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
    ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
    ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
    ['Ctrl', 'Alt', 'Space', 'Alt', 'Ctrl'],
  ];

  // Hindi Mangal layout character mapping hint
  const mangalHintMap: Record<string, string> = {
    q: 'ौ', w: 'ै', e: 'ा', r: 'ी', t: 'ू', y: 'ब', u: 'ह', i: 'ग', o: 'द', p: 'ज',
    a: 'ो', s: 'े', d: '्', f: 'ि', g: 'ु', h: 'प', j: 'र', k: 'क', l: 'त', ';': 'च',
    z: 'े', x: 'ं', c: 'म', v: 'न', b: 'व', n: 'ल', m: 'स', ',': 'श', '.': 'ष',
  };

  // Krutidev 010 key mapping hint
  const krutidevHintMap: Record<string, string> = {
    q: 'ु', w: 'ू', e: 'म', r: 'त', t: 'ज', y: 'ल', u: 'न', i: 'प', o: 'व', p: 'च',
    a: 'ं', s: 'े', d: 'क', f: 'ि', g: 'ह', h: 'ी', j: 'र', k: 'ा', l: 'स', ';': 'य',
    z: '्र', x: 'ग', c: 'ब', v: 'अ', b: 'इ', n: 'द', m: 'उ',
  };

  // Finger guidance determination
  const getFingerGuide = (char: string) => {
    const c = char.toLowerCase();
    if (['1', 'q', 'a', 'z', '`', 'tab', 'caps', 'shift'].includes(c)) return { finger: 'Left Pinky (बाएं हाथ की कनिष्ठिका)', color: 'text-rose-500' };
    if (['2', 'w', 's', 'x'].includes(c)) return { finger: 'Left Ring (अनामिका)', color: 'text-amber-500' };
    if (['3', 'e', 'd', 'c'].includes(c)) return { finger: 'Left Middle (मध्यमा)', color: 'text-emerald-500' };
    if (['4', '5', 'r', 't', 'f', 'g', 'v', 'b'].includes(c)) return { finger: 'Left Index (तर्जनी)', color: 'text-blue-500' };
    if (c === ' ' || c === 'space') return { finger: 'Thumb (अंगूठा - Spacebar)', color: 'text-purple-500' };
    if (['6', '7', 'y', 'u', 'h', 'j', 'n', 'm'].includes(c)) return { finger: 'Right Index (दाएं हाथ की तर्जनी)', color: 'text-blue-500' };
    if (['8', 'i', 'k', ','].includes(c)) return { finger: 'Right Middle (मध्यमा)', color: 'text-emerald-500' };
    if (['9', 'o', 'l', '.'].includes(c)) return { finger: 'Right Ring (अनामिका)', color: 'text-amber-500' };
    if (['0', '-', '=', 'p', '[', ']', '\\', ';', "'", '/', 'enter', 'backspace'].includes(c)) return { finger: 'Right Pinky (कनिष्ठिका)', color: 'text-rose-500' };
    return { finger: 'Rest on Home Row (ASDF JKL;)', color: 'text-slate-400' };
  };

  const fingerInfo = getFingerGuide(activeChar || ' ');

  const isKeyActive = (key: string) => {
    if (!activeChar) return false;
    if (key === 'Space' && activeChar === ' ') return true;
    if (key.toLowerCase() === normalizedChar) return true;
    if (layout === 'MANGAL' && mangalHintMap[key.toLowerCase()] === activeChar) return true;
    if (layout === 'KRUTIDEV' && krutidevHintMap[key.toLowerCase()] === activeChar) return true;
    return false;
  };

  return (
    <div className={`bg-slate-900 text-slate-100 p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3 select-none ${className}`}>
      {/* Top Banner: Active key & Finger Guidance */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Layout:</span>
          <span className="px-2 py-0.5 rounded bg-[#6C63FF]/20 text-[#a59eff] font-bold">
            {layout === 'MANGAL' ? 'Hindi Mangal (Inscript)' : layout === 'KRUTIDEV' ? 'Hindi Krutidev 010' : 'English QWERTY'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Finger Guidance:</span>
          <span className={`font-bold ${fingerInfo.color}`}>
            {fingerInfo.finger}
          </span>
        </div>

        {activeChar && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-400">Target Key:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-sm">
              {activeChar === ' ' ? '␣ Space' : activeChar}
            </span>
          </div>
        )}
      </div>

      {/* Keyboard Grid */}
      <div className="space-y-1.5 overflow-x-auto pb-1">
        {qwertyRows.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5 min-w-[540px]">
            {row.map((key) => {
              const active = isKeyActive(key);
              const isHomeKey = ['f', 'j'].includes(key.toLowerCase());
              const isSpecial = ['Backspace', 'Tab', 'Caps', 'Enter', 'Shift', 'Ctrl', 'Alt'].includes(key);
              const isSpace = key === 'Space';

              const hindiHint = layout === 'MANGAL' ? mangalHintMap[key.toLowerCase()] : layout === 'KRUTIDEV' ? krutidevHintMap[key.toLowerCase()] : null;

              return (
                <div
                  key={key}
                  className={`relative flex flex-col items-center justify-center rounded-xl font-bold text-xs sm:text-sm transition-all duration-100 ${
                    isSpace ? 'w-48 sm:w-64 h-10' : isSpecial ? 'px-2.5 sm:px-4 h-10' : 'w-8 sm:w-11 h-10'
                  } ${
                    active
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105 ring-2 ring-white z-10'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 hover:bg-slate-700/80'
                  }`}
                >
                  <span className="uppercase leading-none">{key === 'Space' ? '—' : key}</span>
                  {hindiHint && (
                    <span className="text-[10px] text-amber-400/90 font-medium leading-none mt-0.5">
                      {hindiHint}
                    </span>
                  )}
                  {/* Home Row Marker bumps on F and J */}
                  {isHomeKey && !active && (
                    <span className="absolute bottom-1 w-2 h-0.5 rounded-full bg-slate-400/70" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualKeyboard;
