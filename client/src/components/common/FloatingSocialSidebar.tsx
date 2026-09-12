import React, { useState } from 'react';
import { MessageCircle, Youtube, Send, Instagram, Facebook, Twitter } from 'lucide-react';

interface SocialLink {
  name: string;
  hindiName: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  bgHover: string;
  textHover: string;
  iconColor: string;
  badge?: string;
}

export const FloatingSocialSidebar: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const socialLinks: SocialLink[] = [
    {
      name: 'WhatsApp',
      hindiName: 'व्हाट्सएप सहायता',
      icon: MessageCircle,
      href: 'https://wa.me/919999999999?text=Hello%20Lo%20Samajh%20Lo%20Team%2C%20I%20need%20course%20guidance',
      bgHover: 'hover:bg-[#25D366]',
      textHover: 'text-[#25D366]',
      iconColor: 'text-[#25D366]',
      badge: 'Support',
    },
    {
      name: 'YouTube',
      hindiName: 'मुफ्त वीडियो कक्षाएं',
      icon: Youtube,
      href: 'https://youtube.com/@losamajhlo',
      bgHover: 'hover:bg-[#FF0000]',
      textHover: 'text-[#FF0000]',
      iconColor: 'text-[#FF0000]',
      badge: 'Live',
    },
    {
      name: 'Telegram',
      hindiName: 'मुफ्त पीडीएफ नोट्स',
      icon: Send,
      href: 'https://t.me/losamajhlo',
      bgHover: 'hover:bg-[#0088cc]',
      textHover: 'text-[#0088cc]',
      iconColor: 'text-[#0088cc]',
      badge: 'PDFs',
    },
    {
      name: 'Instagram',
      hindiName: 'दैनिक करंट अफेयर्स',
      icon: Instagram,
      href: 'https://instagram.com/losamajhlo',
      bgHover: 'hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888]',
      textHover: 'text-[#dc2743]',
      iconColor: 'text-[#dc2743]',
    },
    {
      name: 'Facebook',
      hindiName: 'फेसबुक पेज',
      icon: Facebook,
      href: 'https://facebook.com/losamajhlo',
      bgHover: 'hover:bg-[#1877F2]',
      textHover: 'text-[#1877F2]',
      iconColor: 'text-[#1877F2]',
    },
    {
      name: 'Twitter (X)',
      hindiName: 'नवीनतम अपडेट',
      icon: Twitter,
      href: 'https://twitter.com/losamajhlo',
      bgHover: 'hover:bg-slate-900',
      textHover: 'text-slate-900',
      iconColor: 'text-slate-800',
    },
  ];

  return (
    <aside
      aria-label="Social Media Quick Access"
      className="fixed left-0 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col gap-1 p-1 bg-white/95 backdrop-blur-md rounded-r-2xl shadow-xl border-y border-r border-slate-200/80 transition-all duration-300"
    >
      <div className="py-1 px-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400 text-center border-b border-slate-100">
        Connect
      </div>

      {socialLinks.map((item, idx) => {
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
              aria-label={`${item.name} - ${item.hindiName}`}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 bg-slate-50/60 hover:text-white ${item.bgHover} transition-all duration-200 group shadow-sm hover:scale-110`}
            >
              <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            </a>

            {/* Slide-out Tooltip Box like Drishti IAS */}
            {isHovered && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white rounded-xl shadow-2xl text-xs font-semibold whitespace-nowrap z-50 flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-150">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-white">{item.name}</span>
                    {item.badge && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-white/20 text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium">{item.hindiName}</p>
                </div>
                {/* Arrow */}
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>
            )}
          </div>
        );
      })}
    </aside>
  );
};

export default FloatingSocialSidebar;
