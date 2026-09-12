import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, optionalAuth, requireAdmin, AuthRequest } from '../middleware/auth';

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
        { title: { contains: String(search) } },
        { shortDescription: { contains: String(search) } },
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

    const enhancedCourses = courses.map((course) => ({
      ...course,
      isEnrolled: userEnrolledIds.has(course.id),
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
          select: { lessons: true, enrollments: true, reviews: true },
        },
      },
    });
    res.json({ success: true, courses });
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
          select: {
            id: true,
            title: true,
            chapterTitle: true,
            durationMinutes: true,
            isFreePreview: true,
            position: true,
            videoUrl: true, // Only show preview video or will mask if not enrolled
            pdfUrl: true,
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
          select: { enrollments: true, lessons: true, reviews: true },
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
      isEnrolled = !!(enrollment && enrollment.status === 'ACTIVE');

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
      return lesson;
    });

    res.json({
      success: true,
      course: {
        ...course,
        lessons: protectedLessons,
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

    const hasAccess = req.user!.role === 'ADMIN' || (enrollment && enrollment.status === 'ACTIVE');

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'You are not enrolled in this course. Please enroll to access the lessons.',
      });
      return;
    }

    res.json({
      success: true,
      course,
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
        thumbnail: thumbnail?.trim() || null,
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

// PUT /api/courses/:id (Admin edit)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
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

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(slug ? { slug: slug.trim().toLowerCase() } : {}),
        ...(shortDescription ? { shortDescription: shortDescription.trim() } : {}),
        ...(fullDescription ? { fullDescription: fullDescription.trim() } : {}),
        ...(thumbnail !== undefined ? { thumbnail } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(instructorName ? { instructorName: instructorName.trim() } : {}),
        ...(instructorBio !== undefined ? { instructorBio } : {}),
        ...(price !== undefined ? { price: parseFloat(price) } : {}),
        ...(discountedPrice !== undefined ? { discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null } : {}),
        ...(duration ? { duration: duration.trim() } : {}),
        ...(status ? { status } : {}),
        ...(featured !== undefined ? { featured: Boolean(featured) } : {}),
        ...(validityDays !== undefined ? { validityDays: parseInt(validityDays, 10) } : {}),
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
    await prisma.course.delete({ where: { id } });
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
