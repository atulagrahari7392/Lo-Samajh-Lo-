/**
 * Utility functions for URL parsing, sanitization and Google Drive file mapping
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

export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Already our dedicated image endpoint
  if (trimmed.startsWith('/api/google-drive/image/')) {
    return trimmed;
  }

  // Google Drive URL transformation
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com') || trimmed.includes('googleusercontent.com')) {
    const fileId = extractDriveFileId(trimmed);
    if (fileId) {
      return `/api/google-drive/image/${fileId}`;
    }
  }

  return trimmed;
}
