import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CheckCircle2,
  Users,
  BarChart3,
  User,
  LogOut,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ShieldAlert,
  Clock,
  Video,
  FileText,
  HelpCircle,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TeacherLayoutProps {
  children: React.ReactNode;
}

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children }) => {
  const { user, isTeacher, isAdmin, isSuperAdmin, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Allow TEACHER, ADMIN, or SUPER_ADMIN
  const hasAccess = isTeacher || isAdmin || isSuperAdmin;

  if (!loading && (!user || !hasAccess)) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Teacher Workspace Restricted</h2>
          <p className="text-sm text-slate-600">
            You must be logged in as an approved Teacher to access this faculty portal.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/teacher/status"
              className="inline-block px-6 py-2.5 rounded-xl bg-[#6C63FF] text-white font-bold text-xs shadow-md hover:bg-[#5b52e0]"
            >
              Check Application Status
            </Link>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
            >
              Switch Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'My Assigned Courses', path: '/teacher/courses', icon: BookOpen },
    { name: 'Content & Review Status', path: '/teacher/content-approval', icon: CheckCircle2 },
    { name: 'Application Status', path: '/teacher/status', icon: Clock },
  ];

  const isActive = (path: string) => {
    if (path === '/teacher/dashboard') return location.pathname === '/teacher/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Desktop Dark Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between bg-[#111827] text-slate-300 transition-all duration-300 z-30 sticky top-0 h-screen ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <Link to="/teacher/dashboard" className="flex items-center overflow-hidden py-1">
              <img
                src="/logo.png"
                alt="Lo Samajh Lo Faculty"
                className={`w-auto object-contain transition-all ${collapsed ? 'h-8 mx-auto' : 'h-10'}`}
              />
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Teacher Badge */}
          {!collapsed && (
            <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                Instructor Workspace
              </div>
              <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                {user?.name}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
            {menuItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.name : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#6C63FF] to-[#8f88ff] text-white shadow-md shadow-[#6C63FF]/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title={collapsed ? 'Main Platform' : undefined}
          >
            <ExternalLink className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            {!collapsed && <span>Main Platform</span>}
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors mt-1"
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="text-indigo-600 font-bold">Faculty Portal</span>
              <span>/</span>
              <span className="text-slate-900 font-bold capitalize">
                {location.pathname.replace('/teacher/', '').replace('/teacher', 'Dashboard').replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Student Site</span>
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6C63FF] to-[#3B82F6] text-white font-bold flex items-center justify-center text-xs">
                {user?.name.charAt(0) || 'T'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">{user?.name}</p>
                <span className="text-[10px] text-emerald-600 font-semibold">Teacher Account</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Rendered Here */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#111827] text-slate-300 p-4 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C63FF] to-[#3B82F6] flex items-center justify-center text-white font-black text-sm">
                    LS
                  </div>
                  <span className="font-extrabold text-white">Faculty Portal</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="my-4 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive(item.path)
                        ? 'bg-[#6C63FF] text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 hover:bg-white/5"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Visit Main Site</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLayout;
