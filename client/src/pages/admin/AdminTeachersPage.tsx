import React, { useEffect, useState } from 'react';
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Eye,
  Shield,
  ShieldAlert,
  BookOpen,
  Award,
  FileText,
  Video,
  ExternalLink,
  ChevronRight,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  X,
  Plus,
  Send,
  Lock,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TeacherApplication } from '../../types';

export const AdminTeachersPage: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'approved' | 'staff'>('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [approvedTeachers, setApprovedTeachers] = useState<any[]>([]);
  const [staffManagers, setStaffManagers] = useState<any[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);

  // Search & filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Detail Modal
  const [selectedApp, setSelectedApp] = useState<TeacherApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Approve & Assign Modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [assignSubjects, setAssignSubjects] = useState('');
  const [canPublishDirectly, setCanPublishDirectly] = useState(false);
  const [approving, setApproving] = useState(false);

  // Changes / Reject Modal
  const [showActionModal, setShowActionModal] = useState<'request_changes' | 'reject' | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Staff Manager Modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPermissions, setStaffPermissions] = useState({
    canManageTeachers: true,
    canApproveTeachers: true,
    canAssignCourses: true,
    canReviewContent: true,
    canPublishDirectly: false,
    canViewTeacherPii: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ovRes, appRes, teachRes, coursesRes] = await Promise.all([
        api.teacherAdmin.getOverview(),
        api.teacherAdmin.getApplications(),
        api.teacherAdmin.getApprovedTeachers(),
        api.courses.getAll({ limit: 100 }),
      ]);

      if (ovRes.success) setOverview(ovRes.data);
      if (appRes.success) setApplications(appRes.data || []);
      if (teachRes.success) setApprovedTeachers(teachRes.data || []);
      if (coursesRes.success) setAvailableCourses(coursesRes.data || coursesRes.courses || []);

      if (isSuperAdmin || user?.role === 'ADMIN') {
        const staffRes = await api.teacherAdmin.getStaffManagers();
        if (staffRes.success) setStaffManagers(staffRes.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load teacher admin data:', err);
      toastError(err.message || 'Failed to load teacher management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async () => {
    if (!selectedApp) return;
    try {
      setApproving(true);
      const res = await api.teacherAdmin.approveApplication(selectedApp.id, {
        courseIds: selectedCourseIds,
        assignedSubjects: assignSubjects ? assignSubjects.split(',').map((s) => s.trim()) : undefined,
        canPublishDirectly,
      });
      if (res.success) {
        success('Teacher application approved and courses assigned!');
        setShowApproveModal(false);
        setShowDetailModal(false);
        fetchData();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to approve application.');
    } finally {
      setApproving(false);
    }
  };

  const handleRequestChangesOrReject = async () => {
    if (!selectedApp || !showActionModal) return;
    try {
      setSubmittingAction(true);
      if (showActionModal === 'request_changes') {
        const res = await api.teacherAdmin.requestChanges(selectedApp.id, actionComment);
        if (res.success) success('Changes requested from applicant.');
      } else {
        const res = await api.teacherAdmin.rejectApplication(selectedApp.id, actionComment);
        if (res.success) success('Application rejected.');
      }
      setShowActionModal(null);
      setShowDetailModal(false);
      setActionComment('');
      fetchData();
    } catch (err: any) {
      toastError(err.message || 'Action failed.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSuspend = async (teacherId: string) => {
    if (!window.confirm('Are you sure you want to suspend this teacher? They will lose access to portal.')) return;
    try {
      const res = await api.teacherAdmin.suspendTeacher(teacherId, 'Administrative suspension');
      if (res.success) {
        success('Teacher suspended successfully.');
        fetchData();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to suspend teacher.');
    }
  };

  const handleReinstate = async (teacherId: string) => {
    try {
      const res = await api.teacherAdmin.reinstateTeacher(teacherId);
      if (res.success) {
        success('Teacher reinstated successfully.');
        fetchData();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to reinstate teacher.');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.teacherAdmin.createStaffManager({
        email: staffEmail,
        permissions: staffPermissions,
      });
      if (res.success) {
        success('Staff Manager registered successfully!');
        setShowStaffModal(false);
        setStaffEmail('');
        fetchData();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to create staff manager.');
    }
  };

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const getDocStreamUrl = (docType: string) => {
    if (!selectedApp) return '';
    const token = localStorage.getItem('lsl_token');
    return `/api/admin/teachers/applications/${selectedApp.id}/document/${docType}?token=${token}`;
  };

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const matchesSearch =
      !search ||
      app.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      app.email?.toLowerCase().includes(search.toLowerCase()) ||
      app.phone?.toLowerCase().includes(search.toLowerCase()) ||
      app.specialization?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Faculty & Teacher Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Verify 7-step teacher applications, assign courses, inspect submitted documents, and regulate staff permissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#6C63FF] text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'applications'
                  ? 'bg-[#6C63FF] text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Verification Queue ({overview?.pendingApplications ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'approved'
                  ? 'bg-[#6C63FF] text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Approved Faculty ({overview?.approvedTeachers ?? 0})
            </button>
            {(isSuperAdmin || user?.role === 'ADMIN') && (
              <button
                onClick={() => setActiveTab('staff')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'staff'
                    ? 'bg-[#6C63FF] text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Staff Managers
              </button>
            )}
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-slate-900">{overview?.totalApplications ?? 0}</div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Applications
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm space-y-2 bg-amber-50/20">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-amber-700">{overview?.pendingApplications ?? 0}</div>
                <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Pending Verification
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-2 bg-emerald-50/20">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-emerald-700">{overview?.approvedTeachers ?? 0}</div>
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Active Faculty
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-sm space-y-2 bg-purple-50/20">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-purple-700">{overview?.pendingContent ?? 0}</div>
                <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
                  Lectures In Review
                </div>
              </div>
            </div>

            {/* Quick action banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-tr from-indigo-900 to-indigo-700 rounded-3xl p-6 text-white shadow-md space-y-4">
                <h3 className="text-lg font-bold">Applications Awaiting Inspection</h3>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  Review applicant personal identity, qualification certificates, and sample demo lectures to approve onboarding.
                </p>
                <button
                  onClick={() => setActiveTab('applications')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow hover:bg-indigo-50"
                >
                  <span>Open Verification Queue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-gradient-to-tr from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-md space-y-4">
                <h3 className="text-lg font-bold">Teacher Content Quality Queue</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Teachers cannot publish directly. Inspect video recordings, worksheets, and mock tests before they go live.
                </p>
                <a
                  href="/admin/content-approval"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow"
                >
                  <span>Open Content Review Queue</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* APPLICATIONS TAB */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {['ALL', 'UNDER_REVIEW', 'PENDING_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      statusFilter === s
                        ? 'bg-[#6C63FF] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search applicant name, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF] outline-none"
                />
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              {filteredApplications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                  No applications match the current criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-3.5 px-6">Applicant Name</th>
                        <th className="py-3.5 px-4">Contact</th>
                        <th className="py-3.5 px-4">Experience & Domain</th>
                        <th className="py-3.5 px-4">Medium / Mode</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Submitted</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-900">
                            <div>{app.fullName}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{app.id}</span>
                          </td>
                          <td className="py-4 px-4 text-slate-600">
                            <div>{app.email}</div>
                            <div className="text-[11px] text-slate-400">{app.phone}</div>
                          </td>
                          <td className="py-4 px-4 text-slate-700">
                            <span className="font-bold">{app.teachingExperienceYears} Years</span>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">
                              {app.specialization || 'Not specified'}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-600">
                            <div>{app.teachingMedium}</div>
                            <span className="text-[10px] text-slate-400 font-semibold">{app.preferredMode}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                app.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : app.status === 'CHANGES_REQUESTED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : app.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-indigo-100 text-[#6C63FF]'
                              }`}
                            >
                              {app.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-400 text-[11px]">
                            {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setShowDetailModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#6C63FF] hover:text-white text-slate-700 text-xs font-bold transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect (7-Steps)</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* APPROVED FACULTY TAB */}
        {activeTab === 'approved' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              {approvedTeachers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                  No approved teachers found. Approve pending applications to see them here.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-3.5 px-6">Teacher</th>
                        <th className="py-3.5 px-4">Email & Phone</th>
                        <th className="py-3.5 px-4">Assigned Courses</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Joined</th>
                        <th className="py-3.5 px-6 text-right">Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {approvedTeachers.map((teach) => (
                        <tr key={teach.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                              {teach.name?.charAt(0) || 'T'}
                            </div>
                            <div>
                              <div>{teach.name}</div>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {teach.teacherApplication?.specialization || 'Instructor'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-600">
                            <div>{teach.email}</div>
                            <div className="text-[11px] text-slate-400">{teach.phone || '—'}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {teach.teacherAssignments?.map((a: any) => (
                                <span
                                  key={a.id}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-[#6C63FF] border border-indigo-200"
                                >
                                  {a.course?.title}
                                </span>
                              ))}
                              {(!teach.teacherAssignments || teach.teacherAssignments.length === 0) && (
                                <span className="text-slate-400 italic">No courses mapped</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {teach.isActive === false || teach.teacherApplication?.status === 'SUSPENDED' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                Suspended
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Active Faculty
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-slate-400 text-[11px]">
                            {new Date(teach.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            {teach.isActive === false || teach.teacherApplication?.status === 'SUSPENDED' ? (
                              <button
                                onClick={() => handleReinstate(teach.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors"
                              >
                                Reinstate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspend(teach.id)}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors"
                              >
                                Suspend Access
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STAFF MANAGERS TAB */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Academic Staff Managers</h3>
                <p className="text-xs text-slate-500">Sub-administrators with granular faculty review permissions.</p>
              </div>
              <button
                onClick={() => setShowStaffModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6C63FF] hover:bg-[#5b52e0] text-white text-xs font-bold shadow-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Staff Manager</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              {staffManagers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                  No staff managers registered yet. Click "Add Staff Manager" above to designate roles.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                        <th className="py-3.5 px-6">Name & Email</th>
                        <th className="py-3.5 px-4">Can Manage Teachers</th>
                        <th className="py-3.5 px-4">Can Approve</th>
                        <th className="py-3.5 px-4">Can Assign Courses</th>
                        <th className="py-3.5 px-4">Can Review Content</th>
                        <th className="py-3.5 px-4">View PII</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staffManagers.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-6 font-bold text-slate-900">
                            <div>{m.user?.name || 'Staff Member'}</div>
                            <span className="text-[11px] text-slate-500 font-normal">{m.user?.email}</span>
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-700">
                            {m.canManageTeachers ? '✅ Yes' : '❌ No'}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-700">
                            {m.canApproveTeachers ? '✅ Yes' : '❌ No'}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-700">
                            {m.canAssignCourses ? '✅ Yes' : '❌ No'}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-700">
                            {m.canReviewContent ? '✅ Yes' : '❌ No'}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-700">
                            {m.canViewTeacherPii ? '✅ Yes' : '❌ No'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7-STEP DETAIL INSPECTION MODAL */}
        {showDetailModal && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Application Inspection
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedApp.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-indigo-100 text-[#6C63FF]'
                      }`}
                    >
                      {selectedApp.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">{selectedApp.fullName}</h2>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 7-Step Inspection Grid */}
              <div className="space-y-6">
                {/* 1. Personal & Contact */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    1 & 2. Personal, Contact & Address
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px]">Email</span>
                      <span className="font-bold text-slate-800">{selectedApp.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px]">Phone</span>
                      <span className="font-bold text-slate-800">{selectedApp.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px]">DOB & Gender</span>
                      <span className="font-bold text-slate-800">
                        {selectedApp.dob || '—'} / {selectedApp.gender || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px]">City & State</span>
                      <span className="font-bold text-slate-800">
                        {selectedApp.city || '—'}, {selectedApp.state || '—'} ({selectedApp.pincode || '—'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Qualifications */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    3. Academic Qualifications
                  </h4>
                  {Array.isArray(selectedApp.qualifications) && selectedApp.qualifications.length > 0 ? (
                    <div className="space-y-2">
                      {selectedApp.qualifications.map((q: any, i: number) => (
                        <div
                          key={i}
                          className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{q.degree}</span> in {q.field}
                            <div className="text-slate-500 text-[11px]">{q.institution}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-800">{q.yearOfPassing}</span>
                            <div className="text-slate-500 text-[11px]">{q.percentageOrCgpa}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No structured qualifications recorded.</p>
                  )}
                </div>

                {/* 4. Experience */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    4. Teaching Experience ({selectedApp.teachingExperienceYears} Years)
                  </h4>
                  {Array.isArray(selectedApp.experienceHistory) && selectedApp.experienceHistory.length > 0 ? (
                    <div className="space-y-2">
                      {selectedApp.experienceHistory.map((e: any, i: number) => (
                        <div
                          key={i}
                          className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{e.designation}</span> at {e.organization}
                            <div className="text-slate-500 text-[11px]">Subject: {e.subjectTaught}</div>
                          </div>
                          <div className="text-right text-slate-600 font-semibold text-[11px]">
                            {e.fromYear} - {e.toYear || 'Present'} ({e.years} yrs)
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No prior institutional history specified.</p>
                  )}
                </div>

                {/* 5. Teaching Profile */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    5. Teaching Profile & Pedagogy
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px]">Medium</span>
                      <span className="font-bold text-slate-800">{selectedApp.teachingMedium}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px]">Preferred Mode</span>
                      <span className="font-bold text-slate-800">{selectedApp.preferredMode}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold text-[10px]">Specialization</span>
                      <span className="font-bold text-slate-800">{selectedApp.specialization || 'General'}</span>
                    </div>
                  </div>
                  {selectedApp.bio && (
                    <div className="pt-2 text-xs text-slate-600 italic bg-white p-3 rounded-xl border border-slate-200">
                      "{selectedApp.bio}"
                    </div>
                  )}
                  {selectedApp.demoVideoUrl && (
                    <div className="pt-2">
                      <a
                        href={selectedApp.demoVideoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-100 text-[#6C63FF] font-bold text-xs hover:bg-indigo-200 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Watch Demo Lecture Video</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* 6. Document Verification Stream (Google Drive Secure Stream) */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      6. Secure Document Stream (Google Drive)
                    </h4>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                      Authenticated Token Stream
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedApp.idProofDriveId && (
                      <a
                        href={getDocStreamUrl('id_proof')}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-[#6C63FF] text-center block space-y-1 group"
                      >
                        <Shield className="w-5 h-5 mx-auto text-[#6C63FF]" />
                        <span className="text-[11px] font-bold text-slate-700 block group-hover:text-[#6C63FF]">
                          ID Proof Document
                        </span>
                        <span className="text-[10px] text-slate-400">View File →</span>
                      </a>
                    )}

                    {selectedApp.qualificationDocDriveId && (
                      <a
                        href={getDocStreamUrl('qualification_doc')}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-[#6C63FF] text-center block space-y-1 group"
                      >
                        <Award className="w-5 h-5 mx-auto text-emerald-600" />
                        <span className="text-[11px] font-bold text-slate-700 block group-hover:text-[#6C63FF]">
                          Degree Certificate
                        </span>
                        <span className="text-[10px] text-slate-400">View File →</span>
                      </a>
                    )}

                    {selectedApp.experienceDocDriveId && (
                      <a
                        href={getDocStreamUrl('experience_doc')}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-[#6C63FF] text-center block space-y-1 group"
                      >
                        <FileText className="w-5 h-5 mx-auto text-amber-600" />
                        <span className="text-[11px] font-bold text-slate-700 block group-hover:text-[#6C63FF]">
                          Experience Letter
                        </span>
                        <span className="text-[10px] text-slate-400">View File →</span>
                      </a>
                    )}

                    {selectedApp.resumeDriveId && (
                      <a
                        href={getDocStreamUrl('resume')}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-[#6C63FF] text-center block space-y-1 group"
                      >
                        <FileText className="w-5 h-5 mx-auto text-purple-600" />
                        <span className="text-[11px] font-bold text-slate-700 block group-hover:text-[#6C63FF]">
                          Curriculum Vitae (CV)
                        </span>
                        <span className="text-[10px] text-slate-400">View File →</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* 7. Declaration */}
                <div className="text-[11px] text-slate-500 bg-slate-100 p-3 rounded-xl">
                  ✅ <strong>Declaration Checked:</strong> Applicant confirmed legal accuracy of all submitted details on{' '}
                  {selectedApp.submittedAt ? new Date(selectedApp.submittedAt).toLocaleString() : 'Submission'}.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowActionModal('request_changes')}
                    className="px-4 py-2.5 rounded-xl border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 text-xs font-bold transition-colors"
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={() => setShowActionModal('reject')}
                    className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-800 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition-colors"
                  >
                    Reject Application
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve & Assign Courses</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* APPROVE & ASSIGN MODAL */}
        {showApproveModal && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-black text-slate-900">Approve & Assign Courses</h3>
                  <p className="text-xs text-slate-500">Assign curriculum courses and permissions to {selectedApp.fullName}</p>
                </div>
                <button
                  onClick={() => setShowApproveModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Select Courses to Map ({selectedCourseIds.length} Selected)
                  </label>
                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl p-3 space-y-2">
                    {availableCourses.map((c) => (
                      <label
                        key={c.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                          selectedCourseIds.includes(c.id) ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedCourseIds.includes(c.id)}
                            onChange={() => handleToggleCourse(c.id)}
                            className="rounded text-[#6C63FF] focus:ring-[#6C63FF]"
                          />
                          <span className="text-xs font-bold text-slate-800">{c.title}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{c.category?.name || 'Course'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Subjects (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={assignSubjects}
                    onChange={(e) => setAssignSubjects(e.target.value)}
                    placeholder="e.g. Mathematics, Quantitative Aptitude, Algebra"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#6C63FF]"
                  />
                </div>

                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canPublishDirectly}
                    onChange={(e) => setCanPublishDirectly(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">Grant Direct Publishing Rights</span>
                    <span className="text-[10px] text-amber-700">
                      Bypasses quality review queue. Recommended only for senior trusted faculty.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={approving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-60"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{approving ? 'Activating...' : 'Confirm Approval & Activate'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REQUEST CHANGES / REJECT ACTION MODAL */}
        {showActionModal && selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">
                  {showActionModal === 'request_changes' ? 'Request Changes from Applicant' : 'Reject Application'}
                </h3>
                <button
                  onClick={() => setShowActionModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                {showActionModal === 'request_changes'
                  ? 'Specify what documents or details need correction before this teacher can be approved.'
                  : 'Provide the administrative rationale for declining this application.'}
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Feedback Remarks *</label>
                <textarea
                  rows={3}
                  required
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  placeholder="Enter remarks for the applicant..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#6C63FF]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowActionModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestChangesOrReject}
                  disabled={submittingAction || !actionComment.trim()}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-colors disabled:opacity-60 ${
                    showActionModal === 'request_changes'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingAction ? 'Submitting...' : 'Send Decision'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD STAFF MANAGER MODAL */}
        {showStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">Designate Academic Staff Manager</h3>
                <button
                  onClick={() => setShowStaffModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">User Email Address *</label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="staff@losamajhlo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#6C63FF]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Must be an existing registered user account.
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Granted Permissions</label>
                  {Object.entries(staffPermissions).map(([key, val]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={val}
                        onChange={(e) =>
                          setStaffPermissions((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                        className="rounded text-[#6C63FF] focus:ring-[#6C63FF]"
                      />
                      <span className="font-medium text-slate-800">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowStaffModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5b52e0] text-white text-xs font-bold shadow-md transition-colors"
                  >
                    Create Staff Manager
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTeachersPage;
