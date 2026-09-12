import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/cart
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const items = await prisma.cartItem.findMany({
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

    const courses = items.map((item) => item.course);
    const subtotal = courses.reduce((sum, c) => sum + (c.discountedPrice !== null ? c.discountedPrice : c.price), 0);
    const originalTotal = courses.reduce((sum, c) => sum + c.price, 0);
    const savings = originalTotal - subtotal;

    res.json({
      success: true,
      items,
      courses,
      count: items.length,
      subtotal,
      originalTotal,
      savings,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart/add
router.post('/add', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      res.status(400).json({ success: false, message: 'Course ID is required.' });
      return;
    }

    // Check if already enrolled
    const enrolled = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId: req.user!.id, courseId },
      },
    });

    if (enrolled && enrolled.status === 'ACTIVE') {
      res.status(400).json({ success: false, message: 'You are already enrolled in this course.' });
      return;
    }

    const item = await prisma.cartItem.upsert({
      where: {
        userId_courseId: { userId: req.user!.id, courseId },
      },
      update: {},
      create: {
        userId: req.user!.id,
        courseId,
      },
      include: { course: true },
    });

    res.status(201).json({ success: true, message: 'Course added to cart!', item });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/:courseId
router.delete('/:courseId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { courseId } = req.params;

    await prisma.cartItem.deleteMany({
      where: {
        userId: req.user!.id,
        courseId,
      },
    });

    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart (clear all)
router.delete('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId: req.user!.id },
    });

    res.json({ success: true, message: 'Cart cleared.' });
  } catch (error) {
    next(error);
  }
});

export default router;
