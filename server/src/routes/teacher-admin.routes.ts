import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdminOrStaffManager, requireAdmin, AuthRequest } from '../middleware/auth';
import { googleDriveService } from '../services/googleDrive.service';
import { normalizeImageUrl } from '../utils/url';

const router = Router();

// ============================================================
// 1. TEACHER MANAGEMENT DASHBOARD & APPLICATIONS
// ============================================================

/**
 * GET /api/admin/teachers/overview
 * KPI statistics for Admin Teacher Management panel
 */
router.get(
  '/overview',
  authenticate,
  requireAdminOrStaffManager('canTeacherApplications'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [totalTeachers, pendingApps, approvedTeachers, rejectedApps, suspendedTeachers] = await Promise.all([
        prisma.teacherApplication.count(),
        prisma.teacherApplication.count({ where: { status: 'PENDING_REVIEW' } }),
        prisma.teacherApplication.count({ where: { status: 'APPROVED' } }),
        prisma.teacherApplication.count({ where: { status: 'REJECTED' } }),
        prisma.teacherApplication.count({ where: { status: 'SUSPENDED' } }),
      ]);

      const pendingContentCount =
        (await prisma.courseLesson.count({ where: { approvalStatus: 'PENDING_REVIEW' } })) +
        (await prisma.material.count({ where: { approvalStatus: 'PENDING_REVIEW' } })) +
        (await prisma.test.count({ where: { approvalStatus: 'PENDING_REVIEW' } })) +
        (await prisma.liveClass.count({ where: { approvalStatus: 'PENDING_REVIEW' } }));

      res.json({
        success: true,
        stats: {
          totalTeachers,
          pendingApplications: pendingApps,
          approvedTeachers,
          rejectedApplications: rejectedApps,
          suspendedTeachers,
          pendingContentCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/teachers/applications
 * Returns applications filtered by status
 */
router.get(
  '/applications',
  authenticate,
  requireAdminOrStaffManager('canTeacherApplications'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status, search } = req.query;

      const where: any = {};
      if (status && status !== 'ALL') {
        where.status = String(status);
      }

      if (search) {
        where.OR = [
          { fullName: { contains: String(search), mode: 'insensitive' } },
          { email: { contains: String(search), mode: 'insensitive' } },
          { mobile: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const applications = await prisma.teacherApplication.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, isActive: true, createdAt: true } },
          reviewedBy: { select: { id: true, name: true } },
          assignments: {
            include: { course: { select: { id: true, title: true, slug: true } } },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });

      res.json({
        success: true,
        applications: applications.map((app) => ({
          ...app,
          profilePhoto: normalizeImageUrl(app.profilePhoto),
          subjects: app.subjects ? JSON.parse(app.subjects) : [],
          exams: app.exams ? JSON.parse(app.exams) : [],
          assignedSubjects: app.assignedSubjects ? JSON.parse(app.assignedSubjects) : [],
          assignedCourses: app.assignments.map((a) => a.course),
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/teachers/applications/:id
 * Full application inspection view (all 7 steps & documents)
 */
router.get(
  '/applications/:id',
  authenticate,
  requireAdminOrStaffManager('canTeacherApplications'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const application = await prisma.teacherApplication.findFirst({
        where: { OR: [{ id }, { userId: id }] },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true } },
          reviewedBy: { select: { id: true, name: true } },
          assignments: {
            include: { course: { select: { id: true, title: true, slug: true } } },
          },
        },
      });

      if (!application) {
        res.status(404).json({ success: false, message: 'Teacher application not found.' });
        return;
      }

      res.json({
        success: true,
        application: {
          ...application,
          profilePhoto: normalizeImageUrl(application.profilePhoto),
          qualifications: application.qualificationsJson ? JSON.parse(application.qualificationsJson) : [],
          experiences: application.experiencesJson ? JSON.parse(application.experiencesJson) : [],
          subjects: application.subjects ? JSON.parse(application.subjects) : [],
          exams: application.exams ? JSON.parse(application.exams) : [],
          otherDocs: application.otherDocsJson ? JSON.parse(application.otherDocsJson) : [],
          assignedSubjects: application.assignedSubjects ? JSON.parse(application.assignedSubjects) : [],
          assignedCourses: application.assignments.map((a) => a.course),
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/admin/teachers/applications/:id/document/:docType
 * Secure stream preview for CV / ID / Certificates (Authorized Admin / Staff Manager only)
 */
router.get(
  '/applications/:id/document/:docType',
  authenticate,
  requireAdminOrStaffManager('canTeacherDocuments'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id, docType } = req.params;

      const application = await prisma.teacherApplication.findFirst({
        where: { OR: [{ id }, { userId: id }] },
      });

      if (!application) {
        res.status(404).json({ success: false, message: 'Application not found.' });
        return;
      }

      let targetUrl: string | null = null;
      if (docType === 'cv') targetUrl = application.cvUrl;
      else if (docType === 'id-proof') targetUrl = application.idProofUrl;
      else if (docType === 'qualification-cert') targetUrl = application.qualificationCertUrl;
      else if (docType === 'experience-cert') targetUrl = application.experienceCertUrl;
      else if (docType === 'profile-photo') targetUrl = application.profilePhotoUrl;

      if (!targetUrl) {
        res.status(404).json({ success: false, message: `Document of type '${docType}' not found for this applicant.` });
        return;
      }

      // Check if it is a Google Drive URL
      const driveMatch = targetUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || targetUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (driveMatch) {
        const fileId = driveMatch[1];
        try {
          const stream = await googleDriveService.getFileStream(fileId);
          res.setHeader('Content-Disposition', `inline; filename="${docType}.pdf"`);
          stream.pipe(res);
          return;
        } catch (streamErr: any) {
          console.warn('Could not stream Google Drive file directly, redirecting to webUrl:', streamErr.message);
          res.redirect(targetUrl);
          return;
        }
      }

      // If local data URL or direct link
      if (targetUrl.startsWith('data:')) {
        const matches = targetUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          res.setHeader('Content-Type', mimeType);
          res.send(buffer);
          return;
        }
      }

      res.redirect(targetUrl);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/teachers/applications/:id/approve
 * Approves application, assigns selected courses & subjects, and activates teacher account
 */
router.post(
  '/applications/:id/approve',
  authenticate,
  requireAdminOrStaffManager('canTeacherApplications'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { courseIds, assignedSubjects } = req.body; // array of course IDs and subjects

      const application = await prisma.teacherApplication.findFirst({
        where: { OR: [{ id }, { userId: id }] },
      });

      if (!application) {
        res.status(404).json({ success: false, message: 'Application not found.' });
        return;
      }

      // 1. Activate User account and ensure role is TEACHER
      await prisma.user.update({
        where: { id: application.userId },
        data: {
          isActive: true,
          role: 'TEACHER',
        },
      });

      // 2. Clear old assignments & create new course assignments
      await prisma.teacherCourseAssignment.deleteMany({
        where: { teacherId: application.userId },
      });

      if (Array.isArray(courseIds) && courseIds.length > 0) {
        const assignmentsData = courseIds.map((courseId: string) => ({
          teacherId: application.userId,
          applicationId: application.id,
          courseId,
          assignedBy: req.user!.id,
          isActive: true,
        }));

        await prisma.teacherCourseAssignment.createMany({
          data: assignmentsData,
          skipDuplicates: true,
        });
      }

      // 3. Update application status to APPROVED
      const updated = await prisma.teacherApplication.update({
        where: { id: application.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedById: req.user!.id,
          adminRemarks: 'Application approved. Account and courses assigned.',
          assignedSubjects: Array.isArray(assignedSubjects) ? JSON.stringify(assignedSubjects) : application.assignedSubjects,
        },
        include: {
          assignments: {
            include: { course: { select: { id: true, title: true } } },
          },
        },
      });

      res.json({
        success: true,
        message: 'Teacher approved successfully! Account is now ACTIVE with assigned courses.',
        application: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/teachers/applications/:id/request-changes
 * Requests changes from the teacher with specific comments
 */
router.post(
  '/applications/:id/request-changes',
  authenticate,
  requireAdminOrStaffManager('canTeacherApplications'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;

      if (!comment) {
        res.status(400).json({ success: false, message: 'Comment explaining requested changes is required.' });
        return;
      }

      const application = await prisma.teacherApplication.findFirst({
        where: { OR: [{ id }, { userId: id }] },
      });

      if (!application) {
        res.status(404).json({ success: false, message: 'Application not found.' });
        return;
      }

      const updated = await prisma.teacherApplication.update({
        where: { id: application.id },
        data: {
          status: 'CHANGES_REQUESTED',
          reviewedAt: new Date(),
          reviewedById: req.user!.id,
          adminRemarks: comment.trim(),
        },
      });

      res.json({
        success: true,
        message: 'Changes requested from teacher. They can now edit and resubmit.',
        application: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/teachers/applications/:id/reject
 * Rejects application with reason
 */
router.post(
  '/applications/:id/reject',
  authenticate,
  requireAdminOrStaffManager('canTeacherApplications'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const application = await prisma.teacherApplication.findFirst({
        where: { OR: [{ id }, { userId: id }] },
      });

      if (!application) {
        res.status(404).json({ success: false, message: 'Application not found.' });
        return;
      }

      const updated = await prisma.teacherApplication.update({
        where: { id: application.id },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedById: req.user!.id,
          adminRemarks: reason ? reason.trim() : 'Application did not meet requirements.',
        },
      });

      // Keep user inactive
      await prisma.user.update({
        where: { id: application.userId },
        data: { isActive: false },
      });

      res.json({
        success: true,
        message: 'Application marked as REJECTED.',
        application: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/teachers/:id/suspend
 * Suspends teacher account (prevents login, preserves published content)
 */
router.post(
  '/:id/suspend',
  authenticate,
  requireAdminOrStaffManager('canTeacherApplications'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findFirst({
        where: { OR: [{ id }, { email: id }] },
        include: { teacherApplication: true },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'Teacher user not found.' });
        return;
      }

      // Deactivate User account
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });

      if (user.teacherApplication) {
        await prisma.teacherApplication.update({
          where: { id: user.teacherApplication.id },
          data: { status: 'SUSPENDED' },
        });
      }

      res.json({
        success: true,
        message: 'Teacher account suspended. Login and workspace access are blocked. Published content preserved.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/teachers/:id/reinstate
 * Re-activates suspended teacher
 */
router.post(
  '/:id/reinstate',
  authenticate,
  requireAdminOrStaffManager('canTeacherApplications'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findFirst({
        where: { OR: [{ id }, { email: id }] },
        include: { teacherApplication: true },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'Teacher user not found.' });
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: true },
      });

      if (user.teacherApplication) {
        await prisma.teacherApplication.update({
          where: { id: user.teacherApplication.id },
          data: { status: 'APPROVED' },
        });
      }

      res.json({
        success: true,
        message: 'Teacher account reinstated and marked ACTIVE.',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/admin/teachers/:id/assignments
 * Update course & subject assignments for an existing teacher
 */
router.put(
  '/:id/assignments',
  authenticate,
  requireAdminOrStaffManager('canCourseAssignment'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { courseIds, assignedSubjects } = req.body;

      const user = await prisma.user.findFirst({
        where: { OR: [{ id }, { email: id }] },
        include: { teacherApplication: true },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'Teacher user not found.' });
        return;
      }

      // Update courses
      if (Array.isArray(courseIds)) {
        await prisma.teacherCourseAssignment.deleteMany({
          where: { teacherId: user.id },
        });

        const newAssignments = courseIds.map((courseId: string) => ({
          teacherId: user.id,
          applicationId: user.teacherApplication ? user.teacherApplication.id : null,
          courseId,
          assignedBy: req.user!.id,
          isActive: true,
        }));

        if (newAssignments.length > 0) {
          await prisma.teacherCourseAssignment.createMany({
            data: newAssignments,
            skipDuplicates: true,
          });
        }
      }

      // Update subjects in application record
      if (Array.isArray(assignedSubjects) && user.teacherApplication) {
        await prisma.teacherApplication.update({
          where: { id: user.teacherApplication.id },
          data: { assignedSubjects: JSON.stringify(assignedSubjects) },
        });
      }

      res.json({
        success: true,
        message: 'Teacher course and subject assignments updated successfully.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// 2. CONTENT APPROVAL WORKFLOW
// ============================================================

/**
 * GET /api/admin/content-review/pending
 * Returns all submitted lectures, study materials, tests, and live classes waiting for review
 */
router.get(
  '/content-review/pending',
  authenticate,
  requireAdminOrStaffManager('canContentApproval'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const [pendingLessons, pendingMaterials, pendingTests, pendingLive] = await Promise.all([
        prisma.courseLesson.findMany({
          where: { approvalStatus: 'PENDING_REVIEW' },
          include: {
            course: { select: { id: true, title: true, slug: true } },
          },
          orderBy: { submittedAt: 'desc' },
        }),
        prisma.material.findMany({
          where: { approvalStatus: 'PENDING_REVIEW' },
          include: {
            category: { select: { id: true, name: true } },
          },
          orderBy: { submittedAt: 'desc' },
        }),
        prisma.test.findMany({
          where: { approvalStatus: 'PENDING_REVIEW' },
          include: {
            course: { select: { id: true, title: true } },
          },
          orderBy: { submittedAt: 'desc' },
        }),
        prisma.liveClass.findMany({
          where: { approvalStatus: 'PENDING_REVIEW' },
          include: {
            course: { select: { id: true, title: true } },
          },
          orderBy: { submittedAt: 'desc' },
        }),
      ]);

      // Fetch teacher info map
      const teacherIds = new Set<string>();
      [...pendingLessons, ...pendingMaterials, ...pendingTests, ...pendingLive].forEach((item: any) => {
        if (item.teacherId) teacherIds.add(item.teacherId);
      });

      const teachers = await prisma.user.findMany({
        where: { id: { in: Array.from(teacherIds) } },
        select: { id: true, name: true, email: true, avatar: true },
      });
      const teacherMap = new Map(teachers.map((t) => [t.id, t]));

      const formatItem = (item: any, type: string) => ({
        ...item,
        contentType: type,
        teacher: item.teacherId ? teacherMap.get(item.teacherId) || null : null,
      });

      res.json({
        success: true,
        items: [
          ...pendingLessons.map((l) => formatItem(l, 'lecture')),
          ...pendingMaterials.map((m) => formatItem(m, 'material')),
          ...pendingTests.map((t) => formatItem(t, 'test')),
          ...pendingLive.map((lc) => formatItem(lc, 'live-class')),
        ],
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/content-review/:contentType/:id/action
 * Action: APPROVE_PUBLISH, REQUEST_CHANGES, REJECT
 */
router.post(
  '/content-review/:contentType/:id/action',
  authenticate,
  requireAdminOrStaffManager('canContentApproval'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { contentType, id } = req.params;
      const { action, comment } = req.body; // 'APPROVE_PUBLISH' | 'REQUEST_CHANGES' | 'REJECT'

      if (!['APPROVE_PUBLISH', 'REQUEST_CHANGES', 'REJECT'].includes(action)) {
        res.status(400).json({ success: false, message: 'Invalid action.' });
        return;
      }

      let newApprovalStatus = 'APPROVED';
      if (action === 'REQUEST_CHANGES') newApprovalStatus = 'CHANGES_REQUESTED';
      if (action === 'REJECT') newApprovalStatus = 'REJECTED';

      if (contentType === 'lecture') {
        await prisma.courseLesson.update({
          where: { id },
          data: {
            approvalStatus: newApprovalStatus,
            reviewerComment: comment ? comment.trim() : null,
          },
        });
      } else if (contentType === 'material') {
        await prisma.material.update({
          where: { id },
          data: {
            approvalStatus: newApprovalStatus,
            status: action === 'APPROVE_PUBLISH' ? 'PUBLISHED' : 'DRAFT',
            reviewerComment: comment ? comment.trim() : null,
          },
        });
      } else if (contentType === 'test') {
        await prisma.test.update({
          where: { id },
          data: {
            approvalStatus: newApprovalStatus,
            status: action === 'APPROVE_PUBLISH' ? 'PUBLISHED' : 'DRAFT',
            reviewerComment: comment ? comment.trim() : null,
          },
        });
      } else if (contentType === 'live-class') {
        await prisma.liveClass.update({
          where: { id },
          data: {
            approvalStatus: newApprovalStatus,
            status: action === 'APPROVE_PUBLISH' ? 'SCHEDULED' : 'DRAFT',
            isPublished: action === 'APPROVE_PUBLISH',
            reviewerComment: comment ? comment.trim() : null,
          },
        });
      } else {
        res.status(400).json({ success: false, message: 'Unknown content type.' });
        return;
      }

      res.json({
        success: true,
        message:
          action === 'APPROVE_PUBLISH'
            ? 'Content approved and successfully PUBLISHED!'
            : action === 'REQUEST_CHANGES'
            ? 'Feedback and revision comments sent to teacher.'
            : 'Content rejected.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// 3. STAFF MANAGER PERMISSIONS ARCHITECTURE
// ============================================================

/**
 * GET /api/admin/staff-managers
 * Lists all staff managers and their assigned permissions
 */
router.get(
  '/staff-managers',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const managers = await prisma.user.findMany({
        where: { role: 'STAFF_MANAGER' },
        include: { staffPermission: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        staffManagers: managers,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/admin/staff-managers
 * Create or promote a user to Staff Manager with granular permissions
 */
router.post(
  '/staff-managers',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email, name, permissions } = req.body;

      if (!email) {
        res.status(400).json({ success: false, message: 'Email address is required.' });
        return;
      }

      const cleanEmail = String(email).toLowerCase().trim();
      let user = await prisma.user.findUnique({ where: { email: cleanEmail } });

      if (!user) {
        res.status(404).json({ success: false, message: 'No registered user found with this email address.' });
        return;
      }

      // Promote role to STAFF_MANAGER
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'STAFF_MANAGER' },
      });

      const perms = permissions || {};
      const staffPerm = await prisma.staffPermission.upsert({
        where: { userId: user.id },
        update: {
          canTeacherApplications: perms.canTeacherApplications !== false,
          canTeacherDocuments: perms.canTeacherDocuments !== false,
          canContentApproval: perms.canContentApproval !== false,
          canCourseAssignment: perms.canCourseAssignment !== false,
          canPayments: Boolean(perms.canPayments),
          canUsers: Boolean(perms.canUsers),
          canAdminManagement: Boolean(perms.canAdminManagement),
          canSiteSettings: Boolean(perms.canSiteSettings),
          canDatabase: Boolean(perms.canDatabase),
        },
        create: {
          userId: user.id,
          canTeacherApplications: perms.canTeacherApplications !== false,
          canTeacherDocuments: perms.canTeacherDocuments !== false,
          canContentApproval: perms.canContentApproval !== false,
          canCourseAssignment: perms.canCourseAssignment !== false,
          canPayments: Boolean(perms.canPayments),
          canUsers: Boolean(perms.canUsers),
          canAdminManagement: Boolean(perms.canAdminManagement),
          canSiteSettings: Boolean(perms.canSiteSettings),
          canDatabase: Boolean(perms.canDatabase),
        },
      });

      res.status(201).json({
        success: true,
        message: `User ${user.name} promoted to Staff Manager with assigned permissions.`,
        staffPermission: staffPerm,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/admin/staff-managers/:userId/permissions
 * Update permissions for a Staff Manager
 */
router.put(
  '/staff-managers/:userId/permissions',
  authenticate,
  requireAdmin,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { permissions } = req.body;

      const staffPerm = await prisma.staffPermission.upsert({
        where: { userId },
        update: {
          ...(permissions.canTeacherApplications !== undefined ? { canTeacherApplications: Boolean(permissions.canTeacherApplications) } : {}),
          ...(permissions.canTeacherDocuments !== undefined ? { canTeacherDocuments: Boolean(permissions.canTeacherDocuments) } : {}),
          ...(permissions.canContentApproval !== undefined ? { canContentApproval: Boolean(permissions.canContentApproval) } : {}),
          ...(permissions.canCourseAssignment !== undefined ? { canCourseAssignment: Boolean(permissions.canCourseAssignment) } : {}),
          ...(permissions.canPayments !== undefined ? { canPayments: Boolean(permissions.canPayments) } : {}),
          ...(permissions.canUsers !== undefined ? { canUsers: Boolean(permissions.canUsers) } : {}),
          ...(permissions.canAdminManagement !== undefined ? { canAdminManagement: Boolean(permissions.canAdminManagement) } : {}),
          ...(permissions.canSiteSettings !== undefined ? { canSiteSettings: Boolean(permissions.canSiteSettings) } : {}),
          ...(permissions.canDatabase !== undefined ? { canDatabase: Boolean(permissions.canDatabase) } : {}),
        },
        create: {
          userId,
          ...permissions,
        },
      });

      res.json({
        success: true,
        message: 'Staff manager permissions updated successfully.',
        staffPermission: staffPerm,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
