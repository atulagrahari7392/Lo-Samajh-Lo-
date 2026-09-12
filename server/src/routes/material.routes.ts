import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/materials (Public list with filters)
router.get('/', async (req, res, next) => {
  try {
    const { category, subject, exam, search } = req.query;

    const where: any = { status: 'PUBLISHED' };

    if (category) {
      where.OR = [
        { categoryId: String(category) },
        { category: { slug: String(category) } },
      ];
    }

    if (subject) {
      where.subject = { contains: String(subject) };
    }

    if (exam) {
      where.examName = { contains: String(exam) };
    }

    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    const materials = await prisma.material.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
      },
    });

    res.json({ success: true, materials });
  } catch (error) {
    next(error);
  }
});

// GET /api/materials/admin/all (Admin all materials)
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const materials = await prisma.material.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
    res.json({ success: true, materials });
  } catch (error) {
    next(error);
  }
});

// POST /api/materials/:id/download (Increment counter)
router.post('/:id/download', async (req, res, next) => {
  try {
    const { id } = req.params;
    const material = await prisma.material.update({
      where: { id },
      data: { downloadsCount: { increment: 1 } },
    });
    res.json({ success: true, downloadsCount: material.downloadsCount });
  } catch (error) {
    next(error);
  }
});

// POST /api/materials (Admin create)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      title,
      description,
      categoryId,
      subject,
      examName,
      fileUrl,
      thumbnail,
      fileType,
      fileSize,
      isFree,
      status,
    } = req.body;

    if (!title || !categoryId || !fileUrl) {
      res.status(400).json({ success: false, message: 'Title, category, and file URL are required.' });
      return;
    }

    const material = await prisma.material.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        categoryId,
        subject: subject?.trim() || 'General',
        examName: examName?.trim() || 'Competitive Exams',
        fileUrl: fileUrl.trim(),
        thumbnail: thumbnail?.trim() || null,
        fileType: fileType || 'PDF',
        fileSize: fileSize || '2.5 MB',
        isFree: isFree !== undefined ? Boolean(isFree) : true,
        status: status || 'PUBLISHED',
      },
      include: { category: true },
    });

    res.status(201).json({ success: true, message: 'Study material added successfully.', material });
  } catch (error) {
    next(error);
  }
});

// PUT /api/materials/:id (Admin edit)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      categoryId,
      subject,
      examName,
      fileUrl,
      thumbnail,
      fileType,
      fileSize,
      isFree,
      status,
    } = req.body;

    const updated = await prisma.material.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(subject ? { subject: subject.trim() } : {}),
        ...(examName ? { examName: examName.trim() } : {}),
        ...(fileUrl ? { fileUrl: fileUrl.trim() } : {}),
        ...(thumbnail !== undefined ? { thumbnail: thumbnail?.trim() || null } : {}),
        ...(fileType ? { fileType } : {}),
        ...(fileSize ? { fileSize } : {}),
        ...(isFree !== undefined ? { isFree: Boolean(isFree) } : {}),
        ...(status ? { status } : {}),
      },
      include: { category: true },
    });

    res.json({ success: true, message: 'Study material updated successfully.', material: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/materials/:id (Admin delete)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.material.delete({ where: { id } });
    res.json({ success: true, message: 'Study material deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
