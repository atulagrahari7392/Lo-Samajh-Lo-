import React, { useState } from 'react';
import {
  MessageCircle,
  Youtube,
  Send,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Sparkles,
  ChevronRight,
  X,
  Share2,
} from 'lucide-react';

interface SocialChannel {
  name: string;
  hindiTitle: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  bgGradient: string;
  shadowColor: string;
  badge?: string;
  badgeBg: string;
}

export const FloatingSocialSidebar: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const channels: SocialChannel[] = [
    {
      name: 'WhatsApp',
      hindiTitle: 'व्हाट्सएप चैट सहायता',
      subtitle: 'कोर्स व एडमिशन मार्गदर्शन',
      icon: MessageCircle,
      href: 'https://wa.me/919999999999?text=Hello%20Lo%20Samajh%20Lo%20Team%2C%20I%20need%20course%20guidance',
      bgGradient: 'from-[#25D366] to-[#128C7E]',
      shadowColor: 'shadow-emerald-500/40',
      badge: '24x7 Support',
      badgeBg: 'bg-emerald-500 text-white',
    },
    {
      name: 'YouTube',
      hindiTitle: 'यूट्यूब वीडियो कक्षाएं',
      subtitle: 'मुफ्त लाइव क्लास व मैराथन',
      icon: Youtube,
      href: 'https://youtube.com/@losamajhlo',
      bgGradient: 'from-[#FF0000] to-[#CC0000]',
      shadowColor: 'shadow-red-500/40',
      badge: 'Live Classes',
      badgeBg: 'bg-rose-500 text-white',
    },
    {
      name: 'Telegram',
      hindiTitle: 'टेलीग्राम चैनल',
      subtitle: 'मुफ्त पीडीएफ नोट्स व PYQs',
      icon: Send,
      href: 'https://t.me/losamajhlo',
      bgGradient: 'from-[#0088cc] to-[#006699]',
      shadowColor: 'shadow-sky-500/40',
      badge: 'Free PDFs',
      badgeBg: 'bg-sky-500 text-white',
    },
    {
      name: 'Instagram',
      hindiTitle: 'इंस्टाग्राम रील्स व अपडेट',
      subtitle: 'दैनिक करंट अफेयर्स व टिप्स',
      icon: Instagram,
      href: 'https://instagram.com/losamajhlo',
      bgGradient: 'from-[#f09433] via-[#dc2743] to-[#bc1888]',
      shadowColor: 'shadow-pink-500/40',
      badge: 'Daily Quiz',
      badgeBg: 'bg-pink-500 text-white',
    },
    {
      name: 'Facebook',
      hindiTitle: 'फेसबुक पेज',
      subtitle: 'शिक्षा समाचार व घोषणाएं',
      icon: Facebook,
      href: 'https://facebook.com/losamajhlo',
      bgGradient: 'from-[#1877F2] to-[#0d59c2]',
      shadowColor: 'shadow-blue-500/40',
      badge: 'Community',
      badgeBg: 'bg-blue-600 text-white',
    },
    {
      name: 'Twitter (X)',
      hindiTitle: 'एक्स / ट्विटर',
      subtitle: 'सरकारी भर्ती व विज्ञप्ति अलर्ट',
      icon: Twitter,
      href: 'https://twitter.com/losamajhlo',
      bgGradient: 'from-slate-950 to-slate-800',
      shadowColor: 'shadow-slate-900/40',
      badge: 'Job Alerts',
      badgeBg: 'bg-slate-800 text-white',
    },
    {
      name: 'LinkedIn',
      hindiTitle: 'लिंक्डइन नेटवर्क',
      subtitle: 'करियर मार्गदर्शन व सेमिनार',
      icon: Linkedin,
      href: 'https://linkedin.com/company/losamajhlo',
      bgGradient: 'from-[#0077B5] to-[#005582]',
      shadowColor: 'shadow-cyan-600/40',
      badge: 'Career',
      badgeBg: 'bg-cyan-700 text-white',
    },
  ];

  return (
    <>
      {/* Desktop & Tablet Floating Sidebar (Eye-catching, Vibrant & Interactive) */}
      <aside
        aria-label="Social Media & Help Quick Hub"
        className="fixed left-3 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col items-center gap-2 p-2 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-500/20 border border-slate-200/90 transition-all duration-300 hover:shadow-indigo-500/30"
      >
        {/* Top Header Pill with Live Indicator */}
        <div className="flex flex-col items-center pb-1.5 border-b border-slate-100 w-full">
          <div className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
              Connect
            </span>
          </div>
        </div>

        {/* Channel Icons */}
        <div className="flex flex-col gap-2">
          {channels.map((item, idx) => {
            const Icon = item.icon;
            const isHovered = hoveredIndex === idx;

            return (
              <div
                key={item.name}
                className="relative flex items-center"
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${item.name} - ${item.hindiTitle}`}
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${item.bgGradient} text-white flex items-center justify-center shadow-md ${item.shadowColor} transition-all duration-200 hover:scale-115 hover:-translate-y-0.5 active:scale-95 group relative`}
                >
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />

                  {/* Tiny Live dot / badge indicator on icon */}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white ring-2 ring-emerald-500" />
                  )}
                </a>

                {/* Engaging Slide-Out Tooltip Card */}
                {isHovered && (
                  <div className="absolute left-full ml-3.5 z-50 w-64 bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl p-3.5 shadow-2xl border border-white/10 animate-in fade-in slide-in-from-left-3 duration-200">
                    {/* Tiny triangle arrow */}
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-900 border-l border-b border-white/10 rotate-45" />

                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-black tracking-wide text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full bg-gradient-to-tr ${item.bgGradient}`} />
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${item.badgeBg}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold text-slate-200 leading-tight">
                      {item.hindiTitle}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {item.subtitle}
                    </p>

                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-purple-300 font-bold">
                      <span>Click to open channel</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Mobile Floating Quick-Action Button & Drawer */}
      <div className="sm:hidden fixed bottom-5 left-4 z-40">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Open Social Links"
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] text-white flex items-center justify-center shadow-xl shadow-[#6C63FF]/40 border border-white/20 active:scale-95 transition-transform"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Share2 className="w-5 h-5" />}
        </button>

        {/* Mobile Slide-Up Modal Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end p-4 animate-in fade-in duration-200" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="bg-white rounded-3xl w-full p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300 border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6C63FF] flex items-center justify-center font-black text-xs">
                    LS
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Lo Samajh Lo Channels</h3>
                    <p className="text-[10px] text-slate-500">जुड़ें और मुफ्त नोट्स व क्लास पाएं</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto">
                {channels.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center gap-3 hover:bg-slate-100 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.bgGradient} text-white flex items-center justify-center shadow-sm flex-shrink-0`}>
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
      </div>
    </>
  );
};

export default FloatingSocialSidebar;
