import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

export interface AuthUser {
  id: string;
  email: string;
  role: string; // 'SUPER_ADMIN' | 'ADMIN' | 'STAFF_MANAGER' | 'TEACHER' | 'INSTRUCTOR' | 'USER'
  name: string;
  isActive: boolean;
  staffPermission?: {
    canTeacherApplications: boolean;
    canTeacherDocuments: boolean;
    canContentApproval: boolean;
    canCourseAssignment: boolean;
    canPayments: boolean;
    canUsers: boolean;
    canAdminManagement: boolean;
    canSiteSettings: boolean;
    canDatabase: boolean;
  } | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'losamajhlo_jwt_secret_token_2026_super_secure';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; name: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        isActive: true,
        staffPermission: true,
      },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid token. User account does not exist.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended or deactivated. Please contact support.',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      isActive: user.isActive,
      staffPermission: user.staffPermission || null,
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; name: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          isActive: true,
          staffPermission: true,
        },
      });
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          isActive: user.isActive,
          staffPermission: user.staffPermission || null,
        };
      }
    }
  } catch (error) {
    // Ignore invalid token in optionalAuth
  }
  next();
};

/**
 * Enforces Administrator or Super Administrator privileges
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    res.status(403).json({ success: false, message: 'Forbidden. Admin privileges required.' });
    return;
  }
  next();
};

/**
 * Enforces Super Administrator privileges only
 */
export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, message: 'Forbidden. Super Admin privileges required.' });
    return;
  }
  next();
};

export type StaffPermissionKey =
  | 'canTeacherApplications'
  | 'canTeacherDocuments'
  | 'canContentApproval'
  | 'canCourseAssignment'
  | 'canPayments'
  | 'canUsers'
  | 'canAdminManagement'
  | 'canSiteSettings'
  | 'canDatabase';

/**
 * Allows SUPER_ADMIN, ADMIN, or STAFF_MANAGER (if staff manager has the specific permission)
 */
export const requireAdminOrStaffManager = (permissionKey?: StaffPermissionKey) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Super Admin & Admin have full authority
    if (['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      next();
      return;
    }

    // Staff Manager authority check
    if (req.user.role === 'STAFF_MANAGER') {
      if (!permissionKey) {
        next();
        return;
      }
      const perm = req.user.staffPermission;
      if (perm && (perm as any)[permissionKey] === true) {
        next();
        return;
      }
      res.status(403).json({
        success: false,
        message: `Forbidden. You do not have permission for this management action (${permissionKey}).`,
      });
      return;
    }

    res.status(403).json({ success: false, message: 'Forbidden. Administrative or Staff privileges required.' });
  };
};

/**
 * Enforces verified active teacher role and active approved application
 */
export const requireTeacher = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }

  // Administrators always have access
  if (['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
    next();
    return;
  }

  if (req.user.role !== 'TEACHER' && req.user.role !== 'INSTRUCTOR') {
    res.status(403).json({ success: false, message: 'Forbidden. Teacher account required.' });
    return;
  }

  // Verify approved application
  const application = await prisma.teacherApplication.findUnique({
    where: { userId: req.user.id },
  });

  if (!application) {
    res.status(403).json({ success: false, message: 'Teacher application not found.' });
    return;
  }

  if (application.status === 'SUSPENDED') {
    res.status(403).json({
      success: false,
      code: 'ACCOUNT_SUSPENDED',
      message: 'Your teacher account has been suspended by administration. Access to workspace is restricted.',
    });
    return;
  }

  if (application.status !== 'APPROVED') {
    res.status(403).json({
      success: false,
      code: 'APPLICATION_NOT_APPROVED',
      status: application.status,
      message: `Your teacher application is currently ${application.status}. Workspace access will be enabled upon approval.`,
    });
    return;
  }

  next();
};
