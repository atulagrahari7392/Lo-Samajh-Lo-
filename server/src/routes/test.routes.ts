import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, optionalAuth, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// ----------------------------------------------------
// 1. GET /api/tests (Public tests list with filters)
// ----------------------------------------------------
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { category, search, seriesId, testType, subCategory } = req.query;

    const where: any = { status: 'PUBLISHED' };

    if (seriesId) {
      where.seriesId = String(seriesId);
    }

    if (testType && testType !== 'ALL') {
      where.testType = String(testType).toUpperCase();
    }

    if (subCategory && subCategory !== 'ALL') {
      where.subCategory = String(subCategory);
    }

    if (category) {
      where.OR = [{ categoryId: String(category) }, { category: { slug: String(category) } }];
    }

    if (search) {
      where.OR = [{ title: { contains: String(search) } }, { description: { contains: String(search) } }];
    }

    const tests = await prisma.test.findMany({
      where,
      orderBy: [{ isLive: 'desc' }, { createdAt: 'desc' }],
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
        course: { select: { id: true, title: true, slug: true } },
        series: { select: { id: true, title: true, slug: true, examCategory: true } },
        _count: {
          select: { testQuestions: true, attempts: true },
        },
      },
    });

    let userAttemptsMap: Record<string, { score: number; status: string; attemptId: string }> = {};
    if (req.user) {
      const attempts = await prisma.testAttempt.findMany({
        where: { userId: req.user.id },
        select: { id: true, testId: true, score: true, status: true },
        orderBy: { createdAt: 'desc' },
      });
      attempts.forEach((att) => {
        if (!userAttemptsMap[att.testId]) {
          userAttemptsMap[att.testId] = { score: att.score, status: att.status, attemptId: att.id };
        }
      });
    }

    const enhanced = tests.map((t) => {
      const userAtt = userAttemptsMap[t.id];
      return {
        ...t,
        questionsCount: t._count.testQuestions,
        attemptsCount: t._count.attempts,
        userAttempt: userAtt || null,
        userHighestScore: userAtt ? userAtt.score : null,
      };
    });

    res.json({ success: true, tests: enhanced });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 2. GET /api/tests/my-attempts (Logged-in user attempts)
// ----------------------------------------------------
router.get('/my-attempts', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const attempts = await prisma.testAttempt.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        test: {
          select: { id: true, title: true, totalMarks: true, durationMinutes: true, testType: true, subCategory: true },
        },
      },
    });
    res.json({ success: true, attempts });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 3. GET /api/tests/:idOrSlug (Test overview & metadata)
// ----------------------------------------------------
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
        series: true,
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

// ----------------------------------------------------
// 4. POST /api/tests/:idOrSlug/start (Start or Resume Attempt)
// ----------------------------------------------------
router.post('/:idOrSlug/start', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const { reattempt } = req.body;

    const test = await prisma.test.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: { _count: { select: { testQuestions: true } } },
    });

    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found.' });
      return;
    }

    // Check for ongoing in-progress attempt if not explicitly reattempting
    if (!reattempt) {
      const existingInProgress = await prisma.testAttempt.findFirst({
        where: {
          testId: test.id,
          userId: req.user!.id,
          status: 'IN_PROGRESS',
        },
      });

      if (existingInProgress) {
        let savedAnswers = {};
        let savedMarked = {};
        try {
          if (existingInProgress.answersMap) savedAnswers = JSON.parse(existingInProgress.answersMap);
          if (existingInProgress.markedQuestions) savedMarked = JSON.parse(existingInProgress.markedQuestions);
        } catch {}

        res.json({
          success: true,
          message: 'Resuming ongoing attempt.',
          attemptId: existingInProgress.id,
          isResume: true,
          savedAnswers,
          savedMarked,
          currentIndex: existingInProgress.currentQuestionIndex || 0,
          timeSpentSeconds: existingInProgress.timeSpentSeconds || 0,
          remainingSeconds: Math.max(0, test.durationMinutes * 60 - (existingInProgress.timeSpentSeconds || 0)),
        });
        return;
      }
    }

    // Create a new in-progress attempt
    const newAttempt = await prisma.testAttempt.create({
      data: {
        testId: test.id,
        userId: req.user!.id,
        status: 'IN_PROGRESS',
        totalQuestions: test._count.testQuestions,
        timeSpentSeconds: 0,
        score: 0,
      },
    });

    res.json({
      success: true,
      message: 'Test attempt started.',
      attemptId: newAttempt.id,
      isResume: false,
      savedAnswers: {},
      savedMarked: {},
      currentIndex: 0,
      timeSpentSeconds: 0,
      remainingSeconds: test.durationMinutes * 60,
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 5. POST /api/tests/:idOrSlug/save-progress (Real-time auto save)
// ----------------------------------------------------
router.post('/:idOrSlug/save-progress', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { attemptId, answersMap, markedQuestions, currentIndex, timeSpentSeconds } = req.body;

    if (!attemptId) {
      res.status(400).json({ success: false, message: 'attemptId is required' });
      return;
    }

    await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        answersMap: typeof answersMap === 'object' ? JSON.stringify(answersMap) : answersMap,
        markedQuestions: typeof markedQuestions === 'object' ? JSON.stringify(markedQuestions) : markedQuestions,
        currentQuestionIndex: parseInt(currentIndex, 10) || 0,
        timeSpentSeconds: parseInt(timeSpentSeconds, 10) || 0,
      },
    });

    res.json({ success: true, message: 'Progress saved' });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 6. GET /api/tests/:idOrSlug/take (Delivers questions securely)
// ----------------------------------------------------
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

    // Check for in-progress attempt to restore
    const inProgressAttempt = await prisma.testAttempt.findFirst({
      where: { testId: test.id, userId: req.user!.id, status: 'IN_PROGRESS' },
      orderBy: { createdAt: 'desc' },
    });

    let savedAnswers = {};
    let savedMarked = {};
    if (inProgressAttempt) {
      try {
        if (inProgressAttempt.answersMap) savedAnswers = JSON.parse(inProgressAttempt.answersMap);
        if (inProgressAttempt.markedQuestions) savedMarked = JSON.parse(inProgressAttempt.markedQuestions);
      } catch {}
    }

    // Security: Omit correct answers and explanations from response
    const questions = test.testQuestions.map((tq, idx) => {
      let optionsArray: string[] = [];
      let optionsHindiArray: string[] = [];
      let optionsEnglishArray: string[] = [];

      try {
        optionsArray = JSON.parse(tq.question.options);
      } catch (e) {
        optionsArray = [tq.question.options];
      }

      if (tq.question.optionsHindi) {
        try {
          optionsHindiArray = JSON.parse(tq.question.optionsHindi);
        } catch {}
      }
      if (tq.question.optionsEnglish) {
        try {
          optionsEnglishArray = JSON.parse(tq.question.optionsEnglish);
        } catch {}
      }

      return {
        testQuestionId: tq.id,
        questionId: tq.question.id,
        id: tq.question.id,
        position: tq.position || idx + 1,
        sectionName: tq.sectionName || tq.question.subject || 'General',
        questionText: tq.question.questionText,
        questionHindi: tq.question.questionHindi || tq.question.questionText,
        questionEnglish: tq.question.questionEnglish || tq.question.questionText,
        questionType: tq.question.questionType,
        options: optionsArray,
        optionsHindi: optionsHindiArray.length > 0 ? optionsHindiArray : optionsArray,
        optionsEnglish: optionsEnglishArray.length > 0 ? optionsEnglishArray : optionsArray,
        marks: tq.question.marks,
        negativeMarks: tq.question.negativeMarks || test.negativeMarking,
        difficulty: tq.question.difficulty,
        subject: tq.question.subject,
        chapter: tq.question.chapter || '',
        topic: tq.question.topic || '',
      };
    });

    res.json({
      success: true,
      test: {
        id: test.id,
        title: test.title,
        slug: test.slug,
        durationMinutes: test.durationMinutes,
        totalMarks: test.totalMarks,
        passMarks: test.passMarks,
        negativeMarking: test.negativeMarking,
        questionsCount: questions.length,
        instructions: test.instructions,
      },
      attemptId: inProgressAttempt?.id || null,
      savedAnswers,
      savedMarked,
      savedIndex: inProgressAttempt?.currentQuestionIndex || 0,
      savedSeconds: inProgressAttempt?.timeSpentSeconds || 0,
      questions,
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 7. POST /api/tests/:idOrSlug/submit (Evaluation & Performance Engine)
// ----------------------------------------------------
router.post('/:idOrSlug/submit', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const { answers, timeSpentSeconds, attemptId } = req.body; // answers: { [questionId]: "0" }

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

    // Section and topic trackers
    const sectionStats: Record<string, { total: number; correct: number; incorrect: number; skipped: number; score: number }> = {};
    const topicStats: Record<string, { total: number; correct: number }> = {};

    for (const tq of test.testQuestions) {
      const q = tq.question;
      const userSelected = answers ? answers[q.id] : undefined;
      const sec = tq.sectionName || q.subject || 'General';
      const top = q.topic || q.chapter || q.subject;

      if (!sectionStats[sec]) {
        sectionStats[sec] = { total: 0, correct: 0, incorrect: 0, skipped: 0, score: 0 };
      }
      sectionStats[sec].total++;

      if (!topicStats[top]) {
        topicStats[top] = { total: 0, correct: 0 };
      }
      topicStats[top].total++;

      if (userSelected === undefined || userSelected === null || userSelected === '') {
        skippedCount++;
        sectionStats[sec].skipped++;
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
          sectionStats[sec].correct++;
          topicStats[top].correct++;
          const awarded = q.marks || 1;
          score += awarded;
          sectionStats[sec].score += awarded;
          answerRecordsToCreate.push({
            questionId: q.id,
            selectedOption: String(userSelected),
            isCorrect: true,
            marksAwarded: awarded,
          });
        } else {
          incorrectCount++;
          sectionStats[sec].incorrect++;
          const deduction = q.negativeMarks || test.negativeMarking || 0;
          score -= deduction;
          sectionStats[sec].score -= deduction;
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

    // Calculate Rank and Percentile
    const previousAttempts = await prisma.testAttempt.findMany({
      where: { testId: test.id, status: 'EVALUATED' },
      select: { score: true },
    });

    const allScores = [...previousAttempts.map((a) => a.score), finalScore].sort((a, b) => b - a);
    const rank = allScores.indexOf(finalScore) + 1;
    const totalAspirants = allScores.length;
    const percentile = totalAspirants > 1 ? Math.round(((totalAspirants - rank) / totalAspirants) * 1000) / 10 : 99.0;

    let targetAttempt: any = null;

    if (attemptId) {
      // Clean up any old answers for this attempt then update
      await prisma.testAnswer.deleteMany({ where: { attemptId } });
      targetAttempt = await prisma.testAttempt.update({
        where: { id: attemptId },
        data: {
          score: finalScore,
          totalQuestions,
          correctCount,
          incorrectCount,
          skippedCount,
          accuracy: Math.round(accuracy * 10) / 10,
          timeSpentSeconds: parseInt(timeSpentSeconds, 10) || 0,
          rank,
          percentile,
          status: 'EVALUATED',
          submittedAt: new Date(),
          answers: {
            create: answerRecordsToCreate,
          },
        },
      });
    } else {
      targetAttempt = await prisma.testAttempt.create({
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
          rank,
          percentile,
          status: 'EVALUATED',
          submittedAt: new Date(),
          answers: {
            create: answerRecordsToCreate,
          },
        },
      });
    }

    res.json({
      success: true,
      message: 'Test submitted and evaluated successfully!',
      attemptId: targetAttempt.id,
      score: finalScore,
      totalMarks: test.totalMarks,
      passed: finalScore >= test.passMarks,
      correctCount,
      incorrectCount,
      skippedCount,
      accuracy: Math.round(accuracy * 10) / 10,
      rank,
      percentile,
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 8. GET /api/tests/:idOrSlug/result/:attemptId (Comprehensive Result)
// ----------------------------------------------------
router.get('/:idOrSlug/result/:attemptId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { attemptId } = req.params;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            testQuestions: {
              include: { question: true },
            },
          },
        },
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

    // Sectional Analysis
    const sectionMap: Record<string, { total: number; correct: number; incorrect: number; skipped: number; score: number; time: number }> = {};
    const topicMap: Record<string, { total: number; correct: number; subject: string }> = {};

    attempt.answers.forEach((ans) => {
      const sec = ans.question.subject || 'General';
      const top = ans.question.topic || ans.question.chapter || ans.question.subject;

      if (!sectionMap[sec]) {
        sectionMap[sec] = { total: 0, correct: 0, incorrect: 0, skipped: 0, score: 0, time: 0 };
      }
      sectionMap[sec].total++;
      if (ans.isCorrect) {
        sectionMap[sec].correct++;
        sectionMap[sec].score += ans.marksAwarded;
      } else if (ans.selectedOption !== null) {
        sectionMap[sec].incorrect++;
        sectionMap[sec].score += ans.marksAwarded;
      } else {
        sectionMap[sec].skipped++;
      }

      if (!topicMap[top]) {
        topicMap[top] = { total: 0, correct: 0, subject: sec };
      }
      topicMap[top].total++;
      if (ans.isCorrect) topicMap[top].correct++;
    });

    const sectionalSummary = Object.entries(sectionMap).map(([sectionName, s]) => ({
      sectionName,
      score: Math.max(0, Math.round(s.score * 10) / 10),
      totalQuestions: s.total,
      attempted: s.correct + s.incorrect,
      correct: s.correct,
      incorrect: s.incorrect,
      skipped: s.skipped,
      accuracy: s.correct + s.incorrect > 0 ? Math.round((s.correct / (s.correct + s.incorrect)) * 100) : 0,
      cutoff: Math.round(attempt.test.passMarks / Math.max(Object.keys(sectionMap).length, 1)),
      timeTaken: `${Math.round(attempt.timeSpentSeconds / 60)} mins`,
    }));

    // Weakness & Strength analysis
    const weaknesses: any[] = [];
    const strengths: any[] = [];

    Object.entries(topicMap).forEach(([topic, stat]) => {
      const pct = Math.round((stat.correct / stat.total) * 100);
      if (pct < 50) {
        weaknesses.push({ topic, subject: stat.subject, accuracy: pct });
      } else {
        strengths.push({ topic, subject: stat.subject, accuracy: pct });
      }
    });

    // Topper Comparison stats
    const allEvaluated = await prisma.testAttempt.findMany({
      where: { testId: attempt.testId, status: 'EVALUATED' },
      select: { score: true, accuracy: true, timeSpentSeconds: true, correctCount: true, incorrectCount: true },
    });

    const topperScore = allEvaluated.length > 0 ? Math.max(...allEvaluated.map((a) => a.score)) : attempt.test.totalMarks;
    const avgScore = allEvaluated.length > 0 ? Math.round((allEvaluated.reduce((sum, a) => sum + a.score, 0) / allEvaluated.length) * 10) / 10 : attempt.score;
    const avgAccuracy = allEvaluated.length > 0 ? Math.round(allEvaluated.reduce((sum, a) => sum + a.accuracy, 0) / allEvaluated.length) : attempt.accuracy;

    const topperComparison = {
      you: {
        score: attempt.score,
        accuracy: attempt.accuracy,
        correct: attempt.correctCount,
        wrong: attempt.incorrectCount,
        time: `${Math.round(attempt.timeSpentSeconds / 60)}:${String(attempt.timeSpentSeconds % 60).padStart(2, '0')} mins`,
      },
      topper: {
        score: topperScore,
        accuracy: 100,
        correct: attempt.totalQuestions,
        wrong: 0,
        time: `${Math.round((attempt.test.durationMinutes * 60 * 0.6) / 60)} mins`,
      },
      average: {
        score: avgScore,
        accuracy: avgAccuracy,
        correct: Math.round(attempt.totalQuestions * 0.5),
        wrong: Math.round(attempt.totalQuestions * 0.3),
        time: `${Math.round(attempt.test.durationMinutes * 0.8)} mins`,
      },
    };

    // Leaderboard (Top Rankers)
    const topRankers = await prisma.testAttempt.findMany({
      where: { testId: attempt.testId, status: 'EVALUATED' },
      orderBy: [{ score: 'desc' }, { timeSpentSeconds: 'asc' }],
      take: 10,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    const leaderboard = topRankers.map((r, i) => ({
      rank: i + 1,
      name: r.user?.name || 'Aspirant',
      score: r.score,
      accuracy: r.accuracy,
      totalMarks: attempt.test.totalMarks,
      isCurrentUser: r.userId === req.user!.id,
    }));

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
        rank: attempt.rank || 1,
        percentile: attempt.percentile || 95.0,
        submittedAt: attempt.submittedAt,
        testTitle: attempt.test.title,
      },
      sectionalSummary,
      weaknesses: weaknesses.slice(0, 5),
      strengths: strengths.slice(0, 5),
      topperComparison,
      leaderboard,
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 9. GET /api/tests/:idOrSlug/solutions/:attemptId (Detailed Solutions)
// ----------------------------------------------------
router.get('/:idOrSlug/solutions/:attemptId', authenticate, async (req: AuthRequest, res, next) => {
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

    const solutions = attempt.answers.map((ans, idx) => {
      let optionsArray: string[] = [];
      let optionsHindiArray: string[] = [];
      let optionsEnglishArray: string[] = [];

      try {
        optionsArray = JSON.parse(ans.question.options);
      } catch {
        optionsArray = [ans.question.options];
      }

      if (ans.question.optionsHindi) {
        try {
          optionsHindiArray = JSON.parse(ans.question.optionsHindi);
        } catch {}
      }
      if (ans.question.optionsEnglish) {
        try {
          optionsEnglishArray = JSON.parse(ans.question.optionsEnglish);
        } catch {}
      }

      return {
        questionId: ans.question.id,
        number: idx + 1,
        questionText: ans.question.questionText,
        questionHindi: ans.question.questionHindi || ans.question.questionText,
        questionEnglish: ans.question.questionEnglish || ans.question.questionText,
        options: optionsArray,
        optionsHindi: optionsHindiArray.length > 0 ? optionsHindiArray : optionsArray,
        optionsEnglish: optionsEnglishArray.length > 0 ? optionsEnglishArray : optionsArray,
        userSelected: ans.selectedOption,
        correctAnswer: ans.question.correctAnswer,
        isCorrect: ans.isCorrect,
        isSkipped: ans.selectedOption === null,
        marksAwarded: ans.marksAwarded,
        explanation: ans.question.explanation,
        explanationHindi: ans.question.explanationHindi || ans.question.explanation,
        explanationEnglish: ans.question.explanationEnglish || ans.question.explanation,
        subject: ans.question.subject,
        chapter: ans.question.chapter || '',
        topic: ans.question.topic || '',
        difficulty: ans.question.difficulty,
      };
    });

    res.json({
      success: true,
      testTitle: attempt.test.title,
      solutions,
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 10. ADMIN: Test CRUD
// ----------------------------------------------------
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const tests = await prisma.test.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        course: true,
        series: true,
        _count: { select: { testQuestions: true, attempts: true } },
      },
    });
    res.json({ success: true, tests });
  } catch (error) {
    next(error);
  }
});

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

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      title,
      slug: customSlug,
      seriesId,
      categoryId,
      courseId,
      testType,
      subCategory,
      description,
      instructions,
      durationMinutes,
      totalMarks,
      passMarks,
      negativeMarking,
      isFree,
      isLive,
      scheduledStart,
      scheduledEnd,
      status,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Test title is required.' });
    }

    let slug = customSlug ? slugify(customSlug) : slugify(title);
    if (!slug) slug = 'test-' + Date.now().toString().slice(-6);

    const existing = await prisma.test.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Validate relations to avoid foreign key errors
    let safeSeriesId: string | null = null;
    if (seriesId && String(seriesId).trim()) {
      const foundSeries = await prisma.testSeries.findUnique({ where: { id: String(seriesId).trim() } });
      if (foundSeries) safeSeriesId = foundSeries.id;
    }

    let safeCategoryId: string | null = null;
    if (categoryId && String(categoryId).trim()) {
      const foundCat = await prisma.category.findUnique({ where: { id: String(categoryId).trim() } });
      if (foundCat) safeCategoryId = foundCat.id;
    }

    let safeCourseId: string | null = null;
    if (courseId && String(courseId).trim()) {
      const foundCourse = await prisma.course.findUnique({ where: { id: String(courseId).trim() } });
      if (foundCourse) safeCourseId = foundCourse.id;
    }

    const test = await prisma.test.create({
      data: {
        title: title.trim(),
        slug,
        seriesId: safeSeriesId,
        categoryId: safeCategoryId,
        courseId: safeCourseId,
        testType: testType || 'MOCK',
        subCategory: subCategory || 'Mock Tests',
        description: description?.trim() || null,
        instructions:
          instructions?.trim() ||
          'Each question carries positive marks. Wrong answers carry negative marks. Test clock is synchronized with the server.',
        durationMinutes: parseInt(String(durationMinutes), 10) || 60,
        totalMarks: parseFloat(String(totalMarks)) || 100,
        passMarks: parseFloat(String(passMarks)) || 33,
        negativeMarking: parseFloat(String(negativeMarking)) || 0.25,
        isFree: Boolean(isFree),
        isLive: Boolean(isLive),
        scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
        status: status || 'PUBLISHED',
      },
    });

    return res.status(201).json({ success: true, message: 'Test created successfully.', test });
  } catch (error: any) {
    console.error('Error creating test:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'A test with this slug already exists.' });
    }
    return res.status(400).json({ success: false, message: error.message || 'Failed to create test.' });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug: customSlug,
      seriesId,
      categoryId,
      courseId,
      testType,
      subCategory,
      description,
      instructions,
      durationMinutes,
      totalMarks,
      passMarks,
      negativeMarking,
      isFree,
      isLive,
      scheduledStart,
      scheduledEnd,
      status,
    } = req.body;

    const data: any = {};
    if (title && String(title).trim()) data.title = title.trim();

    if (customSlug) {
      let cleanSlug = slugify(customSlug);
      const existing = await prisma.test.findFirst({
        where: { slug: cleanSlug, NOT: { id } },
      });
      if (existing) {
        cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
      }
      data.slug = cleanSlug;
    }

    if (seriesId !== undefined) {
      if (seriesId && String(seriesId).trim()) {
        const found = await prisma.testSeries.findUnique({ where: { id: String(seriesId).trim() } });
        data.seriesId = found ? found.id : null;
      } else {
        data.seriesId = null;
      }
    }

    if (categoryId !== undefined) {
      if (categoryId && String(categoryId).trim()) {
        const found = await prisma.category.findUnique({ where: { id: String(categoryId).trim() } });
        data.categoryId = found ? found.id : null;
      } else {
        data.categoryId = null;
      }
    }

    if (courseId !== undefined) {
      if (courseId && String(courseId).trim()) {
        const found = await prisma.course.findUnique({ where: { id: String(courseId).trim() } });
        data.courseId = found ? found.id : null;
      } else {
        data.courseId = null;
      }
    }

    if (testType) data.testType = testType;
    if (subCategory !== undefined) data.subCategory = subCategory;
    if (description !== undefined) data.description = description?.trim() || null;
    if (instructions !== undefined) data.instructions = instructions?.trim() || null;
    if (durationMinutes !== undefined) data.durationMinutes = parseInt(String(durationMinutes), 10) || 60;
    if (totalMarks !== undefined) data.totalMarks = parseFloat(String(totalMarks)) || 100;
    if (passMarks !== undefined) data.passMarks = parseFloat(String(passMarks)) || 33;
    if (negativeMarking !== undefined) data.negativeMarking = parseFloat(String(negativeMarking)) || 0.25;
    if (isFree !== undefined) data.isFree = Boolean(isFree);
    if (isLive !== undefined) data.isLive = Boolean(isLive);
    if (scheduledStart !== undefined) data.scheduledStart = scheduledStart ? new Date(scheduledStart) : null;
    if (scheduledEnd !== undefined) data.scheduledEnd = scheduledEnd ? new Date(scheduledEnd) : null;
    if (status) data.status = status;

    const updated = await prisma.test.update({
      where: { id },
      data,
    });

    return res.json({ success: true, message: 'Test updated successfully.', test: updated });
  } catch (error: any) {
    console.error('Error updating test:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'A test with this slug already exists.' });
    }
    return res.status(400).json({ success: false, message: error.message || 'Failed to update test.' });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.test.delete({ where: { id } });
    return res.json({ success: true, message: 'Test deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting test:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to delete test.' });
  }
});

export default router;
