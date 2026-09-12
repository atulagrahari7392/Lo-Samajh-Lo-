import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/wishlist
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.id },
      include: {
        course: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      items,
      courses: items.map((i) => i.course),
      count: items.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/wishlist/toggle
router.post('/toggle', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      res.status(400).json({ success: false, message: 'Course ID is required.' });
      return;
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_courseId: { userId: req.user!.id, courseId },
      },
    });

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { id: existing.id },
      });
      res.json({ success: true, message: 'Course removed from wishlist.', isWishlisted: false });
    } else {
      await prisma.wishlistItem.create({
        data: {
          userId: req.user!.id,
          courseId,
        },
      });
      res.json({ success: true, message: 'Course added to wishlist.', isWishlisted: true });
    }
  } catch (error) {
    next(error);
  }
});

// POST /api/wishlist/move-to-cart
router.post('/move-to-cart', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      res.status(400).json({ success: false, message: 'Course ID is required.' });
      return;
    }

    // Remove from wishlist
    await prisma.wishlistItem.deleteMany({
      where: { userId: req.user!.id, courseId },
    });

    // Add to cart
    await prisma.cartItem.upsert({
      where: {
        userId_courseId: { userId: req.user!.id, courseId },
      },
      update: {},
      create: {
        userId: req.user!.id,
        courseId,
      },
    });

    res.json({ success: true, message: 'Moved course to cart.' });
  } catch (error) {
    next(error);
  }
});

export default router;
