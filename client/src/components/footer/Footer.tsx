import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Heart,
  ArrowRight,
  MessageCircle,
  Youtube,
  Send,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
} from 'lucide-react';
import { api } from '../../services/api';
import { FooterSettings } from '../../types';

const DEFAULT_SETTINGS: FooterSettings = {
  aboutText: "India's premier digital learning platform dedicated to competitive exams (UPSSSC, Railway, SSC, UP Police) and graduation studies. Concept-based learning with comprehensive study materials, live mock tests, and bilingual notes.",
  address: "Raebareli, Uttar Pradesh",
  email: "support@losamajhlo.in",
  phone: "+91 99999 99999",
  whatsappUrl: "https://wa.me/919999999999?text=Hello%20Lo%20Samajh%20Lo%20Team%2C%20I%20need%20course%20guidance",
  youtubeUrl: "https://youtube.com/@losamajhlo",
  telegramUrl: "https://t.me/losamajhlo",
  instagramUrl: "https://instagram.com/losamajhlo",
  facebookUrl: "https://facebook.com/losamajhlo",
  twitterUrl: "https://twitter.com/losamajhlo",
  linkedinUrl: "https://linkedin.com/company/losamajhlo",
  copyrightText: "Lo Samajh Lo (लो समझ लो). All rights reserved.",
  newsletterHeadline: "Stay Connected with Lo Samajh Lo",
  newsletterText: "Subscribe to get immediate alerts for new government job vacancies, PDF circulars, and test updates.",
};

export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<FooterSettings>(DEFAULT_SETTINGS);
  const [subscribed, setSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    api.settings.getFooter().then((res) => {
      if (res.success && res.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...res.settings });
      }
    }).catch(() => {
      // Use defaults
    });
  }, []);

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: settings.whatsappUrl,
      bg: 'hover:bg-[#25D366] hover:border-[#25D366]',
      color: 'text-[#25D366]',
    },
    {
      name: 'YouTube',
      icon: Youtube,
      url: settings.youtubeUrl,
      bg: 'hover:bg-[#FF0000] hover:border-[#FF0000]',
      color: 'text-[#FF0000]',
    },
    {
      name: 'Telegram',
      icon: Send,
      url: settings.telegramUrl,
      bg: 'hover:bg-[#0088cc] hover:border-[#0088cc]',
      color: 'text-[#0088cc]',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: settings.instagramUrl,
      bg: 'hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:border-pink-500',
      color: 'text-[#dc2743]',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: settings.facebookUrl,
      bg: 'hover:bg-[#1877F2] hover:border-[#1877F2]',
      color: 'text-[#1877F2]',
    },
    {
      name: 'Twitter (X)',
      icon: Twitter,
      url: settings.twitterUrl,
      bg: 'hover:bg-slate-700 hover:border-slate-700',
      color: 'text-slate-300',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: settings.linkedinUrl,
      bg: 'hover:bg-[#0077B5] hover:border-[#0077B5]',
      color: 'text-[#0077B5]',
    },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand & About */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block py-1">
              <img
                src="/logo.png"
                alt="Lo Samajh Lo — अब पढ़ाई होगी आसान"
                className="h-14 sm:h-16 w-auto object-contain drop-shadow-md"
              />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              {settings.aboutText}
            </p>

            {/* Contact Details */}
            <div className="space-y-1.5 text-xs text-slate-400 pt-1">
              {settings.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#6C63FF] flex-shrink-0" />
                  <span>{settings.address}</span>
                </div>
              )}
              {settings.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#6C63FF] flex-shrink-0" />
                  <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors">
                    {settings.email}
                  </a>
                </div>
              )}
              {settings.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <a href={`tel:${settings.phone}`} className="hover:text-white transition-colors">
                    {settings.phone}
                  </a>
                </div>
              )}
            </div>

            {/* All Social Media Links with Vibrant Icons */}
            <div className="pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                सोशल मीडिया से जुड़ें (Official Social Handles):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {socialLinks.map((item) => {
                  const Icon = item.icon;
                  if (!item.url) return null;
                  return (
                    <a
                      key={item.name}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.name}
                      aria-label={item.name}
                      className={`w-9 h-9 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 hover:scale-110 shadow-sm ${item.bg}`}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Quick Navigation</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/courses" className="hover:text-white transition-colors">Courses Catalog</Link>
              </li>
              <li>
                <Link to="/study-materials" className="hover:text-white transition-colors">Free Study Materials</Link>
              </li>
              <li>
                <Link to="/test-series" className="hover:text-white transition-colors">Online Test Series</Link>
              </li>
              <li>
                <Link to="/typing-test" className="hover:text-white transition-colors">Typing Speed Test</Link>
              </li>
              <li>
                <Link to="/notifications" className="hover:text-white transition-colors">Exam Notifications</Link>
              </li>
            </ul>
          </div>

          {/* Target Exams */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Target Exams</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/courses?category=upsssc" className="hover:text-white transition-colors">UPSSSC PET 2026</Link>
              </li>
              <li>
                <Link to="/courses?category=railway" className="hover:text-white transition-colors">RRB NTPC & Group D</Link>
              </li>
              <li>
                <Link to="/courses?category=ssc" className="hover:text-white transition-colors">SSC GD & CGL</Link>
              </li>
              <li>
                <Link to="/courses?category=up-police" className="hover:text-white transition-colors">UP Police Constable & SI</Link>
              </li>
              <li>
                <Link to="/courses?category=graduation" className="hover:text-white transition-colors">B.A. / B.Sc. Degree</Link>
              </li>
            </ul>
          </div>

          {/* Contact / Newsletter */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">
              {settings.newsletterHeadline}
            </h4>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              {settings.newsletterText}
            </p>
            {subscribed ? (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
                ✓ धन्यवाद! आप सफलतापूर्वक सब्सक्राइब हो चुके हैं।
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="अपना ईमेल दर्ज करें"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#6C63FF]"
                  required
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs shadow-sm transition-all"
                >
                  <span>Subscribe Alerts / अलर्ट पाएं</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {settings.copyrightText}</p>
          <div className="flex items-center gap-6">
            <span>Made with <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" /> for Indian Aspirants</span>
            <Link to="/login" className="hover:text-slate-400">Student Portal</Link>
            <Link to="/Admin.login" className="hover:text-purple-400 font-semibold transition-colors">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
