import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Heart,
  ArrowRight,
} from 'lucide-react';
import {
  WhatsAppLogo,
  YouTubeLogo,
  TelegramLogo,
  InstagramLogo,
  FacebookLogo,
  XLogo,
  LinkedInLogo,
} from '../common/SocialBrandIcons';
import { api } from '../../services/api';
import { FooterSettings } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

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
  copyrightText: "Lo Samajh Lo. All rights reserved.",
  newsletterHeadline: "Stay Connected with Lo Samajh Lo",
  newsletterText: "Subscribe to get immediate alerts for new government job vacancies, PDF circulars, and test updates.",
};

export const Footer: React.FC = () => {
  const { isHindi, t } = useLanguage();
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
      icon: WhatsAppLogo,
      url: settings.whatsappUrl,
      bg: 'hover:bg-[#25D366] hover:border-[#25D366]',
      color: 'text-[#25D366]',
    },
    {
      name: 'YouTube',
      icon: YouTubeLogo,
      url: settings.youtubeUrl,
      bg: 'hover:bg-[#FF0000] hover:border-[#FF0000]',
      color: 'text-[#FF0000]',
    },
    {
      name: 'Telegram',
      icon: TelegramLogo,
      url: settings.telegramUrl,
      bg: 'hover:bg-[#0088cc] hover:border-[#0088cc]',
      color: 'text-[#0088cc]',
    },
    {
      name: 'Instagram',
      icon: InstagramLogo,
      url: settings.instagramUrl,
      bg: 'hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:border-pink-500',
      color: 'text-[#dc2743]',
    },
    {
      name: 'Facebook',
      icon: FacebookLogo,
      url: settings.facebookUrl,
      bg: 'hover:bg-[#1877F2] hover:border-[#1877F2]',
      color: 'text-[#1877F2]',
    },
    {
      name: 'Twitter (X)',
      icon: XLogo,
      url: settings.twitterUrl,
      bg: 'hover:bg-slate-700 hover:border-slate-700',
      color: 'text-slate-300',
    },
    {
      name: 'LinkedIn',
      icon: LinkedInLogo,
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
    <footer className="footer-gradient text-slate-300 pt-16 pb-12 relative overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="water-ambient-blob w-80 h-80 top-[-60px] left-[-60px] bg-[#1D4ED8]" style={{ opacity: 0.12 }} />
      <div className="water-ambient-blob w-64 h-64 bottom-[-40px] right-[-40px] bg-[#DC2626]" style={{ opacity: 0.1, animationDelay: '4s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand & About */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block py-1">
              <img
                src="/logo.png"
                alt="Lo Samajh Lo â€” à¤…à¤¬ à¤ªà¤¢à¤¼à¤¾à¤ˆ à¤¹à¥‹à¤—à¥€ à¤†à¤¸à¤¾à¤¨"
                className="h-14 sm:h-16 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              {settings.aboutText}
            </p>

            {/* Contact Details */}
            <div className="space-y-1.5 text-xs text-slate-400 pt-1">
              {settings.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                  <span>{settings.address}</span>
                </div>
              )}
              {settings.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                  <a href={`mailto:${settings.email}`} className="footer-link hover:text-white transition-colors">
                    {settings.email}
                  </a>
                </div>
              )}
              {settings.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <a href={`tel:${settings.phone}`} className="footer-link hover:text-white transition-colors">
                    {settings.phone}
                  </a>
                </div>
              )}
            </div>

            {/* All Social Media Links with Vibrant Icons */}
            <div className="pt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                {isHindi ? 'à¤¸à¥‹à¤¶à¤² à¤®à¥€à¤¡à¤¿à¤¯à¤¾ à¤¸à¥‡ à¤œà¥à¤¡à¤¼à¥‡à¤‚:' : 'Official Social Handles:'}
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
                      className={`w-9 h-9 rounded-xl bg-white/8 border border-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-250 hover:scale-110 hover:-translate-y-0.5 shadow-sm ${item.bg}`}
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
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-[#DC2626] to-[#D97706] rounded-full" />
              {t('footer.quickLinks', isHindi ? 'à¤®à¤¹à¤¤à¥à¤µà¤ªà¥‚à¤°à¥à¤£ à¤²à¤¿à¤‚à¤•à¥à¤¸' : 'Quick Navigation')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/courses" className="footer-link">{t('nav.courses', 'Courses Catalog')}</Link></li>
              <li><Link to="/study-materials" className="footer-link">{t('nav.studyMaterials', 'Free Study Materials')}</Link></li>
              <li><Link to="/test-series" className="footer-link">{t('nav.testSeries', 'Online Test Series')}</Link></li>
              <li><Link to="/typing-test" className="footer-link">{t('nav.typingTest', 'Typing Speed Test')}</Link></li>
              <li><Link to="/notifications" className="footer-link">{t('nav.notifications', 'Exam Notifications')}</Link></li>
            </ul>
          </div>

          {/* Target Exams */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-[#DC2626] to-[#D97706] rounded-full" />
              {isHindi ? 'à¤²à¤•à¥à¤·à¤¿à¤¤ à¤ªà¤°à¥€à¤•à¥à¤·à¤¾à¤à¤‚' : 'Target Exams'}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/courses?category=upsssc" className="footer-link">UPSSSC PET 2026</Link></li>
              <li><Link to="/courses?category=railway" className="footer-link">RRB NTPC & Group D</Link></li>
              <li><Link to="/courses?category=ssc" className="footer-link">SSC GD & CGL</Link></li>
              <li><Link to="/courses?category=up-police" className="footer-link">UP Police Constable & SI</Link></li>
              <li><Link to="/courses?category=graduation" className="footer-link">B.A. / B.Sc. Degree</Link></li>
            </ul>
          </div>

          {/* Contact / Newsletter */}
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-gradient-to-b from-[#DC2626] to-[#D97706] rounded-full" />
              {settings.newsletterHeadline}
            </h4>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              {settings.newsletterText}
            </p>
            {subscribed ? (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
                {isHindi ? 'âœ“ à¤§à¤¨à¥à¤¯à¤µà¤¾à¤¦! à¤†à¤ª à¤¸à¤«à¤²à¤¤à¤¾à¤ªà¥‚à¤°à¥à¤µà¤• à¤¸à¤¬à¥à¤¸à¤•à¥à¤°à¤¾à¤‡à¤¬ à¤¹à¥‹ à¤šà¥à¤•à¥‡ à¤¹à¥ˆà¤‚à¥¤' : 'âœ“ Thank you! You have subscribed successfully.'}
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={isHindi ? 'à¤…à¤ªà¤¨à¤¾ à¤ˆà¤®à¥‡à¤² à¤¦à¤°à¥à¤œ à¤•à¤°à¥‡à¤‚' : 'Enter your email address'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#D97706] focus:ring-1 focus:ring-[#D97706]/30 transition-all"
                  required
                />
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#0B2A63] to-[#1D4ED8] hover:from-[#DC2626] hover:to-[#ef4444] text-white font-bold text-xs shadow-sm transition-all duration-300 hover:shadow-[0_4px_14px_rgba(220,38,38,0.35)]"
                >
                  <span>{t('footer.subscribeAlerts', isHindi ? 'à¤…à¤²à¤°à¥à¤Ÿ à¤ªà¤¾à¤à¤‚' : 'Subscribe Alerts')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Brand Divider */}
        <div className="divider-brand my-0 mt-8 mb-6" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>Â© {new Date().getFullYear()} {settings.copyrightText}</p>
          <div className="flex items-center gap-6">
            <span>{isHindi ? 'à¤­à¤¾à¤°à¤¤à¥€à¤¯ à¤…à¤­à¥à¤¯à¤°à¥à¤¥à¤¿à¤¯à¥‹à¤‚ à¤•à¥‡ à¤²à¤¿à¤ à¤¸à¤®à¤°à¥à¤ªà¤¿à¤¤' : 'Made with'} <Heart className="w-3.5 h-3.5 text-[#DC2626] inline fill-[#DC2626]" /> {isHindi ? '' : 'for Indian Aspirants'}</span>
            <Link to="/login" className="hover:text-slate-300 transition-colors">{isHindi ? 'à¤›à¤¾à¤¤à¥à¤° à¤ªà¥‹à¤°à¥à¤Ÿà¤²' : 'Student Portal'}</Link>
            <Link to="/Admin.login" className="hover:text-[#D97706] font-semibold transition-colors">{isHindi ? 'à¤à¤¡à¤®à¤¿à¤¨ à¤ªà¥‹à¤°à¥à¤Ÿà¤²' : 'Admin Portal'}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
