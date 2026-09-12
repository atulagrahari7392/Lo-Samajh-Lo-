import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  UserCheck,
  UserX,
  BookOpen,
  ShoppingCart,
  Award,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';

export const AdminUsersPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const data = await api.admin.getUsers(params);
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

  const handleToggleStatus = async (user: User) => {
    try {
      setUpdatingId(user.id);
      const newStatus = !user.isActive;
      const res = await api.admin.updateUserStatus(user.id, newStatus);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u))
        );
        success(`User ${user.name} marked as ${newStatus ? 'Active' : 'Inactive'}`);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update user status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (user: User, newRole: string) => {
    try {
      setUpdatingId(user.id);
      const res = await api.admin.updateUserRole(user.id, newRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole as any } : u))
        );
        success(`User ${user.name} role changed to ${newRole}`);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update user role');
    } finally {
      setUpdatingId(null);
    }
  };

  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.isActive !== false).length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const studentCount = users.filter((u) => u.role === 'USER').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-[#6C63FF]" />
              User Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              View registered students, instructors, and manage access roles and statuses.
            </p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6C63FF] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
              <p className="text-xl font-black text-slate-900">{totalUsers}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active</p>
              <p className="text-xl font-black text-slate-900">{activeCount}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Admins</p>
              <p className="text-xl font-black text-slate-900">{adminCount}</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Students</p>
              <p className="text-xl font-black text-slate-900">{studentCount}</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30 focus:border-[#6C63FF]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30"
            >
              <option value="">All Roles</option>
              <option value="USER">Student (USER)</option>
              <option value="ADMIN">Administrator</option>
              <option value="INSTRUCTOR">Instructor</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Enrolled Courses</th>
                  <th className="py-3.5 px-4">Orders</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6C63FF]" />
                      Loading users from database...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No users found matching your search or filters.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isUserActive = u.isActive !== false;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#FF6584] text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">{u.name}</p>
                              <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                              {u.phone && <p className="text-[10px] text-slate-400">{u.phone}</p>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={u.role}
                            disabled={updatingId === u.id}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border border-transparent transition-all ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-700 hover:border-purple-300'
                                : u.role === 'INSTRUCTOR'
                                ? 'bg-amber-100 text-amber-700 hover:border-amber-300'
                                : 'bg-slate-100 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="INSTRUCTOR">INSTRUCTOR</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={updatingId === u.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                              isUserActive
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            }`}
                          >
                            {isUserActive ? (
                              <>
                                <UserCheck className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3" />
                                Inactive
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                            <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                            {u._count?.enrollments ?? 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                            <ShoppingCart className="w-3.5 h-3.5 text-emerald-500" />
                            {u._count?.orders ?? 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }) : '—'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={updatingId === u.id}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            {isUserActive ? 'Deactivate' : 'Activate'}
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
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;
