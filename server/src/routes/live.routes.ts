import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/live-classes (Public / Student upcoming & active)
router.get('/', async (req, res, next) => {
  try {
    const classes = await prisma.liveClass.findMany({
      where: {
        status: { in: ['UPCOMING', 'LIVE'] },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        course: { select: { id: true, title: true, slug: true } },
      },
    });
    res.json({ success: true, classes });
  } catch (error) {
    next(error);
  }
});

// Admin Live Class Routes
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const classes = await prisma.liveClass.findMany({
      orderBy: { scheduledAt: 'desc' },
      include: {
        course: { select: { id: true, title: true } },
      },
    });
    res.json({ success: true, classes });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { title, courseId, instructor, description, scheduledAt, durationMinutes, meetingUrl, status, thumbnail } = req.body;

    if (!title || !scheduledAt) {
      res.status(400).json({ success: false, message: 'Title and scheduled time are required.' });
      return;
    }

    const liveClass = await prisma.liveClass.create({
      data: {
        title: title.trim(),
        courseId: courseId || null,
        instructor: instructor?.trim() || 'Atul Agrahari',
        description: description?.trim() || null,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: parseInt(durationMinutes, 10) || 60,
        meetingUrl: meetingUrl?.trim() || 'https://meet.google.com/lsl-live',
        status: status || 'UPCOMING',
        thumbnail: thumbnail?.trim() || null,
      },
    });

    res.status(201).json({ success: true, message: 'Live class scheduled.', liveClass });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, courseId, instructor, description, scheduledAt, durationMinutes, meetingUrl, status, thumbnail } = req.body;

    const updated = await prisma.liveClass.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(courseId !== undefined ? { courseId: courseId || null } : {}),
        ...(instructor ? { instructor: instructor.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
        ...(durationMinutes !== undefined ? { durationMinutes: parseInt(durationMinutes, 10) } : {}),
        ...(meetingUrl ? { meetingUrl: meetingUrl.trim() } : {}),
        ...(status ? { status } : {}),
        ...(thumbnail !== undefined ? { thumbnail: thumbnail?.trim() || null } : {}),
      },
    });

    res.json({ success: true, message: 'Live class updated.', liveClass: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.liveClass.delete({ where: { id } });
    res.json({ success: true, message: 'Live class deleted.' });
  } catch (error) {
    next(error);
  }
});

export default router;
