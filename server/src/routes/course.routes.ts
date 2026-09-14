import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, optionalAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { normalizeImageUrl } from '../utils/url';

function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                url.match(/id=([a-zA-Z0-9_-]+)/) ||
                url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

const router = Router();

// GET /api/courses (Public catalog with filters & pagination)
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { category, search, featured, sort, isFree, limit } = req.query;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (category) {
      where.OR = [
        { categoryId: String(category) },
        { category: { slug: String(category) } },
      ];
    }

    if (featured === 'true') {
      where.featured = true;
    }

    if (isFree === 'true') {
      where.price = 0;
    }

    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { shortDescription: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price-low') orderBy = { price: 'asc' };
    if (sort === 'price-high') orderBy = { price: 'desc' };
    if (sort === 'title') orderBy = { title: 'asc' };

    const courses = await prisma.course.findMany({
      where,
      orderBy,
      take: limit ? parseInt(String(limit), 10) : 50,
      include: {
        category: {
          select: { id: true, name: true, slug: true, color: true },
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            reviews: true,
            recordedClasses: true,
          },
        },
      },
    });

    // If user is logged in, attach isEnrolled, isWishlisted, isInCart
    let userEnrolledIds = new Set<string>();
    let userWishlistIds = new Set<string>();
    let userCartIds = new Set<string>();

    if (req.user) {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId: req.user.id, status: 'ACTIVE' },
        select: { courseId: true },
      });
      userEnrolledIds = new Set(enrollments.map((e) => e.courseId));

      const wishlist = await prisma.wishlistItem.findMany({
        where: { userId: req.user.id },
        select: { courseId: true },
      });
      userWishlistIds = new Set(wishlist.map((w) => w.courseId));

      const cart = await prisma.cartItem.findMany({
        where: { userId: req.user.id },
        select: { courseId: true },
      });
      userCartIds = new Set(cart.map((c) => c.courseId));
    }

    const enhancedCourses = courses.map((course: any) => ({
      ...course,
      thumbnail: normalizeImageUrl(course.thumbnail),
      _count: {
        ...course._count,
        lessons: (course._count?.lessons || 0) + (course._count?.recordedClasses || 0),
      },
      isEnrolled: req.user?.role === 'ADMIN' || userEnrolledIds.has(course.id),
      isWishlisted: userWishlistIds.has(course.id),
      isInCart: userCartIds.has(course.id),
    }));

    res.json({ success: true, courses: enhancedCourses });
  } catch (error) {
    next(error);
  }
});

// GET /api/courses/admin (Admin courses list including DRAFTs)
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: {
          select: { lessons: true, enrollments: true, reviews: true, recordedClasses: true },
        },
      },
    });
    const mapped = courses.map((c) => ({
      ...c,
      thumbnail: normalizeImageUrl(c.thumbnail),
    }));
    res.json({ success: true, courses: mapped });
  } catch (error) {
    next(error);
  }
});

// GET /api/courses/:slugOrId (Public detail)
router.get('/:slugOrId', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { slugOrId } = req.params;

    const course = await prisma.course.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      include: {
        category: true,
        lessons: {
          orderBy: { position: 'asc' },
          include: {
            quiz: { select: { id: true, title: true, durationMinutes: true, totalMarks: true } },
            resources: { where: { isPublished: true }, orderBy: { createdAt: 'asc' } },
          },
        },
        recordedClasses: {
          where: { isPublished: true },
          orderBy: { createdAt: 'asc' },
          include: {
            quiz: { select: { id: true, title: true, durationMinutes: true, totalMarks: true } },
            resources: { where: { isPublished: true }, orderBy: { createdAt: 'asc' } },
          },
        },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
        _count: {
          select: { enrollments: true, lessons: true, reviews: true, recordedClasses: true },
        },
      },
    });

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }

    let isEnrolled = false;
    let isWishlisted = false;
    let isInCart = false;

    if (req.user) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId: req.user.id, courseId: course.id },
        },
      });
      isEnrolled = !!(enrollment && enrollment.status === 'ACTIVE') || req.user.role === 'ADMIN';

      const wish = await prisma.wishlistItem.findUnique({
        where: {
          userId_courseId: { userId: req.user.id, courseId: course.id },
        },
      });
      isWishlisted = !!wish;

      const cart = await prisma.cartItem.findUnique({
        where: {
          userId_courseId: { userId: req.user.id, courseId: course.id },
        },
      });
      isInCart = !!cart;
    }

    // Mask lesson video/pdf URLs if user is not enrolled and lesson is not a free preview
    const protectedLessons = course.lessons.map((lesson) => {
      if (!isEnrolled && !lesson.isFreePreview) {
        return {
          ...lesson,
          videoUrl: null,
          pdfUrl: null,
        };
      }
      let finalVideoUrl = lesson.videoUrl;
      if (finalVideoUrl && finalVideoUrl.includes('drive.google.com')) {
        finalVideoUrl = finalVideoUrl.replace(/\/view(\?.*)?$/, '/preview');
      }
      return {
        ...lesson,
        videoUrl: finalVideoUrl,
        quizId: (lesson as any).quizId || null,
        quiz: (lesson as any).quiz || null,
        resources: (lesson as any).resources || [],
      };
    });

    // Map recorded classes into syllabus lessons
    const isFreeCourse = course.price === 0 || course.discountedPrice === 0;
    const hasFreePreviewInLessons = course.lessons.some((l) => l.isFreePreview);

    const mappedRecordedClasses = (course.recordedClasses || []).map((rc: any, idx: number) => {
      // If course has no free preview lessons, allow the 1st recorded class as free preview demo
      const isFirstClassPreview = idx === 0 && (course.lessons.length === 0 || !hasFreePreviewInLessons);
      const canAccess = isEnrolled || isFreeCourse || isFirstClassPreview;

      let finalVideoUrl: string | null = null;
      if (canAccess && rc.videoUrl) {
        finalVideoUrl = rc.videoUrl.includes('drive.google.com')
          ? rc.videoUrl.replace(/\/view(\?.*)?$/, '/preview')
          : rc.videoUrl;
      }

      return {
        id: rc.id,
        courseId: course.id,
        title: rc.title,
        chapterTitle: rc.chapter || 'Recorded Lectures',
        durationMinutes: rc.durationMinutes || 45,
        videoUrl: finalVideoUrl,
        pdfUrl: null,
        content: rc.description || null,
        isFreePreview: isFirstClassPreview || isFreeCourse,
        position: (course.lessons.length || 0) + idx + 1,
        thumbnail: normalizeImageUrl(rc.thumbnail),
        isRecordedClass: true,
        quizId: rc.quizId || null,
        quiz: rc.quiz || null,
        resources: rc.resources || [],
      };
    });

    const combinedLessons = [...protectedLessons, ...mappedRecordedClasses];

    res.json({
      success: true,
      course: {
        ...course,
        thumbnail: normalizeImageUrl(course.thumbnail),
        lessons: combinedLessons,
        recordedClasses: (course.recordedClasses || []).map((rc: any) => ({
          ...rc,
          thumbnail: normalizeImageUrl(rc.thumbnail),
        })),
        _count: {
          ...course._count,
          lessons: combinedLessons.length,
        },
        isEnrolled,
        isWishlisted,
        isInCart,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/courses/:slugOrId/learn (Enrolled student learning player)
router.get('/:slugOrId/learn', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { slugOrId } = req.params;

    const course = await prisma.course.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
      include: {
        category: true,
        lessons: {
          orderBy: { position: 'asc' },
          include: {
            quiz: { select: { id: true, title: true, durationMinutes: true, totalMarks: true } },
            resources: { where: { isPublished: true }, orderBy: { createdAt: 'asc' } },
          },
        },
        recordedClasses: {
          where: { isPublished: true },
          orderBy: { createdAt: 'asc' },
          include: {
            quiz: { select: { id: true, title: true, durationMinutes: true, totalMarks: true } },
            resources: { where: { isPublished: true }, orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });

    if (!course) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }

    // Check enrollment or admin role
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId: req.user!.id, courseId: course.id },
      },
    });

    let isEnrolled = !!(enrollment && enrollment.status === 'ACTIVE');
    if (!isEnrolled && (course.price === 0 || course.discountedPrice === 0)) {
      await prisma.enrollment.upsert({
        where: {
          userId_courseId: { userId: req.user!.id, courseId: course.id },
        },
        update: { status: 'ACTIVE' },
        create: {
          userId: req.user!.id,
          courseId: course.id,
          status: 'ACTIVE',
        },
      });
      isEnrolled = true;
    }

    const hasAccess = req.user!.role === 'ADMIN' || isEnrolled;

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course. Please enroll to access the lessons.',
      });
      return;
    }

    // Merge standard lessons with clean preview URLs
    const mappedStandardLessons = course.lessons.map((lesson) => {
      let finalVideoUrl = lesson.videoUrl;
      if (finalVideoUrl && finalVideoUrl.includes('drive.google.com')) {
        finalVideoUrl = finalVideoUrl.replace(/\/view(\?.*)?$/, '/preview');
      }
      return {
        ...lesson,
        videoUrl: finalVideoUrl,
        quizId: (lesson as any).quizId || null,
        quiz: (lesson as any).quiz || null,
        resources: (lesson as any).resources || [],
      };
    });

    // Merge recorded classes with clean preview URLs
    const mappedRecordedClasses = (course.recordedClasses || []).map((rc: any, idx: number) => {
      let finalVideoUrl = rc.videoUrl;
      if (finalVideoUrl && finalVideoUrl.includes('drive.google.com')) {
        finalVideoUrl = finalVideoUrl.replace(/\/view(\?.*)?$/, '/preview');
      }

      return {
        id: rc.id,
        courseId: course.id,
        title: rc.title,
        chapterTitle: rc.chapter || 'Recorded Lectures',
        durationMinutes: rc.durationMinutes || 45,
        videoUrl: finalVideoUrl,
        pdfUrl: null,
        content: rc.description || null,
        isFreePreview: true,
        position: (course.lessons?.length || 0) + idx + 1,
        thumbnail: normalizeImageUrl(rc.thumbnail),
        isRecordedClass: true,
        quizId: rc.quizId || null,
        quiz: rc.quiz || null,
        resources: rc.resources || [],
      };
    });

    const combinedLessons = [...mappedStandardLessons, ...mappedRecordedClasses];

    res.json({
      success: true,
      course: {
        ...course,
        thumbnail: normalizeImageUrl(course.thumbnail),
        lessons: combinedLessons,
      },
      enrollment,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/courses (Admin create)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      title,
      slug,
      shortDescription,
      fullDescription,
      thumbnail,
      categoryId,
      instructorName,
      instructorBio,
      price,
      discountedPrice,
      duration,
      status,
      featured,
      validityDays,
    } = req.body;

    if (!title || !slug || !shortDescription || !fullDescription || !categoryId) {
      res.status(400).json({ success: false, message: 'Title, slug, descriptions, and category are required.' });
      return;
    }

    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        shortDescription: shortDescription.trim(),
        fullDescription: fullDescription.trim(),
        thumbnail: normalizeImageUrl(thumbnail?.trim()) || null,
        categoryId,
        instructorName: instructorName?.trim() || 'Atul Agrahari',
        instructorBio: instructorBio?.trim() || 'Senior Educator & Founder',
        price: parseFloat(price) || 0,
        discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
        duration: duration?.trim() || '60+ Hours',
        status: status || 'PUBLISHED',
        featured: Boolean(featured),
        validityDays: parseInt(validityDays, 10) || 365,
      },
      include: { category: true },
    });

    res.status(201).json({ success: true, message: 'Course created successfully.', course });
  } catch (error) {
    next(error);
  }
});

// PUT /api/courses/:id (Admin edit - supports both UUID and slug)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Resolve course by either ID or slug
    const existing = await prisma.course.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }

    const {
      title,
      slug,
      shortDescription,
      fullDescription,
      thumbnail,
      categoryId,
      instructorName,
      instructorBio,
      price,
      discountedPrice,
      duration,
      status,
      featured,
      validityDays,
    } = req.body;

    // Check slug uniqueness if changed
    const newSlug = slug ? slug.trim().toLowerCase() : existing.slug;
    if (newSlug !== existing.slug) {
      const slugTaken = await prisma.course.findUnique({
        where: { slug: newSlug },
      });
      if (slugTaken && slugTaken.id !== existing.id) {
        res.status(400).json({ success: false, message: 'A course with this URL slug already exists. Please choose a different slug.' });
        return;
      }
    }

    // Check category validity if passed
    if (categoryId && categoryId !== existing.categoryId) {
      const catExists = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!catExists) {
        res.status(400).json({ success: false, message: 'Selected exam category does not exist.' });
        return;
      }
    }

    // Number parsing with NaN guards
    let parsedPrice = existing.price;
    if (price !== undefined && price !== '') {
      const num = Number(price);
      if (!isNaN(num) && num >= 0) {
        parsedPrice = num;
      }
    }

    let parsedDiscount = existing.discountedPrice;
    if (discountedPrice !== undefined) {
      if (discountedPrice === '' || discountedPrice === null) {
        parsedDiscount = null;
      } else {
        const num = Number(discountedPrice);
        parsedDiscount = isNaN(num) ? null : num;
      }
    }

    let parsedValidity = existing.validityDays;
    if (validityDays !== undefined && validityDays !== '') {
      const days = parseInt(String(validityDays), 10);
      if (!isNaN(days) && days > 0) {
        parsedValidity = days;
      }
    }

    const updated = await prisma.course.update({
      where: { id: existing.id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        slug: newSlug,
        ...(shortDescription !== undefined ? { shortDescription: shortDescription.trim() } : {}),
        ...(fullDescription !== undefined ? { fullDescription: fullDescription.trim() } : {}),
        ...(thumbnail !== undefined ? { thumbnail: thumbnail ? normalizeImageUrl(thumbnail.trim()) : null } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(instructorName !== undefined ? { instructorName: instructorName.trim() } : {}),
        ...(instructorBio !== undefined ? { instructorBio: instructorBio ? instructorBio.trim() : null } : {}),
        price: parsedPrice,
        discountedPrice: parsedDiscount,
        ...(duration !== undefined ? { duration: duration.trim() } : {}),
        ...(status ? { status } : {}),
        ...(featured !== undefined ? { featured: Boolean(featured) } : {}),
        validityDays: parsedValidity,
      },
      include: { category: true },
    });

    res.json({ success: true, message: 'Course updated successfully.', course: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/courses/:id (Admin delete)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.course.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Course not found.' });
      return;
    }
    await prisma.course.delete({ where: { id: existing.id } });
    res.json({ success: true, message: 'Course deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// POST /api/courses/:courseId/lessons (Admin create lesson)
router.post('/:courseId/lessons', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, chapterTitle, durationMinutes, videoUrl, pdfUrl, content, isFreePreview, position } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'Lesson title is required.' });
      return;
    }

    const lesson = await prisma.courseLesson.create({
      data: {
        courseId,
        title: title.trim(),
        chapterTitle: chapterTitle?.trim() || 'General',
        durationMinutes: parseInt(durationMinutes, 10) || 15,
        videoUrl: videoUrl?.trim() || null,
        pdfUrl: pdfUrl?.trim() || null,
        content: content?.trim() || null,
        isFreePreview: Boolean(isFreePreview),
        position: parseInt(position, 10) || 1,
      },
    });

    res.status(201).json({ success: true, message: 'Lesson added successfully.', lesson });
  } catch (error) {
    next(error);
  }
});

// PUT /api/courses/lessons/:lessonId (Admin edit lesson)
router.put('/lessons/:lessonId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { title, chapterTitle, durationMinutes, videoUrl, pdfUrl, content, isFreePreview, position } = req.body;

    const lesson = await prisma.courseLesson.update({
      where: { id: lessonId },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(chapterTitle ? { chapterTitle: chapterTitle.trim() } : {}),
        ...(durationMinutes !== undefined ? { durationMinutes: parseInt(durationMinutes, 10) } : {}),
        ...(videoUrl !== undefined ? { videoUrl: videoUrl?.trim() || null } : {}),
        ...(pdfUrl !== undefined ? { pdfUrl: pdfUrl?.trim() || null } : {}),
        ...(content !== undefined ? { content: content?.trim() || null } : {}),
        ...(isFreePreview !== undefined ? { isFreePreview: Boolean(isFreePreview) } : {}),
        ...(position !== undefined ? { position: parseInt(position, 10) } : {}),
      },
    });

    res.json({ success: true, message: 'Lesson updated successfully.', lesson });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/courses/lessons/:lessonId (Admin delete lesson)
router.delete('/lessons/:lessonId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    await prisma.courseLesson.delete({ where: { id: lessonId } });
    res.json({ success: true, message: 'Lesson deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
