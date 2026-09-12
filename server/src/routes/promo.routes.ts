import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/promo-codes/validate
router.post('/validate', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      res.status(400).json({ success: false, message: 'Promo code is required.' });
      return;
    }

    const orderAmount = parseFloat(subtotal) || 0;

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      res.status(404).json({ success: false, message: 'Invalid or inactive promo code.' });
      return;
    }

    const now = new Date();
    if (promo.startDate > now) {
      res.status(400).json({ success: false, message: 'This promo code is not active yet.' });
      return;
    }

    if (promo.expiryDate < now) {
      res.status(400).json({ success: false, message: 'This promo code has expired.' });
      return;
    }

    if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
      res.status(400).json({ success: false, message: 'This promo code usage limit has been reached.' });
      return;
    }

    // Check per-user limit
    const userUsages = await prisma.promoCodeUsage.count({
      where: { promoCodeId: promo.id, userId: req.user!.id },
    });

    if (userUsages >= promo.perUserLimit) {
      res.status(400).json({ success: false, message: 'You have already used this promo code.' });
      return;
    }

    if (orderAmount < promo.minOrderAmount) {
      res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${promo.minOrderAmount} required for this code.`,
      });
      return;
    }

    let discount = 0;
    if (promo.discountType === 'PERCENTAGE') {
      discount = (orderAmount * promo.discountValue) / 100;
      if (promo.maxDiscount && discount > promo.maxDiscount) {
        discount = promo.maxDiscount;
      }
    } else {
      // FIXED
      discount = promo.discountValue;
    }

    discount = Math.min(discount, orderAmount);
    const finalAmount = Math.max(0, orderAmount - discount);

    res.json({
      success: true,
      message: `Coupon applied! You saved ₹${discount.toFixed(2)}`,
      promo: {
        id: promo.id,
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        discountAmount: Math.round(discount * 100) / 100,
        finalAmount: Math.round(finalAmount * 100) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Admin Promo Code Routes
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { usages: true, orders: true } },
      },
    });
    res.json({ success: true, promoCodes });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      expiryDate,
      usageLimit,
      perUserLimit,
      isActive,
    } = req.body;

    if (!code || !discountValue || !expiryDate) {
      res.status(400).json({ success: false, message: 'Code, discount value, and expiry date are required.' });
      return;
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: code.trim().toUpperCase(),
        discountType: discountType || 'PERCENTAGE',
        discountValue: parseFloat(discountValue) || 10,
        minOrderAmount: parseFloat(minOrderAmount) || 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        startDate: startDate ? new Date(startDate) : new Date(),
        expiryDate: new Date(expiryDate),
        usageLimit: parseInt(usageLimit, 10) || 1000,
        perUserLimit: parseInt(perUserLimit, 10) || 1,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    res.status(201).json({ success: true, message: 'Promo code created.', promo });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      startDate,
      expiryDate,
      usageLimit,
      perUserLimit,
      isActive,
    } = req.body;

    const updated = await prisma.promoCode.update({
      where: { id },
      data: {
        ...(code ? { code: code.trim().toUpperCase() } : {}),
        ...(discountType ? { discountType } : {}),
        ...(discountValue !== undefined ? { discountValue: parseFloat(discountValue) } : {}),
        ...(minOrderAmount !== undefined ? { minOrderAmount: parseFloat(minOrderAmount) } : {}),
        ...(maxDiscount !== undefined ? { maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null } : {}),
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(expiryDate ? { expiryDate: new Date(expiryDate) } : {}),
        ...(usageLimit !== undefined ? { usageLimit: parseInt(usageLimit, 10) } : {}),
        ...(perUserLimit !== undefined ? { perUserLimit: parseInt(perUserLimit, 10) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    res.json({ success: true, message: 'Promo code updated.', promo: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.promoCode.delete({ where: { id } });
    res.json({ success: true, message: 'Promo code deleted.' });
  } catch (error) {
    next(error);
  }
});

export default router;
