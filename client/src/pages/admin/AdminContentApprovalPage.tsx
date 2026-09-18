import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Video,
  FileText,
  HelpCircle,
  Calendar,
  ExternalLink,
  Eye,
  Send,
  X,
  Search,
  Check,
  User,
  BookOpen,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdminContentApprovalPage: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Preview & Action Modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | null>(null);
  const [reviewerComment, setReviewerComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.teacherAdmin.getPendingContent();
      if (res.success) {
        setQueue(res.data || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch content review queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleAction = async () => {
    if (!selectedItem || !actionType) return;
    try {
      setProcessing(true);
      const contentType = selectedItem.contentType || selectedItem.type || 'lecture';
      const res = await api.teacherAdmin.reviewContent(contentType, selectedItem.id, {
        action: actionType,
        reviewerComment: reviewerComment || undefined,
      });

      if (res.success) {
        if (actionType === 'APPROVE') {
          success('Content approved and published successfully!');
        } else if (actionType === 'REQUEST_CHANGES') {
          success('Revisions requested from teacher.');
        } else {
          success('Content rejected.');
        }
        setSelectedItem(null);
        setActionType(null);
        setReviewerComment('');
        fetchQueue();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to process content review.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredQueue = queue.filter((item) => {
    const itemType = (item.contentType || item.type || '').toUpperCase();
    const matchesType = typeFilter === 'ALL' || itemType.includes(typeFilter);
    const matchesSearch =
      !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.teacher?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.course?.title?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('LECTURE') || t.includes('LESSON')) return <Video className="w-4 h-4 text-[#6C63FF]" />;
    if (t.includes('MATERIAL')) return <FileText className="w-4 h-4 text-emerald-600" />;
    if (t.includes('TEST')) return <HelpCircle className="w-4 h-4 text-purple-600" />;
    if (t.includes('LIVE')) return <Calendar className="w-4 h-4 text-amber-600" />;
    return <FileText className="w-4 h-4 text-slate-500" />;
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Content Quality & Review Queue</h1>
            <p className="text-xs text-slate-500 mt-1">
              Screen teacher-submitted lectures, materials, live classes, and tests before publishing to students.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, teacher, course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF] outline-none"
            />
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 mr-1">Filter Type:</span>
            {['ALL', 'LECTURE', 'MATERIAL', 'TEST', 'LIVE'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  typeFilter === t
                    ? 'bg-[#6C63FF] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            {filteredQueue.length} Pending Quality Verification
          </span>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500 mt-3">Loading review queue...</p>
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">All Caught Up!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No items currently awaiting quality review. New submissions by faculty will show up here immediately.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3.5 px-6">Content Title</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Instructor</th>
                    <th className="py-3.5 px-4">Target Course</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueue.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-100 flex-shrink-0">
                          {getTypeIcon(item.contentType || item.type)}
                        </div>
                        <span className="truncate max-w-xs">{item.title}</span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-600">
                        {(item.contentType || item.type || 'LESSON').replace('_', ' ')}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800">
                        {item.teacher?.name || 'Assigned Instructor'}
                      </td>
                      <td className="py-4 px-4 text-slate-600 max-w-xs truncate">
                        {item.course?.title || item.courseTitle || '—'}
                      </td>
                      <td className="py-4 px-4 text-slate-400 text-[11px]">
                        {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setActionType(null);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#6C63FF] hover:text-white text-slate-700 text-xs font-bold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect & Action</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* REVIEW & INSPECTION MODAL */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Quality Verification
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">{selectedItem.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px]">Instructor</span>
                  <span className="font-bold text-slate-800">{selectedItem.teacher?.name || 'Teacher'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px]">Course</span>
                  <span className="font-bold text-slate-800">
                    {selectedItem.course?.title || selectedItem.courseTitle || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px]">Type</span>
                  <span className="font-bold text-indigo-600">
                    {(selectedItem.contentType || selectedItem.type || 'LESSON').replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Video Player / Attachment Preview */}
              {selectedItem.videoUrl && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700">Video Content Source</div>
                  <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-slate-700 font-mono truncate max-w-md">
                      {selectedItem.videoUrl}
                    </span>
                    <a
                      href={selectedItem.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#6C63FF] hover:underline"
                    >
                      <span>Preview</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {selectedItem.fileUrl && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700">Study Material File</div>
                  <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-slate-700 font-mono truncate max-w-md">
                      {selectedItem.fileUrl}
                    </span>
                    <a
                      href={selectedItem.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
                    >
                      <span>Open File</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Action Choices */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700">Choose Review Action:</div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setActionType('APPROVE')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                      actionType === 'APPROVE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    ✅ Approve & Publish
                  </button>

                  <button
                    onClick={() => setActionType('REQUEST_CHANGES')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                      actionType === 'REQUEST_CHANGES'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    ⚠️ Request Changes
                  </button>

                  <button
                    onClick={() => setActionType('REJECT')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                      actionType === 'REJECT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    ❌ Reject Content
                  </button>
                </div>

                {actionType && (
                  <div className="space-y-2 pt-2 animate-fadeIn">
                    <label className="block text-xs font-bold text-slate-700">
                      {actionType === 'APPROVE' ? 'Optional Note for Teacher' : 'Reviewer Feedback Remarks *'}
                    </label>
                    <textarea
                      rows={2}
                      required={actionType !== 'APPROVE'}
                      value={reviewerComment}
                      onChange={(e) => setReviewerComment(e.target.value)}
                      placeholder={
                        actionType === 'APPROVE'
                          ? 'e.g. Excellent audio clarity and slides.'
                          : 'Please re-record audio without background noise...'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#6C63FF]"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAction}
                  disabled={processing || !actionType || (actionType !== 'APPROVE' && !reviewerComment.trim())}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5b52e0] text-white text-xs font-bold shadow-md transition-colors disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{processing ? 'Processing...' : 'Submit Decision'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminContentApprovalPage;
