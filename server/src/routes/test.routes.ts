import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, optionalAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/tests (Public tests list)
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { category, search } = req.query;

    const where: any = { status: 'PUBLISHED' };

    if (category) {
      where.OR = [
        { categoryId: String(category) },
        { category: { slug: String(category) } },
      ];
    }

    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    const tests = await prisma.test.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
        course: { select: { id: true, title: true, slug: true } },
        _count: {
          select: { testQuestions: true, attempts: true },
        },
      },
    });

    let userAttemptsMap: Record<string, number> = {};
    if (req.user) {
      const attempts = await prisma.testAttempt.findMany({
        where: { userId: req.user.id },
        select: { testId: true, score: true },
      });
      attempts.forEach((att) => {
        userAttemptsMap[att.testId] = Math.max(userAttemptsMap[att.testId] || 0, att.score);
      });
    }

    const enhanced = tests.map((t) => ({
      ...t,
      questionsCount: t._count.testQuestions,
      attemptsCount: t._count.attempts,
      userHighestScore: userAttemptsMap[t.id] !== undefined ? userAttemptsMap[t.id] : null,
    }));

    res.json({ success: true, tests: enhanced });
  } catch (error) {
    next(error);
  }
});

// GET /api/tests/my-attempts (Logged-in user attempts)
router.get('/my-attempts', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const attempts = await prisma.testAttempt.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        test: {
          select: { id: true, title: true, totalMarks: true, durationMinutes: true },
        },
      },
    });
    res.json({ success: true, attempts });
  } catch (error) {
    next(error);
  }
});

// GET /api/tests/:idOrSlug (Test overview & instructions)
router.get('/:idOrSlug', async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;

    const test = await prisma.test.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        category: true,
        course: true,
        _count: {
          select: { testQuestions: true, attempts: true },
        },
      },
    });

    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found.' });
      return;
    }

    res.json({
      success: true,
      test: {
        ...test,
        questionsCount: test._count.testQuestions,
        attemptsCount: test._count.attempts,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tests/:idOrSlug/take (Start test - delivers questions without answers)
router.get('/:idOrSlug/take', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { idOrSlug } = req.params;

    const test = await prisma.test.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        testQuestions: {
          orderBy: { position: 'asc' },
          include: {
            question: true,
          },
        },
      },
    });

    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found.' });
      return;
    }

    // Sanitize questions so correct answers and explanations are hidden during test taking
    const questions = test.testQuestions.map((tq, idx) => {
      let optionsArray: string[] = [];
      try {
        optionsArray = JSON.parse(tq.question.options);
      } catch (e) {
        optionsArray = [tq.question.options];
      }

      return {
        testQuestionId: tq.id,
        questionId: tq.question.id,
        position: tq.position || idx + 1,
        sectionName: tq.sectionName,
        questionText: tq.question.questionText,
        questionType: tq.question.questionType,
        options: optionsArray,
        marks: tq.question.marks,
        negativeMarks: tq.question.negativeMarks || test.negativeMarking,
        difficulty: tq.question.difficulty,
        subject: tq.question.subject,
      };
    });

    res.json({
      success: true,
      test: {
        id: test.id,
        title: test.title,
        durationMinutes: test.durationMinutes,
        totalMarks: test.totalMarks,
        passMarks: test.passMarks,
        negativeMarking: test.negativeMarking,
        questionsCount: questions.length,
      },
      questions,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/tests/:idOrSlug/submit (Grading engine)
router.post('/:idOrSlug/submit', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const { answers, timeSpentSeconds } = req.body; // answers: { [questionId]: "0" }

    const test = await prisma.test.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        testQuestions: {
          include: { question: true },
        },
      },
    });

    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found.' });
      return;
    }

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    const answerRecordsToCreate: Array<{
      questionId: string;
      selectedOption: string | null;
      isCorrect: boolean;
      marksAwarded: number;
    }> = [];

    for (const tq of test.testQuestions) {
      const q = tq.question;
      const userSelected = answers ? answers[q.id] : undefined;

      if (userSelected === undefined || userSelected === null || userSelected === '') {
        skippedCount++;
        answerRecordsToCreate.push({
          questionId: q.id,
          selectedOption: null,
          isCorrect: false,
          marksAwarded: 0,
        });
      } else {
        const isCorrect = String(userSelected).trim() === String(q.correctAnswer).trim();
        if (isCorrect) {
          correctCount++;
          const awarded = q.marks || 1;
          score += awarded;
          answerRecordsToCreate.push({
            questionId: q.id,
            selectedOption: String(userSelected),
            isCorrect: true,
            marksAwarded: awarded,
          });
        } else {
          incorrectCount++;
          const deduction = q.negativeMarks || test.negativeMarking || 0;
          score -= deduction;
          answerRecordsToCreate.push({
            questionId: q.id,
            selectedOption: String(userSelected),
            isCorrect: false,
            marksAwarded: -deduction,
          });
        }
      }
    }

    const totalQuestions = test.testQuestions.length;
    const answeredCount = correctCount + incorrectCount;
    const accuracy = answeredCount > 0 ? (correctCount / answeredCount) * 100 : 0;
    const finalScore = Math.max(0, Math.round(score * 100) / 100);

    const attempt = await prisma.testAttempt.create({
      data: {
        testId: test.id,
        userId: req.user!.id,
        score: finalScore,
        totalQuestions,
        correctCount,
        incorrectCount,
        skippedCount,
        accuracy: Math.round(accuracy * 10) / 10,
        timeSpentSeconds: parseInt(timeSpentSeconds, 10) || 0,
        status: 'EVALUATED',
        answers: {
          create: answerRecordsToCreate,
        },
      },
    });

    res.json({
      success: true,
      message: 'Test submitted and evaluated successfully!',
      attemptId: attempt.id,
      score: finalScore,
      totalMarks: test.totalMarks,
      passed: finalScore >= test.passMarks,
      correctCount,
      incorrectCount,
      skippedCount,
      accuracy: Math.round(accuracy * 10) / 10,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tests/:idOrSlug/result/:attemptId (Detailed solution review)
router.get('/:idOrSlug/result/:attemptId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { attemptId } = req.params;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: true,
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!attempt) {
      res.status(404).json({ success: false, message: 'Test attempt not found.' });
      return;
    }

    // Must be user's own attempt or admin
    if (attempt.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Unauthorized access to test result.' });
      return;
    }

    const detailedQuestions = attempt.answers.map((ans, idx) => {
      let optionsArray: string[] = [];
      try {
        optionsArray = JSON.parse(ans.question.options);
      } catch (e) {
        optionsArray = [ans.question.options];
      }

      return {
        questionId: ans.question.id,
        number: idx + 1,
        questionText: ans.question.questionText,
        options: optionsArray,
        userSelected: ans.selectedOption,
        correctAnswer: ans.question.correctAnswer,
        isCorrect: ans.isCorrect,
        marksAwarded: ans.marksAwarded,
        explanation: ans.question.explanation,
        subject: ans.question.subject,
      };
    });

    res.json({
      success: true,
      attempt: {
        id: attempt.id,
        score: attempt.score,
        totalMarks: attempt.test.totalMarks,
        passMarks: attempt.test.passMarks,
        passed: attempt.score >= attempt.test.passMarks,
        totalQuestions: attempt.totalQuestions,
        correctCount: attempt.correctCount,
        incorrectCount: attempt.incorrectCount,
        skippedCount: attempt.skippedCount,
        accuracy: attempt.accuracy,
        timeSpentSeconds: attempt.timeSpentSeconds,
        submittedAt: attempt.submittedAt,
        testTitle: attempt.test.title,
      },
      questions: detailedQuestions,
    });
  } catch (error) {
    next(error);
  }
});

// Admin Test Routes
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const tests = await prisma.test.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        course: true,
        _count: { select: { testQuestions: true, attempts: true } },
      },
    });
    res.json({ success: true, tests });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      title,
      slug,
      categoryId,
      courseId,
      description,
      instructions,
      durationMinutes,
      totalMarks,
      passMarks,
      negativeMarking,
      isFree,
      status,
    } = req.body;

    if (!title || !slug) {
      res.status(400).json({ success: false, message: 'Title and slug are required.' });
      return;
    }

    const test = await prisma.test.create({
      data: {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        categoryId: categoryId || null,
        courseId: courseId || null,
        description: description?.trim() || null,
        instructions: instructions?.trim() || 'Each question has 4 options. Correct answer carries positive marks, wrong answer carries negative marks.',
        durationMinutes: parseInt(durationMinutes, 10) || 60,
        totalMarks: parseFloat(totalMarks) || 100,
        passMarks: parseFloat(passMarks) || 33,
        negativeMarking: parseFloat(negativeMarking) || 0.25,
        isFree: Boolean(isFree),
        status: status || 'PUBLISHED',
      },
    });

    res.status(201).json({ success: true, message: 'Test created successfully.', test });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      categoryId,
      courseId,
      description,
      instructions,
      durationMinutes,
      totalMarks,
      passMarks,
      negativeMarking,
      isFree,
      status,
    } = req.body;

    const updated = await prisma.test.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(slug ? { slug: slug.trim().toLowerCase() } : {}),
        ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
        ...(courseId !== undefined ? { courseId: courseId || null } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(instructions !== undefined ? { instructions: instructions?.trim() } : {}),
        ...(durationMinutes !== undefined ? { durationMinutes: parseInt(durationMinutes, 10) } : {}),
        ...(totalMarks !== undefined ? { totalMarks: parseFloat(totalMarks) } : {}),
        ...(passMarks !== undefined ? { passMarks: parseFloat(passMarks) } : {}),
        ...(negativeMarking !== undefined ? { negativeMarking: parseFloat(negativeMarking) } : {}),
        ...(isFree !== undefined ? { isFree: Boolean(isFree) } : {}),
        ...(status ? { status } : {}),
      },
    });

    res.json({ success: true, message: 'Test updated successfully.', test: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.test.delete({ where: { id } });
    res.json({ success: true, message: 'Test deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
