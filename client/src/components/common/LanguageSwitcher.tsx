import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200/90 text-xs font-bold transition-all select-none ${className}`}
      role="group"
      aria-label="Language selector"
    >
      <div className="pl-1.5 pr-0.5 text-slate-400 flex items-center justify-center pointer-events-none">
        <Globe className="w-3.5 h-3.5" />
      </div>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded-lg transition-all ${
          language === 'en'
            ? 'bg-white text-[#6C63FF] shadow-xs font-black'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        aria-pressed={language === 'en'}
        title="Switch to English"
      >
        {variant === 'full' ? 'English' : 'EN'}
      </button>

      <span className="text-slate-300 font-normal px-0.5">|</span>

      <button
        type="button"
        onClick={() => setLanguage('hi')}
        className={`px-2 py-1 rounded-lg transition-all ${
          language === 'hi'
            ? 'bg-white text-[#6C63FF] shadow-xs font-black'
            : 'text-slate-600 hover:text-slate-900'
        }`}
        aria-pressed={language === 'hi'}
        title="हिंदी में बदलें"
      >
        हिंदी
      </button>
    </div>
  );
};

export default LanguageSwitcher;
