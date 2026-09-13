import React from 'react';

export const DEFAULT_COURSE_THUMBNAIL = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=80';
export const DEFAULT_LECTURE_THUMBNAIL = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80';

/**
 * Extracts Google Drive fileId from any Google Drive URL format
 */
export function extractDriveFileId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  const match =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/\/image\/([a-zA-Z0-9_-]+)/);

  return match ? match[1] : null;
}

/**
 * Formats any thumbnail URL (including Google Drive links) into a directly loadable <img> src
 */
export function formatImageUrl(url?: string | null, fallback: string = DEFAULT_COURSE_THUMBNAIL): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }

  const trimmed = url.trim();

  // If already pointing to backend image proxy
  if (trimmed.startsWith('/api/google-drive/image/')) {
    return trimmed;
  }

  // If it's a Google Drive link (e.g. /file/d/.../view or /open?id=...)
  if (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('googleusercontent.com')
  ) {
    const fileId = extractDriveFileId(trimmed);
    if (fileId) {
      return `/api/google-drive/image/${fileId}`;
    }
  }

  return trimmed;
}

/**
 * Graceful error fallback handler for <img onError={...} />
 */
export function handleImageError(fallback: string = DEFAULT_COURSE_THUMBNAIL) {
  return (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    if (target.src !== fallback) {
      target.src = fallback;
    }
  };
}
