import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  X,
  Send,
  Clock,
} from 'lucide-react';
import { api } from '../../services/api';
import { Notification } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const AdminNotificationsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Form / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'GENERAL' | 'EXAM' | 'UNIVERSITY' | 'COURSE' | 'ACADEMIC'>('GENERAL');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [linkUrl, setLinkUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [status, setStatus] = useState('PUBLISHED');

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.notifications.adminGetAll();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const openCreateModal = () => {
    setEditingNotification(null);
    setTitle('');
    setMessage('');
    setCategory('EXAM');
    setPriority('NORMAL');
    setLinkUrl('');
    setExpiresAt('');
    setStatus('PUBLISHED');
    setIsModalOpen(true);
  };

  const openEditModal = (n: Notification) => {
    setEditingNotification(n);
    setTitle(n.title);
    setMessage(n.message);
    setCategory(n.category);
    setPriority(n.priority);
    setLinkUrl(n.linkUrl || '');
    setExpiresAt(n.expiresAt ? n.expiresAt.split('T')[0] : '');
    setStatus(n.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toastError('Title and message are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        message: message.trim(),
        category,
        priority,
        linkUrl: linkUrl.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        status,
      };

      if (editingNotification) {
        const res = await api.notifications.update(editingNotification.id, payload);
        if (res.success) {
          success('Notification broadcast updated!');
          setIsModalOpen(false);
          fetchNotifications();
        }
      } else {
        const res = await api.notifications.create(payload);
        if (res.success) {
          success('Notification broadcasted to all students!');
          setIsModalOpen(false);
          fetchNotifications();
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save notification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await api.notifications.delete(deleteId);
      if (res.success) {
        setNotifications((prev) => prev.filter((item) => item.id !== deleteId));
        success('Notification deleted.');
        setDeleteId(null);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to delete notification');
    }
  };

  const priorityBadges: Record<string, string> = {
    URGENT: 'bg-rose-100 text-rose-700 border-rose-200',
    HIGH: 'bg-amber-100 text-amber-700 border-amber-200',
    NORMAL: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const categoryBadges: Record<string, string> = {
    EXAM: 'bg-purple-100 text-purple-700',
    UNIVERSITY: 'bg-indigo-100 text-indigo-700',
    COURSE: 'bg-emerald-100 text-emerald-700',
    ACADEMIC: 'bg-cyan-100 text-cyan-700',
    GENERAL: 'bg-slate-100 text-slate-700',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Bell className="w-7 h-7 text-[#6C63FF]" />
              Notice & Broadcast Center
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Publish critical exam alerts, university circulars, new course launches, and urgent bulletins.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6C63FF] to-[#8f88ff] text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Broadcast Notice
            </button>
          </div>
        </div>

        {/* Notifications Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Title & Notice</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Action Link</th>
                  <th className="py-3.5 px-4">Published Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6C63FF]" />
                      Loading notifications...
                    </td>
                  </tr>
                ) : notifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No notices broadcasted yet. Click "Broadcast Notice" to push an announcement.
                    </td>
                  </tr>
                ) : (
                  notifications.map((n) => (
                    <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-bold text-slate-900">{n.title}</div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mt-0.5">
                          {n.message}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            categoryBadges[n.category] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {n.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            priorityBadges[n.priority] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {n.priority === 'URGENT' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          {n.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {n.linkUrl ? (
                          <a
                            href={n.linkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#6C63FF] hover:underline font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View Link
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(n.publishedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            n.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {n.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(n)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(n.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Broadcast Notice */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6C63FF] flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingNotification ? 'Edit Broadcast Notice' : 'Broadcast New Notice'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Notice Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. UPSSSC PET 2026 Admit Card Released!"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF]/30 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                    >
                      <option value="EXAM">EXAM</option>
                      <option value="UNIVERSITY">UNIVERSITY</option>
                      <option value="COURSE">COURSE</option>
                      <option value="ACADEMIC">ACADEMIC</option>
                      <option value="GENERAL">GENERAL</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Priority Level</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                    >
                      <option value="NORMAL">NORMAL</option>
                      <option value="HIGH">HIGH (Important)</option>
                      <option value="URGENT">URGENT (Top Alert)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Message Content *</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write detailed notification content..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Action Link / PDF Circular</span>
                      <span className="text-[10px] text-[#6C63FF] font-semibold">PDF विज्ञप्ति लिंक</span>
                    </label>
                    <input
                      type="text"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://.../upsssc-pet-notice.pdf"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#6C63FF]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                  >
                    <option value="PUBLISHED">PUBLISHED (Broadcasted)</option>
                    <option value="DRAFT">DRAFT (Hidden)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#6C63FF] hover:bg-[#584fd4] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? 'Broadcasting...' : editingNotification ? 'Update Notice' : 'Broadcast Now'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        <ConfirmModal
          isOpen={!!deleteId}
          title="Delete Notification"
          message="Are you sure you want to delete this notification broadcast?"
          confirmText="Delete Notice"
          isDestructive={true}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminNotificationsPage;
