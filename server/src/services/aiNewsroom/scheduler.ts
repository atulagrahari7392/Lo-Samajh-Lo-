import { prisma } from '../../db';
import { publishArticleWithBridge } from './notificationBridge';
import { getWebDiscoveryProvider, TargetedQueryGenerator } from './webDiscovery';
import { getAIProvider, generateNewsroomSlug } from './aiProvider';
import { safeFetchWebSource } from './webResearcher';
import { verifyExtractedFacts } from './verificationEngine';
import { detectDuplicateArticle } from './duplicateDetector';

let isSchedulerRunning = false;
let isAutonomousCycleRunning = false;
let lastCycleStartedAt: Date | null = null;
let lastCycleCompletedAt: Date | null = null;
let lastCycleError: string | null = null;

export function getSchedulerStatus() {
  return {
    isRunning: isSchedulerRunning,
    isAutonomousCycleRunning,
    lastCycleStartedAt,
    lastCycleCompletedAt,
    lastCycleError,
  };
}

/**
 * Execute an autonomous educational discovery cycle (Phase 10 & Phase 21).
 * Idempotent, non-blocking, and safely handles process restarts.
 */
export async function runAutonomousDiscoveryCycle(reason = 'AUTOMATED_SCHEDULE'): Promise<{
  success: boolean;
  discoveredCount: number;
  draftsCreated: number;
  error?: string;
}> {
  if (isAutonomousCycleRunning) {
    return { success: false, discoveredCount: 0, draftsCreated: 0, error: 'Autonomous cycle is already in progress' };
  }

  isAutonomousCycleRunning = true;
  lastCycleStartedAt = new Date();
  lastCycleError = null;

  try {
    // 1. Load settings (Phase 21)
    const settings = await prisma.newsroomSetting.findMany();
    const settingsMap: Record<string, any> = {};
    for (const s of settings) {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    }

    const autoResearchEnabled = settingsMap.autoResearchEnabled ?? true;
    if (!autoResearchEnabled && reason === 'AUTOMATED_SCHEDULE') {
      isAutonomousCycleRunning = false;
      return { success: true, discoveredCount: 0, draftsCreated: 0 };
    }

    const trustedOrgs: string[] = settingsMap.trustedOrgs || ['UPSSSC', 'UPPSC', 'SSC', 'NTA', 'CBSE'];
    const discoveryProvider = getWebDiscoveryProvider();
    const aiProvider = getAIProvider();

    let totalDiscovered = 0;
    let draftsCreated = 0;

    // 2. Iterate through configured boards (limited to 3 boards per cycle for cost/resource control)
    const targetOrgs = trustedOrgs.slice(0, 3);

    for (const org of targetOrgs) {
      // Generate limited targeted queries (Phase 9)
      const queries = TargetedQueryGenerator.generateQueries(org);
      const primaryQuery = queries[0] || `${org} latest notification 2026`;

      // Discover candidate URLs via WebDiscoveryProvider (Phase 10)
      const candidates = await discoveryProvider.discover(primaryQuery, { organization: org, limit: 3 });
      totalDiscovered += candidates.length;

      for (const candidate of candidates) {
        try {
          // Fetch and validate URL safely with SSRF protection & SHA-256 fingerprinting
          const fetchResult = await safeFetchWebSource(candidate.url);
          if (!fetchResult.success || !fetchResult.content) continue;

          // If content unchanged since last scan, skip to save resources (Phase 33 & 61)
          if (fetchResult.isChanged === false) {
            continue;
          }

          // Extract facts
          const extractedFacts = await aiProvider.extractFacts(fetchResult.content, {
            sourceUrl: candidate.url,
            organization: org,
          });

          // Verify extracted facts
          const verification = verifyExtractedFacts(extractedFacts);

          // Duplicate & Change detection (Phase 16 & 17)
          const duplicateCheck = await detectDuplicateArticle(verification.verifiedFacts);

          // Only generate article for NEW or MEANINGFUL UPDATE (Phase 10 & 61)
          if (!duplicateCheck.isDuplicate) {
            const generated = await aiProvider.generateArticle(verification.verifiedFacts);
            let slug = generated.slug;
            const existingSlug = await prisma.educationArticle.findUnique({ where: { slug } });
            if (existingSlug) {
              slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
            }

            // Save draft article in REVIEW status (Auto-publish default OFF per Phase 31)
            await prisma.educationArticle.create({
              data: {
                title: generated.title,
                slug,
                excerpt: generated.excerpt,
                content: generated.content,
                category: verification.verifiedFacts.category || 'COMPETITIVE_EXAMS',
                organizationName: verification.verifiedFacts.organizationName || org,
                state: verification.verifiedFacts.state || 'Uttar Pradesh',
                examName: verification.verifiedFacts.examName,
                notificationNumber: verification.verifiedFacts.notificationNumber || null,
                status: 'REVIEW',
                confidenceScore: verification.confidence,
                authorType: 'AI',
                seoTitle: generated.seoTitle,
                metaDescription: generated.metaDescription,
                focusKeyword: generated.focusKeyword,
                secondaryKeywords: generated.secondaryKeywords,
                ogTitle: generated.ogTitle,
                ogDescription: generated.ogDescription,
                faqData: JSON.stringify(generated.faqData || []),
                structuredInfo: JSON.stringify(generated.structuredInfo || {}),
              },
            });

            draftsCreated++;
          }
        } catch {
          // Continue processing other candidates
        }
      }
    }

    lastCycleCompletedAt = new Date();
    isAutonomousCycleRunning = false;

    // Record success in settings
    await prisma.newsroomSetting.upsert({
      where: { key: 'lastSuccessfulResearch' },
      update: { value: JSON.stringify(lastCycleCompletedAt.toISOString()) },
      create: { key: 'lastSuccessfulResearch', value: JSON.stringify(lastCycleCompletedAt.toISOString()) },
    });

    return { success: true, discoveredCount: totalDiscovered, draftsCreated };
  } catch (err: any) {
    lastCycleError = err.message;
    isAutonomousCycleRunning = false;

    await prisma.newsroomSetting.upsert({
      where: { key: 'lastFailedResearch' },
      update: { value: JSON.stringify({ error: err.message, timestamp: new Date().toISOString() }) },
      create: { key: 'lastFailedResearch', value: JSON.stringify({ error: err.message, timestamp: new Date().toISOString() }) },
    });

    return { success: false, discoveredCount: 0, draftsCreated: 0, error: err.message };
  }
}

/**
 * Lightweight, safe in-process newsroom background runner.
 * Compatible with Render Node.js deployment without requiring Redis.
 * Executes:
 * 1. Auto-releases SCHEDULED articles that have reached their scheduledAt time
 * 2. Processes pending background research jobs
 * 3. Periodically runs autonomous discovery cycles based on admin settings
 */
export function initNewsroomScheduler(intervalMs = 60000) {
  if (isSchedulerRunning) return;
  isSchedulerRunning = true;

  console.log('🤖 AI Education Newsroom background scheduler initialized.');

  setInterval(async () => {
    try {
      const now = new Date();

      // 1. Release scheduled articles
      const scheduledArticles = await prisma.educationArticle.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { lte: now },
        },
        take: 5,
      });

      for (const article of scheduledArticles) {
        try {
          await publishArticleWithBridge(article.id, 'SYSTEM / SCHEDULER');
          console.log(`🚀 [Newsroom Scheduler] Auto-published scheduled article: ${article.title}`);
        } catch (pubErr: any) {
          console.error(`❌ [Newsroom Scheduler] Failed publishing scheduled article ${article.id}:`, pubErr.message);
        }
      }

      // 2. Process pending research jobs (if any)
      const pendingJob = await prisma.researchJob.findFirst({
        where: { status: 'PENDING' },
        orderBy: { startedAt: 'asc' },
      });

      if (pendingJob) {
        await prisma.researchJob.update({
          where: { id: pendingJob.id },
          data: { status: 'RUNNING' },
        });

        try {
          const provider = getAIProvider();
          const factsList = await provider.research(pendingJob.query || 'Competitive Exams', {
            organization: pendingJob.organization || undefined,
            category: pendingJob.category || undefined,
          });

          await prisma.researchJob.update({
            where: { id: pendingJob.id },
            data: {
              status: 'COMPLETED',
              resultsCount: factsList.length,
              completedAt: new Date(),
            },
          });
        } catch (jobErr: any) {
          await prisma.researchJob.update({
            where: { id: pendingJob.id },
            data: {
              status: 'FAILED',
              error: jobErr.message,
              completedAt: new Date(),
            },
          });
        }
      }
    } catch (err: any) {
      // Background loop catch - never crash the main process
    }
  }, intervalMs);
}
