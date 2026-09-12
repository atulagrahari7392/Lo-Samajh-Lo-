import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/recorded-classes
router.get('/', async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const where: any = { isPublished: true };
    if (courseId) where.courseId = String(courseId);

    const classes = await prisma.recordedClass.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { id: true, title: true, slug: true } },
      },
    });

    res.json({ success: true, classes });
  } catch (error) {
    next(error);
  }
});

// Admin Recorded Classes
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const classes = await prisma.recordedClass.findMany({
      orderBy: { createdAt: 'desc' },
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
    const { courseId, title, chapter, durationMinutes, videoUrl, thumbnail, description, isPublished } = req.body;

    if (!courseId || !title || !videoUrl) {
      res.status(400).json({ success: false, message: 'Course ID, title, and video URL are required.' });
      return;
    }

    const recorded = await prisma.recordedClass.create({
      data: {
        courseId,
        title: title.trim(),
        chapter: chapter?.trim() || 'Chapter 1',
        durationMinutes: parseInt(durationMinutes, 10) || 45,
        videoUrl: videoUrl.trim(),
        thumbnail: thumbnail?.trim() || null,
        description: description?.trim() || null,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      },
    });

    res.status(201).json({ success: true, message: 'Recorded class added.', recorded });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.recordedClass.delete({ where: { id } });
    res.json({ success: true, message: 'Recorded class deleted.' });
  } catch (error) {
    next(error);
  }
});

export default router;
