import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, optionalAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications (Public / Student updates)
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { category } = req.query;
    const where: any = { status: 'PUBLISHED' };
    if (category) where.category = String(category).toUpperCase();

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
    });

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

    const items = notifications.map((n) => ({
      ...n,
      isRead: readIds.has(n.id),
    }));

    res.json({ success: true, notifications: items, unreadCount });
  } catch (error) {
    next(error);
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

// Admin Notification Routes
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
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
