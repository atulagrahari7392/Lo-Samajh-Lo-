export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type ArticleStatus =
  | 'DISCOVERED'
  | 'RESEARCHING'
  | 'GENERATING'
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'FAILED';

export type HighPriorityEvent =
  | 'EXAM_POSTPONED'
  | 'EXAM_DATE_ANNOUNCED'
  | 'APPLICATION_EXTENDED'
  | 'APPLICATION_CLOSED'
  | 'ADMIT_CARD_RELEASED'
  | 'RESULT_DECLARED'
  | 'ANSWER_KEY_RELEASED'
  | 'CORRECTION_WINDOW_OPEN'
  | 'COUNSELLING_STARTED';

export interface StructuredInfo {
  vacancy?: string;
  eligibility?: string;
  ageLimit?: string;
  fee?: string;
  selectionProcess?: string;
  examPattern?: string;
}

export interface ExtractedDate {
  date: string; // ISO string or YYYY-MM-DD
  dateType: string;
  label: string;
  source?: string;
  confidence: ConfidenceLevel;
  note?: string;
  isVerified?: boolean;
}

export interface ExtractedLink {
  label: string;
  url: string;
  linkType: string;
  isOfficial: boolean;
  source?: string;
  verifiedAt?: string;
}

export interface ExtractedSource {
  title: string;
  url: string;
  domain: string;
  sourceType: 'OFFICIAL' | 'RELIABLE_SECONDARY' | 'SOCIAL' | 'OTHER';
  authorityLevel: 'PRIMARY' | 'SECONDARY' | 'DISCOVERY';
  publishedAt?: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'CONFLICT' | 'FAILED';
  hash?: string;
}

export interface ExtractedSyllabus {
  topic: string;
  subtopics: string[];
  order?: number;
  source?: string;
}

export interface ExtractedFacts {
  examName: string;
  organizationName: string;
  notificationNumber?: string;
  state?: string;
  category: string;
  subCategory?: string;
  title: string;
  summary: string;
  structuredInfo: StructuredInfo;
  dates: ExtractedDate[];
  links: ExtractedLink[];
  sources: ExtractedSource[];
  syllabus: ExtractedSyllabus[];
  faqs?: Array<{ question: string; answer: string }>;
  confidence: ConfidenceLevel;
  conflictDetected?: boolean;
  conflictDetails?: string;
}

export interface GeneratedArticleResult {
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Structured Markdown
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  secondaryKeywords: string;
  canonicalUrl?: string;
  ogTitle: string;
  ogDescription: string;
  faqData: Array<{ question: string; answer: string }>;
  structuredInfo: StructuredInfo;
  dates: ExtractedDate[];
  links: ExtractedLink[];
  sources: ExtractedSource[];
  syllabus: ExtractedSyllabus[];
  confidence: ConfidenceLevel;
}

export interface DeadlineStatusResult {
  statusText: string;
  badgeColor: string; // e.g. 'bg-rose-500 text-white'
  isExpired: boolean;
  daysRemaining: number;
  isUrgent: boolean;
  formattedDate: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingArticleId?: string;
  existingSlug?: string;
  existingTitle?: string;
  detectedEvent?: HighPriorityEvent;
  changedFields?: string[];
  confidence: ConfidenceLevel;
}

export interface AIProvider {
  name: string;
  research(query: string, options?: { organization?: string; category?: string }): Promise<ExtractedFacts[]>;
  extractFacts(rawText: string, metadata?: { sourceUrl?: string; organization?: string }): Promise<ExtractedFacts>;
  verifyFacts(facts: ExtractedFacts): Promise<{ facts: ExtractedFacts; passed: boolean; issues: string[] }>;
  generateArticle(facts: ExtractedFacts): Promise<GeneratedArticleResult>;
  generateSEO(article: { title: string; excerpt: string; organization: string; examName: string }): Promise<{
    seoTitle: string;
    metaDescription: string;
    focusKeyword: string;
    secondaryKeywords: string;
    ogTitle: string;
    ogDescription: string;
    slug: string;
  }>;
  testConnection?(): Promise<{
    connected: boolean;
    provider: string;
    model: string;
    latencyMs: number;
    error?: string;
  }>;
}
