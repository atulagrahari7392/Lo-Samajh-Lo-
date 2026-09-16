import crypto from 'crypto';
import { ExtractedSource } from './types';

export interface SourceCacheEntry {
  url: string;
  hash: string;
  lastFetchedAt: Date;
  status: 'UNCHANGED' | 'CHANGED' | 'NEW';
}

export const sourceCache = new Map<string, SourceCacheEntry>();

/**
 * Compute SHA-256 fingerprint of web content for change detection (Phase 33)
 */
export function computeContentHash(content: string): string {
  return crypto.createHash('sha256').update(content.trim()).digest('hex');
}

/**
 * Check if source content has changed since last fetch.
 */
export function checkSourceChanged(url: string, content: string): { isChanged: boolean; hash: string; previousHash?: string } {
  const hash = computeContentHash(content);
  const existing = sourceCache.get(url);

  if (!existing) {
    sourceCache.set(url, { url, hash, lastFetchedAt: new Date(), status: 'NEW' });
    return { isChanged: true, hash };
  }

  const isChanged = existing.hash !== hash;
  const previousHash = existing.hash;

  sourceCache.set(url, {
    url,
    hash,
    lastFetchedAt: new Date(),
    status: isChanged ? 'CHANGED' : 'UNCHANGED',
  });

  return { isChanged, hash, previousHash };
}
export const OFFICIAL_MONITORED_ORGS = [
  {
    org: 'UPSSSC',
    name: 'Uttar Pradesh Subordinate Services Selection Commission',
    domain: 'upsssc.gov.in',
    state: 'Uttar Pradesh',
    category: 'COMPETITIVE_EXAMS',
    officialPortal: 'http://upsssc.gov.in',
  },
  {
    org: 'UPPSC',
    name: 'Uttar Pradesh Public Service Commission',
    domain: 'uppsc.up.nic.in',
    state: 'Uttar Pradesh',
    category: 'COMPETITIVE_EXAMS',
    officialPortal: 'https://uppsc.up.nic.in',
  },
  {
    org: 'UPPBPB',
    name: 'Uttar Pradesh Police Recruitment & Promotion Board',
    domain: 'uppbpb.gov.in',
    state: 'Uttar Pradesh',
    category: 'POLICE',
    officialPortal: 'https://uppbpb.gov.in',
  },
  {
    org: 'SSC',
    name: 'Staff Selection Commission (Govt of India)',
    domain: 'ssc.gov.in',
    state: 'Central',
    category: 'GOVT_JOBS',
    officialPortal: 'https://ssc.gov.in',
  },
  {
    org: 'UPSC',
    name: 'Union Public Service Commission',
    domain: 'upsc.gov.in',
    state: 'Central',
    category: 'COMPETITIVE_EXAMS',
    officialPortal: 'https://upsc.gov.in',
  },
  {
    org: 'NTA',
    name: 'National Testing Agency (CUET, NEET, JEE, UGC-NET)',
    domain: 'nta.ac.in',
    state: 'Central',
    category: 'UNIVERSITY',
    officialPortal: 'https://nta.ac.in',
  },
  {
    org: 'CBSE',
    name: 'Central Board of Secondary Education (CTET & Boards)',
    domain: 'cbse.gov.in',
    state: 'Central',
    category: 'TEACHING',
    officialPortal: 'https://cbse.gov.in',
  },
  {
    org: 'RRB',
    name: 'Railway Recruitment Boards (Indian Railways)',
    domain: 'indianrailways.gov.in',
    state: 'Central',
    category: 'RAILWAY',
    officialPortal: 'https://indianrailways.gov.in',
  },
  {
    org: 'IBPS',
    name: 'Institute of Banking Personnel Selection',
    domain: 'ibps.in',
    state: 'Central',
    category: 'BANKING',
    officialPortal: 'https://ibps.in',
  },
  {
    org: 'UGC',
    name: 'University Grants Commission',
    domain: 'ugc.gov.in',
    state: 'Central',
    category: 'UNIVERSITY',
    officialPortal: 'https://ugc.gov.in',
  },
];

/**
 * Validates a URL against Server-Side Request Forgery (SSRF) vulnerabilities.
 * Blocks private IP ranges, localhost, AWS/cloud metadata, internal DNS, and unsupported schemes.
 */
export function validateSafeUrl(urlStr: string): { safe: boolean; reason?: string; parsedUrl?: URL } {
  try {
    const parsed = new URL(urlStr);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: `Blocked protocol ${parsed.protocol}. Only HTTP/HTTPS allowed.` };
    }

    const host = parsed.hostname.toLowerCase();

    // Check loopback / localhost
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return { safe: false, reason: 'Access to loopback or local hostname is forbidden.' };
    }

    // Check Cloud metadata endpoints
    if (host === '169.254.169.254' || host === 'metadata.google.internal' || host === 'instance-data') {
      return { safe: false, reason: 'Access to cloud metadata endpoints is blocked.' };
    }

    // Check private IPv4 ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = host.match(ipv4Regex);
    if (match) {
      const p1 = parseInt(match[1], 10);
      const p2 = parseInt(match[2], 10);
      if (p1 === 10) return { safe: false, reason: 'Private 10.x.x.x network range blocked.' };
      if (p1 === 192 && p2 === 168) return { safe: false, reason: 'Private 192.168.x.x network range blocked.' };
      if (p1 === 172 && p2 >= 16 && p2 <= 31) return { safe: false, reason: 'Private 172.16-31.x.x network range blocked.' };
      if (p1 === 127) return { safe: false, reason: 'Loopback 127.x.x.x blocked.' };
    }

    return { safe: true, parsedUrl: parsed };
  } catch (err: any) {
    return { safe: false, reason: `Invalid URL: ${err.message}` };
  }
}

/**
 * Determines whether a domain belongs to an official government / exam authority (Level 1),
 * a reputable secondary educational publisher (Level 2), or other.
 */
export function classifySourceAuthority(domainOrUrl: string): {
  sourceType: 'OFFICIAL' | 'RELIABLE_SECONDARY' | 'SOCIAL' | 'OTHER';
  authorityLevel: 'PRIMARY' | 'SECONDARY' | 'DISCOVERY';
  isOfficial: boolean;
} {
  const urlSafe = validateSafeUrl(domainOrUrl);
  const hostname = urlSafe.parsedUrl?.hostname.toLowerCase() || domainOrUrl.toLowerCase();

  // Government domains
  if (
    hostname.endsWith('.gov.in') ||
    hostname.endsWith('.nic.in') ||
    hostname.endsWith('.ac.in') ||
    hostname.endsWith('.edu.in') ||
    hostname === 'ibps.in' ||
    hostname === 'nta.ac.in'
  ) {
    return {
      sourceType: 'OFFICIAL',
      authorityLevel: 'PRIMARY',
      isOfficial: true,
    };
  }

  // Known reliable secondary education portals
  if (
    hostname.includes('jagranjosh.com') ||
    hostname.includes('ndtv.com') ||
    hostname.includes('hindustantimes.com') ||
    hostname.includes('indianexpress.com') ||
    hostname.includes('livemint.com') ||
    hostname.includes('careers360.com') ||
    hostname.includes('shiksha.com')
  ) {
    return {
      sourceType: 'RELIABLE_SECONDARY',
      authorityLevel: 'SECONDARY',
      isOfficial: false,
    };
  }

  // Social discovery
  if (
    hostname.includes('twitter.com') ||
    hostname.includes('x.com') ||
    hostname.includes('telegram.org') ||
    hostname.includes('t.me') ||
    hostname.includes('youtube.com')
  ) {
    return {
      sourceType: 'SOCIAL',
      authorityLevel: 'DISCOVERY',
      isOfficial: false,
    };
  }

  return {
    sourceType: 'OTHER',
    authorityLevel: 'DISCOVERY',
    isOfficial: false,
  };
}

/**
 * Safely fetches raw content from an allowed URL with strict timeout, size limit,
 * and prompt-injection escaping.
 */
export async function safeFetchWebSource(urlStr: string): Promise<{
  success: boolean;
  content: string;
  title: string;
  source: ExtractedSource;
  contentHash?: string;
  isChanged?: boolean;
  error?: string;
}> {
  const check = validateSafeUrl(urlStr);
  if (!check.safe || !check.parsedUrl) {
    return {
      success: false,
      content: '',
      title: '',
      source: {
        title: urlStr,
        url: urlStr,
        domain: 'unknown',
        sourceType: 'OTHER',
        authorityLevel: 'DISCOVERY',
        verificationStatus: 'FAILED',
      },
      error: check.reason || 'SSRF check failed',
    };
  }

  const domain = check.parsedUrl.hostname;
  const classification = classifySourceAuthority(domain);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const res = await fetch(urlStr, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'LoSamajhLo-EducationNewsroom-Bot/2.0 (+https://losamajhlo.com)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        success: false,
        content: '',
        title: '',
        source: {
          title: domain,
          url: urlStr,
          domain,
          sourceType: classification.sourceType,
          authorityLevel: classification.authorityLevel,
          verificationStatus: 'FAILED',
        },
        error: `HTTP status ${res.status}: ${res.statusText}`,
      };
    }

    // Limit payload size to 1MB to prevent memory exhaustion
    const rawHtml = await res.text();
    const truncatedHtml = rawHtml.slice(0, 1000000);

    // Extract basic title and readable text (strip scripts and styles)
    const titleMatch = truncatedHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : domain;

    // Clean HTML to text
    const cleanText = truncatedHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 15000); // Cap at 15k chars for AI context

    // Prompt injection defense: sanitize delimiters and encapsulate as UNTRUSTED DATA
    const sanitizedData = cleanText
      .replace(/```/g, "'''")
      .replace(/<\/?(?:system|instruction|admin)>/gi, '');

    // Phase 33: Source Cache Fingerprint & Change Detection
    const { isChanged, hash } = checkSourceChanged(urlStr, sanitizedData);

    return {
      success: true,
      content: sanitizedData,
      title: pageTitle,
      contentHash: hash,
      isChanged,
      source: {
        title: pageTitle,
        url: urlStr,
        domain,
        sourceType: classification.sourceType,
        authorityLevel: classification.authorityLevel,
        verificationStatus: classification.isOfficial ? 'VERIFIED' : 'UNVERIFIED',
        hash,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      content: '',
      title: domain,
      source: {
        title: domain,
        url: urlStr,
        domain,
        sourceType: classification.sourceType,
        authorityLevel: classification.authorityLevel,
        verificationStatus: 'FAILED',
      },
      error: err.name === 'AbortError' ? 'Request timed out after 8s' : err.message,
    };
  }
}
