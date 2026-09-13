import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, optionalAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// ----------------------------------------------------
// 1. GET /api/test-series (Public list with filters)
// ----------------------------------------------------
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { category, search, featured } = req.query;

    const where: any = { isActive: true, status: 'PUBLISHED' };

    if (category && category !== 'ALL') {
      const catStr = String(category).trim().toLowerCase();
      if (catStr === 'up police' || catStr === 'up-police') {
        where.examCategory = { contains: 'Police' };
      } else if (catStr === 'ssc' || catStr === 'ssc & state exams') {
        where.OR = [{ examCategory: { contains: 'SSC' } }, { examCategory: { contains: 'BSSC' } }];
      } else if (catStr === 'bssc') {
        where.examCategory = { contains: 'BSSC' };
      } else {
        where.examCategory = { contains: String(category).trim() };
      }
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { title: { contains: q } },
        { subTitle: { contains: q } },
        { description: { contains: q } },
        { examCategory: { contains: q } },
      ];
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    const seriesList = await prisma.testSeries.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      include: {
        tests: {
          select: {
            id: true,
            title: true,
            isFree: true,
            subCategory: true,
            testType: true,
            durationMinutes: true,
            totalMarks: true,
          },
        },
      },
    });

    // Compute dynamic test counts & user progress
    let userAttempts: any[] = [];
    if (req.user) {
      userAttempts = await prisma.testAttempt.findMany({
        where: { userId: req.user.id },
        select: { testId: true, score: true, status: true },
      });
    }

    const attemptedTestIds = new Set(userAttempts.map((a) => a.testId));

    const result = seriesList.map((s) => {
      const tests = s.tests || [];
      const totalTests = Math.max(s.totalTestsCount || 0, tests.length);
      const freeTests = tests.filter((t) => t.isFree).length || s.freeTestsCount || 0;

      // Group subcategories
      const subCatMap: Record<string, number> = {};
      tests.forEach((t) => {
        const catName = t.subCategory || 'Mock Tests';
        subCatMap[catName] = (subCatMap[catName] || 0) + 1;
      });

      const subCategories = Object.entries(subCatMap).map(([name, count]) => ({
        name,
        count,
        type: name.toLowerCase().replace(/\s+/g, '-'),
      }));

      // Calculate progress if user logged in
      let attemptedCount = 0;
      tests.forEach((t) => {
        if (attemptedTestIds.has(t.id)) attemptedCount++;
      });

      const progressPercent = totalTests > 0 ? Math.round((attemptedCount / totalTests) * 100) : 0;

      return {
        id: s.id,
        title: s.title,
        slug: s.slug,
        examCategory: s.examCategory,
        subTitle: s.subTitle,
        description: s.description,
        thumbnail: s.thumbnail,
        badge: s.badge,
        totalTests: `${totalTests} Total Tests`,
        totalTestsCount: totalTests,
        freeTests: `${freeTests} FREE TESTS`,
        freeTestsCount: freeTests,
        users: `${(s.enrolledCount / 1000).toFixed(1)}k Users`,
        enrolledCount: s.enrolledCount,
        languages: s.languages || 'English, Hindi',
        attempted: `${attemptedCount}/${totalTests} Tests`,
        attemptedCount,
        progressPercent,
        rating: s.rating,
        price: s.price,
        originalPrice: s.originalPrice,
        isFeatured: s.isFeatured,
        subCategories:
          subCategories.length > 0
            ? subCategories
            : [
                { name: 'Live Test', count: 1, type: 'live' },
                { name: 'Chapter Test', count: 173, type: 'chapter' },
                { name: 'Subject Test', count: 35, type: 'subject' },
                { name: 'Sectional Test', count: 20, type: 'sectional' },
                { name: 'Full Test', count: 15, type: 'full' },
              ],
      };
    });

    res.json({ success: true, series: result });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 2. GET /api/test-series/:idOrSlug (Detailed View with all tests)
// ----------------------------------------------------
router.get('/:idOrSlug', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { idOrSlug } = req.params;

    const series = await prisma.testSeries.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        tests: {
          orderBy: [{ createdAt: 'asc' }],
          include: {
            _count: {
              select: { testQuestions: true, attempts: true },
            },
          },
        },
      },
    });

    if (!series) {
      res.status(404).json({ success: false, message: 'Test Series package not found.' });
      return;
    }

    // Also find any published tests that belong directly to this series OR match its exam category
    const categoryOrSeriesTests = await prisma.test.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { seriesId: series.id },
          { category: { name: { contains: series.examCategory } } },
          { category: { slug: { contains: series.slug } } },
        ],
      },
      orderBy: [{ createdAt: 'asc' }],
      include: {
        _count: {
          select: { testQuestions: true, attempts: true },
        },
      },
    });

    // Merge unique tests prioritizing explicit series.tests
    const testMap = new Map<string, any>();
    (series.tests || []).forEach((t) => testMap.set(t.id, t));
    categoryOrSeriesTests.forEach((t) => {
      if (!testMap.has(t.id)) testMap.set(t.id, t);
    });
    const allMatchingTests = Array.from(testMap.values());

    // User attempts map
    let userAttemptsMap: Record<string, { status: string; score: number; attemptId: string }> = {};
    if (req.user) {
      const attempts = await prisma.testAttempt.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
      });
      attempts.forEach((a) => {
        if (!userAttemptsMap[a.testId]) {
          userAttemptsMap[a.testId] = { status: a.status, score: a.score, attemptId: a.id };
        }
      });
    }

    const enhancedTests = allMatchingTests.map((t) => {
      const userAtt = userAttemptsMap[t.id];
      let stateAction: 'START' | 'RESUME' | 'REATTEMPT' | 'VIEW_RESULT' = 'START';

      if (userAtt) {
        if (userAtt.status === 'IN_PROGRESS') {
          stateAction = 'RESUME';
        } else if (userAtt.status === 'SUBMITTED' || userAtt.status === 'EVALUATED') {
          stateAction = 'REATTEMPT';
        }
      }

      return {
        id: t.id,
        title: t.title,
        slug: t.slug,
        testType: t.testType,
        subCategory: t.subCategory || 'Mock Tests',
        description: t.description,
        durationMinutes: t.durationMinutes,
        totalMarks: t.totalMarks,
        passMarks: t.passMarks,
        negativeMarking: t.negativeMarking,
        isFree: t.isFree,
        isLive: t.isLive,
        scheduledStart: t.scheduledStart,
        scheduledEnd: t.scheduledEnd,
        questionsCount: t._count.testQuestions || 50,
        attemptsCount: t._count.attempts || 1200,
        userAttempt: userAtt || null,
        stateAction,
        languages: 'English, Hindi',
      };
    });

    // Dynamic grouping of tests by subcategory
    const subCategoriesList = [
      'Mock Tests',
      'PYPs',
      'Live Test',
      'Chapter Test',
      'Subject Test',
      'Sectional Test',
      'Full Test',
    ];

    const testsBySubCategory: Record<string, any[]> = {};
    subCategoriesList.forEach((sub) => {
      testsBySubCategory[sub] = [];
    });

    enhancedTests.forEach((t) => {
      const sub = t.subCategory || 'Mock Tests';
      if (!testsBySubCategory[sub]) testsBySubCategory[sub] = [];
      testsBySubCategory[sub].push(t);
    });

    const totalTests = Math.max(series.totalTestsCount, enhancedTests.length);
    const freeTests = enhancedTests.filter((t) => t.isFree).length || series.freeTestsCount;

    res.json({
      success: true,
      series: {
        ...series,
        totalTestsCount: totalTests,
        freeTestsCount: freeTests,
        tests: enhancedTests,
        testsBySubCategory,
      },
      tests: enhancedTests,
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// ----------------------------------------------------
// 3. ADMIN: Create Test Series (supports both / and /admin)
// ----------------------------------------------------
const handleCreateSeries = async (req: any, res: any) => {
  try {
    const {
      title,
      slug: customSlug,
      examCategory,
      subTitle,
      description,
      thumbnail,
      badge,
      totalTestsCount,
      freeTestsCount,
      enrolledCount,
      languages,
      validityDays,
      price,
      originalPrice,
      isFeatured,
      status,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Series title is required.' });
    }

    let slug = customSlug ? slugify(customSlug) : slugify(title);
    if (!slug) slug = 'test-series-' + Date.now().toString().slice(-6);

    // Ensure unique slug
    const existing = await prisma.testSeries.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const series = await prisma.testSeries.create({
      data: {
        title: title.trim(),
        slug,
        examCategory: examCategory?.trim() || 'UP Police',
        subTitle: subTitle?.trim() || null,
        description: description?.trim() || null,
        thumbnail: thumbnail?.trim() || null,
        badge: badge?.trim() || null,
        totalTestsCount: parseInt(String(totalTestsCount), 10) || 0,
        freeTestsCount: parseInt(String(freeTestsCount), 10) || 0,
        enrolledCount: parseInt(String(enrolledCount), 10) || 0,
        languages: languages?.trim() || 'English, Hindi',
        validityDays: parseInt(String(validityDays), 10) || 365,
        price: parseFloat(String(price)) || 0,
        originalPrice: originalPrice ? parseFloat(String(originalPrice)) : null,
        isFeatured: Boolean(isFeatured),
        status: status || 'PUBLISHED',
      },
    });

    return res.status(201).json({ success: true, message: 'Test Series created successfully.', series });
  } catch (error: any) {
    console.error('Error creating test series:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'A test series with this slug already exists.' });
    }
    return res.status(400).json({ success: false, message: error.message || 'Failed to create test series.' });
  }
};

router.post('/', authenticate, requireAdmin, handleCreateSeries);
router.post('/admin', authenticate, requireAdmin, handleCreateSeries);

// ----------------------------------------------------
// 4. ADMIN: Update Test Series (supports both /:id and /admin/:id)
// ----------------------------------------------------
const handleUpdateSeries = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug: customSlug,
      examCategory,
      subTitle,
      description,
      thumbnail,
      badge,
      totalTestsCount,
      freeTestsCount,
      enrolledCount,
      languages,
      validityDays,
      price,
      originalPrice,
      isFeatured,
      status,
    } = req.body;

    const data: any = {};
    if (title && String(title).trim()) data.title = title.trim();

    if (customSlug) {
      let cleanSlug = slugify(customSlug);
      const existing = await prisma.testSeries.findFirst({
        where: { slug: cleanSlug, NOT: { id } },
      });
      if (existing) {
        cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
      }
      data.slug = cleanSlug;
    }

    if (examCategory) data.examCategory = examCategory.trim();
    if (subTitle !== undefined) data.subTitle = subTitle?.trim() || null;
    if (description !== undefined) data.description = description?.trim() || null;
    if (thumbnail !== undefined) data.thumbnail = thumbnail?.trim() || null;
    if (badge !== undefined) data.badge = badge?.trim() || null;
    if (totalTestsCount !== undefined) data.totalTestsCount = parseInt(String(totalTestsCount), 10) || 0;
    if (freeTestsCount !== undefined) data.freeTestsCount = parseInt(String(freeTestsCount), 10) || 0;
    if (enrolledCount !== undefined) data.enrolledCount = parseInt(String(enrolledCount), 10) || 0;
    if (languages !== undefined) data.languages = languages.trim();
    if (validityDays !== undefined) data.validityDays = parseInt(String(validityDays), 10) || 365;
    if (price !== undefined) data.price = parseFloat(String(price)) || 0;
    if (originalPrice !== undefined) data.originalPrice = originalPrice ? parseFloat(String(originalPrice)) : null;
    if (isFeatured !== undefined) data.isFeatured = Boolean(isFeatured);
    if (status !== undefined) data.status = status;

    const updated = await prisma.testSeries.update({
      where: { id },
      data,
    });

    return res.json({ success: true, message: 'Test Series updated successfully.', series: updated });
  } catch (error: any) {
    console.error('Error updating test series:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'A test series with this slug already exists.' });
    }
    return res.status(400).json({ success: false, message: error.message || 'Failed to update test series.' });
  }
};

router.put('/:id', authenticate, requireAdmin, handleUpdateSeries);
router.put('/admin/:id', authenticate, requireAdmin, handleUpdateSeries);

// ----------------------------------------------------
// 5. ADMIN: Delete Test Series (supports both /:id and /admin/:id)
// ----------------------------------------------------
const handleDeleteSeries = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    await prisma.testSeries.delete({ where: { id } });
    return res.json({ success: true, message: 'Test Series deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting test series:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to delete test series.' });
  }
};

router.delete('/:id', authenticate, requireAdmin, handleDeleteSeries);
router.delete('/admin/:id', authenticate, requireAdmin, handleDeleteSeries);

export default router;
