import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Video,
  FileText,
  HelpCircle,
  Calendar,
  Send,
  MessageSquare,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import TeacherLayout from '../../components/teacher/TeacherLayout';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const TeacherContentApprovalPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [contentList, setContentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await api.teacher.getMyContent();
      if (res.success) {
        setContentList(res.data || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch content review items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSubmitForReview = async (type: string, id: string) => {
    try {
      const res = await api.teacher.submitContentForReview(type, id);
      if (res.success) {
        success('Content submitted for administrative review!');
        fetchContent();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to submit for review.');
    }
  };

  const filteredContent = contentList.filter((item) => {
    const matchesStatus =
      statusFilter === 'ALL' || item.approvalStatus === statusFilter;
    const matchesType =
      typeFilter === 'ALL' || (item.type || item.contentType) === typeFilter;
    const matchesSearch =
      !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.courseTitle?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved & Live</span>
          </span>
        );
      case 'CHANGES_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3 h-3" />
            <span>Changes Requested</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            <span>Draft</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-[#6C63FF]">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Under Admin Review</span>
          </span>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'LECTURE':
      case 'LESSON':
        return <Video className="w-4 h-4 text-[#6C63FF]" />;
      case 'MATERIAL':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'TEST':
        return <HelpCircle className="w-4 h-4 text-purple-600" />;
      case 'LIVE_CLASS':
        return <Calendar className="w-4 h-4 text-amber-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <TeacherLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Content Quality & Review Status</h1>
            <p className="text-xs text-slate-500 mt-1">
              All submitted video lectures, class notes, and quizzes undergo administrative quality verification before going live.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search title or course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 mr-2">Status:</span>
            {['ALL', 'PENDING_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'DRAFT', 'REJECTED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  statusFilter === s
                    ? 'bg-[#6C63FF] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none focus:ring-2 focus:ring-[#6C63FF]"
            >
              <option value="ALL">All Types</option>
              <option value="LECTURE">Lectures</option>
              <option value="MATERIAL">Study Notes</option>
              <option value="TEST">Tests</option>
              <option value="LIVE_CLASS">Live Classes</option>
            </select>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500 mt-3">Loading review queue...</p>
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Content Items Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No submissions match the active filters. Upload new lectures or study materials from your dashboard.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3.5 px-6">Content Title</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Course</th>
                    <th className="py-3.5 px-4">Review Status</th>
                    <th className="py-3.5 px-4">Admin Remarks</th>
                    <th className="py-3.5 px-4">Submitted</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContent.map((item) => {
                    const itemType = item.type || item.contentType || 'LECTURE';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900 flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-100 flex-shrink-0">
                            {getTypeIcon(itemType)}
                          </div>
                          <span className="truncate max-w-xs">{item.title}</span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-600">
                          {itemType.replace('_', ' ')}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-800 max-w-xs truncate">
                          {item.courseTitle || item.course?.title || '—'}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(item.approvalStatus)}
                        </td>
                        <td className="py-4 px-4 text-slate-600 max-w-xs">
                          {item.reviewerComment ? (
                            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                              {item.reviewerComment}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-400 text-[11px]">
                          {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {item.approvalStatus === 'DRAFT' && (
                            <button
                              onClick={() => handleSubmitForReview(itemType, item.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#6C63FF] hover:bg-[#5b52e0] text-white text-[11px] font-bold shadow-sm transition-colors"
                            >
                              <Send className="w-3 h-3" />
                              <span>Submit</span>
                            </button>
                          )}
                          {item.videoUrl && (
                            <a
                              href={item.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 inline-block ml-1"
                              title="Preview Video"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherContentApprovalPage;
