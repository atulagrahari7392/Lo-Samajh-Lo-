import { prisma } from '../../db';
import { HighPriorityEvent } from './types';

/**
 * Publishes an EducationArticle atomically:
 * 1. Updates EducationArticle status to 'PUBLISHED' and publishedAt to now()
 * 2. Creates or links corresponding entry in the existing 'Notification' table
 * 3. Broadcasts real-time event through Socket.IO (if available)
 * 4. Logs action in NewsroomAuditLog
 */
export async function publishArticleWithBridge(
  articleId: string,
  actor = 'SYSTEM',
  event?: HighPriorityEvent
): Promise<{ success: boolean; article: any; notification: any }> {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch current article with dates
    const article = await tx.educationArticle.findUnique({
      where: { id: articleId },
      include: { dates: true, links: true },
    });

    if (!article) {
      throw new Error(`Education article ${articleId} not found.`);
    }

    // Determine category and priority mapping for existing Notification model
    let notifCategory = 'EXAM';
    const catUpper = article.category.toUpperCase();
    if (catUpper.includes('UNIVERSITY') || catUpper.includes('COLLEGE')) notifCategory = 'UNIVERSITY';
    else if (catUpper.includes('COURSE')) notifCategory = 'COURSE';
    else if (catUpper.includes('ACADEMIC') || catUpper.includes('BOARD')) notifCategory = 'ACADEMIC';
    else notifCategory = 'EXAM';

    const priority = article.priority === 'URGENT' ? 'URGENT' : article.priority === 'HIGH' ? 'HIGH' : 'NORMAL';

    // Format badge text for notification
    const eventPrefix = event ? `[${event.replace(/_/g, ' ')}] ` : '';
    const notifTitle = `${eventPrefix}${article.title}`.slice(0, 150);
    const linkUrl = `/notifications/${article.slug}`;

    // 2. Update article to PUBLISHED
    const updatedArticle = await tx.educationArticle.update({
      where: { id: articleId },
      data: {
        status: 'PUBLISHED',
        publishedAt: article.publishedAt || new Date(),
        lastVerifiedAt: new Date(),
      },
    });

    // 3. Create or update record in existing Notification model
    const existingNotif = await tx.notification.findFirst({
      where: { articleId: article.id },
    });

    let notificationRecord: any;
    if (existingNotif) {
      notificationRecord = await tx.notification.update({
        where: { id: existingNotif.id },
        data: {
          title: notifTitle,
          message: article.excerpt,
          category: notifCategory,
          priority,
          linkUrl,
          publishedAt: new Date(),
          status: 'PUBLISHED',
        },
      });
    } else {
      notificationRecord = await tx.notification.create({
        data: {
          title: notifTitle,
          message: article.excerpt,
          category: notifCategory,
          priority,
          linkUrl,
          publishedAt: new Date(),
          status: 'PUBLISHED',
          articleId: article.id,
          isNewsroom: true,
        },
      });
    }

    // 4. Create Audit Log entry
    await tx.newsroomAuditLog.create({
      data: {
        action: 'PUBLISH',
        articleId: article.id,
        actor,
        details: JSON.stringify({
          publishedAt: new Date().toISOString(),
          notificationId: notificationRecord.id,
          event: event || 'NEW_PUBLICATION',
        }),
      },
    });

    return {
      success: true,
      article: updatedArticle,
      notification: notificationRecord,
    };
  });
}

/**
 * Emits real-time notification to all connected clients via Socket.IO.
 */
export async function broadcastRealtimeNotification(notification: any, article: any) {
  try {
    const { io } = await import('../../socket');
    if (io) {
      io.emit('notification:new', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        category: notification.category,
        priority: notification.priority,
        linkUrl: notification.linkUrl,
        slug: article.slug,
        publishedAt: notification.publishedAt,
      });
    }
  } catch (err) {
    // Non-blocking socket emission
  }
}
