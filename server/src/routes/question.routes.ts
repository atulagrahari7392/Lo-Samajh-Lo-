import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/questions (Admin list with filters)
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { subject, difficulty, search, testId } = req.query;

    const where: any = {};
    if (subject) where.subject = { contains: String(subject) };
    if (difficulty) where.difficulty = String(difficulty);
    if (search) where.questionText = { contains: String(search) };
    if (testId) {
      where.testQuestions = {
        some: { testId: String(testId) },
      };
    }

    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        testQuestions: {
          include: { test: { select: { id: true, title: true } } },
        },
      },
    });

    const parsed = questions.map((q) => {
      let options = [];
      try {
        options = JSON.parse(q.options);
      } catch (e) {
        options = [q.options];
      }
      return { ...q, options };
    });

    res.json({ success: true, questions: parsed });
  } catch (error) {
    next(error);
  }
});

// POST /api/questions (Admin create question & assign to test)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      questionText,
      questionType,
      options,
      correctAnswer,
      explanation,
      marks,
      negativeMarks,
      difficulty,
      subject,
      topic,
      testId,
      sectionName,
    } = req.body;

    if (!questionText || !options || correctAnswer === undefined) {
      res.status(400).json({ success: false, message: 'Question text, options, and correct answer are required.' });
      return;
    }

    const optionsStr = typeof options === 'string' ? options : JSON.stringify(options);

    const question = await prisma.question.create({
      data: {
        questionText: questionText.trim(),
        questionType: questionType || 'MCQ_SINGLE',
        options: optionsStr,
        correctAnswer: String(correctAnswer).trim(),
        explanation: explanation?.trim() || null,
        marks: parseFloat(marks) || 1.0,
        negativeMarks: parseFloat(negativeMarks) || 0.25,
        difficulty: difficulty || 'MEDIUM',
        subject: subject?.trim() || 'General',
        topic: topic?.trim() || null,
        status: 'ACTIVE',
      },
    });

    // If testId provided, link to test
    if (testId) {
      await prisma.testQuestion.create({
        data: {
          testId,
          questionId: question.id,
          sectionName: sectionName || subject || 'General',
        },
      });
    }

    res.status(201).json({ success: true, message: 'Question created successfully.', question });
  } catch (error) {
    next(error);
  }
});

// PUT /api/questions/:id (Admin edit)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      questionText,
      questionType,
      options,
      correctAnswer,
      explanation,
      marks,
      negativeMarks,
      difficulty,
      subject,
      topic,
      status,
    } = req.body;

    const data: any = {};
    if (questionText) data.questionText = questionText.trim();
    if (questionType) data.questionType = questionType;
    if (options !== undefined) {
      data.options = typeof options === 'string' ? options : JSON.stringify(options);
    }
    if (correctAnswer !== undefined) data.correctAnswer = String(correctAnswer).trim();
    if (explanation !== undefined) data.explanation = explanation?.trim() || null;
    if (marks !== undefined) data.marks = parseFloat(marks);
    if (negativeMarks !== undefined) data.negativeMarks = parseFloat(negativeMarks);
    if (difficulty) data.difficulty = difficulty;
    if (subject) data.subject = subject.trim();
    if (topic !== undefined) data.topic = topic ? topic.trim() : null;
    if (status) data.status = status;

    const updated = await prisma.question.update({
      where: { id },
      data,
    });

    res.json({ success: true, message: 'Question updated successfully.', question: updated });
  } catch (error) {
    next(error);
  }
});

// POST /api/questions/assign-to-test (Admin link existing question to test)
router.post('/assign-to-test', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { testId, questionId, sectionName, position } = req.body;
    if (!testId || !questionId) {
      res.status(400).json({ success: false, message: 'Test ID and Question ID are required.' });
      return;
    }

    const testQuestion = await prisma.testQuestion.upsert({
      where: {
        testId_questionId: { testId, questionId },
      },
      update: {
        sectionName: sectionName || 'General',
        position: position || 1,
      },
      create: {
        testId,
        questionId,
        sectionName: sectionName || 'General',
        position: position || 1,
      },
    });

    res.json({ success: true, message: 'Question assigned to test.', testQuestion });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/questions/:id (Admin delete)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.question.delete({ where: { id } });
    res.json({ success: true, message: 'Question deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
