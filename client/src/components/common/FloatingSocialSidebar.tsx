import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  X,
  Share2,
} from 'lucide-react';
import {
  WhatsAppLogo,
  YouTubeLogo,
  TelegramLogo,
  InstagramLogo,
  FacebookLogo,
  XLogo,
  LinkedInLogo,
} from './SocialBrandIcons';
import { api } from '../../services/api';
import { FooterSettings } from '../../types';

interface SocialChannel {
  name: string;
  hindiTitle: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  bgGradient: string;
  shadowColor: string;
  glowColor: string;
  badge?: string;
  badgeBg: string;
}

const DEFAULT_SETTINGS: Partial<FooterSettings> = {
  whatsappUrl: 'https://wa.me/919999999999?text=Hello%20Lo%20Samajh%20Lo%20Team%2C%20I%20need%20course%20guidance',
  youtubeUrl: 'https://youtube.com/@losamajhlo',
  telegramUrl: 'https://t.me/losamajhlo',
  instagramUrl: 'https://instagram.com/losamajhlo',
  facebookUrl: 'https://facebook.com/losamajhlo',
  twitterUrl: 'https://twitter.com/losamajhlo',
  linkedinUrl: 'https://linkedin.com/company/losamajhlo',
};

export const FloatingSocialSidebar: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<Partial<FooterSettings>>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  // Staggered entrance trigger
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    api.settings
      .getFooter()
      .then((res) => {
        if (active && res?.success && res?.settings) {
          setSettings((prev) => ({ ...prev, ...res.settings }));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const channels: SocialChannel[] = [
    {
      name: 'WhatsApp',
      hindiTitle: 'WhatsApp Chat Support',
      subtitle: 'Course guidance & admission help — 24x7',
      icon: WhatsAppLogo,
      href: settings.whatsappUrl || DEFAULT_SETTINGS.whatsappUrl!,
      bgGradient: 'from-[#25D366] to-[#128C7E]',
      shadowColor: 'shadow-emerald-500/50',
      glowColor: 'rgba(37,211,102,0.55)',
      badge: '24x7',
      badgeBg: 'bg-emerald-500 text-white',
    },
    {
      name: 'YouTube',
      hindiTitle: 'YouTube Free Video Classes',
      subtitle: 'Live classes, marathons & recorded lectures',
      icon: YouTubeLogo,
      href: settings.youtubeUrl || DEFAULT_SETTINGS.youtubeUrl!,
      bgGradient: 'from-[#FF0000] to-[#CC0000]',
      shadowColor: 'shadow-red-500/50',
      glowColor: 'rgba(255,0,0,0.5)',
      badge: 'Live',
      badgeBg: 'bg-rose-500 text-white',
    },
    {
      name: 'Telegram',
      hindiTitle: 'Telegram Channel',
      subtitle: 'Free PDF notes, PYQs & daily updates',
      icon: TelegramLogo,
      href: settings.telegramUrl || DEFAULT_SETTINGS.telegramUrl!,
      bgGradient: 'from-[#0088cc] to-[#006699]',
      shadowColor: 'shadow-sky-500/50',
      glowColor: 'rgba(0,136,204,0.5)',
      badge: 'PDFs',
      badgeBg: 'bg-sky-500 text-white',
    },
    {
      name: 'Instagram',
      hindiTitle: 'Instagram Reels & Updates',
      subtitle: 'Daily current affairs, quiz & study tips',
      icon: InstagramLogo,
      href: settings.instagramUrl || DEFAULT_SETTINGS.instagramUrl!,
      bgGradient: 'from-[#f09433] via-[#dc2743] to-[#bc1888]',
      shadowColor: 'shadow-pink-500/50',
      glowColor: 'rgba(220,39,67,0.5)',
      badge: 'Reels',
      badgeBg: 'bg-pink-500 text-white',
    },
    {
      name: 'Facebook',
      hindiTitle: 'Facebook Community Page',
      subtitle: 'Education news, results & announcements',
      icon: FacebookLogo,
      href: settings.facebookUrl || DEFAULT_SETTINGS.facebookUrl!,
      bgGradient: 'from-[#1877F2] to-[#0d59c2]',
      shadowColor: 'shadow-blue-500/50',
      glowColor: 'rgba(24,119,242,0.5)',
      badge: 'Group',
      badgeBg: 'bg-blue-600 text-white',
    },
    {
      name: 'Twitter / X',
      hindiTitle: 'Twitter (X) Job Alerts',
      subtitle: 'Sarkari bharti, results & vacancy alerts',
      icon: XLogo,
      href: settings.twitterUrl || DEFAULT_SETTINGS.twitterUrl!,
      bgGradient: 'from-slate-950 to-slate-800',
      shadowColor: 'shadow-slate-900/50',
      glowColor: 'rgba(15,23,42,0.5)',
      badge: 'Alerts',
      badgeBg: 'bg-slate-800 text-white',
    },
    {
      name: 'LinkedIn',
      hindiTitle: 'LinkedIn Network',
      subtitle: 'Career guidance, seminars & opportunities',
      icon: LinkedInLogo,
      href: settings.linkedinUrl || DEFAULT_SETTINGS.linkedinUrl!,
      bgGradient: 'from-[#0077B5] to-[#005582]',
      shadowColor: 'shadow-cyan-600/50',
      glowColor: 'rgba(0,119,181,0.5)',
      badge: 'Career',
      badgeBg: 'bg-cyan-700 text-white',
    },
  ];

  return (
    <>
      {/* â”€â”€ Desktop / Tablet Floating Sidebar â”€â”€ */}
      <aside
        aria-label="Social Media Quick Hub"
        className={`fixed left-3 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col items-center gap-1.5 p-2.5 rounded-[28px] border border-white/80 transition-all duration-700 ${
          mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
        }`}
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 8px 40px rgba(11,42,99,0.14), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.9)',
        }}
      >
        {/* CONNECT label */}
        <div className="flex flex-col items-center pb-2 border-b border-slate-100 w-full gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
            Connect
          </span>
        </div>

        {/* Icon list */}
        <div className="flex flex-col gap-1.5">
          {channels.map((item, idx) => {
            const Icon = item.icon;
            const isHov = hoveredIndex === idx;

            return (
              <div
                key={item.name}
                className="relative flex items-center"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                // staggered entrance: each icon slides in with delay
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-24px)',
                  transition: `opacity 0.5s ease ${idx * 70}ms, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${idx * 70}ms`,
                }}
              >
                {/* Animated pulse ring on hover */}
                {isHov && (
                  <span
                    className="absolute inset-0 rounded-2xl animate-ping pointer-events-none"
                    style={{
                      background: 'transparent',
                      border: `2px solid ${item.glowColor}`,
                      opacity: 0.6,
                      animationDuration: '0.8s',
                    }}
                  />
                )}

                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${item.name} â€” ${item.hindiTitle}`}
                  className={`relative w-11 h-11 rounded-2xl bg-gradient-to-tr ${item.bgGradient} text-white flex items-center justify-center transition-all duration-300 active:scale-90 group overflow-hidden`}
                  style={{
                    boxShadow: isHov
                      ? `0 8px 24px ${item.glowColor}, 0 4px 12px rgba(0,0,0,0.15)`
                      : `0 3px 10px rgba(0,0,0,0.12)`,
                    transform: isHov ? 'scale(1.18) translateY(-2px)' : 'scale(1) translateY(0)',
                  }}
                >
                  {/* Shimmer sweep on hover */}
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
                      backgroundSize: '200% 100%',
                      backgroundPosition: isHov ? '200% 0' : '-200% 0',
                      transition: 'background-position 0.5s ease',
                    }}
                  />

                  <span
                    className="w-5 h-5 relative z-10 flex items-center justify-center transition-transform duration-300"
                    style={{ transform: isHov ? 'scale(1.15) rotate(-5deg)' : 'scale(1) rotate(0deg)' }}
                  >
                    <Icon className="w-5 h-5" />
                  </span>

                  {/* Live dot badge */}
                  {item.badge && (
                    <span
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white ring-[1.5px] ring-emerald-400 z-10"
                      style={{
                        animation: isHov ? 'none' : 'sidebarDotPulse 2s ease-in-out infinite',
                        animationDelay: `${idx * 300}ms`,
                      }}
                    />
                  )}
                </a>

                {/* Slide-out tooltip card */}
                <div
                  className="absolute left-full ml-3.5 z-50 w-60 pointer-events-none"
                  style={{
                    opacity: isHov ? 1 : 0,
                    transform: isHov ? 'translateX(0) scale(1)' : 'translateX(-10px) scale(0.95)',
                    transition: 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                >
                  <div
                    className="relative rounded-2xl p-3.5 text-white border border-white/10"
                    style={{
                      background: 'rgba(10,15,30,0.94)',
                      backdropFilter: 'blur(16px)',
                      boxShadow: `0 12px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)`,
                    }}
                  >
                    {/* Arrow */}
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-[rgba(10,15,30,0.94)] border-l border-b border-white/10 rotate-45" />

                    {/* Header row */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="flex items-center gap-1.5 text-xs font-black text-white">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, ${item.glowColor}, white)` }}
                        />
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${item.badgeBg} flex-shrink-0`}>
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] font-bold text-slate-200 leading-tight">{item.hindiTitle}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{item.subtitle}</p>

                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-bold" style={{ color: item.glowColor }}>
                      <span>Click to join channel</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom wave bar */}
        <div className="w-8 mt-1 pt-1.5 border-t border-slate-100 flex items-center justify-center">
          <div className="flex items-end gap-[2px]">
            {[3,5,7,5,3].map((h, i) => (
              <span
                key={i}
                className="w-[3px] rounded-full bg-gradient-to-t from-[#0B2A63] to-[#DC2626]"
                style={{
                  height: `${h}px`,
                  animation: `sidebarWave 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 120}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* â”€â”€ Keyframes injected via style tag â”€â”€ */}
      <style>{`
        @keyframes sidebarWave {
          0%, 100% { transform: scaleY(1); opacity: 0.7; }
          50%       { transform: scaleY(2.2); opacity: 1; }
        }
        @keyframes sidebarDotPulse {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%       { transform: scale(1.5); opacity: 0.6; }
        }
      `}</style>

      {/* â”€â”€ Mobile FAB + Drawer â”€â”€ */}
      <div className="sm:hidden fixed bottom-5 left-4 z-40">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Open Social Links"
          className="relative w-13 h-13 rounded-2xl text-white flex items-center justify-center border border-white/20 active:scale-90 transition-all duration-300 overflow-hidden"
          style={{
            width: 52, height: 52,
            background: 'linear-gradient(135deg, #0B2A63 0%, #DC2626 100%)',
            boxShadow: '0 6px 20px rgba(11,42,99,0.45)',
          }}
        >
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-2xl animate-ping bg-[#0B2A63] opacity-20 pointer-events-none" style={{ animationDuration: '2s' }} />
          {mobileMenuOpen ? <X className="w-6 h-6 relative z-10" /> : <Share2 className="w-5 h-5 relative z-10" />}
        </button>

        {/* Mobile Slide-Up Sheet */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end p-4"
            style={{ background: 'rgba(6,21,48,0.65)', backdropFilter: 'blur(6px' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="bg-white rounded-3xl w-full p-5 space-y-4 shadow-2xl border border-slate-100"
              style={{ animation: 'slideUpSheet 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sheet header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-black text-xs"
                    style={{ background: 'linear-gradient(135deg, #0B2A63, #DC2626)' }}
                  >
                    LS
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Lo Samajh Lo</h3>
                    <p className="text-[10px] text-slate-500">à¤œà¥à¤¡à¤¼à¥‡à¤‚ à¤”à¤° à¤®à¥à¤«à¥à¤¤ à¤¨à¥‹à¤Ÿà¥à¤¸ à¤µ à¤•à¥à¤²à¤¾à¤¸ à¤ªà¤¾à¤à¤‚</p>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Icons grid */}
              <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto">
                {channels.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center gap-3 hover:bg-slate-100 active:scale-95 transition-all duration-200"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.bgGradient} text-white flex items-center justify-center flex-shrink-0`}
                        style={{ boxShadow: `0 3px 10px ${item.glowColor}` }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-xs text-slate-900 truncate">{item.name}</p>
                        <span className="text-[10px] text-slate-500 truncate block">{item.badge || 'Visit'}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideUpSheet {
            0%   { opacity: 0; transform: translateY(40px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0)   scale(1);    }
          }
        `}</style>
      </div>
    </>
  );
};

export default FloatingSocialSidebar;
