import { Router, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db';
import { authenticate, requireAdmin, optionalAuth, AuthRequest } from '../middleware/auth';
import { normalizeImageUrl } from '../utils/url';

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
  if (!base) base = 'study-material';
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await prisma.material.findUnique({ where: { slug } });
    if (!existing || (currentId && existing.id === currentId)) {
      return slug;
    }
    slug = `${base}-${counter++}`;
  }
}

// ----------------------------------------------------
// 1. GET /api/materials (Public list with filters & pagination)
// ----------------------------------------------------
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      category,
      materialType,
      classGrade,
      subject,
      examName,
      topic,
      language,
      year,
      difficulty,
      isFree,
      search,
      sort = 'latest',
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 12));
    const skip = (pageNum - 1) * take;

    const where: any = { status: 'PUBLISHED' };

    if (category) {
      where.OR = [
        { categoryId: String(category) },
        { category: { slug: String(category) } },
        { category: { name: { contains: String(category), mode: 'insensitive' } } },
      ];
    }

    if (materialType && materialType !== 'ALL') {
      where.materialType = String(materialType).toUpperCase();
    }

    if (classGrade && classGrade !== 'ALL') {
      where.classGrade = { contains: String(classGrade), mode: 'insensitive' };
    }

    if (subject && subject !== 'ALL') {
      where.subject = { contains: String(subject), mode: 'insensitive' };
    }

    if (examName && examName !== 'ALL') {
      where.examName = { contains: String(examName), mode: 'insensitive' };
    }

    if (topic) {
      where.topic = { contains: String(topic), mode: 'insensitive' };
    }

    if (language && language !== 'ALL') {
      where.language = String(language).toUpperCase();
    }

    if (year) {
      where.year = parseInt(String(year), 10);
    }

    if (difficulty && difficulty !== 'ALL') {
      where.difficulty = String(difficulty).toUpperCase();
    }

    if (isFree !== undefined && isFree !== '') {
      where.isFree = String(isFree) === 'true';
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      const searchConditions = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { topic: { contains: q, mode: 'insensitive' } },
        { chapter: { contains: q, mode: 'insensitive' } },
        { classGrade: { contains: q, mode: 'insensitive' } },
        { examName: { contains: q, mode: 'insensitive' } },
        { keywords: { contains: q, mode: 'insensitive' } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'popular' || sort === 'downloads') {
      orderBy = { downloadsCount: 'desc' };
    } else if (sort === 'views') {
      orderBy = { viewsCount: 'desc' };
    } else if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    }

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          category: { select: { id: true, name: true, slug: true, color: true } },
        },
      }),
      prisma.material.count({ where }),
    ]);

    // Check user bookmarks if authenticated
    let bookmarkedIds = new Set<string>();
    if (req.user) {
      const userBookmarks = await prisma.materialBookmark.findMany({
        where: { userId: req.user.id },
        select: { materialId: true },
      });
      userBookmarks.forEach(b => bookmarkedIds.add(b.materialId));
    }

    const enhancedMaterials = materials.map(m => ({
      ...m,
      thumbnail: normalizeImageUrl(m.thumbnail),
      isBookmarked: bookmarkedIds.has(m.id),
    }));

    res.json({
      success: true,
      materials: enhancedMaterials,
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

// ----------------------------------------------------
// 2. Curated collections (Featured, Trending, Recent, Most Downloaded)
// ----------------------------------------------------
router.get('/featured', async (req, res, next) => {
  try {
    const materials = await prisma.material.findMany({
      where: { status: 'PUBLISHED', isFeatured: true },
      orderBy: { downloadsCount: 'desc' },
      take: 8,
      include: { category: { select: { id: true, name: true, slug: true, color: true } } },
    });
    res.json({ success: true, materials });
  } catch (error) {
    next(error);
  }
});

router.get('/trending', async (req, res, next) => {
  try {
    const materials = await prisma.material.findMany({
      where: { status: 'PUBLISHED', OR: [{ isTrending: true }, { viewsCount: { gt: 0 } }] },
      orderBy: [{ viewsCount: 'desc' }, { downloadsCount: 'desc' }],
      take: 8,
      include: { category: { select: { id: true, name: true, slug: true, color: true } } },
    });
    res.json({ success: true, materials });
  } catch (error) {
    next(error);
  }
});

router.get('/most-downloaded', async (req, res, next) => {
  try {
    const materials = await prisma.material.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { downloadsCount: 'desc' },
      take: 8,
      include: { category: { select: { id: true, name: true, slug: true, color: true } } },
    });
    res.json({ success: true, materials });
  } catch (error) {
    next(error);
  }
});

router.get('/recent', async (req, res, next) => {
  try {
    const materials = await prisma.material.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { category: { select: { id: true, name: true, slug: true, color: true } } },
    });
    res.json({ success: true, materials });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 3. User Library (Bookmarks & Download History)
// ----------------------------------------------------
router.get('/user/library', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const [bookmarks, downloads] = await Promise.all([
      prisma.materialBookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          material: {
            include: { category: { select: { id: true, name: true, slug: true, color: true } } },
          },
        },
      }),
      prisma.materialDownload.findMany({
        where: { userId },
        orderBy: { downloadedAt: 'desc' },
        take: 20,
        include: {
          material: {
            include: { category: { select: { id: true, name: true, slug: true, color: true } } },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      savedMaterials: bookmarks.map(b => ({ ...b.material, isBookmarked: true, savedAt: b.createdAt })),
      downloadHistory: downloads.map(d => ({ ...d.material, downloadedAt: d.downloadedAt })),
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 4. Bookmark Toggle
// ----------------------------------------------------
router.post('/:id/bookmark', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const existing = await prisma.materialBookmark.findUnique({
      where: { userId_materialId: { userId, materialId: id } },
    });

    if (existing) {
      await prisma.materialBookmark.delete({
        where: { id: existing.id },
      });
      res.json({ success: true, isBookmarked: false, message: 'Removed from saved materials' });
    } else {
      await prisma.materialBookmark.create({
        data: { userId, materialId: id },
      });
      res.json({ success: true, isBookmarked: true, message: 'Saved to your library' });
    }
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 5. Download Counter & Log
// ----------------------------------------------------
router.post('/:id/download', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;
    const ipAddress = req.ip || req.socket.remoteAddress || null;

    const [material] = await Promise.all([
      prisma.material.update({
        where: { id },
        data: { downloadsCount: { increment: 1 } },
      }),
      prisma.materialDownload.create({
        data: {
          materialId: id,
          userId,
          ipAddress: typeof ipAddress === 'string' ? ipAddress : null,
        },
      }),
    ]);

    res.json({ success: true, downloadsCount: material.downloadsCount, fileUrl: material.fileUrl });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 6. View Counter & Log
// ----------------------------------------------------
router.post('/:id/view', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    const material = await prisma.material.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    await prisma.materialView.create({
      data: { materialId: id, userId },
    }).catch(() => {});

    res.json({ success: true, viewsCount: material.viewsCount });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 7. GET /api/materials/slug/:slug (Material Detail Page + Related)
// ----------------------------------------------------
router.get('/slug/:slug', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    let material = await prisma.material.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        category: true,
      },
    });

    if (!material) {
      res.status(404).json({ success: false, message: 'Study material not found.' });
      return;
    }

    // Increment view count asynchronously
    prisma.material.update({
      where: { id: material.id },
      data: { viewsCount: { increment: 1 } },
    }).catch(() => {});

    if (req.user?.id) {
      prisma.materialView.create({
        data: { materialId: material.id, userId: req.user.id },
      }).catch(() => {});
    }

    // Check if bookmarked
    let isBookmarked = false;
    if (req.user?.id) {
      const b = await prisma.materialBookmark.findUnique({
        where: { userId_materialId: { userId: req.user.id, materialId: material.id } },
      });
      isBookmarked = !!b;
    }

    // Fetch related materials
    const relatedMaterials = await prisma.material.findMany({
      where: {
        id: { not: material.id },
        status: 'PUBLISHED',
        OR: [
          { subject: material.subject },
          { classGrade: material.classGrade || undefined },
          { categoryId: material.categoryId },
          { examName: material.examName },
        ],
      },
      take: 6,
      include: {
        category: { select: { id: true, name: true, slug: true, color: true } },
      },
    });

    res.json({
      success: true,
      material: {
        ...material,
        thumbnail: normalizeImageUrl(material.thumbnail),
        isBookmarked,
      },
      relatedMaterials: relatedMaterials.map(rm => ({
        ...rm,
        thumbnail: normalizeImageUrl(rm.thumbnail),
      })),
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 8. Admin Dashboard Stats
// ----------------------------------------------------
router.get('/admin/stats', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalMaterials,
      publishedMaterials,
      draftMaterials,
      archivedMaterials,
      totalDownloadsAgg,
      totalViewsAgg,
      todayDownloads,
      monthDownloads,
      freeMaterials,
      premiumMaterials,
    ] = await Promise.all([
      prisma.material.count(),
      prisma.material.count({ where: { status: 'PUBLISHED' } }),
      prisma.material.count({ where: { status: 'DRAFT' } }),
      prisma.material.count({ where: { status: 'ARCHIVED' } }),
      prisma.material.aggregate({ _sum: { downloadsCount: true } }),
      prisma.material.aggregate({ _sum: { viewsCount: true } }),
      prisma.materialDownload.count({ where: { downloadedAt: { gte: todayStart } } }),
      prisma.materialDownload.count({ where: { downloadedAt: { gte: monthStart } } }),
      prisma.material.count({ where: { isFree: true } }),
      prisma.material.count({ where: { isFree: false } }),
    ]);

    const recentMaterials = await prisma.material.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { category: { select: { name: true } } },
    });

    res.json({
      success: true,
      stats: {
        totalMaterials,
        publishedMaterials,
        draftMaterials,
        archivedMaterials,
        totalDownloads: totalDownloadsAgg._sum.downloadsCount || 0,
        totalViews: totalViewsAgg._sum.viewsCount || 0,
        todayDownloads,
        monthDownloads,
        freeMaterials,
        premiumMaterials,
      },
      recentMaterials,
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 9. Admin List All (with pagination and admin filters)
// ----------------------------------------------------
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { search, category, status, materialType, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * take;

    const where: any = {};

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { examName: { contains: q, mode: 'insensitive' } },
        { classGrade: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categoryId = String(category);
    }

    if (status && status !== 'ALL') {
      where.status = String(status);
    }

    if (materialType && materialType !== 'ALL') {
      where.materialType = String(materialType);
    }

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { category: true },
      }),
      prisma.material.count({ where }),
    ]);

    res.json({
      success: true,
      materials: materials.map(m => ({
        ...m,
        thumbnail: normalizeImageUrl(m.thumbnail),
      })),
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

// ----------------------------------------------------
// 10. Admin Create Material
// ----------------------------------------------------
router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      title,
      slug: customSlug,
      description,
      fullContent,
      categoryId,
      materialType,
      classGrade,
      subject,
      chapter,
      topic,
      examName,
      year,
      shift,
      language,
      pageCount,
      fileUrl,
      thumbnail,
      fileType,
      fileSize,
      author,
      difficulty,
      isFree,
      isFeatured,
      isTrending,
      status,
      metaTitle,
      metaDescription,
      keywords,
    } = req.body;

    if (!title || !categoryId || !fileUrl) {
      res.status(400).json({ success: false, message: 'Title, category, and file URL are required.' });
      return;
    }

    const slug = customSlug?.trim()
      ? await generateUniqueSlug(customSlug)
      : await generateUniqueSlug(title);

    const material = await prisma.material.create({
      data: {
        title: title.trim(),
        slug,
        description: description?.trim() || null,
        fullContent: fullContent?.trim() || null,
        categoryId,
        materialType: materialType || 'CLASS_NOTES',
        classGrade: classGrade?.trim() || null,
        subject: subject?.trim() || 'General',
        chapter: chapter?.trim() || null,
        topic: topic?.trim() || null,
        examName: examName?.trim() || 'Competitive Exams',
        year: year ? parseInt(String(year), 10) : null,
        shift: shift?.trim() || null,
        language: language || 'BILINGUAL',
        pageCount: pageCount ? parseInt(String(pageCount), 10) : 1,
        fileUrl: fileUrl.trim(),
        thumbnail: normalizeImageUrl(thumbnail?.trim()) || null,
        fileType: fileType || 'PDF',
        fileSize: fileSize || '2.5 MB',
        author: author?.trim() || 'Lo Samajh Lo Faculty',
        difficulty: difficulty || 'MEDIUM',
        isFree: isFree !== undefined ? Boolean(isFree) : true,
        isFeatured: Boolean(isFeatured),
        isTrending: Boolean(isTrending),
        status: status || 'PUBLISHED',
        metaTitle: metaTitle?.trim() || null,
        metaDescription: metaDescription?.trim() || null,
        keywords: keywords?.trim() || null,
      },
      include: { category: true },
    });

    res.status(201).json({ success: true, message: 'Study material created successfully.', material });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 11. Admin Edit Material
// ----------------------------------------------------
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug: customSlug,
      description,
      fullContent,
      categoryId,
      materialType,
      classGrade,
      subject,
      chapter,
      topic,
      examName,
      year,
      shift,
      language,
      pageCount,
      fileUrl,
      thumbnail,
      fileType,
      fileSize,
      author,
      difficulty,
      isFree,
      isFeatured,
      isTrending,
      status,
      metaTitle,
      metaDescription,
      keywords,
    } = req.body;

    const existing = await prisma.material.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Material not found.' });
      return;
    }

    let finalSlug = existing.slug;
    if (customSlug && customSlug !== existing.slug) {
      finalSlug = await generateUniqueSlug(customSlug, id);
    } else if (title && !existing.slug) {
      finalSlug = await generateUniqueSlug(title, id);
    }

    const updated = await prisma.material.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        slug: finalSlug,
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(fullContent !== undefined ? { fullContent: fullContent?.trim() || null } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(materialType ? { materialType } : {}),
        ...(classGrade !== undefined ? { classGrade: classGrade?.trim() || null } : {}),
        ...(subject ? { subject: subject.trim() } : {}),
        ...(chapter !== undefined ? { chapter: chapter?.trim() || null } : {}),
        ...(topic !== undefined ? { topic: topic?.trim() || null } : {}),
        ...(examName ? { examName: examName.trim() } : {}),
        ...(year !== undefined ? { year: year ? parseInt(String(year), 10) : null } : {}),
        ...(shift !== undefined ? { shift: shift?.trim() || null } : {}),
        ...(language ? { language } : {}),
        ...(pageCount !== undefined ? { pageCount: parseInt(String(pageCount), 10) || 1 } : {}),
        ...(fileUrl ? { fileUrl: fileUrl.trim() } : {}),
        ...(thumbnail !== undefined ? { thumbnail: thumbnail ? normalizeImageUrl(thumbnail.trim()) : null } : {}),
        ...(fileType ? { fileType } : {}),
        ...(fileSize ? { fileSize } : {}),
        ...(author !== undefined ? { author: author?.trim() || null } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(isFree !== undefined ? { isFree: Boolean(isFree) } : {}),
        ...(isFeatured !== undefined ? { isFeatured: Boolean(isFeatured) } : {}),
        ...(isTrending !== undefined ? { isTrending: Boolean(isTrending) } : {}),
        ...(status ? { status } : {}),
        ...(metaTitle !== undefined ? { metaTitle: metaTitle?.trim() || null } : {}),
        ...(metaDescription !== undefined ? { metaDescription: metaDescription?.trim() || null } : {}),
        ...(keywords !== undefined ? { keywords: keywords?.trim() || null } : {}),
      },
      include: { category: true },
    });

    res.json({ success: true, message: 'Study material updated successfully.', material: updated });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 12. Admin Delete Material
// ----------------------------------------------------
router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.material.delete({ where: { id } });
    res.json({ success: true, message: 'Study material deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 13. Admin Bulk Actions (Publish, Unpublish, Archive, Delete)
// ----------------------------------------------------
router.post('/bulk-action', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { action, ids } = req.body;
    if (!action || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'Action and an array of IDs are required.' });
      return;
    }

    if (action === 'delete') {
      await prisma.material.deleteMany({
        where: { id: { in: ids } },
      });
      res.json({ success: true, message: `Successfully deleted ${ids.length} materials.` });
    } else if (action === 'publish') {
      await prisma.material.updateMany({
        where: { id: { in: ids } },
        data: { status: 'PUBLISHED' },
      });
      res.json({ success: true, message: `Successfully published ${ids.length} materials.` });
    } else if (action === 'unpublish') {
      await prisma.material.updateMany({
        where: { id: { in: ids } },
        data: { status: 'DRAFT' },
      });
      res.json({ success: true, message: `Successfully moved ${ids.length} materials to Drafts.` });
    } else if (action === 'archive') {
      await prisma.material.updateMany({
        where: { id: { in: ids } },
        data: { status: 'ARCHIVED' },
      });
      res.json({ success: true, message: `Successfully archived ${ids.length} materials.` });
    } else {
      res.status(400).json({ success: false, message: 'Unknown bulk action.' });
    }
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 14. File / Media Library (Scan /uploads directory)
// ----------------------------------------------------
router.get('/files', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      res.json({ success: true, files: [] });
      return;
    }

    const files = fs.readdirSync(uploadDir);
    const fileDetails = files
      .filter(f => !f.startsWith('.'))
      .map(file => {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        const ext = path.extname(file).toLowerCase();
        let fileType = 'other';
        if (['.pdf', '.doc', '.docx', '.ppt', '.pptx'].includes(ext)) fileType = 'document';
        else if (['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(ext)) fileType = 'image';
        else if (['.mp4', '.webm', '.mkv'].includes(ext)) fileType = 'video';

        return {
          filename: file,
          url: `/uploads/${file}`,
          size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
          rawBytes: stats.size,
          fileType,
          ext: ext.replace('.', '').toUpperCase(),
          modifiedAt: stats.mtime,
        };
      })
      .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());

    res.json({ success: true, files: fileDetails });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 15. Study Taxonomies CRUD (Categories, Classes, Subjects, Exams, Topics)
// ----------------------------------------------------
router.get('/taxonomies', async (req, res, next) => {
  try {
    const { type } = req.query;
    const where: any = { isActive: true };
    if (type) where.type = String(type).toUpperCase();

    const taxonomies = await prisma.studyTaxonomy.findMany({
      where,
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    res.json({ success: true, taxonomies });
  } catch (error) {
    next(error);
  }
});

router.post('/taxonomies', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { type, name, slug: customSlug, icon, color, order } = req.body;
    if (!type || !name) {
      res.status(400).json({ success: false, message: 'Type and name are required.' });
      return;
    }

    const slug = customSlug?.trim() ? slugify(customSlug) : slugify(name);
    const item = await prisma.studyTaxonomy.upsert({
      where: { type_slug: { type: type.toUpperCase(), slug } },
      update: { name, icon, color, order: order || 0 },
      create: {
        type: type.toUpperCase(),
        name,
        slug,
        icon,
        color: color || '#6C63FF',
        order: order || 0,
      },
    });

    res.status(201).json({ success: true, taxonomy: item });
  } catch (error) {
    next(error);
  }
});

router.delete('/taxonomies/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.studyTaxonomy.delete({ where: { id } });
    res.json({ success: true, message: 'Taxonomy removed.' });
  } catch (error) {
    next(error);
  }
});

export default router;
