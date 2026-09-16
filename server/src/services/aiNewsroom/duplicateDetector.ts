import { prisma } from '../../db';
import { DuplicateCheckResult, ExtractedFacts, HighPriorityEvent } from './types';

/**
 * Calculates string similarity using Levenshtein distance ratio (0 to 1).
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return (maxLen - distance) / maxLen;
}

/**
 * Multi-factor duplicate check against existing database articles.
 * Matches on:
 * 1. Exact Notification Number / Advt Number
 * 2. Organization + Exam Name match
 * 3. Matching Official URL
 * 4. High Title Similarity (>= 0.82)
 */
export async function detectDuplicateArticle(facts: ExtractedFacts): Promise<DuplicateCheckResult> {
  const normalizedExam = facts.examName.toLowerCase().trim();
  const normalizedOrg = facts.organizationName.toLowerCase().trim();

  // 1. Check exact notification number if present
  if (facts.notificationNumber && facts.notificationNumber.length >= 4) {
    const matched = await prisma.educationArticle.findFirst({
      where: {
        notificationNumber: {
          equals: facts.notificationNumber.trim(),
          mode: 'insensitive',
        },
      },
      include: { dates: true, links: true },
    });

    if (matched) {
      return analyzeChanges(matched, facts, 'Exact Notification/Advt number matched');
    }
  }

  // 2. Check exact Organization + Exam Name
  const candidateArticles = await prisma.educationArticle.findMany({
    where: {
      organizationName: {
        contains: normalizedOrg.slice(0, 4),
        mode: 'insensitive',
      },
    },
    include: { dates: true, links: true },
    take: 20,
  });

  for (const article of candidateArticles) {
    const examSim = calculateSimilarity(article.examName, facts.examName);
    const titleSim = calculateSimilarity(article.title, facts.title);

    if (examSim >= 0.85 || titleSim >= 0.80) {
      return analyzeChanges(article, facts, `High similarity (Exam: ${(examSim * 100).toFixed(0)}%, Title: ${(titleSim * 100).toFixed(0)}%)`);
    }
  }

  // 3. Check official source URL overlap
  if (facts.sources && facts.sources.length > 0) {
    const sourceUrls = facts.sources.map((s) => s.url);
    const existingSource = await prisma.articleSource.findFirst({
      where: {
        url: { in: sourceUrls },
      },
      include: {
        article: { include: { dates: true, links: true } },
      },
    });

    if (existingSource && existingSource.article) {
      return analyzeChanges(existingSource.article, facts, 'Matching official URL found');
    }
  }

  return {
    isDuplicate: false,
    confidence: 'HIGH',
  };
}

/**
 * Analyzes the differences between an existing article and newly extracted facts
 * to identify what changed (event type, new dates, links, etc.).
 */
function analyzeChanges(existing: any, facts: ExtractedFacts, reason: string): DuplicateCheckResult {
  const changedFields: string[] = [];
  let detectedEvent: HighPriorityEvent | undefined;

  // Check for Admit Card date / link
  const hasAdmitCardNow = facts.dates.some((d) => d.dateType.toUpperCase().includes('ADMIT') || d.label.toLowerCase().includes('admit'));
  const hadAdmitCardBefore = existing.dates.some((d: any) => d.dateType.toUpperCase().includes('ADMIT') || d.label.toLowerCase().includes('admit'));
  if (hasAdmitCardNow && !hadAdmitCardBefore) {
    detectedEvent = 'ADMIT_CARD_RELEASED';
    changedFields.push('Admit Card Released');
  }

  // Check for Result date / link
  const hasResultNow = facts.dates.some((d) => d.dateType.toUpperCase().includes('RESULT') || d.label.toLowerCase().includes('result'));
  const hadResultBefore = existing.dates.some((d: any) => d.dateType.toUpperCase().includes('RESULT') || d.label.toLowerCase().includes('result'));
  if (hasResultNow && !hadResultBefore) {
    detectedEvent = 'RESULT_DECLARED';
    changedFields.push('Result Declared');
  }

  // Check for Answer Key
  const hasAnswerKeyNow = facts.dates.some((d) => d.dateType.toUpperCase().includes('ANSWER') || d.label.toLowerCase().includes('answer key'));
  const hadAnswerKeyBefore = existing.dates.some((d: any) => d.dateType.toUpperCase().includes('ANSWER') || d.label.toLowerCase().includes('answer key'));
  if (hasAnswerKeyNow && !hadAnswerKeyBefore) {
    detectedEvent = 'ANSWER_KEY_RELEASED';
    changedFields.push('Answer Key Released');
  }

  // Check for Exam Date Announcement / Postponement
  const newExamDate = facts.dates.find((d) => d.dateType.toUpperCase().includes('EXAM'));
  const oldExamDate = existing.dates.find((d: any) => d.dateType.toUpperCase().includes('EXAM'));
  if (newExamDate && !oldExamDate) {
    detectedEvent = detectedEvent || 'EXAM_DATE_ANNOUNCED';
    changedFields.push('Exam Date Announced');
  } else if (newExamDate && oldExamDate && new Date(newExamDate.date).getTime() !== new Date(oldExamDate.date).getTime()) {
    detectedEvent = detectedEvent || 'EXAM_POSTPONED';
    changedFields.push(`Exam Date changed to ${new Date(newExamDate.date).toLocaleDateString('en-IN')}`);
  }

  // Check for Application Extension
  const newLastDate = facts.dates.find((d) => d.dateType.toUpperCase().includes('LAST') || d.dateType.toUpperCase().includes('END'));
  const oldLastDate = existing.dates.find((d: any) => d.dateType.toUpperCase().includes('LAST') || d.dateType.toUpperCase().includes('END'));
  if (newLastDate && oldLastDate && new Date(newLastDate.date).getTime() > new Date(oldLastDate.date).getTime()) {
    detectedEvent = detectedEvent || 'APPLICATION_EXTENDED';
    changedFields.push(`Application Last Date extended to ${new Date(newLastDate.date).toLocaleDateString('en-IN')}`);
  }

  if (changedFields.length === 0) {
    changedFields.push('Fact details refreshed/verified');
  }

  return {
    isDuplicate: true,
    existingArticleId: existing.id,
    existingSlug: existing.slug,
    existingTitle: existing.title,
    detectedEvent,
    changedFields,
    confidence: 'HIGH',
  };
}
