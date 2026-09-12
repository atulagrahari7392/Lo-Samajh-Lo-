import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            courses: true,
            materials: true,
            tests: true,
          },
        },
      },
    });
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
});

// POST /api/categories (Admin)
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, slug, description, icon, color } = req.body;
    if (!name || !slug) {
      res.status(400).json({ success: false, message: 'Name and slug are required.' });
      return;
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description?.trim(),
        icon: icon?.trim() || 'BookOpen',
        color: color?.trim() || '#6C63FF',
      },
    });

    res.status(201).json({ success: true, message: 'Category created successfully.', category });
  } catch (error) {
    next(error);
  }
});

// PUT /api/categories/:id (Admin)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, color } = req.body;

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(slug ? { slug: slug.trim().toLowerCase() } : {}),
        ...(description !== undefined ? { description: description?.trim() } : {}),
        ...(icon ? { icon: icon.trim() } : {}),
        ...(color ? { color: color.trim() } : {}),
      },
    });

    res.json({ success: true, message: 'Category updated successfully.', category: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/categories/:id (Admin)
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

export default router;
