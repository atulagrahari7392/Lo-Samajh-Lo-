import React, { useState, useEffect } from 'react';
import {
  Bell,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  Clock,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Settings,
  Activity,
  Database,
  Cpu,
  Globe,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../../services/api';
import { Notification, EducationArticle } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/common/ConfirmModal';

import { NewsroomDashboardTab } from '../../components/admin/newsroom/NewsroomDashboardTab';
import { NewsroomDiscoverTab } from '../../components/admin/newsroom/NewsroomDiscoverTab';
import { NewsroomReviewModal } from '../../components/admin/newsroom/NewsroomReviewModal';
import { NewsroomBroadcastModal } from '../../components/admin/newsroom/NewsroomBroadcastModal';

type NewsroomTab =
  | 'DASHBOARD'
  | 'DISCOVER'
  | 'DRAFTS'
  | 'PUBLISHED'
  | 'SCHEDULED'
  | 'FAILED'
  | 'SOURCES'
  | 'SETTINGS'
  | 'LOGS'
  | 'BROADCAST';

export const AdminNotificationsPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<NewsroomTab>('DASHBOARD');
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);

  // Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [articles, setArticles] = useState<EducationArticle[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Research State
  const [researchQuery, setResearchQuery] = useState('');
  const [researchOrg, setResearchOrg] = useState('UPSSSC');
  const [researchCategory, setResearchCategory] = useState('COMPETITIVE_EXAMS');
  const [researchCustomUrl, setResearchCustomUrl] = useState('');
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [discoveredResults, setDiscoveredResults] = useState<any[]>([]);

  // Modals
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewArticle, setReviewArticle] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    category: 'EXAM',
    priority: 'NORMAL',
    linkUrl: '',
    expiresAt: '',
    status: 'PUBLISHED',
  });
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);

  // Settings & Logs
  const [settings, setSettings] = useState<any>({});
  const [logs, setLogs] = useState<{ usageLogs: any[]; auditLogs: any[] }>({ usageLogs: [], auditLogs: [] });
  const [sourcesList, setSourcesList] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'ARTICLE' | 'NOTIFICATION'; id: string } | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.aiNewsroom.getDashboard();
      if (res.success) setDashboardData(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async (statusFilter?: string) => {
    try {
      setLoading(true);
      const res = await api.aiNewsroom.getArticles({ status: statusFilter || 'ALL', limit: 30 });
      if (res.success) setArticles(res.articles || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.notifications.adminGetAll();
      if (res.success) setNotifications(res.notifications || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to load broadcasts');
    }
  };

  const fetchSettingsAndSources = async () => {
    try {
      const [setRes, srcRes, logsRes] = await Promise.all([
        api.aiNewsroom.getSettings(),
        api.aiNewsroom.getSources(),
        api.aiNewsroom.getLogs(),
      ]);
      if (setRes.success) setSettings(setRes.settings || {});
      if (srcRes.success) setSourcesList(srcRes.sources || []);
      if (logsRes.success) setLogs(logsRes);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchNotifications();
    fetchSettingsAndSources();
  }, []);

  useEffect(() => {
    if (activeTab === 'DRAFTS') fetchArticles('DRAFT');
    else if (activeTab === 'PUBLISHED') fetchArticles('PUBLISHED');
    else if (activeTab === 'SCHEDULED') fetchArticles('SCHEDULED');
    else if (activeTab === 'FAILED') fetchArticles('FAILED');
    else if (activeTab === 'DASHBOARD') fetchDashboard();
  }, [activeTab]);

  const handleRunResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setResearching(true);
      const res = await api.aiNewsroom.research({
        organization: researchOrg,
        category: researchCategory,
        query: researchQuery,
        customUrl: researchCustomUrl || undefined,
        autonomous: autonomousMode,
      });
      if (res.success) {
        setDiscoveredResults(res.results || []);
        success(`Found ${res.count} verified update(s)!`);
      }
    } catch (err: any) {
      toastError(err.message || 'Research failed');
    } finally {
      setResearching(false);
    }
  };

  const handleGenerateDraft = async (item: any) => {
    try {
      setLoading(true);
      const res = await api.aiNewsroom.generate({ facts: item.facts });
      if (res.success) {
        success('Draft article generated! Opening review panel...');
        setReviewArticle(res.article);
        setReviewModalOpen(true);
        fetchDashboard();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to generate draft');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      setLoading(true);
      const res = await api.aiNewsroom.publish(id);
      if (res.success) {
        success('Article published live to student updates!');
        setReviewModalOpen(false);
        fetchDashboard();
        if (activeTab === 'DRAFTS') fetchArticles('DRAFT');
        if (activeTab === 'PUBLISHED') fetchArticles('PUBLISHED');
      }
    } catch (err: any) {
      toastError(err.message || 'Publishing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (id: string, targetSection = 'ALL') => {
    try {
      setLoading(true);
      const res = await api.aiNewsroom.regenerate(id, targetSection);
      if (res.success) {
        success('Regenerated successfully while preserving locked facts!');
        setReviewArticle(res.article);
      }
    } catch (err: any) {
      toastError(err.message || 'Regeneration failed');
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = async (artId: string) => {
    try {
      setLoading(true);
      const res = await api.aiNewsroom.getArticle(artId);
      if (res.success) {
        setReviewArticle(res.article);
        setReviewModalOpen(true);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticleId) return;

    try {
      setLoading(true);
      const res = await api.aiNewsroom.updateArticle(editingArticleId, editForm);
      if (res.success) {
        success('Article revised and version snapshot recorded!');
        setEditModalOpen(false);
        if (reviewModalOpen) setReviewArticle(res.article);
        fetchArticles();
      }
    } catch (err: any) {
      toastError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      toastError('Title and message are required.');
      return;
    }

    try {
      setSubmittingBroadcast(true);
      const payload = {
        ...broadcastForm,
        expiresAt: broadcastForm.expiresAt ? new Date(broadcastForm.expiresAt).toISOString() : null,
      };
      const res = await api.notifications.create(payload);
      if (res.success) {
        success('Broadcast notice transmitted to all students!');
        setIsBroadcastModalOpen(false);
        fetchNotifications();
      }
    } catch (err: any) {
      toastError(err.message || 'Broadcast failed');
    } finally {
      setSubmittingBroadcast(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'ARTICLE') {
        await api.aiNewsroom.deleteArticle(deleteTarget.id);
        success('Article archived.');
        fetchArticles();
      } else {
        await api.notifications.delete(deleteTarget.id);
        success('Notification deleted.');
        fetchNotifications();
      }
      setDeleteTarget(null);
    } catch (err: any) {
      toastError(err.message || 'Delete failed');
    }
  };

  const navTabs: Array<{ id: NewsroomTab; label: string; icon: any }> = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: Activity },
    { id: 'DISCOVER', label: 'Discover & Research', icon: Sparkles },
    { id: 'DRAFTS', label: 'Drafts Queue', icon: FileText },
    { id: 'PUBLISHED', label: 'Published Updates', icon: CheckCircle2 },
    { id: 'SCHEDULED', label: 'Scheduled', icon: Clock },
    { id: 'FAILED', label: 'Failed Jobs', icon: AlertTriangle },
    { id: 'SOURCES', label: 'Official Sources', icon: Globe },
    { id: 'BROADCAST', label: 'Instant Broadcast', icon: Bell },
    { id: 'SETTINGS', label: 'AI Settings', icon: Settings },
    { id: 'LOGS', label: 'Audit Logs', icon: Database },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Main AI Newsroom Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-purple-100 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-[#6C63FF] text-xs font-black border border-purple-200 mb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>AI Education Newsroom 2.0 • Autonomous Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Notifications & Education Newsroom
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Verify, structure, schedule and broadcast government exam notices, syllabus, and dynamic deadlines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('DISCOVER')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8077ff] text-white font-bold text-xs shadow-md shadow-[#6C63FF]/30 hover:opacity-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Research Now / खोजें</span>
            </button>
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-xs"
            >
              <Bell className="w-4 h-4 text-[#FF6584]" />
              <span>Instant Notice</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-200">
          {navTabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold whitespace-nowrap transition-all border-b-2 ${
                  active
                    ? 'border-[#6C63FF] text-[#6C63FF] bg-purple-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'DASHBOARD' && (
          <NewsroomDashboardTab
            dashboardData={dashboardData}
            onSelectTab={setActiveTab}
            onOpenReview={openReviewModal}
            onPublish={handlePublish}
          />
        )}

        {/* TAB 2: DISCOVER */}
        {activeTab === 'DISCOVER' && (
          <NewsroomDiscoverTab
            researchOrg={researchOrg}
            setResearchOrg={setResearchOrg}
            researchCategory={researchCategory}
            setResearchCategory={setResearchCategory}
            researchQuery={researchQuery}
            setResearchQuery={setResearchQuery}
            researchCustomUrl={researchCustomUrl}
            setResearchCustomUrl={setResearchCustomUrl}
            researching={researching}
            discoveredResults={discoveredResults}
            onRunResearch={handleRunResearch}
            onGenerateDraft={handleGenerateDraft}
            loading={loading}
            autonomousMode={autonomousMode}
            setAutonomousMode={setAutonomousMode}
          />
        )}

        {/* TABS: DRAFTS, PUBLISHED, SCHEDULED, FAILED */}
        {(activeTab === 'DRAFTS' || activeTab === 'PUBLISHED' || activeTab === 'SCHEDULED' || activeTab === 'FAILED') && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-black text-sm text-slate-900">{activeTab} Queue ({articles.length})</h2>
              <button
                onClick={() => fetchArticles(activeTab === 'DRAFTS' ? 'DRAFT' : activeTab)}
                className="text-xs font-bold text-slate-500 hover:text-[#6C63FF] flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {articles.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {articles.map((art) => (
                  <div key={art.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-100 text-[#6C63FF]">
                          {art.organizationName}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {art.category}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          AI: {art.confidenceScore}
                        </span>
                        {art.status === 'PUBLISHED' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            LIVE
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-base text-slate-900 leading-snug">{art.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{art.excerpt}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => openReviewModal(art.id)}
                        className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-[#6C63FF] text-[#6C63FF] hover:text-white font-bold text-xs transition-all border border-purple-200"
                      >
                        Review & Verify
                      </button>

                      {art.status !== 'PUBLISHED' && (
                        <button
                          onClick={() => handlePublish(art.id)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                        >
                          Approve & Publish
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteTarget({ type: 'ARTICLE', id: art.id })}
                        className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors"
                        title="Archive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                <p>No articles found in {activeTab} status.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB: INSTANT BROADCAST */}
        {activeTab === 'BROADCAST' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-base text-slate-900">Instant Broadcast Circulars</h2>
                <p className="text-xs text-slate-500">Quick push-style student notifications (Classic tool preserved)</p>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#6C63FF] text-white font-bold text-xs shadow-md shadow-[#6C63FF]/30 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> New Instant Broadcast
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
              {notifications.map((n) => (
                <div key={n.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-[#6C63FF]">
                        {n.category}
                      </span>
                      <span className="text-[11px] text-slate-400">{new Date(n.publishedAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{n.message}</p>
                  </div>
                  <button
                    onClick={() => setDeleteTarget({ type: 'NOTIFICATION', id: n.id })}
                    className="text-slate-400 hover:text-rose-600 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SOURCES */}
        {activeTab === 'SOURCES' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="font-black text-base text-slate-900">Monitored Official Boards (Level 1 Authority)</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {sourcesList.map((src, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-[#6C63FF]">{src.org}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      OFFICIAL
                    </span>
                  </div>
                  <p className="font-bold text-slate-800">{src.name}</p>
                  <a
                    href={src.officialPortal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#6C63FF] font-semibold hover:underline"
                  >
                    <span>{src.domain}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === 'SETTINGS' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 max-w-2xl">
            <h2 className="font-black text-base text-slate-900">AI Education Newsroom Configuration</h2>
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">AI Engine Provider</label>
                <input
                  type="text"
                  disabled
                  value="Rule-Based Education Parser + OpenAI Fallback"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-semibold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Configured server-side. Zero secret leakage to frontend.
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800">Autonomous Research Engine</h4>
                  <p className="text-slate-500">Automatically discover circulars every 60 minutes in the background</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#6C63FF]" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800">Require Manual Admin Approval for Publishing</h4>
                  <p className="text-slate-500">Default security rule: No auto-publishing without admin sign-off</p>
                </div>
                <input type="checkbox" defaultChecked disabled className="w-5 h-5 accent-[#6C63FF]" />
              </div>
            </div>
          </div>
        )}

        {/* TAB: LOGS */}
        {activeTab === 'LOGS' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="font-black text-base text-slate-900">AI Usage & Tokens Log</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase bg-slate-50 text-slate-500 border-b">
                  <tr>
                    <th className="py-2.5 px-4">Request</th>
                    <th className="py-2.5 px-4">Provider</th>
                    <th className="py-2.5 px-4">Tokens</th>
                    <th className="py-2.5 px-4">Execution</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.usageLogs.map((ul) => (
                    <tr key={ul.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-800">{ul.requestType}</td>
                      <td className="py-2.5 px-4">{ul.provider}</td>
                      <td className="py-2.5 px-4 font-mono">{ul.tokensUsed}</td>
                      <td className="py-2.5 px-4 font-mono">{ul.executionTimeMs}ms</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {ul.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">{new Date(ul.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2-Column Reviewer Modal */}
        <NewsroomReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          article={reviewArticle}
          loading={loading}
          onPublish={handlePublish}
          onRegenerate={handleRegenerate}
          onOpenEdit={() => {
            setEditForm({
              title: reviewArticle.title,
              excerpt: reviewArticle.excerpt,
              content: reviewArticle.content,
            });
            setEditingArticleId(reviewArticle.id);
            setEditModalOpen(true);
          }}
        />

        {/* Instant Broadcast Modal */}
        <NewsroomBroadcastModal
          isOpen={isBroadcastModalOpen}
          onClose={() => setIsBroadcastModalOpen(false)}
          form={broadcastForm}
          setForm={setBroadcastForm}
          onSubmit={handleSaveBroadcast}
          submitting={submittingBroadcast}
        />

        {/* Manual Content Edit Modal */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-black text-base text-slate-900">Edit Educational Article</h3>
                <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Title</label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Summary / Excerpt</label>
                  <textarea
                    rows={3}
                    value={editForm.excerpt || ''}
                    onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Content (Markdown)</label>
                  <textarea
                    rows={8}
                    value={editForm.content || ''}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-[#6C63FF] text-white font-bold">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteTarget && (
          <ConfirmModal
            isOpen={true}
            title={deleteTarget.type === 'ARTICLE' ? 'Archive Educational Article?' : 'Delete Broadcast Notice?'}
            message="This record will be safely removed from student feeds."
            confirmText="Confirm Delete"
            isDestructive={true}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNotificationsPage;
