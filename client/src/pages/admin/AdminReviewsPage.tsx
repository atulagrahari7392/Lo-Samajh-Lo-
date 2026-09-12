import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
  Trash2,
  Filter,
  Sparkles,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { api } from '../../services/api';
import { Review } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const AdminReviewsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await api.reviews.adminGetAll();
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApproved = async (r: Review) => {
    try {
      setUpdatingId(r.id);
      const newApproved = !r.isApproved;
      const res = await api.reviews.updateStatus(r.id, { isApproved: newApproved });
      if (res.success) {
        setReviews((prev) =>
          prev.map((item) => (item.id === r.id ? { ...item, isApproved: newApproved } : item))
        );
        success(`Review marked as ${newApproved ? 'Approved' : 'Pending'}`);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update review status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleFeatured = async (r: Review) => {
    try {
      setUpdatingId(r.id);
      const newFeatured = !r.isFeatured;
      const res = await api.reviews.updateStatus(r.id, { isFeatured: newFeatured });
      if (res.success) {
        setReviews((prev) =>
          prev.map((item) => (item.id === r.id ? { ...item, isFeatured: newFeatured } : item))
        );
        success(`Review ${newFeatured ? 'featured on homepage' : 'unfeatured'}`);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to toggle featured status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await api.reviews.delete(deleteId);
      if (res.success) {
        setReviews((prev) => prev.filter((item) => item.id !== deleteId));
        success('Review deleted successfully.');
        setDeleteId(null);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to delete review');
    }
  };

  const filtered = reviews.filter((r) => {
    if (statusFilter === 'APPROVED') return r.isApproved;
    if (statusFilter === 'PENDING') return !r.isApproved;
    if (statusFilter === 'FEATURED') return r.isFeatured;
    return true;
  });

  const totalReviews = reviews.length;
  const approvedCount = reviews.filter((r) => r.isApproved).length;
  const featuredCount = reviews.filter((r) => r.isFeatured).length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : '5.0';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-7 h-7 text-[#6C63FF]" />
              Reviews & Testimonials Moderation
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Moderate student course reviews, feature testimonials on the landing page, and monitor student feedback.
            </p>
          </div>
          <button
            onClick={fetchReviews}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6C63FF] flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Reviews</p>
              <p className="text-xl font-black text-slate-900">{totalReviews}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center font-bold">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Average Rating</p>
              <p className="text-xl font-black text-slate-900">{avgRating} / 5</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Approved</p>
              <p className="text-xl font-black text-slate-900">{approvedCount}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Featured</p>
              <p className="text-xl font-black text-slate-900">{featuredCount}</p>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Filter By:</span>
            <div className="flex gap-1.5 ml-2">
              {[
                { label: 'All Reviews', val: 'ALL' },
                { label: 'Approved', val: 'APPROVED' },
                { label: 'Pending', val: 'PENDING' },
                { label: 'Featured on Home', val: 'FEATURED' },
              ].map((tab) => (
                <button
                  key={tab.val}
                  onClick={() => setStatusFilter(tab.val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === tab.val
                      ? 'bg-[#6C63FF] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Review Comment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Featured</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6C63FF]" />
                      Loading reviews...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No reviews found under this filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] text-white font-bold flex items-center justify-center text-[10px]">
                            {r.user?.name.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{r.user?.name || 'Student'}</p>
                            <p className="text-[10px] text-slate-400">{r.user?.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 line-clamp-1 max-w-[180px]">
                          {r.course?.title || 'General Course'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-slate-700 ml-1">{r.rating}.0</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-700 leading-relaxed italic line-clamp-2">
                          "{r.comment}"
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleApproved(r)}
                          disabled={updatingId === r.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            r.isApproved
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          }`}
                        >
                          {r.isApproved ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Approved
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Pending
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleFeatured(r)}
                          disabled={updatingId === r.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                            r.isFeatured
                              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {r.isFeatured ? 'Featured' : 'Not Featured'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setDeleteId(r.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Modal */}
        <ConfirmModal
          isOpen={!!deleteId}
          title="Delete Review"
          message="Are you sure you want to delete this review? This action cannot be undone."
          confirmText="Delete Review"
          isDestructive={true}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminReviewsPage;
