import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ArrowRight,
  FileText,
  User,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  Shield,
  Upload,
  Send,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TeacherApplication } from '../../types';

export const TeacherStatusPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [application, setApplication] = useState<TeacherApplication | null>(null);

  // Resubmit state for CHANGES_REQUESTED
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitComment, setResubmitComment] = useState('');
  const [resubmitSpecialization, setResubmitSpecialization] = useState('');
  const [resubmitBio, setResubmitBio] = useState('');
  const [resubmitDemoVideo, setResubmitDemoVideo] = useState('');
  const [submittingResubmit, setSubmittingResubmit] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.teacher.getMyApplication();
      if (res.success && res.data) {
        setApplication(res.data);
        setResubmitSpecialization(res.data.specialization || '');
        setResubmitBio(res.data.bio || '');
        setResubmitDemoVideo(res.data.demoVideoUrl || '');
      } else {
        setApplication(null);
      }
    } catch (err: any) {
      console.error('Failed to load application status:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    await fetchStatus();
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingResubmit(true);
      const res = await api.teacher.resubmitApplication({
        specialization: resubmitSpecialization,
        bio: resubmitBio,
        demoVideoUrl: resubmitDemoVideo,
        comment: resubmitComment,
      });
      if (res.success) {
        success('Application resubmitted successfully! It is now under review.');
        setShowResubmitModal(false);
        fetchStatus();
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to resubmit application.');
    } finally {
      setSubmittingResubmit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading your teacher status...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#6C63FF] mx-auto flex items-center justify-center">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">No Application Found</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            You haven't submitted a Teacher Onboarding Application yet, or your application is not linked to this account.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/teacher/apply"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#6C63FF] text-white font-bold text-sm shadow-md hover:bg-[#5b52e0] transition-colors"
          >
            <span>Apply as a Teacher</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const status = application.status;
  const isApproved = status === 'APPROVED';
  const isUnderReview = status === 'UNDER_REVIEW' || status === 'PENDING_REVIEW';
  const isChangesRequested = status === 'CHANGES_REQUESTED';
  const isRejected = status === 'REJECTED';
  const isSuspended = status === 'SUSPENDED';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl shadow-md ${
                isApproved
                  ? 'bg-emerald-500'
                  : isChangesRequested
                  ? 'bg-amber-500'
                  : isRejected
                  ? 'bg-rose-500'
                  : isSuspended
                  ? 'bg-slate-700'
                  : 'bg-[#6C63FF]'
              }`}
            >
              {isApproved && <CheckCircle className="w-8 h-8" />}
              {isUnderReview && <Clock className="w-8 h-8 animate-pulse" />}
              {isChangesRequested && <AlertTriangle className="w-8 h-8" />}
              {isRejected && <XCircle className="w-8 h-8" />}
              {isSuspended && <Shield className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Teacher Application Status
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-800'
                      : isChangesRequested
                      ? 'bg-amber-100 text-amber-800'
                      : isRejected
                      ? 'bg-rose-100 text-rose-800'
                      : isSuspended
                      ? 'bg-slate-200 text-slate-800'
                      : 'bg-indigo-100 text-[#6C63FF]'
                  }`}
                >
                  {status.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-1">
                {isApproved && 'Congratulations, You Are Approved! 🎉'}
                {isUnderReview && 'Application Under Review ⏳'}
                {isChangesRequested && 'Action Required: Revisions Requested ⚠️'}
                {isRejected && 'Application Decision: Not Approved'}
                {isSuspended && 'Teacher Account Suspended'}
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Application ID: <span className="font-mono font-medium text-slate-800">{application.id}</span>
                {application.submittedAt && (
                  <> • Submitted on {new Date(application.submittedAt).toLocaleDateString()}</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
            </button>

            {isApproved && (
              <Link
                to="/teacher/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5b52e0] text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
              >
                <span>Open Teacher Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Status-specific Callout Banners */}
        {isApproved && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-emerald-100" />
              <div>
                <h3 className="text-xl font-black">Welcome to the Lo Samajh Lo Faculty!</h3>
                <p className="text-emerald-100 text-sm mt-0.5">
                  Your profile and documents have been reviewed and approved by the academic committee.
                </p>
              </div>
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              You can now access your Teacher Workspace to view assigned courses, upload lectures & materials, create tests,
              and track student engagement. All content submitted will be queued for rapid admin quality review.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/teacher/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-emerald-700 font-extrabold text-sm shadow-md hover:bg-emerald-50 transition-colors"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/teacher/courses"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700/60 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>My Assigned Courses</span>
              </Link>
            </div>
          </div>
        )}

        {isUnderReview && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center font-bold">
                <Clock className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Application Review Lifecycle</h3>
                <p className="text-xs text-slate-500">We verify qualifications, ID proof, and sample demo lectures.</p>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>1. Submitted</span>
                </div>
                <p className="text-[11px] text-emerald-900 font-medium">Application received securely.</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
                <div className="flex items-center gap-2 text-[#6C63FF] font-bold text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>2. Verification</span>
                </div>
                <p className="text-[11px] text-indigo-900 font-medium">Checking credentials & ID proofs.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 opacity-75">
                <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                  <Clock className="w-4 h-4" />
                  <span>3. Assignment</span>
                </div>
                <p className="text-[11px] text-slate-500">Mapping courses and batches.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 opacity-75">
                <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                  <Shield className="w-4 h-4" />
                  <span>4. Activation</span>
                </div>
                <p className="text-[11px] text-slate-500">Teacher workspace unlock.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
              💡 <strong>Average turnaround time:</strong> Usually processed within 24 to 48 hours. You will receive an automated
              confirmation email once our academic managers make a decision.
            </div>
          </div>
        )}

        {isChangesRequested && (
          <div className="bg-amber-50 rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-sm space-y-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-7 h-7 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-lg font-black text-amber-900">Reviewer Requested Changes</h3>
                <p className="text-xs text-amber-800">
                  Our academic admin reviewed your profile and requested the following adjustments before approval:
                </p>
              </div>
            </div>

            {application.reviewerComment && (
              <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-inner">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Administrator Comments
                </div>
                <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">
                  "{application.reviewerComment}"
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-amber-900 font-medium">
                Update your details or submit a note to proceed.
              </span>
              <button
                onClick={() => setShowResubmitModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                <span>Edit & Resubmit Application</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="bg-rose-50 rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-7 h-7 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-lg font-black text-rose-900">Application Not Approved</h3>
                <p className="text-xs text-rose-700">
                  We appreciate your interest in teaching at Lo Samajh Lo. Unfortunately, your application was not accepted at this time.
                </p>
              </div>
            </div>

            {application.reviewerComment && (
              <div className="bg-white p-4 rounded-2xl border border-rose-200">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reason / Feedback</div>
                <p className="text-sm text-slate-800">{application.reviewerComment}</p>
              </div>
            )}

            <div className="pt-2 text-xs text-slate-600">
              If you have queries regarding this decision, feel free to write to our team at{' '}
              <a href="mailto:support@losamajhlo.com" className="font-bold text-[#6C63FF] underline">
                support@losamajhlo.com
              </a>.
            </div>
          </div>
        )}

        {isSuspended && (
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-7 h-7 text-rose-400 flex-shrink-0" />
              <h3 className="text-lg font-black">Teacher Workspace Suspended</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your instructor account access has been temporarily suspended by the management team. Previously published course
              materials remain intact, but you cannot upload new lessons or conduct live sessions while suspended.
            </p>
            <p className="text-xs text-slate-400">
              For assistance or reinstatement requests, please contact management directly at{' '}
              <span className="font-bold text-white">admin@losamajhlo.com</span>.
            </p>
          </div>
        )}

        {/* Application Summary Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#6C63FF]" />
              <h2 className="text-base font-bold text-slate-900">Submitted Profile Information</h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Read-only preview</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Full Name
              </span>
              <p className="text-sm font-bold text-slate-800">{application.fullName}</p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Email Address
              </span>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{application.email}</span>
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Phone Number
              </span>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{application.phone}</span>
              </p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Experience
              </span>
              <p className="text-sm font-bold text-slate-800">{application.teachingExperienceYears} Years</p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Medium of Instruction
              </span>
              <p className="text-sm font-bold text-slate-800">{application.teachingMedium}</p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Preferred Mode
              </span>
              <p className="text-sm font-bold text-slate-800">{application.preferredMode}</p>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Specialization / Subject Domain
              </span>
              <p className="text-sm font-bold text-slate-800">{application.specialization || 'Not specified'}</p>
            </div>

            {application.bio && (
              <div className="sm:col-span-2 lg:col-span-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Professional Bio
                </span>
                <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl leading-relaxed">
                  {application.bio}
                </p>
              </div>
            )}

            {application.demoVideoUrl && (
              <div className="sm:col-span-2 lg:col-span-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Demo Lecture Video
                </span>
                <a
                  href={application.demoVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6C63FF] hover:underline"
                >
                  <span>{application.demoVideoUrl}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Resubmit Modal */}
        {showResubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900">Resubmit Application</h3>
                <button
                  onClick={() => setShowResubmitModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleResubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specialization / Domain
                  </label>
                  <input
                    type="text"
                    value={resubmitSpecialization}
                    onChange={(e) => setResubmitSpecialization(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF] outline-none"
                    placeholder="e.g., Higher Mathematics, SSC CGL Reasoning"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Demo Video URL (YouTube, Vimeo, Drive)
                  </label>
                  <input
                    type="url"
                    value={resubmitDemoVideo}
                    onChange={(e) => setResubmitDemoVideo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF] outline-none"
                    placeholder="https://youtu.be/..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Updated Professional Bio
                  </label>
                  <textarea
                    rows={3}
                    value={resubmitBio}
                    onChange={(e) => setResubmitBio(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF] outline-none"
                    placeholder="Summarize your teaching philosophy and exam results..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notes for Reviewer (Explain changes made)
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={resubmitComment}
                    onChange={(e) => setResubmitComment(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#6C63FF] outline-none"
                    placeholder="e.g. Added my updated master's certificate and a 15-min sample lecture video."
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowResubmitModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingResubmit}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6C63FF] hover:bg-[#5b52e0] text-white text-xs font-bold shadow-md transition-colors disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingResubmit ? 'Resubmitting...' : 'Resubmit for Review'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherStatusPage;
