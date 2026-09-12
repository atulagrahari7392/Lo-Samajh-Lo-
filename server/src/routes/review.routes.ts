import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/reviews/featured (Public testimonials)
router.get('/featured', async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { isApproved: true, isFeatured: true },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        course: { select: { id: true, title: true, slug: true } },
      },
    });
    res.json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
});

// POST /api/reviews (Student add review)
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { courseId, rating, comment } = req.body;

    if (!courseId || !rating || !comment) {
      res.status(400).json({ success: false, message: 'Course ID, rating, and comment are required.' });
      return;
    }

    const review = await prisma.review.create({
      data: {
        courseId,
        userId: req.user!.id,
        rating: Math.min(5, Math.max(1, parseInt(rating, 10) || 5)),
        comment: comment.trim(),
        isApproved: true,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Thank you! Your review has been submitted.', review });
  } catch (error) {
    next(error);
  }
});

// Admin Review Routes
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });
    res.json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isApproved, isFeatured } = req.body;

    const data: any = {};
    if (isApproved !== undefined) data.isApproved = Boolean(isApproved);
    if (isFeatured !== undefined) data.isFeatured = Boolean(isFeatured);

    const updated = await prisma.review.update({
      where: { id },
      data,
    });

    res.json({ success: true, message: 'Review updated.', review: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.review.delete({ where: { id } });
    res.json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    next(error);
  }
});

export default router;
