import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/admin/stats (Aggregated statistics from real database)
router.get('/stats', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalCourses,
      totalOrders,
      totalMaterials,
      totalTests,
      activeLiveClasses,
      totalRecordedClasses,
      pendingReviews,
      orders,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.order.count(),
      prisma.material.count(),
      prisma.test.count(),
      prisma.liveClass.count({ where: { status: { in: ['UPCOMING', 'LIVE'] } } }),
      prisma.recordedClass.count(),
      prisma.review.count({ where: { isApproved: false } }),
      prisma.order.findMany({
        where: { status: 'COMPLETED' },
        select: { totalAmount: true },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
      }),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { course: { select: { id: true, title: true } } } },
      },
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalMaterials,
        totalTests,
        activeLiveClasses,
        totalRecordedClasses,
        pendingReviews,
      },
      recentOrders,
      recentUsers,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users (User management list)
router.get('/users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { role, status, search } = req.query;

    const where: any = {};
    if (role) where.role = String(role);
    if (status) where.isActive = status === 'active';
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            orders: true,
            testAttempts: true,
          },
        },
      },
    });

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/users/:id/status (Toggle active/inactive)
router.put('/users/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    res.json({ success: true, message: 'User status updated.', user });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/users/:id/role (Update role)
router.put('/users/:id/role', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN', 'INSTRUCTOR'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role.' });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ success: true, message: 'User role updated.', user });
  } catch (error) {
    next(error);
  }
});

export default router;
