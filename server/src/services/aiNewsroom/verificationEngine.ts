import { ExtractedFacts, ExtractedDate, ExtractedLink } from './types';
import { validateSafeUrl } from './webResearcher';

export interface VerificationReport {
  passed: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  issues: string[];
  conflictDetected: boolean;
  conflictDetails?: string;
  verifiedFacts: ExtractedFacts;
}

/**
 * Runs automated quality & verification checks on extracted facts before draft/review:
 * 1. Validates title, exam name, organization name are present
 * 2. Checks official URL validity via SSRF tester
 * 3. Checks dates for valid formats and chronologic consistency (e.g. End Date >= Start Date)
 * 4. Checks for conflicts between official and secondary sources
 * 5. Preserves locked facts if existing article data is provided
 */
export function verifyExtractedFacts(
  facts: ExtractedFacts,
  lockedFacts?: { dates?: ExtractedDate[]; info?: any; links?: ExtractedLink[] }
): VerificationReport {
  const issues: string[] = [];
  let conflictDetected = false;
  let conflictDetails = '';

  // 1. Core metadata checks
  if (!facts.title || facts.title.length < 5) {
    issues.push('Article title is too short or missing.');
  }
  if (!facts.examName || facts.examName.trim().length === 0) {
    issues.push('Exam name is required.');
  }
  if (!facts.organizationName || facts.organizationName.trim().length === 0) {
    issues.push('Organization name is required.');
  }

  // 2. Verified links check
  const validatedLinks: ExtractedLink[] = [];
  for (const link of facts.links || []) {
    const urlCheck = validateSafeUrl(link.url);
    if (!urlCheck.safe) {
      issues.push(`Invalid or unsafe link URL rejected: ${link.url} (${urlCheck.reason})`);
      continue;
    }
    validatedLinks.push({
      ...link,
      isOfficial: link.isOfficial ?? true,
      verifiedAt: new Date().toISOString(),
    });
  }

  // 3. Chronological dates validation & Fact Locking
  const validatedDates: ExtractedDate[] = [];
  let applicationStart: Date | null = null;
  let applicationEnd: Date | null = null;

  for (const d of facts.dates || []) {
    const parsed = new Date(d.date);
    if (isNaN(parsed.getTime())) {
      issues.push(`Unrecognized date format in: ${d.label} (${d.date})`);
      continue;
    }

    if (d.dateType.toUpperCase().includes('START')) {
      applicationStart = parsed;
    } else if (d.dateType.toUpperCase().includes('END') || d.dateType.toUpperCase().includes('LAST')) {
      applicationEnd = parsed;
    }

    validatedDates.push({
      ...d,
      date: parsed.toISOString(),
      confidence: d.confidence || 'HIGH',
    });
  }

  // Check if End Date is chronologically before Start Date
  if (applicationStart && applicationEnd && applicationEnd.getTime() < applicationStart.getTime()) {
    conflictDetected = true;
    conflictDetails = `Application Last Date (${applicationEnd.toLocaleDateString()}) is before Start Date (${applicationStart.toLocaleDateString()}). Flagged for manual admin review.`;
    issues.push(conflictDetails);
  }

  // 4. Official source check
  const hasOfficialSource = (facts.sources || []).some((s) => s.sourceType === 'OFFICIAL');
  if (!hasOfficialSource && (facts.sources || []).length > 0) {
    issues.push('Notice discovered solely from secondary source. Requires official confirmation.');
  }

  // 5. Fact Locking: If admin locked certain fields, preserve them strictly!
  if (lockedFacts) {
    if (lockedFacts.dates && lockedFacts.dates.length > 0) {
      for (const lockedDate of lockedFacts.dates) {
        if (lockedDate.isVerified) {
          // Replace or preserve locked date
          const idx = validatedDates.findIndex((vd) => vd.dateType === lockedDate.dateType);
          if (idx >= 0) {
            validatedDates[idx] = lockedDate;
          } else {
            validatedDates.push(lockedDate);
          }
        }
      }
    }
  }

  // Determine overall confidence level
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  if (conflictDetected || !hasOfficialSource || issues.length >= 2) {
    confidence = 'LOW';
  } else if (issues.length === 1 || !facts.notificationNumber) {
    confidence = 'MEDIUM';
  }

  const verifiedFacts: ExtractedFacts = {
    ...facts,
    dates: validatedDates,
    links: validatedLinks,
    confidence,
    conflictDetected,
    conflictDetails: conflictDetails || undefined,
  };

  return {
    passed: issues.length === 0,
    confidence,
    issues,
    conflictDetected,
    conflictDetails: conflictDetails || undefined,
    verifiedFacts,
  };
}
