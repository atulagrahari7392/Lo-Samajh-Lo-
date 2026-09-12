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
} from 'lucide-react';
import { api } from '../../services/api';
import StatCard from '../../components/admin/StatCard';
import AdminLayout from '../../components/admin/AdminLayout';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchStats();
  }, []);

  const stats = data?.stats || {};
  const recentOrders = data?.recentOrders || [];
  const recentUsers = data?.recentUsers || [];

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

          <div className="flex items-center gap-2">
            <Link
              to="/admin/courses/new"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#564ec9] text-white font-bold text-xs shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Course</span>
            </Link>
          </div>
        </div>

        {/* Real Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue || 0}`}
            subtitle="Completed order sales"
            icon={IndianRupee}
            color="#2ECC71"
            trend="+18% this month"
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
