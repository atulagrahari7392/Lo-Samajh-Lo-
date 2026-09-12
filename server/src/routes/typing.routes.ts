import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, optionalAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/typing-tests (Public list of passages)
router.get('/', async (req, res, next) => {
  try {
    const { language, difficulty } = req.query;

    const where: any = { status: 'PUBLISHED' };
    if (language) where.language = String(language).toUpperCase();
    if (difficulty) where.difficulty = String(difficulty).toUpperCase();

    const tests = await prisma.typingTest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { attempts: true } },
      },
    });

    res.json({ success: true, tests });
  } catch (error) {
    next(error);
  }
});

// GET /api/typing-tests/:id (Passage details)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const test = await prisma.typingTest.findUnique({
      where: { id },
      include: {
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

// POST /api/typing-tests/attempt (Save typing test result)
router.post('/attempt', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const {
      typingTestId,
      wpm,
      accuracy,
      errors,
      netWpm,
      totalCharacters,
      durationSeconds,
    } = req.body;

    if (!typingTestId) {
      res.status(400).json({ success: false, message: 'Typing test ID is required.' });
      return;
    }

    // If logged in, save to database
    let attemptRecord = null;
    if (req.user) {
      attemptRecord = await prisma.typingAttempt.create({
        data: {
          typingTestId,
          userId: req.user.id,
          wpm: parseFloat(wpm) || 0,
          accuracy: parseFloat(accuracy) || 0,
          errors: parseInt(errors, 10) || 0,
          netWpm: parseFloat(netWpm) || 0,
          totalCharacters: parseInt(totalCharacters, 10) || 0,
          durationSeconds: parseInt(durationSeconds, 10) || 60,
        },
      });
    }

    res.json({
      success: true,
      message: 'Typing attempt evaluated successfully!',
      attempt: attemptRecord,
      metrics: {
        wpm: parseFloat(wpm) || 0,
        netWpm: parseFloat(netWpm) || 0,
        accuracy: parseFloat(accuracy) || 0,
        errors: parseInt(errors, 10) || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/typing-tests/user/history (Logged in user attempts)
router.get('/user/history', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const attempts = await prisma.typingAttempt.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        typingTest: {
          select: { id: true, title: true, language: true, difficulty: true },
        },
      },
    });

    res.json({ success: true, attempts });
  } catch (error) {
    next(error);
  }
});

// Admin typing test CRUD
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { title, language, passageText, difficulty, durationSeconds, status } = req.body;

    if (!title || !passageText) {
      res.status(400).json({ success: false, message: 'Title and passage text are required.' });
      return;
    }

    const passage = await prisma.typingTest.create({
      data: {
        title: title.trim(),
        language: language?.toUpperCase() || 'ENGLISH',
        passageText: passageText.trim(),
        difficulty: difficulty?.toUpperCase() || 'MEDIUM',
        durationSeconds: parseInt(durationSeconds, 10) || 60,
        status: status || 'PUBLISHED',
      },
    });

    res.status(201).json({ success: true, message: 'Typing passage created.', passage });
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

export default router;
