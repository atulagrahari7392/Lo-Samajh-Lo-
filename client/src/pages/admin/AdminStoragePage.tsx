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
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdminStoragePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

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

  useEffect(() => {
    fetchStatus();

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

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
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
              Connect your personal Google account with 5 TB storage to permanently host all PDFs, videos, and study media.
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
                      className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Disconnect Google Drive"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#6C63FF] hover:bg-[#5b52e0] text-white shadow-md shadow-[#6C63FF]/20 transition-all"
                  >
                    <Cloud className="w-4 h-4" />
                    {connecting ? 'Connecting...' : 'Connect Google Drive'}
                  </button>
                )}
              </div>
            </div>

            {/* Connection Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Connected Account</span>
                <p className="text-sm font-bold text-slate-800 mt-1 truncate">
                  {status?.connectedEmail || 'Not Linked'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Storage Provider</span>
                <p className="text-sm font-bold text-slate-800 mt-1 truncate">
                  {status?.connected ? 'Google Drive (5 TB Plan)' : 'Local Ephemeral Disk'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Root Drive Folder</span>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  LoSamajhLo /
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Authentication</span>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {status?.authMethod === 'OAUTH2' ? 'OAuth 2.0 (User Quota)' : status?.authMethod || 'None'}
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
                <div className="pl-4 text-slate-300">├── Study-Materials/ <span className="text-slate-500">(NCERT, Current-Affairs, E-Books, Notes)</span></div>
                <div className="pl-4 text-slate-300">├── Videos/ <span className="text-slate-500">(Lecture Videos, Class Streams)</span></div>
                <div className="pl-4 text-slate-300">├── Live-Classes/ <span className="text-slate-500">(Recordings & Materials)</span></div>
                <div className="pl-4 text-slate-300">├── Test-Series/ <span className="text-slate-500">(Test PDFs, Question Papers)</span></div>
                <div className="pl-4 text-slate-300">├── Typing/ <span className="text-slate-500">(Passages & Practice Sheets)</span></div>
                <div className="pl-4 text-slate-300">└── Uploads/ <span className="text-slate-500">(Images, PDFs, Documents)</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Help & Security Notice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#6C63FF]" />
              How 5 TB OAuth Works
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When you click <strong>Connect Google Drive</strong>, Google asks you to sign in with your Google account. Because you sign in with your account that has the 5 TB plan, all uploaded files are created in your Drive, using your 5 TB storage quota.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Neither Service Accounts nor Render servers store files permanently. Files stay permanently in your Google Drive.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Security & Privacy Guarantee
            </h3>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              <li>Client secrets and refresh tokens are strictly server-side and never exposed to the browser.</li>
              <li>Tokens are encrypted and stored safely in PostgreSQL.</li>
              <li>Files deleted from the admin panel are soft-deleted or moved to Drive Trash to prevent permanent loss.</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStoragePage;
