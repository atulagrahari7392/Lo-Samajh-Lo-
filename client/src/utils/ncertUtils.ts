/**
 * Utility functions for resolving NCERT textbook URLs, direct PDF links,
 * Google Drive previews, and instant downloads with zero connection timeouts.
 */

/**
 * Resolves any NCERT or external textbook URL to a direct, static downloadable PDF URL.
 * Transforms legacy NCERT dynamic PHP frame URLs:
 * 'https://ncert.nic.in/textbook.php?femh1=3-10' -> 'https://ncert.nic.in/textbook/pdf/femh103.pdf'
 * 'https://ncert.nic.in/textbook.php?femh1=0-10' -> 'https://ncert.nic.in/textbook/pdf/femh1ps.pdf'
 */
export function getNcertStaticPdfUrl(rawUrl?: string | null, chapterNumber?: number): string {
  if (!rawUrl) return '';

  const cleanUrl = rawUrl.trim();

  // If already a Google Drive link or direct upload/CDN link
  if (cleanUrl.includes('drive.google.com') || cleanUrl.includes('/uploads/') || cleanUrl.toLowerCase().endsWith('.pdf')) {
    return cleanUrl;
  }

  // Check for NCERT textbook.php pattern: ?code=ch-total or ?code=ch
  const match = cleanUrl.match(/textbook\.php\?([a-zA-Z0-9]+)=([0-9]+)(?:-([0-9]+))?/i);
  if (match) {
    const code = match[1];
    const rawCh = parseInt(chapterNumber !== undefined ? String(chapterNumber) : match[2], 10);
    const ch = isNaN(rawCh) ? 0 : rawCh;

    if (ch === 0) {
      // Preliminary pages / Index / Front matter
      return `https://ncert.nic.in/textbook/pdf/${code}ps.pdf`;
    }

    const paddedCh = ch < 10 ? `0${ch}` : String(ch);
    return `https://ncert.nic.in/textbook/pdf/${code}${paddedCh}.pdf`;
  }

  return cleanUrl;
}

/**
 * Returns the official complete book ZIP download URL from NCERT if available
 */
export function getNcertCompleteBookZipUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  const match = rawUrl.trim().match(/textbook\.php\?([a-zA-Z0-9]+)=/i);
  if (match) {
    const code = match[1];
    return `https://ncert.nic.in/textbook/pdf/${code}dd.zip`;
  }
  return rawUrl;
}

/**
 * Returns an embeddable viewer URL for iframes.
 * Transforms Google Drive links to /preview and handles direct PDFs.
 */
export function getNcertEmbedViewerUrl(rawUrl?: string | null, chapterNumber?: number): string {
  if (!rawUrl) return '';
  const cleanUrl = rawUrl.trim();

  // Google Drive
  if (cleanUrl.includes('drive.google.com')) {
    const match = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return cleanUrl.replace(/\/view(\?.*)?$/, '/preview');
  }

  // Local uploads or same-origin direct PDFs
  if (cleanUrl.startsWith('/') || (typeof window !== 'undefined' && cleanUrl.includes(window.location.host))) {
    return cleanUrl;
  }

  // Direct static PDF or resolved NCERT static PDF
  const staticPdf = getNcertStaticPdfUrl(cleanUrl, chapterNumber);
  if (staticPdf) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(staticPdf)}&embedded=true`;
  }

  return `https://docs.google.com/viewer?url=${encodeURIComponent(cleanUrl)}&embedded=true`;
}

/**
 * Programmatically triggers an instant browser download without freezing or opening a broken tab.
 */
export function triggerInstantDownload(url: string, fileName?: string): void {
  if (!url) return;

  try {
    const link = document.createElement('a');
    link.href = url;
    if (fileName) {
      link.download = fileName.endsWith('.pdf') || fileName.endsWith('.zip') ? fileName : `${fileName}.pdf`;
    } else {
      link.download = 'NCERT-Textbook.pdf';
    }
    link.target = '_blank';
    link.rel = 'noopener,noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
      } catch {}
    }, 200);
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
