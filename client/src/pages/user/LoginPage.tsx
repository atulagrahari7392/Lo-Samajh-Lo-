import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  Phone,
  GraduationCap,
  BookOpen,
  AlertCircle,
  CheckCircle,
  KeyRound,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';

export const LoginPage: React.FC = () => {
  const { isHindi, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [registerRole, setRegisterRole] = useState<'student' | 'teacher'>('student');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Student Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Teacher Quick Onboarding fields
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherConfirmPassword, setTeacherConfirmPassword] = useState('');

  // Status & errors
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [teacherStatusData, setTeacherStatusData] = useState<any>(null);

  // Forgot Password Modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'success'>('email');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setTeacherStatusData(null);
    try {
      setLoading(true);
      await login({ email: loginEmail, password: loginPassword });
      navigate('/');
    } catch (err: any) {
      if (
        err.data?.code === 'APPLICATION_PENDING_REVIEW' ||
        err.data?.code === 'APPLICATION_CHANGES_REQUESTED' ||
        err.data?.code === 'APPLICATION_REJECTED' ||
        err.data?.code === 'ACCOUNT_SUSPENDED'
      ) {
        setTeacherStatusData({
          code: err.data.code,
          message: err.data.message || err.message,
          status: err.data.status,
          remarks: err.data.remarks,
          email: loginEmail,
        });
      } else {
        setErrorMsg(err.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStudentRegisterSubmit = async (e: React.FormEvent) => {
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

  const handleTeacherContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!teacherEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (teacherPassword !== teacherConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (teacherPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    // Direct transition to Teacher Application Workflow
    navigate(`/teacher/apply?email=${encodeURIComponent(teacherEmail)}&pass=${encodeURIComponent(teacherPassword)}`);
  };

  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    try {
      setForgotLoading(true);
      const res = await api.auth.sendForgotPasswordOtp(forgotEmail);
      if (res.success) {
        setForgotMessage(res.message);
        setForgotStep('otp');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError('New passwords do not match.');
      return;
    }
    try {
      setForgotLoading(true);
      const res = await api.auth.verifyResetPassword({
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotNewPass,
        confirmPassword: forgotConfirmPass,
      });
      if (res.success) {
        setForgotStep('success');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-7 space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block group">
            <img
              src="/logo.png"
              alt="Lo Samajh Lo"
              className="h-14 sm:h-16 w-auto object-contain mx-auto group-hover:scale-105 transition-transform duration-200"
            />
          </Link>
          <p className="text-xs text-slate-500 font-medium">
            India's Trusted Exam Preparation & Faculty Learning Platform
          </p>
        </div>

        {/* Compact Mode Tabs */}
        <div className="flex rounded-2xl bg-slate-100 p-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
              setTeacherStatusData(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'login'
                ? 'bg-white text-[#0B2A63] shadow-sm'
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
              setTeacherStatusData(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              activeTab === 'register'
                ? 'bg-white text-[#0B2A63] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('nav.register', isHindi ? 'खाता बनाएं' : 'Create Account')}
          </button>
        </div>

        {/* Special Teacher Status Notice if trying to login */}
        {teacherStatusData && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5 text-xs animate-scale-in">
            <div className="flex items-start gap-2.5 text-amber-900">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-amber-950">
                  {teacherStatusData.code === 'APPLICATION_PENDING_REVIEW' && 'Application Under Review'}
                  {teacherStatusData.code === 'APPLICATION_CHANGES_REQUESTED' && 'Changes Requested by Admin'}
                  {teacherStatusData.code === 'APPLICATION_REJECTED' && 'Application Not Approved'}
                  {teacherStatusData.code === 'ACCOUNT_SUSPENDED' && 'Account Suspended'}
                </p>
                <p className="text-amber-800 mt-1 leading-relaxed">{teacherStatusData.message}</p>
                {teacherStatusData.remarks && (
                  <p className="mt-1.5 p-2 rounded-lg bg-white/70 border border-amber-200/60 text-amber-900 font-medium">
                    Feedback: {teacherStatusData.remarks}
                  </p>
                )}
              </div>
            </div>
            <div className="pt-1">
              <Link
                to={`/teacher/status?email=${encodeURIComponent(teacherStatusData.email)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-sm"
              >
                <span>View Application Timeline & Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="py-2.5 px-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 text-center animate-shake">
            {errorMsg}
          </div>
        )}

        {/* ================= LOGIN FORM ================= */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email Address / User ID</label>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:border-[#0B2A63] focus-within:ring-2 focus-within:ring-[#0B2A63]/10 bg-slate-50/50">
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="student@example.com / teacher@gmail.com"
                  className="w-full bg-transparent text-xs text-slate-800 outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginEmail);
                    setForgotModalOpen(true);
                    setForgotStep('email');
                    setForgotError('');
                  }}
                  className="text-[11px] text-[#0B2A63] font-semibold hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:border-[#0B2A63] focus-within:ring-2 focus-within:ring-[#0B2A63]/10 bg-slate-50/50">
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
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0B2A63] to-[#1D4ED8] hover:from-[#081d45] hover:to-[#173ea6] text-white font-extrabold text-xs shadow-md shadow-[#0B2A63]/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Sign In to Lo Samajh Lo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ================= REGISTER FORM ================= */}
        {activeTab === 'register' && (
          <div className="space-y-4">
            {/* Account Type Selector: Student vs Teacher */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Select Account Type</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRegisterRole('student')}
                  className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 text-xs font-bold ${
                    registerRole === 'student'
                      ? 'border-[#0B2A63] bg-[#0B2A63]/05 text-[#0B2A63]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Student (विद्यार्थी)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterRole('teacher')}
                  className={`p-3 rounded-2xl border-2 transition-all flex items-center justify-center gap-2 text-xs font-bold ${
                    registerRole === 'teacher'
                      ? 'border-[#0B2A63] bg-[#0B2A63]/05 text-[#0B2A63]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Teacher (शिक्षक)</span>
                </button>
              </div>
            </div>

            {/* Student Registration Form */}
            {registerRole === 'student' && (
              <form onSubmit={handleStudentRegisterSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Full Name *</label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-[#0B2A63] bg-slate-50/50">
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
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-[#0B2A63] bg-slate-50/50">
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
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-[#0B2A63] bg-slate-50/50">
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
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-[#0B2A63] bg-slate-50/50">
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
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-[#0B2A63] bg-slate-50/50">
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
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0B2A63] to-[#1D4ED8] hover:from-[#081d45] hover:to-[#173ea6] text-white font-extrabold text-xs shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span>{loading ? 'Creating Student Account...' : 'Create Student Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* Teacher Fast Registration Step -> Leads to 7-step Application Wizard */}
            {registerRole === 'teacher' && (
              <form onSubmit={handleTeacherContinue} className="space-y-3">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                  <strong>Faculty Enrollment:</strong> Teacher चुनते ही Gmail OTP सत्यापन एवं 7-Step Teacher Application workflow शुरू होगा।
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Official / Gmail Address *</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-[#0B2A63] bg-slate-50/50">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="email"
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      placeholder="teacher@gmail.com"
                      className="w-full bg-transparent text-xs text-slate-800 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Create Password *</label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-[#0B2A63] bg-slate-50/50">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="password"
                        value={teacherPassword}
                        onChange={(e) => setTeacherPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent text-xs text-slate-800 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Confirm Password *</label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 focus-within:border-[#0B2A63] bg-slate-50/50">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="password"
                        value={teacherConfirmPassword}
                        onChange={(e) => setTeacherConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent text-xs text-slate-800 outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>Continue to Verification & Application</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        )}

        <div className="text-center pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            {activeTab === 'login' ? "New to Lo Samajh Lo?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setActiveTab(activeTab === 'login' ? 'register' : 'login');
                setErrorMsg('');
                setTeacherStatusData(null);
              }}
              className="font-bold text-[#0B2A63] hover:underline"
            >
              {activeTab === 'login' ? 'Create Account' : 'Sign In'}
            </button>
          </span>
        </div>
      </div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-[#0B2A63]/10 text-[#0B2A63] mx-auto flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Reset Password</h3>
              <p className="text-xs text-slate-500">
                Securely reset your password using Gmail 6-digit OTP verification
              </p>
            </div>

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 text-center">
                {forgotError}
              </div>
            )}

            {forgotStep === 'email' && (
              <form onSubmit={handleSendForgotOtp} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Enter Registered Email</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 focus-within:border-[#0B2A63] bg-slate-50/50">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="teacher@gmail.com / student@example.com"
                      className="w-full bg-transparent text-xs text-slate-800 outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 rounded-xl bg-[#0B2A63] hover:bg-[#071c42] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending OTP...' : 'Send Verification OTP'}
                </button>
              </form>
            )}

            {forgotStep === 'otp' && (
              <form onSubmit={handleVerifyForgotReset} className="space-y-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium text-center">
                  {forgotMessage || 'OTP sent! Please check your email inbox.'}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-lg font-mono font-bold py-2 rounded-xl border border-slate-300 focus:border-[#0B2A63] outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">New Password</label>
                    <input
                      type="password"
                      value={forgotNewPass}
                      onChange={(e) => setForgotNewPass(e.target.value)}
                      placeholder="••••••"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#0B2A63] outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Confirm Password</label>
                    <input
                      type="password"
                      value={forgotConfirmPass}
                      onChange={(e) => setForgotConfirmPass(e.target.value)}
                      placeholder="••••••"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#0B2A63] outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {forgotLoading ? 'Updating Password...' : 'Verify OTP & Reset Password'}
                </button>
              </form>
            )}

            {forgotStep === 'success' && (
              <div className="text-center space-y-3 py-2">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto animate-bounce-slow" />
                <h4 className="text-base font-bold text-slate-900">Password Reset Complete!</h4>
                <p className="text-xs text-slate-600">
                  Your password has been securely updated. You can now log in using your new credentials.
                </p>
                <button
                  onClick={() => {
                    setForgotModalOpen(false);
                    setActiveTab('login');
                  }}
                  className="px-6 py-2 rounded-xl bg-[#0B2A63] text-white font-bold text-xs"
                >
                  Return to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
