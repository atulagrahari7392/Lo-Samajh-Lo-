import { Router, Response, NextFunction } from 'express';
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
// 1. GET /api/typing-tests (Public list of passages with filters & pagination)
// ----------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const {
      language,
      difficulty,
      examCategory,
      category,
      search,
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 12));
    const skip = (pageNum - 1) * take;

    const where: any = { status: 'PUBLISHED' };

    if (language && language !== 'ALL') {
      where.language = String(language).toUpperCase();
    }

    if (difficulty && difficulty !== 'ALL') {
      where.difficulty = String(difficulty).toUpperCase();
    }

    if (examCategory && examCategory !== 'ALL') {
      where.examCategory = String(examCategory).toUpperCase();
    }

    if (category && category !== 'ALL') {
      where.category = String(category).toUpperCase();
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { title: { contains: q } },
        { passageText: { contains: q } },
        { tags: { contains: q } },
      ];
    }

    const [tests, total] = await Promise.all([
      prisma.typingTest.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: {
          exam: { select: { id: true, name: true, slug: true, targetSpeed: true, minAccuracy: true } },
          _count: { select: { attempts: true } },
        },
      }),
      prisma.typingTest.count({ where }),
    ]);

    res.json({
      success: true,
      tests,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 2. GET /api/typing-tests/exams (Government Typing Exams list)
// ----------------------------------------------------
router.get('/exams', async (req, res, next) => {
  try {
    const exams = await prisma.typingExam.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { tests: true, attempts: true } },
      },
    });
    res.json({ success: true, exams });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 3. GET /api/typing-tests/exams/:slug (Exam details + Mock Passages)
// ----------------------------------------------------
router.get('/exams/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const exam = await prisma.typingExam.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        tests: {
          where: { status: 'PUBLISHED' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!exam) {
      res.status(404).json({ success: false, message: 'Typing exam not found.' });
      return;
    }

    res.json({ success: true, exam });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 4. GET /api/typing-tests/courses (Learning Courses: English & Hindi)
// ----------------------------------------------------
router.get('/courses', async (req, res, next) => {
  try {
    const courses = await prisma.typingCourse.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { lessonOrder: 'asc' },
          select: { id: true, moduleName: true, title: true, lessonOrder: true, targetSpeed: true, minAccuracy: true },
        },
      },
    });
    res.json({ success: true, courses });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 5. GET /api/typing-tests/courses/:slug (Course detail with full lessons)
// ----------------------------------------------------
router.get('/courses/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const course = await prisma.typingCourse.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        lessons: {
          orderBy: { lessonOrder: 'asc' },
        },
      },
    });

    if (!course) {
      res.status(404).json({ success: false, message: 'Typing course not found.' });
      return;
    }

    res.json({ success: true, course });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 6. GET /api/typing-tests/daily-challenge (Today's Challenge)
// ----------------------------------------------------
router.get('/daily-challenge', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let challenge = await prisma.typingDailyChallenge.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, challenge });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 7. GET /api/typing-tests/user/dashboard (User Stats, Streak, Weak Keys)
// ----------------------------------------------------
router.get('/user/dashboard', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Fetch user progress or create default
    let progress = await prisma.typingUserProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      progress = await prisma.typingUserProgress.create({
        data: {
          userId,
          targetSpeed: 35,
          targetAccuracy: 95,
          selectedExam: 'SSC CHSL',
        },
      });
    }

    // Compute language-specific stats from attempts
    const [engAttempts, hindiAttempts] = await Promise.all([
      prisma.typingAttempt.findMany({
        where: { userId, typingTest: { language: 'ENGLISH' } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.typingAttempt.findMany({
        where: { userId, typingTest: { language: 'HINDI' } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    const engBestSpeed = engAttempts.length > 0 ? Math.max(...engAttempts.map(a => a.netWpm)) : 0;
    const engAvgSpeed = engAttempts.length > 0 ? Math.round(engAttempts.reduce((acc, a) => acc + a.netWpm, 0) / engAttempts.length) : 0;
    const engAccuracy = engAttempts.length > 0 ? Math.round(engAttempts.reduce((acc, a) => acc + a.accuracy, 0) / engAttempts.length) : 0;

    const hindiBestSpeed = hindiAttempts.length > 0 ? Math.max(...hindiAttempts.map(a => a.netWpm)) : 0;
    const hindiAvgSpeed = hindiAttempts.length > 0 ? Math.round(hindiAttempts.reduce((acc, a) => acc + a.netWpm, 0) / hindiAttempts.length) : 0;
    const hindiAccuracy = hindiAttempts.length > 0 ? Math.round(hindiAttempts.reduce((acc, a) => acc + a.accuracy, 0) / hindiAttempts.length) : 0;

    // Recent attempts
    const recentAttempts = await prisma.typingAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        typingTest: { select: { id: true, title: true, language: true, difficulty: true } },
        exam: { select: { name: true, targetSpeed: true } },
      },
    });

    // Parse weak keys
    let weakKeysList: string[] = [];
    if (progress.weakKeys) {
      try {
        weakKeysList = JSON.parse(progress.weakKeys);
      } catch {}
    }

    res.json({
      success: true,
      stats: {
        streakDays: progress.streakDays || 1,
        dailyGoalMinutes: progress.dailyGoalMinutes,
        selectedExam: progress.selectedExam,
        targetSpeed: progress.targetSpeed,
        targetAccuracy: progress.targetAccuracy,
        english: {
          bestSpeed: engBestSpeed,
          avgSpeed: engAvgSpeed,
          accuracy: engAccuracy,
          testsCompleted: engAttempts.length,
        },
        hindi: {
          bestSpeed: hindiBestSpeed,
          avgSpeed: hindiAvgSpeed,
          accuracy: hindiAccuracy,
          testsCompleted: hindiAttempts.length,
        },
        weakKeys: weakKeysList,
      },
      recentAttempts,
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 8. POST /api/typing-tests/user/goal (Update Goal & Target)
// ----------------------------------------------------
router.post('/user/goal', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { targetSpeed, targetAccuracy, selectedExam, dailyGoalMinutes, preferredLanguage } = req.body;

    const progress = await prisma.typingUserProgress.upsert({
      where: { userId },
      update: {
        ...(targetSpeed !== undefined ? { targetSpeed: parseFloat(targetSpeed) } : {}),
        ...(targetAccuracy !== undefined ? { targetAccuracy: parseFloat(targetAccuracy) } : {}),
        ...(selectedExam ? { selectedExam } : {}),
        ...(dailyGoalMinutes ? { dailyGoalMinutes: parseInt(dailyGoalMinutes, 10) } : {}),
        ...(preferredLanguage ? { preferredLanguage } : {}),
      },
      create: {
        userId,
        targetSpeed: parseFloat(targetSpeed) || 35,
        targetAccuracy: parseFloat(targetAccuracy) || 95,
        selectedExam: selectedExam || 'SSC CHSL',
        dailyGoalMinutes: parseInt(dailyGoalMinutes, 10) || 15,
        preferredLanguage: preferredLanguage || 'ENGLISH',
      },
    });

    res.json({ success: true, progress });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 9. POST /api/typing-tests/attempt (Save & Evaluate Attempt with Anti-Cheat)
// ----------------------------------------------------
router.post('/attempt', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      typingTestId,
      examId,
      mode = 'STANDARD',
      wpm,
      grossWpm,
      netWpm,
      accuracy,
      errors,
      correctChars,
      wrongChars,
      backspaces,
      omissions,
      substitutions,
      totalCharacters,
      durationSeconds,
      timeSpentSeconds,
      mistakeDetails,
    } = req.body;

    if (!typingTestId) {
      res.status(400).json({ success: false, message: 'Typing test ID is required.' });
      return;
    }

    const test = await prisma.typingTest.findUnique({
      where: { id: typingTestId },
      include: { exam: true },
    });

    if (!test) {
      res.status(404).json({ success: false, message: 'Passage not found.' });
      return;
    }

    const duration = parseInt(durationSeconds, 10) || test.durationSeconds || 60;
    const timeSpent = Math.max(1, parseInt(timeSpentSeconds, 10) || duration);

    // Server-side calculation & sanity validation (Anti-Cheat)
    const minutesElapsed = Math.max(timeSpent / 60, 0.05);
    const charsTyped = parseInt(totalCharacters, 10) || 0;
    const computedErrors = parseInt(errors, 10) || 0;

    // Enforce reasonable boundaries (anti-paste, impossible speed limit 250 WPM)
    const calculatedGross = Math.round((charsTyped / 5) / minutesElapsed);
    if (calculatedGross > 250) {
      res.status(400).json({ success: false, message: 'Irregular typing speed detected.' });
      return;
    }

    const finalGrossWpm = parseFloat(grossWpm) || calculatedGross;
    const finalNetWpm = Math.max(0, parseFloat(netWpm) || Math.round(((charsTyped / 5) - (computedErrors / 5)) / minutesElapsed));
    const finalAccuracy = Math.min(100, Math.max(0, parseFloat(accuracy) || Math.round(((charsTyped - computedErrors) / Math.max(1, charsTyped)) * 100)));

    // Exam qualification & Readiness Score calculation
    let resultStatus = 'PASSED';
    let readinessScore = Math.min(100, Math.round((finalNetWpm / 35) * 50 + (finalAccuracy / 100) * 50));

    const targetExam = test.exam;
    if (targetExam) {
      const meetsSpeed = finalNetWpm >= targetExam.targetSpeed;
      const meetsAccuracy = finalAccuracy >= targetExam.minAccuracy;
      resultStatus = meetsSpeed && meetsAccuracy ? 'QUALIFIED' : 'NOT_QUALIFIED';
      readinessScore = Math.min(
        100,
        Math.round((finalNetWpm / targetExam.targetSpeed) * 60 + (finalAccuracy / targetExam.minAccuracy) * 40)
      );
    }

    let attemptRecord = null;
    if (req.user) {
      const userId = req.user.id;

      attemptRecord = await prisma.typingAttempt.create({
        data: {
          typingTestId,
          userId,
          examId: examId || test.examId || null,
          mode,
          wpm: finalNetWpm,
          grossWpm: finalGrossWpm,
          netWpm: finalNetWpm,
          accuracy: finalAccuracy,
          errors: computedErrors,
          correctChars: parseInt(correctChars, 10) || Math.max(0, charsTyped - computedErrors),
          wrongChars: parseInt(wrongChars, 10) || computedErrors,
          backspaces: parseInt(backspaces, 10) || 0,
          omissions: parseInt(omissions, 10) || 0,
          substitutions: parseInt(substitutions, 10) || 0,
          totalCharacters: charsTyped,
          durationSeconds: duration,
          timeSpentSeconds: timeSpent,
          resultStatus,
          readinessScore,
          mistakeDetails: mistakeDetails ? JSON.stringify(mistakeDetails) : null,
        },
      });

      // Update User Progress, Streak & Stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingProgress = await prisma.typingUserProgress.findUnique({
        where: { userId },
      });

      let streakDays = existingProgress?.streakDays || 1;
      if (existingProgress?.lastPracticeDate) {
        const lastDate = new Date(existingProgress.lastPracticeDate);
        lastDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((today.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          streakDays += 1;
        } else if (diffDays > 1) {
          streakDays = 1;
        }
      }

      await prisma.typingUserProgress.upsert({
        where: { userId },
        update: {
          streakDays,
          lastPracticeDate: new Date(),
          bestWpm: Math.max(existingProgress?.bestWpm || 0, finalNetWpm),
          totalTestsCount: { increment: 1 },
          totalPracticeSeconds: { increment: timeSpent },
        },
        create: {
          userId,
          streakDays: 1,
          lastPracticeDate: new Date(),
          bestWpm: finalNetWpm,
          totalTestsCount: 1,
          totalPracticeSeconds: timeSpent,
        },
      });
    }

    res.json({
      success: true,
      message: 'Typing attempt evaluated successfully.',
      attempt: attemptRecord,
      metrics: {
        grossWpm: finalGrossWpm,
        netWpm: finalNetWpm,
        accuracy: finalAccuracy,
        errors: computedErrors,
        correctChars: parseInt(correctChars, 10) || Math.max(0, charsTyped - computedErrors),
        wrongChars: parseInt(wrongChars, 10) || computedErrors,
        backspaces: parseInt(backspaces, 10) || 0,
        resultStatus,
        readinessScore,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 10. GET /api/typing-tests/user/history (Logged in user attempts)
// ----------------------------------------------------
router.get('/user/history', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * take;

    const [attempts, total] = await Promise.all([
      prisma.typingAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          typingTest: { select: { id: true, title: true, language: true, difficulty: true } },
          exam: { select: { name: true, targetSpeed: true } },
        },
      }),
      prisma.typingAttempt.count({ where: { userId } }),
    ]);

    res.json({
      success: true,
      attempts,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 11. GET /api/typing-tests/:id (Passage details)
// ----------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await prisma.typingTest.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        exam: true,
        _count: { select: { attempts: true } },
      },
    });

    if (!test) {
      res.status(404).json({ success: false, message: 'Typing passage not found.' });
      return;
    }

    res.json({ success: true, test });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 12. ADMIN: Dashboard Stats
// ----------------------------------------------------
router.get('/admin/stats', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPassages,
      totalExams,
      totalCourses,
      totalAttempts,
      todayAttempts,
      usersCount,
      attemptsAgg,
    ] = await Promise.all([
      prisma.typingTest.count(),
      prisma.typingExam.count(),
      prisma.typingCourse.count(),
      prisma.typingAttempt.count(),
      prisma.typingAttempt.count({ where: { createdAt: { gte: today } } }),
      prisma.typingUserProgress.count(),
      prisma.typingAttempt.aggregate({
        _avg: { netWpm: true, accuracy: true },
      }),
    ]);

    const popularExams = await prisma.typingExam.findMany({
      take: 5,
      include: { _count: { select: { attempts: true, tests: true } } },
      orderBy: { attempts: { _count: 'desc' } },
    });

    res.json({
      success: true,
      stats: {
        totalPassages,
        totalExams,
        totalCourses,
        totalAttempts,
        todayAttempts,
        usersCount,
        avgWpm: Math.round(attemptsAgg._avg.netWpm || 0),
        avgAccuracy: Math.round(attemptsAgg._avg.accuracy || 0),
      },
      popularExams,
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 13. ADMIN: Exam CRUD
// ----------------------------------------------------
router.post('/admin/exams', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      name,
      slug: customSlug,
      category,
      post,
      department,
      language,
      keyboardLayout,
      durationSeconds,
      targetSpeed,
      minAccuracy,
      backspaceRule,
      description,
      instructions,
      isFeatured,
    } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Exam name is required.' });
      return;
    }

    const slug = customSlug ? slugify(customSlug) : slugify(name);

    const exam = await prisma.typingExam.create({
      data: {
        name: name.trim(),
        slug,
        category: category || 'SSC',
        post: post?.trim() || 'Clerk / Typist',
        department: department?.trim() || null,
        language: language || 'ENGLISH',
        keyboardLayout: keyboardLayout || 'QWERTY',
        durationSeconds: parseInt(durationSeconds, 10) || 600,
        targetSpeed: parseFloat(targetSpeed) || 35,
        minAccuracy: parseFloat(minAccuracy) || 95,
        backspaceRule: backspaceRule || 'ALLOWED',
        description: description?.trim() || null,
        instructions: instructions?.trim() || null,
        isFeatured: Boolean(isFeatured),
      },
    });

    res.status(201).json({ success: true, message: 'Typing exam created successfully.', exam });
  } catch (error) {
    next(error);
  }
});

router.put('/admin/exams/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.targetSpeed) updateData.targetSpeed = parseFloat(updateData.targetSpeed);
    if (updateData.minAccuracy) updateData.minAccuracy = parseFloat(updateData.minAccuracy);
    if (updateData.durationSeconds) updateData.durationSeconds = parseInt(updateData.durationSeconds, 10);

    const exam = await prisma.typingExam.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, message: 'Typing exam updated.', exam });
  } catch (error) {
    next(error);
  }
});

router.delete('/admin/exams/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.typingExam.delete({ where: { id } });
    res.json({ success: true, message: 'Typing exam deleted.' });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 14. ADMIN: Passage CRUD
// ----------------------------------------------------
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      title,
      slug: customSlug,
      examId,
      examCategory,
      language,
      keyboardLayout,
      category,
      passageText,
      difficulty,
      durationSeconds,
      source,
      year,
      tags,
      isFeatured,
      status,
    } = req.body;

    if (!title || !passageText) {
      res.status(400).json({ success: false, message: 'Title and passage text are required.' });
      return;
    }

    const text = passageText.trim();
    const words = text.split(/\s+/).filter(Boolean);
    const slug = customSlug ? slugify(customSlug) : slugify(title);

    const passage = await prisma.typingTest.create({
      data: {
        title: title.trim(),
        slug,
        examId: examId || null,
        examCategory: examCategory || 'GENERAL',
        language: language?.toUpperCase() || 'ENGLISH',
        keyboardLayout: keyboardLayout || 'QWERTY',
        category: category || 'PRACTICE',
        passageText: text,
        wordCount: words.length,
        characterCount: text.length,
        difficulty: difficulty?.toUpperCase() || 'MEDIUM',
        durationSeconds: parseInt(durationSeconds, 10) || 60,
        source: source?.trim() || null,
        year: year ? parseInt(year, 10) : null,
        tags: tags?.trim() || null,
        isFeatured: Boolean(isFeatured),
        status: status || 'PUBLISHED',
      },
    });

    res.status(201).json({ success: true, message: 'Typing passage created.', passage });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { passageText } = req.body;
    const dataToUpdate = { ...req.body };

    if (passageText) {
      const text = passageText.trim();
      const words = text.split(/\s+/).filter(Boolean);
      dataToUpdate.passageText = text;
      dataToUpdate.wordCount = words.length;
      dataToUpdate.characterCount = text.length;
    }

    const passage = await prisma.typingTest.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json({ success: true, message: 'Typing passage updated.', passage });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.typingTest.delete({ where: { id } });
    res.json({ success: true, message: 'Typing passage deleted.' });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 15. ADMIN: User Analytics List
// ----------------------------------------------------
router.get('/admin/users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const usersProgress = await prisma.typingUserProgress.findMany({
      orderBy: { bestWpm: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    res.json({ success: true, users: usersProgress });
  } catch (error) {
    next(error);
  }
});

export default router;
