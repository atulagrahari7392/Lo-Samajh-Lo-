import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

const DEFAULT_FOOTER_SETTINGS = {
  aboutText: "India's premier digital learning platform dedicated to competitive exams (UPSSSC, Railway, SSC, UP Police) and graduation studies. Concept-based learning with comprehensive study materials, live mock tests, and bilingual notes.",
  address: "Raebareli, Uttar Pradesh",
  email: "support@losamajhlo.in",
  phone: "+91 99999 99999",
  whatsappUrl: "https://wa.me/919999999999?text=Hello%20Lo%20Samajh%20Lo%20Team%2C%20I%20need%20course%20guidance",
  youtubeUrl: "https://youtube.com/@losamajhlo",
  telegramUrl: "https://t.me/losamajhlo",
  instagramUrl: "https://instagram.com/losamajhlo",
  facebookUrl: "https://facebook.com/losamajhlo",
  twitterUrl: "https://twitter.com/losamajhlo",
  linkedinUrl: "https://linkedin.com/company/losamajhlo",
  copyrightText: "Lo Samajh Lo (लो समझ लो). All rights reserved.",
  newsletterHeadline: "Stay Connected with Lo Samajh Lo",
  newsletterText: "Subscribe to get immediate alerts for new government job vacancies, PDF circulars, and test updates.",
};

// GET /api/settings/footer - Public footer settings
router.get('/footer', async (req, res, next) => {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'footer' },
    });

    if (!setting) {
      return res.json({ success: true, settings: DEFAULT_FOOTER_SETTINGS });
    }

    try {
      const parsed = JSON.parse(setting.value);
      return res.json({ success: true, settings: { ...DEFAULT_FOOTER_SETTINGS, ...parsed } });
    } catch {
      return res.json({ success: true, settings: DEFAULT_FOOTER_SETTINGS });
    }
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings/footer - Admin update footer settings
router.put('/footer', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const updatedValue = JSON.stringify(req.body);
    const setting = await prisma.siteSetting.upsert({
      where: { key: 'footer' },
      update: { value: updatedValue },
      create: { key: 'footer', value: updatedValue },
    });

    res.json({
      success: true,
      settings: JSON.parse(setting.value),
      message: 'Footer settings updated successfully!',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
