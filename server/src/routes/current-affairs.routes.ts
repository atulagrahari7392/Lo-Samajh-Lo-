import { Router, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin, optionalAuth, AuthRequest } from '../middleware/auth';

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

async function generateUniqueSlug(title: string, currentId?: string): Promise<string> {
  let base = slugify(title);
  if (!base) base = 'current-affairs';
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.currentAffairs.findUnique({ where: { slug } });
    if (!existing || (currentId && existing.id === currentId)) {
      return slug;
    }
    slug = `${base}-${counter++}`;
  }
}

// GET /api/current-affairs (Public list with filters & pagination)
router.get('/', async (req, res, next) => {
  try {
    const {
      category,
      date,
      month,
      year,
      search,
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 12));
    const skip = (pageNum - 1) * take;

    const where: any = { status: 'PUBLISHED' };

    if (category && category !== 'ALL') {
      where.category = String(category).toUpperCase();
    }

    if (date) {
      const d = new Date(String(date));
      if (!isNaN(d.getTime())) {
        const startOfDay = new Date(d);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(d);
        endOfDay.setHours(23, 59, 59, 999);
        where.date = { gte: startOfDay, lte: endOfDay };
      }
    } else if (year && month) {
      const y = parseInt(String(year), 10);
      const m = parseInt(String(month), 10) - 1; // 0-indexed
      const startOfMonth = new Date(y, m, 1);
      const endOfMonth = new Date(y, m + 1, 0, 23, 59, 59, 999);
      where.date = { gte: startOfMonth, lte: endOfMonth };
    } else if (year) {
      const y = parseInt(String(year), 10);
      const startOfYear = new Date(y, 0, 1);
      const endOfYear = new Date(y, 11, 31, 23, 59, 59, 999);
      where.date = { gte: startOfYear, lte: endOfYear };
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } },
        { tags: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.currentAffairs.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      prisma.currentAffairs.count({ where }),
    ]);

    res.json({
      success: true,
      items,
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

// GET /api/current-affairs/admin/all (Admin view)
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { search, category, status, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * take;

    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = String(category).toUpperCase();
    }

    if (status && status !== 'ALL') {
      where.status = String(status);
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } },
        { tags: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.currentAffairs.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      prisma.currentAffairs.count({ where }),
    ]);

    res.json({
      success: true,
      items,
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

// GET /api/current-affairs/:idOrSlug
router.get('/:idOrSlug', async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;

    const item = await prisma.currentAffairs.findFirst({
      where: {
        OR: [{ slug: idOrSlug }, { id: idOrSlug }],
      },
    });

    if (!item) {
      res.status(404).json({ success: false, message: 'Current affairs article not found.' });
      return;
    }

    // Increment view count
    prisma.currentAffairs.update({
      where: { id: item.id },
      data: { viewsCount: { increment: 1 } },
    }).catch(() => {});

    res.json({ success: true, item });
  } catch (error) {
    next(error);
  }
});

// POST /api/current-affairs (Admin create)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { title, slug: customSlug, category, date, content, image, pdfUrl, source, tags, status } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, message: 'Title and content are required.' });
      return;
    }

    const slug = customSlug?.trim()
      ? await generateUniqueSlug(customSlug)
      : await generateUniqueSlug(title);

    const item = await prisma.currentAffairs.create({
      data: {
        title: title.trim(),
        slug,
        category: category || 'NATIONAL',
        date: date ? new Date(date) : new Date(),
        content: content.trim(),
        image: image?.trim() || null,
        pdfUrl: pdfUrl?.trim() || null,
        source: source?.trim() || null,
        tags: tags?.trim() || null,
        status: status || 'PUBLISHED',
      },
    });

    res.status(201).json({ success: true, message: 'Current affairs post created successfully.', item });
  } catch (error) {
    next(error);
  }
});

// PUT /api/current-affairs/:id (Admin update)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, slug: customSlug, category, date, content, image, pdfUrl, source, tags, status } = req.body;

    const existing = await prisma.currentAffairs.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Article not found.' });
      return;
    }

    let finalSlug = existing.slug;
    if (customSlug && customSlug !== existing.slug) {
      finalSlug = await generateUniqueSlug(customSlug, id);
    } else if (title && !existing.slug) {
      finalSlug = await generateUniqueSlug(title, id);
    }

    const updated = await prisma.currentAffairs.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        slug: finalSlug,
        ...(category ? { category } : {}),
        ...(date ? { date: new Date(date) } : {}),
        ...(content ? { content: content.trim() } : {}),
        ...(image !== undefined ? { image: image?.trim() || null } : {}),
        ...(pdfUrl !== undefined ? { pdfUrl: pdfUrl?.trim() || null } : {}),
        ...(source !== undefined ? { source: source?.trim() || null } : {}),
        ...(tags !== undefined ? { tags: tags?.trim() || null } : {}),
        ...(status ? { status } : {}),
      },
    });

    res.json({ success: true, message: 'Current affairs updated successfully.', item: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/current-affairs/:id (Admin delete)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.currentAffairs.delete({ where: { id } });
    res.json({ success: true, message: 'Article deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
