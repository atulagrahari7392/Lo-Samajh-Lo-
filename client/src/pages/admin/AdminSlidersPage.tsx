import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  MoveUp,
  MoveDown,
  Sparkles,
  CheckCircle2,
  X,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { SliderBanner } from '../../types';

export const AdminSlidersPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [sliders, setSliders] = useState<SliderBanner[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<SliderBanner | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [buttonText, setButtonText] = useState('Explore Now');
  const [linkUrl, setLinkUrl] = useState('/courses');
  const [position, setPosition] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<SliderBanner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const res = await api.sliders.adminGetAll();
      if (res.success && res.sliders) {
        setSliders(res.sliders);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load slider banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const openAddModal = () => {
    setEditingSlider(null);
    setTitle('');
    setSubtitle('');
    setBadge('🔥 POPULAR BATCH');
    setImageUrl('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400');
    setButtonText('Explore Courses');
    setLinkUrl('/courses');
    setPosition((sliders.length || 0) + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (slider: SliderBanner) => {
    setEditingSlider(slider);
    setTitle(slider.title || '');
    setSubtitle(slider.subtitle || '');
    setBadge(slider.badge || '');
    setImageUrl(slider.imageUrl || '');
    setButtonText(slider.buttonText || 'Explore Now');
    setLinkUrl(slider.linkUrl || '/courses');
    setPosition(slider.position ?? 1);
    setIsActive(slider.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      toastError('Title and Image URL are required!');
      return;
    }

    try {
      setSaving(true);
      const payload: Partial<SliderBanner> = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        badge: badge.trim() || null,
        imageUrl: imageUrl.trim(),
        buttonText: buttonText.trim() || null,
        linkUrl: linkUrl.trim() || null,
        position: Number(position) || 0,
        isActive,
      };

      if (editingSlider) {
        const res = await api.sliders.update(editingSlider.id, payload);
        if (res.success) {
          success('Slider banner updated successfully!');
          setIsModalOpen(false);
          fetchSliders();
        }
      } else {
        const res = await api.sliders.create(payload);
        if (res.success) {
          success('New slider banner added successfully!');
          setIsModalOpen(false);
          fetchSliders();
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save slider banner');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (slider: SliderBanner) => {
    try {
      const res = await api.sliders.update(slider.id, { isActive: !slider.isActive });
      if (res.success) {
        success(`Banner ${!slider.isActive ? 'activated' : 'deactivated'} successfully!`);
        setSliders((prev) =>
          prev.map((s) => (s.id === slider.id ? { ...s, isActive: !s.isActive } : s))
        );
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await api.sliders.delete(deleteTarget.id);
      if (res.success) {
        success('Slider banner removed successfully!');
        setDeleteTarget(null);
        fetchSliders();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to delete slider');
    } finally {
      setDeleting(false);
    }
  };

  const handleQuickMove = async (slider: SliderBanner, direction: 'up' | 'down') => {
    const currentIndex = sliders.findIndex((s) => s.id === slider.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sliders.length) return;

    const targetSlider = sliders[targetIndex];
    const currentPos = slider.position;
    const targetPos = targetSlider.position;

    try {
      // Swap positions
      await Promise.all([
        api.sliders.update(slider.id, { position: targetPos }),
        api.sliders.update(targetSlider.id, { position: currentPos }),
      ]);
      fetchSliders();
    } catch (err: any) {
      toastError('Failed to reorder banners');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sliders className="w-7 h-7 text-[#6C63FF]" />
              Home Page Slider Management (स्लाइडर प्रबंधन)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              वेबसाइट के मुख्य पृष्ठ (Home Page) पर प्रदर्शित होने वाले बैनर, फोटो, लिंक और क्रम को प्रबंधित करें।
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchSliders}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#6C63FF]' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-[#6C63FF] hover:bg-[#584feb] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#6C63FF]/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add New Slide / नया बैनर जोड़ें
            </button>
          </div>
        </div>

        {/* Sliders Table / Cards */}
        {loading ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <RefreshCw className="w-8 h-8 text-[#6C63FF] animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading slider banners...</p>
          </div>
        ) : sliders.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 text-[#6C63FF] flex items-center justify-center mx-auto mb-4">
              <Sliders className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-800">No Sliders Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
              अभी तक कोई स्लाइडर बैनर नहीं जोड़ा गया है। होमपेज पर आकर्षक बैनर दिखाने के लिए 'Add New Slide' पर क्लिक करें।
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-xl bg-[#6C63FF] text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-[#6C63FF]/30"
            >
              <Plus className="w-4 h-4" /> Add First Slide
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-4 px-4 text-center w-16">Order</th>
                    <th className="py-4 px-4 w-44">Preview</th>
                    <th className="py-4 px-4">Title & Subtitle</th>
                    <th className="py-4 px-4">Badge / Button</th>
                    <th className="py-4 px-4">Target Link</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sliders.map((slider, idx) => (
                    <tr
                      key={slider.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        !slider.isActive ? 'opacity-60 bg-slate-50/30' : ''
                      }`}
                    >
                      {/* Position & Move */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 font-black text-slate-700 flex items-center justify-center text-xs">
                            {slider.position}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleQuickMove(slider, 'up')}
                              disabled={idx === 0}
                              title="Move Up"
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-400"
                            >
                              <MoveUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickMove(slider, 'down')}
                              disabled={idx === sliders.length - 1}
                              title="Move Down"
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-400"
                            >
                              <MoveDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Image Preview */}
                      <td className="py-4 px-4">
                        <div className="w-40 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm relative group">
                          <img
                            src={slider.imageUrl}
                            alt={slider.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e: any) => {
                              e.target.src =
                                'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600';
                            }}
                          />
                          <a
                            href={slider.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> View Image
                          </a>
                        </div>
                      </td>

                      {/* Title & Subtitle */}
                      <td className="py-4 px-4 max-w-sm">
                        <div className="font-bold text-slate-900 text-sm line-clamp-1">
                          {slider.title}
                        </div>
                        {slider.subtitle && (
                          <div className="text-slate-500 text-xs mt-0.5 line-clamp-2">
                            {slider.subtitle}
                          </div>
                        )}
                      </td>

                      {/* Badge / Button */}
                      <td className="py-4 px-4 space-y-1">
                        {slider.badge && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black uppercase tracking-wider">
                            {slider.badge}
                          </span>
                        )}
                        {slider.buttonText && (
                          <div className="text-slate-700 text-xs font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]"></span>
                            CTA: {slider.buttonText}
                          </div>
                        )}
                      </td>

                      {/* Target Link */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px]">
                          {slider.linkUrl || '/courses'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(slider)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black transition-colors ${
                            slider.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                          title="Click to toggle Active / Inactive"
                        >
                          {slider.isActive ? (
                            <>
                              <Eye className="w-3 h-3" /> Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" /> Hidden
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(slider)}
                            className="p-2 rounded-xl text-slate-600 hover:text-[#6C63FF] hover:bg-purple-50 transition-colors"
                            title="Edit Slide"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(slider)}
                            className="p-2 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Slide"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
              <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6C63FF] flex items-center justify-center font-bold">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">
                    {editingSlider ? 'Edit Slider Banner' : 'Add New Slider Banner'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Banner Title (शीर्षक) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. UPSSSC PET 2026 संपूर्ण सिलेक्शन लाइव बैच"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/20 outline-none"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Banner Subtitle (उप-शीर्षक / विवरण)
                  </label>
                  <textarea
                    rows={2}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="e.g. लाइव कक्षाएं, द्विभाषी हस्तलिखित नोट्स एवं 50+ फुल-लेंथ ऑनलाइन टेस्ट..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#6C63FF] outline-none"
                  />
                </div>

                {/* Grid of Badge, Button text */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Badge Text (टैग / बैज)
                    </label>
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder="e.g. 🔥 2026 NEW BATCH OPEN"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#6C63FF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Button Text (बटन टेक्स्ट)
                    </label>
                    <input
                      type="text"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder="e.g. Explore Courses / बैच देखें"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#6C63FF] outline-none"
                    />
                  </div>
                </div>

                {/* Target Link & Position */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target Link (क्लिक करने पर कहाँ खुले)
                    </label>
                    <input
                      type="text"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="e.g. /courses or /test-series"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#6C63FF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Display Position Order (क्रम संख्या)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={position}
                      onChange={(e) => setPosition(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#6C63FF] outline-none"
                    />
                  </div>
                </div>

                {/* Image URL with live preview */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Banner Image URL (बैनर इमेज लिंक) *</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      High resolution recommended (1400x500 or 16:9)
                    </span>
                  </label>
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#6C63FF] outline-none"
                  />
                  {/* Quick presets */}
                  <div className="flex flex-wrap gap-2 mt-2 items-center text-[11px] text-slate-500">
                    <span className="font-bold text-slate-400">Sample Presets:</span>
                    {[
                      {
                        name: 'Students & Books',
                        url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400',
                      },
                      {
                        name: 'Exam CBT Desk',
                        url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1400',
                      },
                      {
                        name: 'Library & Notes',
                        url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1400',
                      },
                    ].map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setImageUrl(p.url)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-purple-100 hover:text-[#6C63FF] transition-colors"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>

                  {/* Live preview */}
                  {imageUrl && (
                    <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 h-32 relative">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e: any) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent p-4 flex flex-col justify-end text-white">
                        {badge && (
                          <span className="text-[9px] font-black uppercase text-pink-400">
                            {badge}
                          </span>
                        )}
                        <h4 className="text-xs font-black line-clamp-1">{title || 'Banner Title'}</h4>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Checkbox */}
                <div className="pt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-[#6C63FF] rounded border-slate-300 focus:ring-[#6C63FF]"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Active (होमपेज स्लाइडर में तुरंत प्रदर्शित करें)
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#584feb] text-white font-bold text-xs shadow-lg shadow-[#6C63FF]/30 transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : editingSlider ? 'Update Banner' : 'Create Banner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">Delete Slider Banner?</h3>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Are you sure you want to delete <strong className="text-slate-700">"{deleteTarget.title}"</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/30"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSlidersPage;
