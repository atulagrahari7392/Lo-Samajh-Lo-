import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  MessageCircle,
  Youtube,
  Send,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
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
        success('Footer & Social Media settings saved successfully!');
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
              <Settings className="w-7 h-7 text-[#6C63FF]" />
              Footer & Social Media Management (फ़ूटर प्रबंधन)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              वेबसाइट के फ़ूटर में दिखने वाले सोशल मीडिया लिंक्स, हेल्पलाइन नंबर, ईमेल और विवरण को यहाँ से अपडेट करें।
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
            {/* Section 1: Social Media Links */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FF6584]" />
                  सोशल मीडिया लिंक्स (Official Social Channels)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ये लिंक्स फ़ूटर में और फ्लोटिंग साइडबार में उपयोग किए जाते हैं।
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>WhatsApp Link / Number</span>
                  </label>
                  <input
                    type="text"
                    value={formData.whatsappUrl}
                    onChange={(e) => handleChange('whatsappUrl', e.target.value)}
                    placeholder="https://wa.me/919999999999?text=..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                {/* YouTube */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Youtube className="w-4 h-4 text-[#FF0000]" />
                    <span>YouTube Channel URL</span>
                  </label>
                  <input
                    type="text"
                    value={formData.youtubeUrl}
                    onChange={(e) => handleChange('youtubeUrl', e.target.value)}
                    placeholder="https://youtube.com/@losamajhlo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                {/* Telegram */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-[#0088cc]" />
                    <span>Telegram Channel URL</span>
                  </label>
                  <input
                    type="text"
                    value={formData.telegramUrl}
                    onChange={(e) => handleChange('telegramUrl', e.target.value)}
                    placeholder="https://t.me/losamajhlo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                {/* Instagram */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Instagram className="w-4 h-4 text-[#dc2743]" />
                    <span>Instagram Profile URL</span>
                  </label>
                  <input
                    type="text"
                    value={formData.instagramUrl}
                    onChange={(e) => handleChange('instagramUrl', e.target.value)}
                    placeholder="https://instagram.com/losamajhlo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                {/* Facebook */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Facebook className="w-4 h-4 text-[#1877F2]" />
                    <span>Facebook Page URL</span>
                  </label>
                  <input
                    type="text"
                    value={formData.facebookUrl}
                    onChange={(e) => handleChange('facebookUrl', e.target.value)}
                    placeholder="https://facebook.com/losamajhlo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                {/* Twitter / X */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Twitter className="w-4 h-4 text-slate-800" />
                    <span>Twitter / X Profile URL</span>
                  </label>
                  <input
                    type="text"
                    value={formData.twitterUrl}
                    onChange={(e) => handleChange('twitterUrl', e.target.value)}
                    placeholder="https://twitter.com/losamajhlo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                  />
                </div>

                {/* LinkedIn */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Linkedin className="w-4 h-4 text-[#0077B5]" />
                    <span>LinkedIn Company URL</span>
                  </label>
                  <input
                    type="text"
                    value={formData.linkedinUrl}
                    onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/company/losamajhlo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#6C63FF]"
                  />
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
