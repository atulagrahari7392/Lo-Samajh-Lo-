import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const sliderSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  subtitle: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  imageUrl: z.string().min(1, 'Image URL is required'),
  linkUrl: z.string().optional().nullable(),
  buttonText: z.string().optional().nullable(),
  position: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// GET /api/sliders - Public active sliders for Home Page
router.get('/', async (req, res, next) => {
  try {
    const sliders = await prisma.sliderBanner.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
    });
    res.json({ success: true, sliders });
  } catch (err) {
    next(err);
  }
});

// GET /api/sliders/admin/all - Admin view all sliders
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const sliders = await prisma.sliderBanner.findMany({
      orderBy: { position: 'asc' },
    });
    res.json({ success: true, sliders });
  } catch (err) {
    next(err);
  }
});

// POST /api/sliders - Create slide
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const data = sliderSchema.parse(req.body);
    const slider = await prisma.sliderBanner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || null,
        badge: data.badge || null,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl || null,
        buttonText: data.buttonText || 'Enroll Now / शामिल हों',
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
      },
    });
    res.status(201).json({ success: true, slider });
  } catch (err) {
    next(err);
  }
});

// PUT /api/sliders/:id - Update slide
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = sliderSchema.partial().parse(req.body);
    const slider = await prisma.sliderBanner.update({
      where: { id },
      data,
    });
    res.json({ success: true, slider });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/sliders/:id - Delete slide
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.sliderBanner.delete({ where: { id } });
    res.json({ success: true, message: 'Slider banner deleted successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
