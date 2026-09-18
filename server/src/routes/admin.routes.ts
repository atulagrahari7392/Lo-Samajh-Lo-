import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { emailOtpService } from '../services/emailOtp.service';
import { executeDemoDataCleanup } from '../scripts/cleanup-demo-data';

const router = Router();

// GET /api/admin/stats (Aggregated statistics directly from PostgreSQL)
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
      prisma.order.count({ where: { status: 'COMPLETED' } }),
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

    // Calculate real monthly revenue growth only if historical data exists
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisMonthOrders, lastMonthOrders] = await Promise.all([
      prisma.order.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: startOfThisMonth } },
        select: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } },
        select: { totalAmount: true },
      }),
    ]);

    const thisMonthRev = thisMonthOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const lastMonthRev = lastMonthOrders.reduce((acc, o) => acc + o.totalAmount, 0);

    let revenueGrowth: string | null = null;
    if (lastMonthRev > 0) {
      const pct = Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100);
      revenueGrowth = `${pct >= 0 ? '+' : ''}${pct}% vs last month`;
    }

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
        revenueGrowth,
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

    if (!['USER', 'ADMIN', 'INSTRUCTOR', 'TEACHER', 'STAFF_MANAGER'].includes(role)) {
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

// ============================================================
// EMAIL DIAGNOSTIC & SMTP CONFIGURATION (Page 12 Requirement)
// ============================================================

/**
 * POST /api/admin/email/test
 * Diagnostic endpoint: tests email provider connection, measures latency,
 * sends test email if recipient is specified, never leaks secrets.
 */
router.post('/email/test', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { recipientEmail } = req.body;
    const testRecipient = recipientEmail || req.user?.email;

    const result = await emailOtpService.testEmailConnection(testRecipient);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      provider: 'NONE',
      status: 'DISCONNECTED',
      sender: null,
      lastTestSuccessful: false,
      latencyMs: 0,
      message: 'Failed to execute email diagnostic test.',
      error: error.message || 'Internal server error during email test.',
    });
  }
});

/**
 * GET /api/admin/email/settings
 * Fetches SMTP settings (masked password)
 */
router.get('/email/settings', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const config = await emailOtpService.getSmtpConfig();
    res.json({
      success: true,
      settings: {
        host: config.host || '',
        port: config.port || 587,
        user: config.user || '',
        hasPassword: Boolean(config.pass),
        secure: config.secure,
        from: config.from || '',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/email/settings
 * Saves SMTP settings in database SiteSetting ('smtp_settings')
 */
router.post('/email/settings', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { host, port, user, pass, secure, from } = req.body;

    if (!user) {
      res.status(400).json({ success: false, message: 'SMTP User/Email is required.' });
      return;
    }

    // If password is not provided in update, retain existing password
    let finalPass = pass;
    if (!finalPass) {
      const existing = await emailOtpService.getSmtpConfig();
      finalPass = existing.pass || '';
    }

    const payload = JSON.stringify({
      host: host?.trim() || 'smtp.gmail.com',
      port: Number(port) || 465,
      user: user.trim(),
      pass: finalPass,
      secure: secure !== undefined ? Boolean(secure) : Number(port) === 465,
      from: from?.trim() || `"Lo Samajh Lo" <${user.trim()}>`,
    });

    await prisma.siteSetting.upsert({
      where: { key: 'smtp_settings' },
      update: { value: payload },
      create: { key: 'smtp_settings', value: payload },
    });

    res.json({
      success: true,
      message: 'SMTP settings saved successfully in production database.',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// SAFE PRODUCTION DATA CLEANUP (Page 20 Requirement)
// ============================================================

/**
 * POST /api/admin/system/cleanup-demo-data
 * Deterministically removes confirmed seed records from live PostgreSQL
 * while strictly preserving admin account, categories, and genuine users.
 */
router.post('/system/cleanup-demo-data', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const result = await executeDemoDataCleanup();
    res.json({
      success: true,
      message: 'Demo and seed data safely cleaned from production database.',
      result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Database cleanup failed.',
      error: error.message,
    });
  }
});

export default router;
