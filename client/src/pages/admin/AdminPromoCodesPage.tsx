import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Edit2,
  Percent,
  IndianRupee,
  Calendar,
  Users,
  RefreshCw,
  X,
  Copy,
} from 'lucide-react';
import { api } from '../../services/api';
import { PromoCode } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const AdminPromoCodesPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState<string>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [usageLimit, setUsageLimit] = useState(1000);
  const [perUserLimit, setPerUserLimit] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const data = await api.promo.adminGetAll();
      if (data.success) {
        setPromoCodes(data.promoCodes || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch promo codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const openCreateModal = () => {
    setEditingPromo(null);
    setCode('');
    setDiscountType('PERCENTAGE');
    setDiscountValue(10);
    setMinOrderAmount(0);
    setMaxDiscount('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setExpiryDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setUsageLimit(1000);
    setPerUserLimit(1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: PromoCode) => {
    setEditingPromo(p);
    setCode(p.code);
    setDiscountType(p.discountType);
    setDiscountValue(p.discountValue);
    setMinOrderAmount(p.minOrderAmount);
    setMaxDiscount(p.maxDiscount ? String(p.maxDiscount) : '');
    setStartDate(p.startDate ? p.startDate.split('T')[0] : '');
    setExpiryDate(p.expiryDate ? p.expiryDate.split('T')[0] : '');
    setUsageLimit(p.usageLimit);
    setPerUserLimit(p.perUserLimit);
    setIsActive(p.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue || !expiryDate) {
      toastError('Code, discount value, and expiry date are required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        startDate: new Date(startDate).toISOString(),
        expiryDate: new Date(expiryDate).toISOString(),
        usageLimit,
        perUserLimit,
        isActive,
      };

      if (editingPromo) {
        const res = await api.promo.update(editingPromo.id, payload);
        if (res.success) {
          success('Promo code updated successfully!');
          setIsModalOpen(false);
          fetchPromos();
        }
      } else {
        const res = await api.promo.create(payload);
        if (res.success) {
          success('Promo code created successfully!');
          setIsModalOpen(false);
          fetchPromos();
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to save promo code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (p: PromoCode) => {
    try {
      const res = await api.promo.update(p.id, { isActive: !p.isActive });
      if (res.success) {
        setPromoCodes((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, isActive: !p.isActive } : item))
        );
        success(`Promo code ${p.code} ${!p.isActive ? 'activated' : 'deactivated'}`);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to toggle promo code');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await api.promo.delete(deleteId);
      if (res.success) {
        setPromoCodes((prev) => prev.filter((p) => p.id !== deleteId));
        success('Promo code deleted successfully.');
        setDeleteId(null);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to delete promo code');
    }
  };

  const copyCode = (c: string) => {
    navigator.clipboard.writeText(c);
    success(`Copied ${c} to clipboard!`);
  };

  const filtered = promoCodes.filter((p) =>
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Tag className="w-7 h-7 text-[#6C63FF]" />
              Coupons & Discount Engine
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Create and manage promotional voucher codes, percentage or flat discounts, and usage limits.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPromos}
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
              Create Promo Code
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search coupon code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#6C63FF]/30 outline-none"
            />
          </div>
        </div>

        {/* Promo Codes Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount Value</th>
                  <th className="py-3.5 px-4">Min Order Amount</th>
                  <th className="py-3.5 px-4">Max Discount Cap</th>
                  <th className="py-3.5 px-4">Usage Stats</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6C63FF]" />
                      Loading coupons...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No promo codes found. Create your first coupon using the button above.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const isExpired = new Date(p.expiryDate) < new Date();
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              {p.code}
                            </span>
                            <button
                              onClick={() => copyCode(p.code)}
                              className="text-slate-400 hover:text-slate-700 p-1"
                              title="Copy code"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                            {p.discountType === 'PERCENTAGE' ? (
                              <>
                                <Percent className="w-3 h-3" />
                                {p.discountValue}% OFF
                              </>
                            ) : (
                              <>
                                <IndianRupee className="w-3 h-3" />
                                ₹{p.discountValue} FLAT OFF
                              </>
                            )}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 font-semibold">
                          ₹{p.minOrderAmount}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {p.maxDiscount ? `₹${p.maxDiscount}` : 'No Cap'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{p.usedCount || 0}</span>
                          <span className="text-slate-400 font-normal"> / {p.usageLimit} uses</span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          <div>
                            Expires:{' '}
                            <span className={isExpired ? 'text-rose-600 font-bold' : 'font-semibold text-slate-800'}>
                              {new Date(p.expiryDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleActive(p)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                              p.isActive && !isExpired
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            }`}
                          >
                            {p.isActive && !isExpired ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                {isExpired ? 'Expired' : 'Inactive'}
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(p.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create / Edit Promo */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6C63FF] flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingPromo ? 'Edit Promo Code' : 'Create New Promo Code'}
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
                  <label className="text-xs font-bold text-slate-700">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. RAILWAY50"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-[#6C63FF]/30 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Discount Type</label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Flat Fixed (₹)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Discount Value *</label>
                    <input
                      type="number"
                      step="0.5"
                      min={1}
                      required
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      placeholder={discountType === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 200'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Minimum Order (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Max Discount Cap (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Expiry Date *</label>
                    <input
                      type="date"
                      required
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Global Usage Limit</label>
                    <input
                      type="number"
                      min={1}
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(parseInt(e.target.value, 10) || 1000)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Per User Limit</label>
                    <input
                      type="number"
                      min={1}
                      value={perUserLimit}
                      onChange={(e) => setPerUserLimit(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isPromoActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#6C63FF]"
                  />
                  <label htmlFor="isPromoActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Enable Coupon for checkout
                  </label>
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
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#6C63FF] hover:bg-[#584fd4] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingPromo ? 'Update Coupon' : 'Create Coupon'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        <ConfirmModal
          isOpen={!!deleteId}
          title="Delete Promo Code"
          message="Are you sure you want to delete this coupon? Existing student checkout sessions using this code will be invalidated."
          confirmText="Delete Coupon"
          isDestructive={true}
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminPromoCodesPage;
