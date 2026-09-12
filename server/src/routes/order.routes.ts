import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/orders/checkout (Create order, verify payment, auto-enroll)
router.post('/checkout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { courseIds, promoCode, paymentMethod } = req.body;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      res.status(400).json({ success: false, message: 'At least one course is required for checkout.' });
      return;
    }

    // Fetch actual database course records (Never trust client prices)
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
    });

    if (courses.length !== courseIds.length) {
      res.status(400).json({ success: false, message: 'One or more selected courses are invalid.' });
      return;
    }

    // Check if user is already enrolled
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        userId: req.user!.id,
        courseId: { in: courseIds },
        status: 'ACTIVE',
      },
    });

    if (existingEnrollments.length > 0) {
      res.status(400).json({
        success: false,
        message: 'You are already enrolled in one or more of the selected courses.',
      });
      return;
    }

    // Calculate subtotal from authoritative database prices
    const subtotal = courses.reduce((sum, c) => {
      const priceToUse = c.discountedPrice !== null ? c.discountedPrice : c.price;
      return sum + priceToUse;
    }, 0);

    // Validate promo code if applied
    let discount = 0;
    let validPromo: any = null;

    if (promoCode) {
      validPromo = await prisma.promoCode.findUnique({
        where: { code: promoCode.trim().toUpperCase() },
      });

      if (validPromo && validPromo.isActive && validPromo.expiryDate >= new Date()) {
        if (subtotal >= validPromo.minOrderAmount) {
          if (validPromo.discountType === 'PERCENTAGE') {
            discount = (subtotal * validPromo.discountValue) / 100;
            if (validPromo.maxDiscount && discount > validPromo.maxDiscount) {
              discount = validPromo.maxDiscount;
            }
          } else {
            discount = validPromo.discountValue;
          }
          discount = Math.min(discount, subtotal);
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discount);
    const orderNumber = `LSL-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create Order with Items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user!.id,
          subtotal: Math.round(subtotal * 100) / 100,
          discount: Math.round(discount * 100) / 100,
          tax: 0,
          totalAmount: Math.round(totalAmount * 100) / 100,
          promoCodeId: validPromo ? validPromo.id : null,
          status: 'COMPLETED',
          paymentMethod: paymentMethod || 'ONLINE_UPI',
          paymentProvider: 'RAZORPAY_SIMULATED',
          transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          items: {
            create: courses.map((c) => ({
              courseId: c.id,
              price: c.discountedPrice !== null ? c.discountedPrice : c.price,
            })),
          },
        },
        include: { items: true },
      });

      // Enroll user in all courses
      for (const c of courses) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (c.validityDays || 365));

        await tx.enrollment.upsert({
          where: {
            userId_courseId: { userId: req.user!.id, courseId: c.id },
          },
          update: {
            status: 'ACTIVE',
            expiresAt,
            orderId: createdOrder.id,
          },
          create: {
            userId: req.user!.id,
            courseId: c.id,
            orderId: createdOrder.id,
            status: 'ACTIVE',
            expiresAt,
          },
        });
      }

      // Record promo code usage if applied
      if (validPromo) {
        await tx.promoCodeUsage.create({
          data: {
            promoCodeId: validPromo.id,
            userId: req.user!.id,
            orderId: createdOrder.id,
          },
        });
        await tx.promoCode.update({
          where: { id: validPromo.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Remove enrolled courses from Cart
      await tx.cartItem.deleteMany({
        where: {
          userId: req.user!.id,
          courseId: { in: courseIds },
        },
      });

      return createdOrder;
    });

    res.status(201).json({
      success: true,
      message: 'Order placed and enrollment activated successfully!',
      order,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/my-orders (User order history)
router.get('/my-orders', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            course: {
              select: { id: true, title: true, slug: true, thumbnail: true },
            },
          },
        },
        promoCode: {
          select: { code: true, discountType: true, discountValue: true },
        },
      },
    });

    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
});

// GET /api/orders (Admin list orders)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const where: any = {};
    if (status) where.status = String(status);
    if (search) {
      where.OR = [
        { orderNumber: { contains: String(search) } },
        { user: { name: { contains: String(search) } } },
        { user: { email: { contains: String(search) } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
        promoCode: { select: { code: true } },
      },
    });

    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/:id/status (Admin update status)
router.put('/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, message: 'Order status updated.', order: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
