import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { Notification } from '../../types';

interface Props {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  showReadButton?: boolean;
}

export const NotificationCard: React.FC<Props> = ({ notification, onMarkAsRead, showReadButton }) => {
  const isUrgent = notification.priority === 'URGENT';
  const isHigh = notification.priority === 'HIGH';
  const article = notification.article;
  const deadline = notification.deadlineStatus;
  const primaryDate = notification.primaryDate;

  const articleUrl = article?.slug ? `/notifications/${article.slug}` : notification.linkUrl;

  const categoryColor: Record<string, string> = {
    EXAM: 'bg-purple-100 text-purple-800',
    COMPETITIVE_EXAMS: 'bg-purple-100 text-purple-800',
    GOVT_JOBS: 'bg-blue-100 text-blue-800',
    POLICE: 'bg-indigo-100 text-indigo-800',
    UNIVERSITY: 'bg-emerald-100 text-emerald-800',
    COURSE: 'bg-amber-100 text-amber-800',
    ACADEMIC: 'bg-cyan-100 text-cyan-800',
    TEACHING: 'bg-rose-100 text-rose-800',
    RAILWAY: 'bg-orange-100 text-orange-800',
    BANKING: 'bg-sky-100 text-sky-800',
    GENERAL: 'bg-slate-100 text-slate-700',
  };

  const badgeClass = categoryColor[notification.category] || 'bg-purple-100 text-[#6C63FF]';

  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl bg-white border transition-all flex flex-col justify-between gap-4 ${
        notification.isRead
          ? 'border-slate-200/80 opacity-85 hover:border-slate-300'
          : 'border-purple-200 shadow-sm hover:shadow-md hover:border-[#6C63FF]/60 ring-1 ring-[#6C63FF]/5'
      }`}
    >
      <div className="space-y-3">
        {/* Top Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
              {notification.category.replace(/_/g, ' ')}
            </span>

            {article?.organizationName && (
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                {article.organizationName}
              </span>
            )}

            {(isUrgent || isHigh) && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  isUrgent ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {notification.priority}
              </span>
            )}

            {deadline && (
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${deadline.badgeColor}`}>
                {deadline.statusText}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>Published: {new Date(notification.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug hover:text-[#6C63FF] transition-colors">
          {article?.slug ? (
            <Link to={`/notifications/${article.slug}`}>{notification.title}</Link>
          ) : (
            notification.title
          )}
        </h3>

        {/* Message / Summary */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
          {notification.message}
        </p>

        {/* Key Date Highlight if available */}
        {primaryDate && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-[#6C63FF]" />
            <span>{primaryDate.label}:</span>
            <span className="font-bold text-slate-900">
              {new Date(primaryDate.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {article?.slug ? (
            <Link
              to={`/notifications/${article.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#8077ff] hover:opacity-95 text-white font-bold text-xs shadow-sm shadow-[#6C63FF]/20 transition-all"
            >
              <span>Read Full Update / विवरण देखें</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : notification.linkUrl ? (
            <a
              href={notification.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-50 hover:bg-[#6C63FF] text-[#6C63FF] hover:text-white font-bold text-xs border border-purple-200 hover:border-[#6C63FF] transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Official Circular / विज्ञप्ति देखें</span>
            </a>
          ) : null}

          {/* Quick Apply button if active application link */}
          {article?.links && article.links.some((l: any) => l.linkType === 'APPLY_ONLINE') && (
            <a
              href={article.links.find((l: any) => l.linkType === 'APPLY_ONLINE')?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold text-xs border border-emerald-200 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Apply Online / ऑनलाइन आवेदन</span>
            </a>
          )}
        </div>

        {showReadButton && onMarkAsRead && !notification.isRead && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-emerald-600 transition-colors ml-auto"
            title="Mark as read"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark as Read</span>
          </button>
        )}
      </div>
    </div>
  );
};
