import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { emailOtpService } from '../services/emailOtp.service';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'losamajhlo_jwt_secret_token_2026_super_secure';

// POST /api/auth/register (Student registration)
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase().trim() },
          ...(phone ? [{ phone: phone.trim() }] : []),
        ],
      },
    });

    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email or phone number is already registered.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : null,
        passwordHash,
        role: 'USER',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const cleanInput = String(email).trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanInput },
          { phone: cleanInput },
        ],
      },
      include: {
        teacherApplication: true,
        staffPermission: true,
      },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email/phone or password.' });
      return;
    }

    // Verify Password first
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email/phone or password.' });
      return;
    }

    // Check Teacher Application status if user has a teacher application
    if (user.teacherApplication) {
      const appStatus = user.teacherApplication.status;

      if (appStatus === 'SUSPENDED' || !user.isActive) {
        res.status(403).json({
          success: false,
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your teacher account has been suspended by administration. Access to workspace is disabled.',
        });
        return;
      }

      if (appStatus === 'PENDING_REVIEW') {
        res.status(403).json({
          success: false,
          code: 'APPLICATION_PENDING_REVIEW',
          status: 'PENDING_REVIEW',
          message: 'Your teacher application is currently UNDER REVIEW by the administration. You will be able to log in once your application is approved.',
        });
        return;
      }

      if (appStatus === 'CHANGES_REQUESTED') {
        res.status(403).json({
          success: false,
          code: 'APPLICATION_CHANGES_REQUESTED',
          status: 'CHANGES_REQUESTED',
          remarks: user.teacherApplication.adminRemarks,
          message: `The administrator requested changes to your application: "${user.teacherApplication.adminRemarks || 'Please review your application'}". Please edit and resubmit.`,
        });
        return;
      }

      if (appStatus === 'REJECTED') {
        res.status(403).json({
          success: false,
          code: 'APPLICATION_REJECTED',
          status: 'REJECTED',
          remarks: user.teacherApplication.adminRemarks,
          message: `Your teacher application was not approved: "${user.teacherApplication.adminRemarks || 'Did not meet criteria'}".`,
        });
        return;
      }
    }

    // Check generic account active state
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        code: 'ACCOUNT_DEACTIVATED',
        message: 'Your account is deactivated. Please contact support.',
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        staffPermission: user.staffPermission || null,
        isTeacher: user.role === 'TEACHER' || user.role === 'INSTRUCTOR',
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
        staffPermission: true,
        teacherApplication: {
          select: {
            id: true,
            status: true,
            specialization: true,
            bio: true,
            assignedSubjects: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            cartItems: true,
            wishlistItems: true,
            testAttempts: true,
            orders: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password/otp/send
router.post('/forgot-password/otp/send', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email address is required.' });
      return;
    }

    const result = await emailOtpService.sendOtp(email, 'FORGOT_PASSWORD');
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password/otp/verify-reset
router.post('/forgot-password/otp/verify-reset', async (req, res, next) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword) {
      res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ success: false, message: 'Passwords do not match.' });
      return;
    }

    // Verify OTP
    const verifyResult = await emailOtpService.verifyOtp(email, otp, 'FORGOT_PASSWORD');
    if (!verifyResult.success) {
      res.status(400).json(verifyResult);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: { passwordHash },
    });

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/change-password (Logged-in user)
router.post('/change-password', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current password and new password are required.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ success: false, message: 'New passwords do not match.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { name, phone, currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
        return;
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        return;
      }
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
      },
    });

    res.json({ success: true, message: 'Profile updated successfully!', user: updated });
  } catch (error) {
    next(error);
  }
});

export default router;
