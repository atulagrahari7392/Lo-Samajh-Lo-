import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Eye, EyeOff, User, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const LoginPage: React.FC = () => {
  const { isHindi, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      setLoading(true);
      await login({ email: loginEmail, password: loginPassword });
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      await register({ name: regName, email: regEmail, phone: regPhone, password: regPassword });
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setLoginEmail(demoEmail);
    setLoginPassword(demoPass);
    setErrorMsg('');
    try {
      setLoading(true);
      await login({ email: demoEmail, password: demoPass });
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[78vh] flex items-center justify-center py-8 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-5 sm:p-6 space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block group">
            <img
              src="/logo.png"
              alt="Lo Samajh Lo"
              className="h-14 sm:h-16 w-auto object-contain mx-auto group-hover:scale-105 transition-transform duration-200"
            />
          </Link>
          <p className="text-[11px] text-slate-500 font-medium">
            India's Trusted Exam Preparation Platform
          </p>
        </div>

        {/* Compact Mode Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-white text-[#6C63FF] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('nav.login', isHindi ? 'लॉग इन' : 'Sign In')}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-white text-[#6C63FF] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('nav.register', isHindi ? 'नया खाता' : 'Register')}
          </button>
        </div>

        {/* Quick Demo Access Bar for testing */}
        {activeTab === 'login' && (
          <div className="bg-purple-50/70 py-2 px-3 rounded-xl border border-purple-100 flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-600">Quick Demo:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@losamajhlo.in', 'admin123')}
                className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-sm"
              >
                <ShieldCheck className="w-3 h-3 text-[#FF6584]" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('student@losamajhlo.in', 'student123')}
                className="px-2.5 py-1 rounded-lg bg-[#6C63FF] text-white font-bold hover:bg-[#584fd4] transition-colors flex items-center gap-1 shadow-sm"
              >
                <UserCheck className="w-3 h-3" />
                <span>Student</span>
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="py-2 px-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 text-center">
            {errorMsg}
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Email Address / User ID</label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-[#6C63FF] focus-within:ring-2 focus-within:ring-[#6C63FF]/20 bg-slate-50/50">
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="student@losamajhlo.in"
                  className="w-full bg-transparent text-xs text-slate-800 outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-700">Password</label>
                <span className="text-[10px] text-[#6C63FF] hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-[#6C63FF] focus-within:ring-2 focus-within:ring-[#6C63FF]/20 bg-slate-50/50">
                <Lock className="w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-xs text-slate-800 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#584fd4] text-white font-extrabold text-xs shadow-md shadow-[#6C63FF]/30 transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{loading ? (isHindi ? 'लॉगिन हो रहा है...' : 'Signing in...') : (isHindi ? 'लॉगिन करें' : 'Sign In')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Full Name *</label>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 focus-within:border-[#6C63FF] bg-slate-50/50">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ravi Kumar"
                    className="w-full bg-transparent text-xs text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Mobile (Optional)</label>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 focus-within:border-[#6C63FF] bg-slate-50/50">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-transparent text-xs text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Email Address *</label>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 focus-within:border-[#6C63FF] bg-slate-50/50">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full bg-transparent text-xs text-slate-800 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Password *</label>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 focus-within:border-[#6C63FF] bg-slate-50/50">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-transparent text-xs text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Confirm *</label>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 focus-within:border-[#6C63FF] bg-slate-50/50">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-transparent text-xs text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#584fd4] text-white font-extrabold text-xs shadow-md shadow-[#6C63FF]/30 transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5 disabled:opacity-50 mt-1"
            >
              <span>{loading ? (isHindi ? 'खाता बनाया जा रहा है...' : 'Creating account...') : (isHindi ? 'खाता बनाएं' : 'Create Account')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        <div className="text-center pt-1 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            {activeTab === 'login' ? "New student on Lo Samajh Lo?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setActiveTab(activeTab === 'login' ? 'register' : 'login');
                setErrorMsg('');
              }}
              className="font-bold text-[#6C63FF] hover:underline"
            >
              {activeTab === 'login' ? 'Create Account' : 'Sign In'}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
