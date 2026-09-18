import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  HardDrive,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FolderTree,
  FileCheck,
  LogOut,
  Info,
  Server,
  Cloud,
  Mail,
  Send,
  Lock,
  Database,
  Trash2,
  Clock,
  Activity,
  Zap,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdminStoragePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [activeTab, setActiveTab] = useState<'drive' | 'email' | 'database'>('drive');

  // Google Drive State
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    storageProvider: string;
    authMethod: string;
    connectedEmail?: string | null;
    rootFolderId?: string | null;
    rootFolderConfigured: boolean;
    hasClientCredentials: boolean;
  } | null>(null);

  // Email Diagnostic State
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailTesting, setEmailTesting] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [emailDiagnostic, setEmailDiagnostic] = useState<{
    success: boolean;
    provider: 'SMTP' | 'GMAIL_API' | 'NONE';
    status: 'CONNECTED' | 'DISCONNECTED';
    sender: string | null;
    lastTestSuccessful: boolean;
    latencyMs: number;
    message: string;
    error?: string;
  } | null>(null);

  // SMTP Settings State
  const [smtpForm, setSmtpForm] = useState({
    host: 'smtp.gmail.com',
    port: 465,
    user: '',
    pass: '',
    secure: true,
    from: '',
  });
  const [savingSmtp, setSavingSmtp] = useState(false);

  // Database Cleanup State
  const [cleaningDb, setCleaningDb] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.googleDrive.getStatus();
      if (res.success) {
        setStatus(res);
      }
    } catch (err: any) {
      console.error('Failed to fetch storage status:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailSettings = async () => {
    try {
      setEmailLoading(true);
      const res = await api.admin.getEmailSettings();
      if (res.success && res.settings) {
        setSmtpForm((prev) => ({
          ...prev,
          host: res.settings.host || 'smtp.gmail.com',
          port: res.settings.port || 465,
          user: res.settings.user || '',
          secure: res.settings.secure ?? true,
          from: res.settings.from || '',
        }));
      }
    } catch (err: any) {
      console.error('Failed to load email settings:', err);
    } finally {
      setEmailLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchEmailSettings();

    // Check for callback query parameters
    const queryStatus = searchParams.get('status');
    const queryEmail = searchParams.get('email');
    const queryMsg = searchParams.get('message');

    if (queryStatus === 'success') {
      toastSuccess(`Google Drive connected successfully! (${queryEmail || 'Authorized Account'})`);
    } else if (queryStatus === 'error') {
      toastError(`Google Drive connection error: ${queryMsg || 'Authorization failed'}`);
    }
  }, [searchParams]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const res = await api.googleDrive.getAuthUrl();
      if (res.success && res.authUrl) {
        toastInfo('Redirecting to Google for account authorization...');
        window.location.href = res.authUrl;
      } else {
        toastError(res.message || 'Could not initiate Google OAuth flow.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to start Google Drive authentication.');
    } finally {
      setConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const res = await api.googleDrive.testConnection();
      if (res.success) {
        toastSuccess(res.message || 'Google Drive connected and accessible!');
        fetchStatus();
      } else {
        toastError(res.message || 'Google Drive test failed.');
      }
    } catch (err: any) {
      toastError(err.message || 'Error testing Google Drive connection.');
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Drive? Files currently stored will remain safe in your Google Drive.')) {
      return;
    }

    try {
      setDisconnecting(true);
      const res = await api.googleDrive.disconnect();
      if (res.success) {
        toastSuccess('Google Drive disconnected.');
        fetchStatus();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to disconnect Google Drive.');
    } finally {
      setDisconnecting(false);
    }
  };

  // Run Email Diagnostic Test (Page 12 Requirement)
  const handleTestEmail = async () => {
    try {
      setEmailTesting(true);
      const res = await api.admin.testEmail(testRecipient || undefined);
      setEmailDiagnostic(res);
      if (res.success && res.status === 'CONNECTED') {
        toastSuccess(res.message || `Email provider connected (${res.latencyMs}ms)!`);
      } else {
        toastError(res.error || res.message || 'Email provider test failed.');
      }
    } catch (err: any) {
      toastError(err.message || 'Error testing email connection.');
    } finally {
      setEmailTesting(false);
    }
  };

  // Save SMTP Settings
  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpForm.user) {
      toastError('Email address is required.');
      return;
    }
    try {
      setSavingSmtp(true);
      const res = await api.admin.updateEmailSettings(smtpForm);
      if (res.success) {
        toastSuccess('SMTP Configuration saved successfully!');
        handleTestEmail();
      } else {
        toastError(res.message || 'Failed to save SMTP settings.');
      }
    } catch (err: any) {
      toastError(err.message || 'Error saving SMTP settings.');
    } finally {
      setSavingSmtp(false);
    }
  };

  // Execute Safe Demo Data Cleanup
  const handleExecuteCleanup = async () => {
    if (!window.confirm('Are you sure you want to clean all confirmed demo/seed records? Admin account, categories, and genuine users will be 100% PRESERVED.')) {
      return;
    }

    try {
      setCleaningDb(true);
      const res = await api.admin.cleanupDemoData();
      if (res.success) {
        setCleanupResult(res.result);
        toastSuccess('Demo data cleanup completed successfully! Admin account preserved.');
      } else {
        toastError(res.message || 'Cleanup operation failed.');
      }
    } catch (err: any) {
      toastError(err.message || 'Error executing demo data cleanup.');
    } finally {
      setCleaningDb(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('drive')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'drive'
                ? 'bg-[#6C63FF] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Google Drive Storage</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'email'
                ? 'bg-[#6C63FF] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email & OTP Diagnostics</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'database'
                ? 'bg-[#6C63FF] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Production Database Cleanup</span>
          </button>
        </div>

        {/* TAB 1: GOOGLE DRIVE */}
        {activeTab === 'drive' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">Google Drive Cloud Storage</h1>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    5 TB Quota Integration
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Connect your Google account with 5 TB storage to permanently host all PDFs, videos, and study media.
                </p>
              </div>

              <button
                onClick={fetchStatus}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-colors self-start"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </button>
            </div>

            {/* Main Status Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      status?.connected ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <HardDrive className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">Google Drive Connection</h2>
                        {status?.connected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Connected ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Not Connected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {status?.connected
                          ? 'All educational uploads stream directly to your 5 TB Google Drive storage.'
                          : 'Uploads are currently using local fallback storage.'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {status?.connected ? (
                      <>
                        <button
                          onClick={handleTestConnection}
                          disabled={testing}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                        >
                          <FileCheck className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                          {testing ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button
                          onClick={handleConnect}
                          disabled={connecting}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#6C63FF] hover:bg-[#5b52e0] text-white transition-colors"
                        >
                          <RefreshCw className={`w-4 h-4 ${connecting ? 'animate-spin' : ''}`} />
                          Reconnect
                        </button>
                        <button
                          onClick={handleDisconnect}
                          disabled={disconnecting}
                          className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Disconnect Google Drive"
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#6C63FF] hover:bg-[#5b52e0] text-white shadow-sm hover:shadow transition-all"
                      >
                        <Cloud className="w-4 h-4" />
                        {connecting ? 'Connecting...' : 'Connect Google Drive'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Authorized Account</span>
                    <p className="text-sm font-bold text-slate-800 mt-1 truncate">
                      {status?.connectedEmail || (status?.connected ? 'Authorized User' : 'Not Connected')}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Root Directory</span>
                    <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                      <FolderTree className="w-4 h-4 text-[#6C63FF]" />
                      <span>LoSamajhLo /</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Engine</span>
                    <p className="text-sm font-bold text-slate-800 mt-1">
                      {status?.connected ? 'Google Drive REST API v3' : 'Local Disk'}
                    </p>
                  </div>
                </div>

                {/* Directory Architecture */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                    <FolderTree className="w-4 h-4 text-[#6C63FF]" />
                    Automated Google Drive Folder Structure
                  </h3>
                  <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto space-y-1">
                    <div className="text-emerald-400 font-bold">LoSamajhLo/</div>
                    <div className="pl-4 text-slate-300">├── Courses/ <span className="text-slate-500">(Course Thumbnails & Documents)</span></div>
                    <div className="pl-4 text-slate-300">├── Teacher-Applications/ <span className="text-amber-400">(Private CV, ID Proof, Certs)</span></div>
                    <div className="pl-4 text-slate-300">├── Study-Materials/ <span className="text-slate-500">(NCERT, Current-Affairs, E-Books, Notes)</span></div>
                    <div className="pl-4 text-slate-300">├── Videos/ <span className="text-slate-500">(Lecture Videos, Class Streams)</span></div>
                    <div className="pl-4 text-slate-300">├── Live-Classes/ <span className="text-slate-500">(Recordings & Materials)</span></div>
                    <div className="pl-4 text-slate-300">├── Test-Series/ <span className="text-slate-500">(Test PDFs, Question Papers)</span></div>
                    <div className="pl-4 text-slate-300">└── Uploads/ <span className="text-slate-500">(Images, PDFs, Documents)</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EMAIL & OTP DIAGNOSTICS (Page 12 Requirement) */}
        {activeTab === 'email' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Email & OTP Provider Diagnostics</h1>
              <p className="text-sm text-slate-500 mt-1">
                Verify high-speed SMTP delivery and execute live health tests to ensure instant 6-digit OTP delivery for teachers and students.
              </p>
            </div>

            {/* Diagnostic Results Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    emailDiagnostic?.status === 'CONNECTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-[#0B2A63]'
                  }`}>
                    <Activity className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Email Provider Status</h2>
                    <p className="text-xs text-slate-500">
                      {emailDiagnostic ? emailDiagnostic.message : 'Click "Run Provider Diagnostic" to test live connection.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      placeholder="Optional test email"
                      value={testRecipient}
                      onChange={(e) => setTestRecipient(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs w-48 focus:border-[#6C63FF] outline-none"
                    />
                    <button
                      onClick={handleTestEmail}
                      disabled={emailTesting}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0B2A63] hover:bg-[#071c42] text-white shadow-sm transition-all"
                    >
                      <Zap className={`w-3.5 h-3.5 ${emailTesting ? 'animate-spin' : ''}`} />
                      <span>{emailTesting ? 'Testing...' : 'Run Provider Diagnostic'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Diagnostic Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EMAIL PROVIDER</span>
                  <p className="text-sm font-black text-slate-800 mt-1">
                    {emailDiagnostic?.provider || (smtpForm.user ? 'SMTP (CONFIGURED)' : 'NOT TESTED')}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STATUS</span>
                  <p className="text-sm font-black mt-1">
                    {emailDiagnostic?.status === 'CONNECTED' ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> CONNECTED
                      </span>
                    ) : emailDiagnostic?.status === 'DISCONNECTED' ? (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> DISCONNECTED
                      </span>
                    ) : (
                      <span className="text-slate-500">STANDBY</span>
                    )}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SENDER</span>
                  <p className="text-sm font-bold text-slate-800 mt-1 truncate">
                    {emailDiagnostic?.sender || smtpForm.user || 'None'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LATENCY</span>
                  <p className="text-sm font-black text-[#0B2A63] mt-1">
                    {emailDiagnostic ? `${emailDiagnostic.latencyMs} ms` : '—'}
                  </p>
                </div>
              </div>

              {emailDiagnostic?.error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Provider Error Notice:</span>
                  </p>
                  <p className="font-mono text-[11px]">{emailDiagnostic.error}</p>
                </div>
              )}
            </div>

            {/* SMTP Settings Form */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6C63FF] flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">SMTP Server Configuration</h3>
                  <p className="text-xs text-slate-500">
                    Saved safely in the database (`SiteSetting`). Used by Nodemailer to dispatch verification emails in &lt;1 second.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveSmtp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">SMTP Host *</label>
                  <input
                    type="text"
                    required
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#6C63FF] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">SMTP Port *</label>
                  <input
                    type="number"
                    required
                    value={smtpForm.port}
                    onChange={(e) => setSmtpForm({ ...smtpForm, port: Number(e.target.value) })}
                    placeholder="465 or 587"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#6C63FF] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Sender Email / Username *</label>
                  <input
                    type="email"
                    required
                    value={smtpForm.user}
                    onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                    placeholder="your-email@gmail.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#6C63FF] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Gmail App Password / SMTP Password *</label>
                  <input
                    type="password"
                    value={smtpForm.pass}
                    onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                    placeholder="16-character App Password"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#6C63FF] outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Generate from myaccount.google.com &rarr; Security &rarr; 2-Step &rarr; App passwords</span>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">From Header Display Name</label>
                  <input
                    type="text"
                    value={smtpForm.from}
                    onChange={(e) => setSmtpForm({ ...smtpForm, from: e.target.value })}
                    placeholder='"Lo Samajh Lo" <support@losamajhlo.in>'
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#6C63FF] outline-none"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSmtp}
                    className="px-6 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#584ed9] text-white font-bold text-xs shadow-sm transition-all"
                  >
                    {savingSmtp ? 'Saving...' : 'Save & Test Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: PRODUCTION DATABASE CLEANUP (Page 20 Requirement) */}
        {activeTab === 'database' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Production Database Cleanup & Integrity</h1>
              <p className="text-sm text-slate-500 mt-1">
                Safely purge confirmed seed records, fake orders, and demo test series without touching your administrator account or live courses.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Deterministic Cleanup Policy (Phase 20 & 21)</h3>
                  <p className="text-xs text-slate-500">
                    Strict deterministic identification: Only verified demo items are removed. Zero blind deletes.
                  </p>
                </div>
              </div>

              {/* Items targeted */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5" /> Items Targeted for Safe Removal:
                  </span>
                  <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                    <li>Fake order <code>LSL-2026-00109</code> (₹699) & derived order item</li>
                    <li>2 fake enrollments for Ravi Kumar</li>
                    <li>6 seed test series (fabricated 49k+ enrollments)</li>
                    <li>4 seed mock tests & associated questions</li>
                    <li>4 demo user accounts (<code>student@losamajhlo.in</code>, <code>sneha@...</code>, etc.)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Items Guaranteed Preserved:
                  </span>
                  <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                    <li><strong>Atul Agrahari (Admin)</strong>: <code>admin@losamajhlo.in</code></li>
                    <li>All official exam categories (UP Police, SSC, etc.)</li>
                    <li>All official NCERT textbook catalogues & AI Newsroom items</li>
                    <li>All legitimate teacher applications & registered students</li>
                    <li>All Google Drive and SMTP configurations</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold">Ready to clean demo records?</p>
                  <p className="text-[11px] text-amber-700">Once cleaned, the Admin Dashboard will cleanly display true ₹0 revenue and 0 orders until genuine student purchases occur.</p>
                </div>
                <button
                  onClick={handleExecuteCleanup}
                  disabled={cleaningDb}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow transition-all flex items-center gap-2 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{cleaningDb ? 'Cleaning...' : 'Execute Safe Cleanup'}</span>
                </button>
              </div>

              {cleanupResult && (
                <div className="p-5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2 overflow-x-auto">
                  <div className="text-emerald-400 font-bold">✓ CLEANUP EXECUTION LOG</div>
                  <div>Orders Removed: {cleanupResult.ordersRemoved}</div>
                  <div>Enrollments Removed: {cleanupResult.enrollmentsRemoved}</div>
                  <div>Test Series Removed: {cleanupResult.testSeriesRemoved}</div>
                  <div>Tests Removed: {cleanupResult.testsRemoved}</div>
                  <div>Demo Users Removed: {cleanupResult.usersRemoved}</div>
                  <div className="text-emerald-300">Preserved Admin: {cleanupResult.preservedAdmin}</div>
                  <div className="text-slate-400 text-[11px]">Timestamp: {cleanupResult.timestamp}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminStoragePage;
