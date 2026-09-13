import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  Server,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already logged in as admin, redirect to /admin
  useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both administrative ID/email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.auth.login({ email: email.trim(), password });

      if (res.success && res.token && res.user) {
        // Verify admin role
        if (res.user.role !== 'ADMIN') {
          // Clear token if user is not an admin
          localStorage.removeItem('lsl_token');
          setErrorMsg('Access Denied: This account does not possess Administrator privileges. Students must log in via the regular portal.');
          toastError('Access Denied: Non-admin account.');
          return;
        }

        // Save token and refresh
        localStorage.setItem('lsl_token', res.token);
        await refreshUser();
        success(`Authenticated successfully! Welcome, Admin ${res.user.name}`);
        navigate('/admin', { replace: true });
      } else {
        setErrorMsg('Invalid administrative credentials. Please verify and retry.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('admin@losamajhlo.in');
    setPassword('admin123');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#0d0f17] flex flex-col justify-between relative overflow-hidden text-slate-100 selection:bg-[#6C63FF] selection:text-white">
      {/* Background ambient lighting effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#6C63FF]/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#FF6584]/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />

      {/* Top Navbar Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-white/5 relative z-10 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="Lo Samajh Lo"
            className="h-10 w-auto brightness-110 group-hover:scale-105 transition-transform"
            onError={(e: any) => {
              e.target.style.display = 'none';
            }}
          />
          <div>
            <div className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              <span>Lo Samajh Lo</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6C63FF]/20 text-[#9b94ff] border border-[#6C63FF]/40 font-bold uppercase tracking-widest">
                Admin
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Executive Portal</p>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Main Website</span>
        </Link>
      </header>

      {/* Central Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="max-w-md w-full">
          {/* Card Container */}
          <div className="bg-[#151824]/90 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-7 sm:p-9 space-y-6 relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6C63FF] via-[#a855f7] to-[#FF6584]" />

            {/* Header / Security Badge */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C63FF]/20 to-[#6C63FF]/5 border border-[#6C63FF]/30 text-[#9b94ff] shadow-lg shadow-[#6C63FF]/10 mx-auto">
                <ShieldCheck className="w-9 h-9 text-[#8179ff]" />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                  Admin Sign In
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Secure Administrative Control Center authentication
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>256-Bit SSL Encrypted & Protected</span>
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{errorMsg}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email / Username */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 tracking-wide">
                  Admin Email / User ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@losamajhlo.in"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/30 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300 tracking-wide">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400">System Admin Auth</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:border-[#6C63FF] focus:ring-2 focus:ring-[#6C63FF]/30 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8075ff] hover:from-[#5c53f0] hover:to-[#7266fa] text-white font-extrabold text-sm shadow-xl shadow-[#6C63FF]/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Admin Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Autofill */}
            <div className="pt-2 border-t border-white/10 text-center">
              <button
                type="button"
                onClick={handleDemoFill}
                className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#6C63FF]" />
                <span>Fill Default Admin Credentials (1-Click)</span>
              </button>
              <p className="text-[11px] text-slate-500 mt-2 font-mono">
                Default: admin@losamajhlo.in / admin123
              </p>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="text-center mt-6 space-y-1 text-slate-500 text-xs">
            <p className="flex items-center justify-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>Dedicated Portal: <strong className="text-slate-400 font-mono">/Admin.login</strong></span>
            </p>
            <p className="text-[11px]">
              Lo Samajh Lo Education System • Unauthorized access attempts are monitored and logged.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-white/5 relative z-10">
        &copy; {new Date().getFullYear()} Lo Samajh Lo. All administrative rights reserved.
      </footer>
    </div>
  );
};

export default AdminLoginPage;
