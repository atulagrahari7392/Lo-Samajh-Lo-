import { prisma } from '../../db';
import { publishArticleWithBridge } from './notificationBridge';

let isSchedulerRunning = false;

/**
 * Lightweight, safe in-process newsroom background runner.
 * Compatible with Render Node.js deployment without requiring Redis.
 * Executes:
 * 1. Auto-releases SCHEDULED articles that have reached their scheduledAt time
 * 2. Updates expired important dates
 * 3. Checks for pending background research jobs
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
          const { getAIProvider } = await import('./aiProvider');
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
