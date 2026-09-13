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
    if (search) {
      where.OR = [
        { questionText: { contains: String(search) } },
        { questionHindi: { contains: String(search) } },
        { questionEnglish: { contains: String(search) } },
      ];
    }
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

      const activeTq = testId ? q.testQuestions.find((tq) => tq.testId === String(testId)) : undefined;

      return {
        ...q,
        options,
        sectionName: activeTq?.sectionName || 'General',
        position: activeTq?.position || 1,
        testQuestionId: activeTq?.id,
      };
    });

    res.json({ success: true, questions: parsed });
  } catch (error) {
    next(error);
  }
});

// GET /api/questions/available-for-test/:testId (Questions not in this test for importing)
router.get('/available-for-test/:testId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { subject, difficulty, search, topic } = req.query;

    const where: any = {
      testQuestions: {
        none: { testId: String(testId) },
      },
    };

    if (subject) where.subject = { contains: String(subject) };
    if (difficulty) where.difficulty = String(difficulty);
    if (topic) where.topic = { contains: String(topic) };
    if (search) {
      where.OR = [
        { questionText: { contains: String(search) } },
        { questionHindi: { contains: String(search) } },
        { questionEnglish: { contains: String(search) } },
      ];
    }

    const questions = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
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
      questionHindi,
      questionEnglish,
      questionType,
      options,
      optionsHindi,
      optionsEnglish,
      correctAnswer,
      explanation,
      explanationHindi,
      explanationEnglish,
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
        questionHindi: questionHindi?.trim() || null,
        questionEnglish: questionEnglish?.trim() || null,
        questionType: questionType || 'MCQ_SINGLE',
        options: optionsStr,
        optionsHindi: optionsHindi ? (typeof optionsHindi === 'string' ? optionsHindi : JSON.stringify(optionsHindi)) : null,
        optionsEnglish: optionsEnglish ? (typeof optionsEnglish === 'string' ? optionsEnglish : JSON.stringify(optionsEnglish)) : null,
        correctAnswer: String(correctAnswer).trim(),
        explanation: explanation?.trim() || null,
        explanationHindi: explanationHindi?.trim() || null,
        explanationEnglish: explanationEnglish?.trim() || null,
        marks: parseFloat(marks) || 1.0,
        negativeMarks: parseFloat(negativeMarks) || 0.25,
        difficulty: difficulty || 'MEDIUM',
        subject: subject?.trim() || 'General',
        topic: topic?.trim() || null,
        status: 'ACTIVE',
      },
    });

    let questionsCount = undefined;
    // If testId provided, link to test
    if (testId) {
      const currentCount = await prisma.testQuestion.count({ where: { testId: String(testId) } });
      await prisma.testQuestion.create({
        data: {
          testId: String(testId),
          questionId: question.id,
          sectionName: sectionName || subject || 'General',
          position: currentCount + 1,
        },
      });
      questionsCount = currentCount + 1;
    }

    res.status(201).json({
      success: true,
      message: 'Question created successfully.',
      question,
      questionsCount,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/questions/bulk (Admin bulk create questions)
router.post('/bulk', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { questions, testId, sectionName } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ success: false, message: 'Questions array is required.' });
      return;
    }

    const createdQuestions = [];
    let currentPosition = testId ? await prisma.testQuestion.count({ where: { testId: String(testId) } }) : 0;

    // Process questions in sequence
    for (const q of questions) {
      if (!q.questionText || !q.options || q.correctAnswer === undefined) {
        continue; // Skip invalid entries
      }

      const optionsStr = typeof q.options === 'string' ? q.options : JSON.stringify(q.options);

      const newQ = await prisma.question.create({
        data: {
          questionText: String(q.questionText).trim(),
          questionHindi: q.questionHindi ? String(q.questionHindi).trim() : null,
          questionEnglish: q.questionEnglish ? String(q.questionEnglish).trim() : null,
          questionType: q.questionType || 'MCQ_SINGLE',
          options: optionsStr,
          optionsHindi: q.optionsHindi ? (typeof q.optionsHindi === 'string' ? q.optionsHindi : JSON.stringify(q.optionsHindi)) : null,
          optionsEnglish: q.optionsEnglish ? (typeof q.optionsEnglish === 'string' ? q.optionsEnglish : JSON.stringify(q.optionsEnglish)) : null,
          correctAnswer: String(q.correctAnswer).trim(),
          explanation: q.explanation ? String(q.explanation).trim() : null,
          explanationHindi: q.explanationHindi ? String(q.explanationHindi).trim() : null,
          explanationEnglish: q.explanationEnglish ? String(q.explanationEnglish).trim() : null,
          marks: parseFloat(q.marks) || 1.0,
          negativeMarks: parseFloat(q.negativeMarks) || 0.25,
          difficulty: q.difficulty || 'MEDIUM',
          subject: q.subject ? String(q.subject).trim() : 'General',
          topic: q.topic ? String(q.topic).trim() : null,
          status: 'ACTIVE',
        },
      });

      if (testId) {
        currentPosition++;
        await prisma.testQuestion.create({
          data: {
            testId: String(testId),
            questionId: newQ.id,
            sectionName: q.sectionName || sectionName || q.subject || 'General',
            position: currentPosition,
          },
        });
      }

      createdQuestions.push(newQ);
    }

    let questionsCount = undefined;
    if (testId) {
      questionsCount = await prisma.testQuestion.count({ where: { testId: String(testId) } });
    }

    res.status(201).json({
      success: true,
      message: `Successfully uploaded and created ${createdQuestions.length} questions!`,
      count: createdQuestions.length,
      questionsCount,
      questions: createdQuestions,
    });
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
      questionHindi,
      questionEnglish,
      questionType,
      options,
      optionsHindi,
      optionsEnglish,
      correctAnswer,
      explanation,
      explanationHindi,
      explanationEnglish,
      marks,
      negativeMarks,
      difficulty,
      subject,
      topic,
      status,
    } = req.body;

    const data: any = {};
    if (questionText) data.questionText = questionText.trim();
    if (questionHindi !== undefined) data.questionHindi = questionHindi ? questionHindi.trim() : null;
    if (questionEnglish !== undefined) data.questionEnglish = questionEnglish ? questionEnglish.trim() : null;
    if (questionType) data.questionType = questionType;
    if (options !== undefined) {
      data.options = typeof options === 'string' ? options : JSON.stringify(options);
    }
    if (optionsHindi !== undefined) {
      data.optionsHindi = optionsHindi ? (typeof optionsHindi === 'string' ? optionsHindi : JSON.stringify(optionsHindi)) : null;
    }
    if (optionsEnglish !== undefined) {
      data.optionsEnglish = optionsEnglish ? (typeof optionsEnglish === 'string' ? optionsEnglish : JSON.stringify(optionsEnglish)) : null;
    }
    if (correctAnswer !== undefined) data.correctAnswer = String(correctAnswer).trim();
    if (explanation !== undefined) data.explanation = explanation?.trim() || null;
    if (explanationHindi !== undefined) data.explanationHindi = explanationHindi?.trim() || null;
    if (explanationEnglish !== undefined) data.explanationEnglish = explanationEnglish?.trim() || null;
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

// POST /api/questions/assign-to-test (Admin link existing single question to test)
router.post('/assign-to-test', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { testId, questionId, sectionName, position } = req.body;
    if (!testId || !questionId) {
      res.status(400).json({ success: false, message: 'Test ID and Question ID are required.' });
      return;
    }

    const currentCount = await prisma.testQuestion.count({ where: { testId: String(testId) } });

    const testQuestion = await prisma.testQuestion.upsert({
      where: {
        testId_questionId: { testId: String(testId), questionId: String(questionId) },
      },
      update: {
        sectionName: sectionName || 'General',
        position: position || currentCount,
      },
      create: {
        testId: String(testId),
        questionId: String(questionId),
        sectionName: sectionName || 'General',
        position: position || currentCount + 1,
      },
    });

    const updatedCount = await prisma.testQuestion.count({ where: { testId: String(testId) } });

    res.json({ success: true, message: 'Question assigned to test.', testQuestion, questionsCount: updatedCount });
  } catch (error) {
    next(error);
  }
});

// POST /api/questions/batch-assign-to-test (Admin link multiple questions from Question Bank to test)
router.post('/batch-assign-to-test', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { testId, questionIds, sectionName } = req.body;
    if (!testId || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Test ID and question IDs array are required.' });
    }

    let currentPos = await prisma.testQuestion.count({ where: { testId: String(testId) } });

    for (const qId of questionIds) {
      currentPos++;
      await prisma.testQuestion.upsert({
        where: {
          testId_questionId: { testId: String(testId), questionId: String(qId) },
        },
        update: {
          sectionName: sectionName || 'General',
        },
        create: {
          testId: String(testId),
          questionId: String(qId),
          sectionName: sectionName || 'General',
          position: currentPos,
        },
      });
    }

    const updatedCount = await prisma.testQuestion.count({ where: { testId: String(testId) } });

    res.json({
      success: true,
      message: `Successfully attached ${questionIds.length} question(s) to the test!`,
      questionsCount: updatedCount,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/questions/remove-from-test (Admin unlink question from test without deleting it globally)
router.post('/remove-from-test', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { testId, questionId } = req.body;
    if (!testId || !questionId) {
      return res.status(400).json({ success: false, message: 'Test ID and Question ID are required.' });
    }

    await prisma.testQuestion.deleteMany({
      where: { testId: String(testId), questionId: String(questionId) },
    });

    const updatedCount = await prisma.testQuestion.count({ where: { testId: String(testId) } });

    res.json({
      success: true,
      message: 'Question successfully unlinked from this test.',
      questionsCount: updatedCount,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/questions/:id (Admin permanently delete question)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.question.delete({ where: { id } });
    res.json({ success: true, message: 'Question deleted permanently from the Question Bank.' });
  } catch (error) {
    next(error);
  }
});

export default router;
