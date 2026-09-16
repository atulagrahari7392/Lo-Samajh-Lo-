import { DeadlineStatusResult } from './types';

/**
 * Calculates deadline status dynamically based on current Indian Standard Time (Asia/Kolkata).
 * Handles: Starts Today, Tomorrow, 2 Days Left, 3 Days Left, This Week, Closing Soon, Expired, Upcoming.
 */
export function calculateDeadlineStatus(targetDateInput: string | Date): DeadlineStatusResult {
  const targetDate = new Date(targetDateInput);

  // Convert to Indian Standard Time (UTC + 5:30)
  const now = new Date();
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 3600000;
  const currentIst = new Date(utcNow + istOffset);

  // Strip time for clean day-difference calculation
  const todayDate = new Date(currentIst.getFullYear(), currentIst.getMonth(), currentIst.getDate());
  const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  const diffMs = targetDay.getTime() - todayDate.getTime();
  const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  };
  const formattedDate = targetDate.toLocaleDateString('en-IN', options);

  if (daysDiff < 0) {
    return {
      statusText: 'Expired / समाप्त',
      badgeColor: 'bg-slate-100 text-slate-500 border-slate-200',
      isExpired: true,
      daysRemaining: daysDiff,
      isUrgent: false,
      formattedDate,
    };
  }

  if (daysDiff === 0) {
    return {
      statusText: 'Today / आज अंतिम दिन',
      badgeColor: 'bg-rose-600 text-white animate-pulse shadow-sm',
      isExpired: false,
      daysRemaining: 0,
      isUrgent: true,
      formattedDate,
    };
  }

  if (daysDiff === 1) {
    return {
      statusText: 'Tomorrow / कल तक',
      badgeColor: 'bg-rose-500 text-white shadow-sm',
      isExpired: false,
      daysRemaining: 1,
      isUrgent: true,
      formattedDate,
    };
  }

  if (daysDiff === 2) {
    return {
      statusText: '2 Days Left / 2 दिन शेष',
      badgeColor: 'bg-amber-500 text-white shadow-sm',
      isExpired: false,
      daysRemaining: 2,
      isUrgent: true,
      formattedDate,
    };
  }

  if (daysDiff === 3) {
    return {
      statusText: '3 Days Left / 3 दिन शेष',
      badgeColor: 'bg-amber-500 text-white shadow-sm',
      isExpired: false,
      daysRemaining: 3,
      isUrgent: true,
      formattedDate,
    };
  }

  if (daysDiff <= 7) {
    return {
      statusText: `Closing Soon (${daysDiff} Days Left)`,
      badgeColor: 'bg-orange-100 text-orange-700 border border-orange-200 font-semibold',
      isExpired: false,
      daysRemaining: daysDiff,
      isUrgent: false,
      formattedDate,
    };
  }

  if (daysDiff <= 14) {
    return {
      statusText: `This Fortnight (${daysDiff} Days Left)`,
      badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold',
      isExpired: false,
      daysRemaining: daysDiff,
      isUrgent: false,
      formattedDate,
    };
  }

  return {
    statusText: `Upcoming (${daysDiff} Days Left)`,
    badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold',
    isExpired: false,
    daysRemaining: daysDiff,
    isUrgent: false,
    formattedDate,
  };
}

/**
 * Categorizes a date into dashboard buckets:
 * TODAY, THIS_WEEK, UPCOMING, CLOSING_SOON, EXPIRED
 */
export function getTimelineBucket(targetDateInput: string | Date): 'TODAY' | 'THIS_WEEK' | 'UPCOMING' | 'CLOSING_SOON' | 'EXPIRED' {
  const status = calculateDeadlineStatus(targetDateInput);
  if (status.isExpired) return 'EXPIRED';
  if (status.daysRemaining === 0) return 'TODAY';
  if (status.daysRemaining <= 7) return 'CLOSING_SOON';
  if (status.daysRemaining <= 14) return 'THIS_WEEK';
  return 'UPCOMING';
}
