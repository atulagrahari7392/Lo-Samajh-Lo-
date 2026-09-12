import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  IndianRupee,
  Eye,
  FileText,
  Tag,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { Order } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';

export const AdminOrdersPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const data = await api.orders.adminGetAll(params);
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId);
      const res = await api.orders.updateStatus(orderId, newStatus);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        }
        success(`Order status updated to ${newStatus}`);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const totalRevenue = orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const refundedOrders = orders.filter((o) => o.status === 'REFUNDED').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-7 h-7 text-[#6C63FF]" />
              Order & Revenue Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track course purchases, student payment records, coupons, and update order statuses.
            </p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6C63FF] flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
              <p className="text-xl font-black text-slate-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed</p>
              <p className="text-xl font-black text-slate-900">{completedOrders}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending</p>
              <p className="text-xl font-black text-slate-900">{pendingOrders}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Refunded</p>
              <p className="text-xl font-black text-slate-900">{refundedOrders}</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search order #, customer name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Courses</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6C63FF]" />
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No orders found matching your filters.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => {
                    const statusColors: Record<string, string> = {
                      COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                      PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
                      FAILED: 'bg-rose-100 text-rose-700 border-rose-200',
                      REFUNDED: 'bg-slate-100 text-slate-600 border-slate-200',
                    };

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {o.orderNumber}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{o.user?.name || 'Unknown'}</div>
                          <div className="text-[11px] text-slate-500">{o.user?.email}</div>
                          {o.user?.phone && <div className="text-[10px] text-slate-400">{o.user.phone}</div>}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">
                            {o.items?.length || 0} course{o.items?.length !== 1 ? 's' : ''}
                          </span>
                          {o.items && o.items.length > 0 && (
                            <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                              {o.items.map((i) => i.course?.title).filter(Boolean).join(', ')}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">₹{o.totalAmount}</div>
                          {o.discount > 0 && (
                            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" />
                              Saved ₹{o.discount}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="font-medium">{o.paymentMethod || 'Online'}</span>
                          {o.transactionId && (
                            <p className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                              {o.transactionId}
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={o.status}
                            disabled={updatingId === o.id}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            className={`px-2 py-1 text-[10px] font-bold rounded-lg border ${
                              statusColors[o.status] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="PENDING">PENDING</option>
                            <option value="FAILED">FAILED</option>
                            <option value="REFUNDED">REFUNDED</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#6C63FF] hover:bg-purple-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Receipt / Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6C63FF] flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Order #{selectedOrder.orderNumber}</h3>
                    <p className="text-[11px] text-slate-500">
                      Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Info */}
              <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Student Details</p>
                <p className="font-bold text-slate-800">{selectedOrder.user?.name}</p>
                <p className="text-slate-600">{selectedOrder.user?.email}</p>
                {selectedOrder.user?.phone && <p className="text-slate-500">{selectedOrder.user.phone}</p>}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Enrolled Courses</p>
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 pr-2">
                        {item.course?.title || 'Course Package'}
                      </span>
                      <span className="font-bold text-slate-900">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breakdown */}
              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount {selectedOrder.promoCode?.code ? `(${selectedOrder.promoCode.code})` : ''}</span>
                    <span>-₹{selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-slate-200">
                  <span>Total Amount Paid</span>
                  <span className="text-[#6C63FF]">₹{selectedOrder.totalAmount}</span>
                </div>
              </div>

              {/* Meta details */}
              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-semibold text-slate-700">{selectedOrder.paymentMethod}</span>
                </div>
                {selectedOrder.transactionId && (
                  <div className="flex justify-between">
                    <span>Transaction Ref:</span>
                    <span className="font-mono text-slate-700">{selectedOrder.transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1">
                  <span>Current Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrdersPage;
