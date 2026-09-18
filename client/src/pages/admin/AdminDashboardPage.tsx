import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  ShoppingCart,
  IndianRupee,
  FileText,
  Award,
  Video,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Trash2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import StatCard from '../../components/admin/StatCard';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';

export const AdminDashboardPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getStats();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handlePurgeDemoData = async () => {
    if (!window.confirm('Purge all confirmed demo orders, fake tests, and demo users from PostgreSQL? Your Admin account and real courses will be strictly preserved.')) {
      return;
    }
    try {
      setCleaning(true);
      const res = await api.admin.cleanupDemoData();
      if (res.success) {
        success('Demo data purged! Revenue reset to ₹0 and fake metrics cleared.');
        await fetchStats();
      } else {
        toastError(res.message || 'Cleanup failed.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to execute cleanup.');
    } finally {
      setCleaning(false);
    }
  };

  const stats = data?.stats || {};
  const recentOrders = data?.recentOrders || [];
  const recentUsers = data?.recentUsers || [];
  const hasDemoOrders = recentOrders.some((o: any) => o.orderNumber === 'LSL-2026-00109' || o.orderNumber === 'LSL-151853-8857' || o.orderNumber === 'LSL-553144-9062');

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Admin Overview & Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Live statistics queried directly from the production database.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePurgeDemoData}
              disabled={cleaning}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs shadow-xs transition-all"
              title="Delete seed orders and demo records to restore ₹0 zero-state"
            >
              <Trash2 className={`w-4 h-4 ${cleaning ? 'animate-spin' : ''}`} />
              <span>{cleaning ? 'Purging...' : 'Purge Demo Data (₹0 Reset)'}</span>
            </button>

            <Link
              to="/admin/courses/new"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Course</span>
            </Link>
          </div>
        </div>

        {/* Demo Data Alert Banner if detected */}
        {hasDemoOrders && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-bold">Initial seed records detected in database (e.g. ₹1348 revenue / sample orders).</p>
                <p className="text-[11px] text-amber-700">Click "Purge Demo Data" to safely restore genuine ₹0 zero-state. Real admin accounts are preserved.</p>
              </div>
            </div>
            <button
              onClick={handlePurgeDemoData}
              disabled={cleaning}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs self-start sm:self-auto flex-shrink-0 shadow transition-all"
            >
              {cleaning ? 'Cleaning...' : 'Purge Now (Reset to ₹0)'}
            </button>
          </div>
        )}

        {/* Real Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue || 0}`}
            subtitle="Completed order sales"
            icon={IndianRupee}
            color="#2ECC71"
            trend={stats.revenueGrowth || undefined}
          />
          <StatCard
            title="Total Students"
            value={stats.totalUsers || 0}
            subtitle="Registered user accounts"
            icon={Users}
            color="#6C63FF"
          />
          <StatCard
            title="Active Courses"
            value={stats.totalCourses || 0}
            subtitle="Published curriculum"
            icon={BookOpen}
            color="#FF6584"
          />
          <StatCard
            title="Orders Completed"
            value={stats.totalOrders || 0}
            subtitle="Total student enrollments"
            icon={ShoppingCart}
            color="#F39C12"
          />
          <StatCard
            title="Study Materials"
            value={stats.totalMaterials || 0}
            subtitle="Downloadable PDFs"
            icon={FileText}
            color="#3B82F6"
          />
          <StatCard
            title="Mock Tests"
            value={stats.totalTests || 0}
            subtitle="Published test series"
            icon={Award}
            color="#8B5CF6"
          />
          <StatCard
            title="Live Sessions"
            value={stats.activeLiveClasses || 0}
            subtitle="Scheduled upcoming"
            icon={Video}
            color="#EC4899"
          />
          <StatCard
            title="Recorded Videos"
            value={stats.totalRecordedClasses || 0}
            subtitle="In video repository"
            icon={BookOpen}
            color="#14B8A6"
          />
        </div>

        {/* Tables: Recent Orders & Recent Users */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Recent Orders Table */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Recent Enrollments & Orders</h3>
              <Link to="/admin/orders" className="text-xs font-bold text-[#6C63FF] hover:underline">
                View All Orders
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Order #</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-xl">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {recentOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-800">{ord.orderNumber}</td>
                      <td className="p-3">{ord.user?.name}</td>
                      <td className="p-3 font-bold text-slate-900">₹{ord.totalAmount}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                          {ord.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-400">No recent orders.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Users Table */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">New Registered Students</h3>
              <Link to="/admin/users" className="text-xs font-bold text-[#6C63FF] hover:underline">
                View All Users
              </Link>
            </div>

            <div className="space-y-3">
              {recentUsers.map((u: any) => (
                <div key={u.id} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#6C63FF] font-bold flex items-center justify-center">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{u.name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                    {u.role}
                  </span>
                </div>
              ))}
              {recentUsers.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No users found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
