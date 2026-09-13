import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
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
} from '../../components/common/SocialBrandIcons';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { FooterSettings } from '../../types';

export const AdminFooterSettingsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FooterSettings>({
    aboutText: '',
    address: '',
    email: '',
    phone: '',
    whatsappUrl: '',
    youtubeUrl: '',
    telegramUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    copyrightText: '',
    newsletterHeadline: '',
    newsletterText: '',
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.settings.getFooter();
      if (res.success && res.settings) {
        setFormData(res.settings);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load footer settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field: keyof FooterSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.settings.updateFooter(formData);
      if (res.success) {
        success('Social media and footer settings saved successfully!');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Share2 className="w-7 h-7 text-[#6C63FF]" />
              Social Media & Footer Hub (सोशल मीडिया व फ़ूटर प्रबंधन)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              वेबसाइट के बाएं तरफ दिखने वाले <strong>Floating Social Sidebar</strong> और <strong>Footer</strong> के सभी सोशल मीडिया लिंक्स (WhatsApp, YouTube, Telegram, Instagram, Facebook, X, LinkedIn) व संपर्क जानकारी को यहाँ से नियंत्रित करें।
            </p>
          </div>
          <button
            type="button"
            onClick={fetchSettings}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm self-start"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#6C63FF]" />
            <p className="text-xs font-bold text-slate-600">लोड हो रहा है...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Official Brand Social Media Links with Real Logos & Test Buttons */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#FF6584]" />
                    ऑफ़िशियल सोशल मीडिया लिंक्स (Official Brand Logos & Channels)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ये लिंक्स सीधे वेबसाइट के <strong>फ्लोटिंग साइडबार (Floating Sidebar)</strong> और <strong>फ़ूटर (Footer)</strong> में लाइव काम करते हैं।
                  </p>
                </div>
                <span className="text-[11px] font-black px-3 py-1 bg-purple-50 text-[#6C63FF] border border-purple-200 rounded-xl self-start">
                  Real Brand Logos Active
                </span>
              </div>

              {/* Grid of Social Channels */}
              <div className="grid sm:grid-cols-2 gap-5">
                {/* 1. WhatsApp */}
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#25D366] to-[#128C7E] text-white flex items-center justify-center shadow-sm">
                        <WhatsAppLogo className="w-4 h-4" />
                      </div>
                      <span>WhatsApp Link / Number</span>
                    </label>
                    {formData.whatsappUrl && (
                      <a
                        href={formData.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Test Link
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.whatsappUrl}
                    onChange={(e) => handleChange('whatsappUrl', e.target.value)}
                    placeholder="https://wa.me/919999999999?text=Hello%20Lo%20Samajh%20Lo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#25D366] font-mono"
                  />
                  <p className="text-[10px] text-slate-400">व्हाट्सएप चैट लिंक या नंबर (e.g. https://wa.me/91XXXXXXXXXX)</p>
                </div>

                {/* 2. YouTube */}
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#FF0000] to-[#CC0000] text-white flex items-center justify-center shadow-sm">
                        <YouTubeLogo className="w-4 h-4" />
                      </div>
                      <span>YouTube Channel URL</span>
                    </label>
                    {formData.youtubeUrl && (
                      <a
                        href={formData.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Test Link
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.youtubeUrl}
                    onChange={(e) => handleChange('youtubeUrl', e.target.value)}
                    placeholder="https://youtube.com/@losamajhlo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-red-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">यूट्यूब चैनल का पूरा वेब लिंक</p>
                </div>

                {/* 3. Telegram */}
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#0088cc] to-[#006699] text-white flex items-center justify-center shadow-sm">
                        <TelegramLogo className="w-4 h-4" />
                      </div>
                      <span>Telegram Channel URL</span>
                    </label>
                    {formData.telegramUrl && (
                      <a
                        href={formData.telegramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Test Link
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.telegramUrl}
                    onChange={(e) => handleChange('telegramUrl', e.target.value)}
                    placeholder="https://t.me/losamajhlo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">टेलीग्राम ग्रुप या चैनल का लिंक</p>
                </div>

                {/* 4. Instagram */}
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-sm">
                        <InstagramLogo className="w-4 h-4" />
                      </div>
                      <span>Instagram Profile URL</span>
                    </label>
                    {formData.instagramUrl && (
                      <a
                        href={formData.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Test Link
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.instagramUrl}
                    onChange={(e) => handleChange('instagramUrl', e.target.value)}
                    placeholder="https://instagram.com/losamajhlo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-pink-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">इंस्टाग्राम प्रोफाइल यूआरएल</p>
                </div>

                {/* 5. Facebook */}
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#1877F2] to-[#0d59c2] text-white flex items-center justify-center shadow-sm">
                        <FacebookLogo className="w-4 h-4" />
                      </div>
                      <span>Facebook Page URL</span>
                    </label>
                    {formData.facebookUrl && (
                      <a
                        href={formData.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Test Link
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.facebookUrl}
                    onChange={(e) => handleChange('facebookUrl', e.target.value)}
                    placeholder="https://facebook.com/losamajhlo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">फेसबुक पेज का आधिकारिक लिंक</p>
                </div>

                {/* 6. Twitter / X */}
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-slate-950 to-slate-800 text-white flex items-center justify-center shadow-sm">
                        <XLogo className="w-4 h-4" />
                      </div>
                      <span>Twitter / X Profile URL</span>
                    </label>
                    {formData.twitterUrl && (
                      <a
                        href={formData.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-slate-700 hover:text-black flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Test Link
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.twitterUrl}
                    onChange={(e) => handleChange('twitterUrl', e.target.value)}
                    placeholder="https://twitter.com/losamajhlo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-slate-700 font-mono"
                  />
                  <p className="text-[10px] text-slate-400">एक्स / ट्विटर प्रोफाइल हैंडल या यूआरएल</p>
                </div>

                {/* 7. LinkedIn */}
                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#0077B5] to-[#005582] text-white flex items-center justify-center shadow-sm">
                        <LinkedInLogo className="w-4 h-4" />
                      </div>
                      <span>LinkedIn Company URL</span>
                    </label>
                    {formData.linkedinUrl && (
                      <a
                        href={formData.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#0077B5] hover:text-[#005582] flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" /> Test Link
                      </a>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.linkedinUrl}
                    onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/company/losamajhlo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-[#0077B5] font-mono"
                  />
                  <p className="text-[10px] text-slate-400">लिंक्डइन कंपनी या इंस्टीट्यूट पेज का लिंक</p>
                </div>
              </div>

              {/* Visual Live Preview of Sidebar Icons */}
              <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50/60 to-indigo-50/60 border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Floating Sidebar Live Preview
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    आपकी वेबसाइट के बाएं कोने पर यूजर को ये रियल ब्रांड आइकन्स दिखेंगे:
                  </p>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white/90 rounded-2xl shadow-sm border border-slate-200">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#25D366] to-[#128C7E] text-white flex items-center justify-center shadow-xs" title="WhatsApp">
                    <WhatsAppLogo className="w-4 h-4" />
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF0000] to-[#CC0000] text-white flex items-center justify-center shadow-xs" title="YouTube">
                    <YouTubeLogo className="w-4 h-4" />
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0088cc] to-[#006699] text-white flex items-center justify-center shadow-xs" title="Telegram">
                    <TelegramLogo className="w-4 h-4" />
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-xs" title="Instagram">
                    <InstagramLogo className="w-4 h-4" />
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1877F2] to-[#0d59c2] text-white flex items-center justify-center shadow-xs" title="Facebook">
                    <FacebookLogo className="w-4 h-4" />
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-950 to-slate-800 text-white flex items-center justify-center shadow-xs" title="Twitter / X">
                    <XLogo className="w-4 h-4" />
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0077B5] to-[#005582] text-white flex items-center justify-center shadow-xs" title="LinkedIn">
                    <LinkedInLogo className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Contact Info & About Description */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#6C63FF]" />
                  संपर्क विवरण व संस्थान जानकारी (Contact & About Info)
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Footer About Description</label>
                  <textarea
                    rows={3}
                    value={formData.aboutText}
                    onChange={(e) => handleChange('aboutText', e.target.value)}
                    placeholder="Lo Samajh Lo के बारे में संक्षिप्त परिचय..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-[#6C63FF]" />
                      <span>Support Email</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="support@losamajhlo.in"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <span>Helpline Phone</span>
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+91 99999 99999"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      <span>Office Address</span>
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Raebareli, Uttar Pradesh"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Copyright Text</label>
                    <input
                      type="text"
                      value={formData.copyrightText}
                      onChange={(e) => handleChange('copyrightText', e.target.value)}
                      placeholder="Lo Samajh Lo (लो समझ लो). All rights reserved."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Newsletter Headline</label>
                    <input
                      type="text"
                      value={formData.newsletterHeadline}
                      onChange={(e) => handleChange('newsletterHeadline', e.target.value)}
                      placeholder="Stay Connected with Lo Samajh Lo"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-[#6C63FF] to-[#8f88ff] hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-[#6C63FF]/30 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Changes...' : 'Save Footer Settings (सेटिंग्स सहेजें)'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFooterSettingsPage;
