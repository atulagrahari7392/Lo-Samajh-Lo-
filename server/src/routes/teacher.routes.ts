import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { prisma } from '../db';
import { authenticate, requireTeacher, AuthRequest } from '../middleware/auth';
import { emailOtpService } from '../services/emailOtp.service';
import { googleDriveService } from '../services/googleDrive.service';
import { normalizeImageUrl } from '../utils/url';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// ============================================================
// 1. PUBLIC TEACHER ONBOARDING & VERIFICATION FLOW
// ============================================================

/**
 * POST /api/teachers/otp/send
 * Sends 6-digit Gmail OTP to teacher email with cooldown, rate limiting & duplicate check
 */
router.post('/otp/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email address is required.' });
      return;
    }

    const result = await emailOtpService.sendOtp(email, 'TEACHER_VERIFICATION');
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/teachers/otp/verify
 * Verifies 6-digit OTP
 */
router.post('/otp/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and 6-digit OTP are required.' });
      return;
    }

    const result = await emailOtpService.verifyOtp(email, otp, 'TEACHER_VERIFICATION');
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/teachers/upload-document
 * Uploads a document (CV, Photo, Certificate, ID) to Google Drive in structured hierarchy
 */
router.post(
  '/upload-document',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      const { email, teacherId, subCategory, docTitle } = req.body;

      if (!file) {
        res.status(400).json({ success: false, message: 'No file uploaded.' });
        return;
      }

      const idForFolder = teacherId || (email ? email.replace(/[^a-zA-Z0-9_-]/g, '_') : 'temp_applicant');
      const validSubCategories: Array<'Profile' | 'CV' | 'Qualification' | 'Experience' | 'Identity' | 'Other'> = [
        'Profile',
        'CV',
        'Qualification',
        'Experience',
        'Identity',
        'Other',
      ];
      const categoryToUse = validSubCategories.includes(subCategory) ? subCategory : 'Other';

      // Check if Google Drive is configured
      const isDriveActive = await googleDriveService.isConfigured();

      if (isDriveActive) {
        const uploadResult = await googleDriveService.uploadTeacherDocument({
          streamOrBuffer: file.buffer,
          fileName: `${categoryToUse}_${Date.now()}_${file.originalname}`,
          mimeType: file.mimetype,
          teacherId: idForFolder,
          status: 'Pending',
          subCategory: categoryToUse,
        });

        res.json({
          success: true,
          message: 'Document uploaded securely to Google Drive.',
          fileUrl: uploadResult.webUrl,
          fileId: uploadResult.fileId,
          downloadUrl: uploadResult.downloadUrl,
          fileName: uploadResult.fileName,
          size: uploadResult.size,
        });
        return;
      }

      // Fallback: Return data URL / placeholder if Google Drive is in offline dev mode
      const base64Data = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      res.json({
        success: true,
        message: 'File uploaded (Local dev storage).',
        fileUrl: base64Data,
        fileName: file.originalname,
        size: file.size,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/teachers/apply
 * Submits the complete 7-Step Teacher Application and creates an account (PENDING_REVIEW)
 */
router.post('/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      // Auth credentials
      email,
      password,
      confirmPassword,
      // Step 1 - Personal
      fullName,
      profilePhoto,
      dob,
      gender,
      mobile,
      whatsapp,
      // Step 2 - Address
      state,
      district,
      city,
      address,
      pin,
      // Step 3 - Qualifications
      qualifications,
      // Step 4 - Experiences
      experiences,
      // Step 5 - Teaching Profile
      subjects,
      exams,
      teachingMedium,
      teachingMode,
      specialization,
      bio,
      demoVideoUrl,
      // Step 6 - Documents
      cvUrl,
      idProofUrl,
      idProofType,
      qualificationCertUrl,
      experienceCertUrl,
      otherDocs,
      // Step 7 - Declaration
      declarationAccepted,
    } = req.body;

    const cleanEmail = String(email || '').toLowerCase().trim();

    if (!cleanEmail || !fullName || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ success: false, message: 'Passwords do not match.' });
      return;
    }

    if (!declarationAccepted) {
      res.status(400).json({ success: false, message: 'You must accept the declaration to submit your application.' });
      return;
    }

    // Strict Email Verification check: cannot submit without verified OTP
    const isEmailVerified = await emailOtpService.checkEmailVerified(cleanEmail, 'TEACHER_VERIFICATION');
    if (!isEmailVerified) {
      res.status(403).json({
        success: false,
        message: 'Email address has not been verified via OTP. Please complete verification first.',
      });
      return;
    }

    // Check duplicate user
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User record (role: TEACHER, isActive: false until approved by Admin/Manager)
    const user = await prisma.user.create({
      data: {
        name: fullName.trim(),
        email: cleanEmail,
        phone: mobile ? String(mobile).trim() : null,
        passwordHash,
        role: 'TEACHER',
        avatar: profilePhoto || null,
        isActive: false, // Inactive until Admin Approval!
      },
    });

    // Create TeacherApplication (Status: PENDING_REVIEW / UNDER_REVIEW)
    const application = await prisma.teacherApplication.create({
      data: {
        userId: user.id,
        status: 'PENDING_REVIEW',
        fullName: fullName.trim(),
        profilePhoto: profilePhoto || null,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
        mobile: String(mobile || '').trim(),
        whatsapp: whatsapp ? String(whatsapp).trim() : null,
        email: cleanEmail,
        state: String(state || '').trim(),
        district: String(district || '').trim(),
        city: String(city || '').trim(),
        address: String(address || '').trim(),
        pin: String(pin || '').trim(),
        qualificationsJson: JSON.stringify(qualifications || []),
        experiencesJson: JSON.stringify(experiences || []),
        subjects: JSON.stringify(subjects || []),
        exams: JSON.stringify(exams || []),
        teachingMedium: teachingMedium || 'BILINGUAL',
        teachingMode: teachingMode || 'BOTH',
        specialization: specialization || null,
        bio: bio || null,
        demoVideoUrl: demoVideoUrl || null,
        cvUrl: cvUrl || null,
        profilePhotoUrl: profilePhoto || null,
        idProofUrl: idProofUrl || null,
        idProofType: idProofType || 'AADHAAR',
        qualificationCertUrl: qualificationCertUrl || null,
        experienceCertUrl: experienceCertUrl || null,
        otherDocsJson: JSON.stringify(otherDocs || []),
        declarationAccepted: true,
        submittedAt: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Teacher application submitted successfully! Your profile is now UNDER REVIEW by the administration.',
      applicationId: application.id,
      status: 'PENDING_REVIEW',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/teachers/my-application
 * Public or authenticated check of application status by email
 */
router.get('/my-application', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.query;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email address is required.' });
      return;
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        teacherApplication: {
          include: {
            assignments: {
              include: { course: { select: { id: true, title: true, slug: true } } },
            },
          },
        },
      },
    });

    if (!user || !user.teacherApplication) {
      res.status(404).json({ success: false, message: 'No teacher application found for this email address.' });
      return;
    }

    const app = user.teacherApplication;

    res.json({
      success: true,
      application: {
        id: app.id,
        status: app.status,
        fullName: app.fullName,
        email: app.email,
        submittedAt: app.submittedAt,
        reviewedAt: app.reviewedAt,
        adminRemarks: app.adminRemarks,
        assignedSubjects: app.assignedSubjects ? JSON.parse(app.assignedSubjects) : [],
        assignedCourses: app.assignments.map((a) => a.course),
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/teachers/application/resubmit
 * Allows teacher to update and resubmit application if changes were requested
 */
router.put('/application/resubmit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, ...updates } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email address is required.' });
      return;
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { teacherApplication: true },
    });

    if (!user || !user.teacherApplication) {
      res.status(404).json({ success: false, message: 'Application not found.' });
      return;
    }

    const app = user.teacherApplication;
    if (app.status !== 'CHANGES_REQUESTED' && app.status !== 'REJECTED') {
      res.status(400).json({
        success: false,
        message: `Application in state ${app.status} cannot be resubmitted.`,
      });
      return;
    }

    const updated = await prisma.teacherApplication.update({
      where: { id: app.id },
      data: {
        fullName: updates.fullName || app.fullName,
        profilePhoto: updates.profilePhoto !== undefined ? updates.profilePhoto : app.profilePhoto,
        mobile: updates.mobile || app.mobile,
        whatsapp: updates.whatsapp || app.whatsapp,
        state: updates.state || app.state,
        district: updates.district || app.district,
        city: updates.city || app.city,
        address: updates.address || app.address,
        pin: updates.pin || app.pin,
        qualificationsJson: updates.qualifications ? JSON.stringify(updates.qualifications) : app.qualificationsJson,
        experiencesJson: updates.experiences ? JSON.stringify(updates.experiences) : app.experiencesJson,
        subjects: updates.subjects ? JSON.stringify(updates.subjects) : app.subjects,
        exams: updates.exams ? JSON.stringify(updates.exams) : app.exams,
        specialization: updates.specialization !== undefined ? updates.specialization : app.specialization,
        bio: updates.bio !== undefined ? updates.bio : app.bio,
        demoVideoUrl: updates.demoVideoUrl !== undefined ? updates.demoVideoUrl : app.demoVideoUrl,
        cvUrl: updates.cvUrl !== undefined ? updates.cvUrl : app.cvUrl,
        idProofUrl: updates.idProofUrl !== undefined ? updates.idProofUrl : app.idProofUrl,
        qualificationCertUrl: updates.qualificationCertUrl !== undefined ? updates.qualificationCertUrl : app.qualificationCertUrl,
        experienceCertUrl: updates.experienceCertUrl !== undefined ? updates.experienceCertUrl : app.experienceCertUrl,
        status: 'PENDING_REVIEW', // Resubmitted!
        submittedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Application resubmitted successfully! Your updated details are now UNDER REVIEW.',
      application: updated,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 2. TEACHER WORKSPACE & DASHBOARD ENDPOINTS (Strict Auth)
// ============================================================

/**
 * GET /api/teachers/dashboard
 * Returns stats for logged-in teacher's workspace
 */
router.get('/dashboard', authenticate, requireTeacher, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const teacherId = req.user!.id;

    // Get assigned courses
    const assignments = await prisma.teacherCourseAssignment.findMany({
      where: { teacherId, isActive: true },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            duration: true,
            _count: {
              select: { lessons: true, enrollments: true, liveClasses: true },
            },
          },
        },
      },
    });

    const assignedCourseIds = assignments.map((a) => a.courseId);

    // Get counts
    const lecturesCount = await prisma.courseLesson.count({
      where: {
        OR: [{ teacherId }, { courseId: { in: assignedCourseIds } }],
      },
    });

    const materialsCount = await prisma.material.count({
      where: { teacherId },
    });

    const testsCount = await prisma.test.count({
      where: { teacherId },
    });

    // Count pending content approvals created by this teacher
    const pendingLessons = await prisma.courseLesson.count({
      where: { teacherId, approvalStatus: 'PENDING_REVIEW' },
    });
    const pendingMaterials = await prisma.material.count({
      where: { teacherId, approvalStatus: 'PENDING_REVIEW' },
    });
    const pendingTests = await prisma.test.count({
      where: { teacherId, approvalStatus: 'PENDING_REVIEW' },
    });
    const pendingLive = await prisma.liveClass.count({
      where: { teacherId, approvalStatus: 'PENDING_REVIEW' },
    });

    const totalPendingApproval = pendingLessons + pendingMaterials + pendingTests + pendingLive;

    // Count published content
    const publishedLessons = await prisma.courseLesson.count({
      where: { teacherId, approvalStatus: 'APPROVED' },
    });
    const publishedMaterials = await prisma.material.count({
      where: { teacherId, approvalStatus: 'APPROVED', status: 'PUBLISHED' },
    });
    const publishedTests = await prisma.test.count({
      where: { teacherId, approvalStatus: 'APPROVED', status: 'PUBLISHED' },
    });
    const publishedLive = await prisma.liveClass.count({
      where: { teacherId, approvalStatus: 'APPROVED', isPublished: true },
    });

    const totalPublishedContent = publishedLessons + publishedMaterials + publishedTests + publishedLive;

    res.json({
      success: true,
      teacher: {
        id: req.user!.id,
        name: req.user!.name,
        email: req.user!.email,
      },
      stats: {
        assignedCoursesCount: assignments.length,
        lecturesCount,
        studyMaterialsCount: materialsCount,
        testsCount,
        pendingApprovalCount: totalPendingApproval,
        publishedContentCount: totalPublishedContent,
      },
      assignedCourses: assignments.map((a) => ({
        ...a.course,
        thumbnail: normalizeImageUrl(a.course.thumbnail),
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/teachers/my-courses
 * Returns assigned courses only
 */
router.get('/my-courses', authenticate, requireTeacher, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const teacherId = req.user!.id;

    const assignments = await prisma.teacherCourseAssignment.findMany({
      where: { teacherId, isActive: true },
      include: {
        course: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            lessons: {
              where: {
                OR: [{ teacherId }, { approvalStatus: 'APPROVED' }],
              },
              orderBy: { position: 'asc' },
            },
            liveClasses: {
              where: { teacherId },
              orderBy: { scheduledAt: 'asc' },
            },
            _count: {
              select: { enrollments: true, lessons: true, liveClasses: true },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      courses: assignments.map((a) => ({
        ...a.course,
        thumbnail: normalizeImageUrl(a.course.thumbnail),
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/teachers/content
 * Returns all content submitted by the teacher with approval status
 */
router.get('/content', authenticate, requireTeacher, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const teacherId = req.user!.id;

    const [lessons, materials, tests, liveClasses] = await Promise.all([
      prisma.courseLesson.findMany({
        where: { teacherId },
        include: { course: { select: { id: true, title: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.material.findMany({
        where: { teacherId },
        include: { category: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.test.findMany({
        where: { teacherId },
        include: { course: { select: { id: true, title: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.liveClass.findMany({
        where: { teacherId },
        include: { course: { select: { id: true, title: true } } },
        orderBy: { scheduledAt: 'desc' },
      }),
    ]);

    res.json({
      success: true,
      lessons,
      materials,
      tests,
      liveClasses,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/teachers/content/lecture
 * Teacher uploads lecture -> DRAFT or PENDING_REVIEW (Never directly PUBLISHED)
 */
router.post('/content/lecture', authenticate, requireTeacher, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const teacherId = req.user!.id;
    const { courseId, title, chapterTitle, durationMinutes, videoUrl, pdfUrl, content, submitForReview } = req.body;

    if (!courseId || !title) {
      res.status(400).json({ success: false, message: 'Course ID and Lecture Title are required.' });
      return;
    }

    // Verify course is assigned to this teacher
    const isAssigned = await prisma.teacherCourseAssignment.findUnique({
      where: { teacherId_courseId: { teacherId, courseId } },
    });

    if (!isAssigned && !['ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      res.status(403).json({ success: false, message: 'Forbidden. You are not assigned to this course.' });
      return;
    }

    const approvalStatus = submitForReview ? 'PENDING_REVIEW' : 'DRAFT';

    const lesson = await prisma.courseLesson.create({
      data: {
        courseId,
        teacherId,
        title: title.trim(),
        chapterTitle: chapterTitle?.trim() || 'General',
        durationMinutes: parseInt(durationMinutes, 10) || 30,
        videoUrl: videoUrl?.trim() || null,
        pdfUrl: pdfUrl?.trim() || null,
        content: content?.trim() || null,
        isFreePreview: false,
        approvalStatus,
        submittedAt: submitForReview ? new Date() : null,
      },
    });

    res.status(201).json({
      success: true,
      message: submitForReview
        ? 'Lecture submitted for administrator approval.'
        : 'Lecture saved as draft.',
      lesson,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/teachers/content/material
 * Teacher uploads study material -> DRAFT or PENDING_REVIEW
 */
router.post('/content/material', authenticate, requireTeacher, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const teacherId = req.user!.id;
    const { title, categoryId, materialType, subject, chapter, topic, examName, fileUrl, fileSize, submitForReview } = req.body;

    if (!title || !categoryId || !fileUrl) {
      res.status(400).json({ success: false, message: 'Title, Category, and File are required.' });
      return;
    }

    const approvalStatus = submitForReview ? 'PENDING_REVIEW' : 'DRAFT';

    const material = await prisma.material.create({
      data: {
        title: title.trim(),
        categoryId,
        materialType: materialType || 'CLASS_NOTES',
        subject: subject || 'General',
        chapter: chapter || null,
        topic: topic || null,
        examName: examName || 'Competitive Exams',
        fileUrl,
        fileSize: fileSize || '2.0 MB',
        author: req.user!.name,
        teacherId,
        approvalStatus,
        status: 'DRAFT', // Remains DRAFT until Admin Approves!
        submittedAt: submitForReview ? new Date() : null,
      },
    });

    res.status(201).json({
      success: true,
      message: submitForReview
        ? 'Material submitted for administrator approval.'
        : 'Material saved as draft.',
      material,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/teachers/content/test
 * Teacher creates mock test -> DRAFT or PENDING_REVIEW
 */
router.post('/content/test', authenticate, requireTeacher, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const teacherId = req.user!.id;
    const { title, courseId, categoryId, durationMinutes, totalMarks, passMarks, instructions, submitForReview } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'Test title is required.' });
      return;
    }

    const approvalStatus = submitForReview ? 'PENDING_REVIEW' : 'DRAFT';
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const test = await prisma.test.create({
      data: {
        title: title.trim(),
        slug,
        courseId: courseId || null,
        categoryId: categoryId || null,
        durationMinutes: parseInt(durationMinutes, 10) || 60,
        totalMarks: parseFloat(totalMarks) || 100,
        passMarks: parseFloat(passMarks) || 33,
        instructions: instructions || null,
        teacherId,
        approvalStatus,
        status: 'DRAFT', // Remains DRAFT until Admin Approves!
        submittedAt: submitForReview ? new Date() : null,
      },
    });

    res.status(201).json({
      success: true,
      message: submitForReview
        ? 'Test submitted for administrator approval.'
        : 'Test saved as draft.',
      test,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/teachers/content/live-class
 * Teacher schedules live class -> DRAFT or PENDING_REVIEW
 */
router.post('/content/live-class', authenticate, requireTeacher, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const teacherId = req.user!.id;
    const { courseId, title, scheduledAt, durationMinutes, subject, chapter, description, submitForReview } = req.body;

    if (!title || !scheduledAt) {
      res.status(400).json({ success: false, message: 'Title and scheduled time are required.' });
      return;
    }

    const approvalStatus = submitForReview ? 'PENDING_REVIEW' : 'DRAFT';
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const liveClass = await prisma.liveClass.create({
      data: {
        title: title.trim(),
        slug,
        courseId: courseId || null,
        teacherId,
        instructor: req.user!.name,
        subject: subject || null,
        chapter: chapter || null,
        description: description || null,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: parseInt(durationMinutes, 10) || 60,
        status: 'DRAFT',
        isPublished: false,
        approvalStatus,
        submittedAt: submitForReview ? new Date() : null,
      },
    });

    res.status(201).json({
      success: true,
      message: submitForReview
        ? 'Live class submitted for administrator approval.'
        : 'Live class saved as draft.',
      liveClass,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/teachers/content/:contentType/:id/submit-review
 * Submit draft content for administrator approval
 */
router.post(
  '/content/:contentType/:id/submit-review',
  authenticate,
  requireTeacher,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { contentType, id } = req.params;
      const teacherId = req.user!.id;

      if (contentType === 'lecture') {
        const lesson = await prisma.courseLesson.updateMany({
          where: { id, teacherId },
          data: { approvalStatus: 'PENDING_REVIEW', submittedAt: new Date(), reviewerComment: null },
        });
        if (lesson.count === 0) {
          res.status(404).json({ success: false, message: 'Lecture not found or not owned by teacher.' });
          return;
        }
      } else if (contentType === 'material') {
        const mat = await prisma.material.updateMany({
          where: { id, teacherId },
          data: { approvalStatus: 'PENDING_REVIEW', submittedAt: new Date(), reviewerComment: null },
        });
        if (mat.count === 0) {
          res.status(404).json({ success: false, message: 'Material not found or not owned by teacher.' });
          return;
        }
      } else if (contentType === 'test') {
        const t = await prisma.test.updateMany({
          where: { id, teacherId },
          data: { approvalStatus: 'PENDING_REVIEW', submittedAt: new Date(), reviewerComment: null },
        });
        if (t.count === 0) {
          res.status(404).json({ success: false, message: 'Test not found or not owned by teacher.' });
          return;
        }
      } else if (contentType === 'live-class') {
        const lc = await prisma.liveClass.updateMany({
          where: { id, teacherId },
          data: { approvalStatus: 'PENDING_REVIEW', submittedAt: new Date(), reviewerComment: null },
        });
        if (lc.count === 0) {
          res.status(404).json({ success: false, message: 'Live class not found or not owned by teacher.' });
          return;
        }
      } else {
        res.status(400).json({ success: false, message: 'Invalid content type.' });
        return;
      }

      res.json({ success: true, message: 'Content successfully submitted for Administrator Review.' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/teachers/assigned-students
 * Students enrolled in courses assigned to the teacher
 */
router.get(
  '/assigned-students',
  authenticate,
  requireTeacher,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const teacherId = req.user!.id;

      const assignments = await prisma.teacherCourseAssignment.findMany({
        where: { teacherId, isActive: true },
        select: { courseId: true },
      });

      const courseIds = assignments.map((a) => a.courseId);

      const enrollments = await prisma.enrollment.findMany({
        where: { courseId: { in: courseIds }, status: 'ACTIVE' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
          course: { select: { id: true, title: true } },
        },
        orderBy: { enrolledAt: 'desc' },
      });

      res.json({
        success: true,
        students: enrollments.map((e) => ({
          enrollmentId: e.id,
          studentId: e.user.id,
          studentName: e.user.name,
          studentEmail: e.user.email,
          enrolledAt: e.enrolledAt,
          courseName: e.course.title,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/teachers/analytics
 * Performance analytics for the teacher's assigned courses
 */
router.get(
  '/analytics',
  authenticate,
  requireTeacher,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const teacherId = req.user!.id;

      const assignments = await prisma.teacherCourseAssignment.findMany({
        where: { teacherId, isActive: true },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              _count: {
                select: { enrollments: true, lessons: true, liveClasses: true, reviews: true },
              },
            },
          },
        },
      });

      const testAttemptsCount = await prisma.testAttempt.count({
        where: { test: { teacherId } },
      });

      res.json({
        success: true,
        analytics: {
          totalAssignedCourses: assignments.length,
          coursesBreakdown: assignments.map((a) => ({
            courseId: a.course.id,
            title: a.course.title,
            enrolledStudents: a.course._count.enrollments,
            lessonsCount: a.course._count.lessons,
            liveClassesCount: a.course._count.liveClasses,
          })),
          testAttemptsReceived: testAttemptsCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/teachers/profile
 * Update public teacher profile (bio, specialization, demo video)
 */
router.put('/profile', authenticate, requireTeacher, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const teacherId = req.user!.id;
    const { bio, specialization, demoVideoUrl, profilePhoto } = req.body;

    const application = await prisma.teacherApplication.findUnique({
      where: { userId: teacherId },
    });

    if (!application) {
      res.status(404).json({ success: false, message: 'Teacher application profile not found.' });
      return;
    }

    const updated = await prisma.teacherApplication.update({
      where: { id: application.id },
      data: {
        ...(bio !== undefined ? { bio: bio?.trim() } : {}),
        ...(specialization !== undefined ? { specialization: specialization?.trim() } : {}),
        ...(demoVideoUrl !== undefined ? { demoVideoUrl: demoVideoUrl?.trim() } : {}),
        ...(profilePhoto !== undefined ? { profilePhoto, profilePhotoUrl: profilePhoto } : {}),
      },
    });

    if (profilePhoto) {
      await prisma.user.update({
        where: { id: teacherId },
        data: { avatar: profilePhoto },
      });
    }

    res.json({
      success: true,
      message: 'Teacher profile updated successfully.',
      profile: updated,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
