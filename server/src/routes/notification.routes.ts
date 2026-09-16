import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, optionalAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { calculateDeadlineStatus, getTimelineBucket } from '../services/aiNewsroom/deadlineCalculator';

const router = Router();

// ============================================================
// 1. PUBLIC STUDENT NOTIFICATIONS & EDUCATION UPDATES
// ============================================================

// GET /api/notifications (Public / Student updates list with search, filters & pagination)
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { category, search, filter, state, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { status: 'PUBLISHED' };

    // Category filter
    if (category && String(category).trim() !== '') {
      const cat = String(category).toUpperCase();
      where.OR = [
        { category: cat },
        { article: { category: cat } },
      ];
    }

    // Keyword Search (exam name, org, title, message)
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.AND = [
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { message: { contains: q, mode: 'insensitive' } },
            { article: { examName: { contains: q, mode: 'insensitive' } } },
            { article: { organizationName: { contains: q, mode: 'insensitive' } } },
            { article: { focusKeyword: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ];
    }

    const [totalCount, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          article: {
            select: {
              id: true,
              slug: true,
              examName: true,
              organizationName: true,
              category: true,
              lastVerifiedAt: true,
              viewsCount: true,
              dates: {
                orderBy: { date: 'asc' },
              },
              links: true,
              sources: {
                select: { domain: true, sourceType: true },
                take: 1,
              },
            },
          },
        },
      }),
    ]);

    // Track read state for authenticated user
    let readIds = new Set<string>();
    if (req.user) {
      const reads = await prisma.notificationRead.findMany({
        where: { userId: req.user.id },
        select: { notificationId: true },
      });
      readIds = new Set(reads.map((r) => r.notificationId));
    }

    const unreadCount = req.user
      ? notifications.filter((n) => !readIds.has(n.id)).length
      : notifications.length;

    // Enhance each item with dynamic deadline intelligence
    const items = notifications.map((n) => {
      let deadlineStatus = null;
      let primaryDate = null;

      if (n.article && n.article.dates.length > 0) {
        // Find nearest active date or last date
        const activeDates = n.article.dates
          .map((d) => ({ ...d, calc: calculateDeadlineStatus(d.date) }))
          .filter((d) => !d.calc.isExpired);

        if (activeDates.length > 0) {
          primaryDate = activeDates[0];
          deadlineStatus = activeDates[0].calc;
        } else {
          // If all dates expired, display the latest one with Expired status
          const lastDate = n.article.dates[n.article.dates.length - 1];
          primaryDate = lastDate;
          deadlineStatus = calculateDeadlineStatus(lastDate.date);
        }
      }

      return {
        ...n,
        isRead: readIds.has(n.id),
        deadlineStatus,
        primaryDate,
      };
    });

    res.json({
      success: true,
      notifications: items,
      unreadCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications/dates (Dedicated Important Dates Dashboard data)
router.get('/dates', async (req, res, next) => {
  try {
    const dates = await prisma.importantDate.findMany({
      where: {
        article: {
          status: 'PUBLISHED',
        },
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
            examName: true,
            organizationName: true,
            category: true,
          },
        },
      },
      orderBy: { date: 'asc' },
      take: 100,
    });

    const timeline = {
      TODAY: [] as any[],
      THIS_WEEK: [] as any[],
      CLOSING_SOON: [] as any[],
      UPCOMING: [] as any[],
      EXPIRED: [] as any[],
    };

    for (const d of dates) {
      const status = calculateDeadlineStatus(d.date);
      const bucket = getTimelineBucket(d.date);
      const item = {
        id: d.id,
        label: d.label,
        date: d.date,
        formattedDate: status.formattedDate,
        dateType: d.dateType,
        statusText: status.statusText,
        badgeColor: status.badgeColor,
        isExpired: status.isExpired,
        daysRemaining: status.daysRemaining,
        article: d.article,
      };
      timeline[bucket].push(item);
    }

    res.json({
      success: true,
      timeline,
      counts: {
        today: timeline.TODAY.length,
        thisWeek: timeline.THIS_WEEK.length,
        closingSoon: timeline.CLOSING_SOON.length,
        upcoming: timeline.UPCOMING.length,
        expired: timeline.EXPIRED.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications/articles/:slug (Public rich Article Detail Page)
router.get('/articles/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const article = await prisma.educationArticle.findUnique({
      where: { slug },
      include: {
        dates: { orderBy: { date: 'asc' } },
        links: true,
        sources: true,
        syllabus: { orderBy: { order: 'asc' } },
      },
    });

    if (!article || article.status !== 'PUBLISHED') {
      res.status(404).json({ success: false, message: 'Article not found or not published.' });
      return;
    }

    // Enhance dates with dynamic deadline intelligence
    const enhancedDates = article.dates.map((d) => ({
      ...d,
      deadlineStatus: calculateDeadlineStatus(d.date),
    }));

    // Parse JSON fields safely
    let faqData = [];
    let structuredInfo: any = {};
    try {
      if (article.faqData) faqData = JSON.parse(article.faqData);
      if (article.structuredInfo) structuredInfo = JSON.parse(article.structuredInfo);
    } catch {
      // safe fallback
    }

    // Internal Linking: Find related courses, test series, and study materials
    const [relatedCourses, relatedTests, relatedMaterials, recentUpdates] = await Promise.all([
      prisma.course.findMany({
        where: {
          OR: [
            { title: { contains: article.organizationName, mode: 'insensitive' } },
            { title: { contains: article.examName.slice(0, 6), mode: 'insensitive' } },
          ],
          status: 'PUBLISHED',
        },
        select: { id: true, title: true, slug: true, price: true, discountedPrice: true, thumbnail: true },
        take: 3,
      }),
      prisma.testSeries.findMany({
        where: {
          title: { contains: article.organizationName, mode: 'insensitive' },
          status: 'PUBLISHED',
        },
        select: { id: true, title: true, slug: true, totalTestsCount: true, price: true },
        take: 2,
      }),
      prisma.material.findMany({
        where: {
          examName: { contains: article.organizationName, mode: 'insensitive' },
          status: 'PUBLISHED',
        },
        select: { id: true, title: true, slug: true, fileType: true, fileSize: true, fileUrl: true },
        take: 3,
      }),
      prisma.educationArticle.findMany({
        where: {
          status: 'PUBLISHED',
          id: { not: article.id },
        },
        select: { id: true, title: true, slug: true, organizationName: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 5,
      }),
    ]);

    res.json({
      success: true,
      article: {
        ...article,
        dates: enhancedDates,
        faqData,
        structuredInfo,
      },
      related: {
        courses: relatedCourses,
        testSeries: relatedTests,
        materials: relatedMaterials,
        recentUpdates,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/articles/:id/view (Increment view counter)
router.post('/articles/:id/view', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.educationArticle.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// POST /api/notifications/:id/read (Mark as read)
router.post('/:id/read', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    await prisma.notificationRead.upsert({
      where: {
        notificationId_userId: { notificationId: id, userId: req.user!.id },
      },
      update: { readAt: new Date() },
      create: {
        notificationId: id,
        userId: req.user!.id,
      },
    });

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 2. EXISTING ADMIN NOTIFICATION BROADCAST ROUTES (PRESERVED)
// ============================================================

router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        article: {
          select: { id: true, slug: true, title: true, status: true },
        },
      },
    });
    res.json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { title, message, category, priority, linkUrl, expiresAt, status } = req.body;

    if (!title || !message) {
      res.status(400).json({ success: false, message: 'Title and message are required.' });
      return;
    }

    const notification = await prisma.notification.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        category: category?.toUpperCase() || 'GENERAL',
        priority: priority?.toUpperCase() || 'NORMAL',
        linkUrl: linkUrl?.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: status || 'PUBLISHED',
      },
    });

    res.status(201).json({ success: true, message: 'Notification broadcasted.', notification });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, message, category, priority, linkUrl, expiresAt, status } = req.body;

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(message ? { message: message.trim() } : {}),
        ...(category ? { category: category.toUpperCase() } : {}),
        ...(priority ? { priority: priority.toUpperCase() } : {}),
        ...(linkUrl !== undefined ? { linkUrl: linkUrl?.trim() || null } : {}),
        ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
        ...(status ? { status } : {}),
      },
    });

    res.json({ success: true, message: 'Notification updated.', notification: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.notification.delete({ where: { id } });
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    next(error);
  }
});

export default router;
