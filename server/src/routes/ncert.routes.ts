import { Router, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin, optionalAuth, AuthRequest } from '../middleware/auth';
import { NcertDiscoveryService } from '../services/ncertDiscovery.service';
import { seedNcertCatalog } from '../scripts/seed-ncert-catalog';

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
  if (!base) base = 'ncert-book';
  let slug = base;
  let counter = 1;
  while (true) {
    const existing = await (prisma as any).ncertBook.findUnique({ where: { slug } });
    if (!existing || (currentId && existing.id === currentId)) {
      return slug;
    }
    slug = `${base}-${counter++}`;
  }
}

// ----------------------------------------------------
// 1. GET /api/ncert-books (Public Catalog with Filters & Pagination)
// ----------------------------------------------------
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      classNumber,
      subject,
      medium,
      search,
      sort = 'class_asc',
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 12));
    const skip = (pageNum - 1) * take;

    const where: any = { isActive: true };

    if (classNumber && classNumber !== 'ALL') {
      const cls = parseInt(String(classNumber), 10);
      if (!isNaN(cls)) {
        where.classNumber = cls;
      }
    }

    if (subject && subject !== 'ALL') {
      where.subject = { equals: String(subject), mode: 'insensitive' };
    }

    if (medium && medium !== 'ALL') {
      where.medium = { equals: String(medium), mode: 'insensitive' };
    }

    if (search && String(search).trim()) {
      let q = String(search).trim();
      let extractedClass: number | null = null;
      const classMatch = q.match(/class\s*[-_]?\s*(\d{1,2})/i) || q.match(/\b(\d{1,2})(?:th|st|nd|rd)?\s*class\b/i) || q.match(/\b([1-9]|1[0-2])\b/);
      if (classMatch) {
        const num = parseInt(classMatch[1], 10);
        if (num >= 1 && num <= 12) {
          extractedClass = num;
          q = q.replace(/class\s*[-_]?\s*\d{1,2}/gi, '')
               .replace(/\b\d{1,2}(?:th|st|nd|rd)?\s*class\b/gi, '')
               .replace(/\bclass\b/gi, '')
               .trim();
        }
      }

      if (extractedClass !== null) {
        where.classNumber = extractedClass;
      }

      const searchConditions: any[] = [];
      if (q) {
        searchConditions.push(
          { bookName: { contains: q, mode: 'insensitive' } },
          { bookNameHi: { contains: q, mode: 'insensitive' } },
          { subject: { contains: q, mode: 'insensitive' } },
          { bookCode: { contains: q, mode: 'insensitive' } },
        );
        if (/^maths?$/i.test(q)) {
          searchConditions.push({ subject: { contains: 'Math', mode: 'insensitive' } });
          searchConditions.push({ bookName: { contains: 'Math', mode: 'insensitive' } });
        }
      }

      if (searchConditions.length > 0) {
        where.OR = searchConditions;
      }
    }

    let orderBy: any = [{ classNumber: 'asc' }, { subject: 'asc' }, { bookName: 'asc' }];
    if (sort === 'popular' || sort === 'downloads') {
      orderBy = [{ downloadsCount: 'desc' }, { classNumber: 'asc' }];
    } else if (sort === 'views') {
      orderBy = [{ viewsCount: 'desc' }, { classNumber: 'asc' }];
    } else if (sort === 'latest') {
      orderBy = [{ createdAt: 'desc' }];
    } else if (sort === 'name') {
      orderBy = [{ bookName: 'asc' }];
    }

    const [books, total] = await Promise.all([
      (prisma as any).ncertBook.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      (prisma as any).ncertBook.count({ where }),
    ]);

    const formattedBooks = books.map((b: any) => ({
      ...b,
      chapters: b.chaptersJson ? JSON.parse(b.chaptersJson) : [],
    }));

    res.json({
      success: true,
      data: formattedBooks,
      pagination: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 2. GET /api/ncert-books/classes (Distinct Classes with Counts)
// ----------------------------------------------------
router.get('/classes', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const books = await (prisma as any).ncertBook.findMany({
      where: { isActive: true },
      select: { classNumber: true, subject: true },
    });

    const classMap = new Map<number, { count: number; subjects: Set<string> }>();
    for (let i = 1; i <= 12; i++) {
      classMap.set(i, { count: 0, subjects: new Set<string>() });
    }

    books.forEach((b: any) => {
      const entry = classMap.get(b.classNumber);
      if (entry) {
        entry.count++;
        entry.subjects.add(b.subject);
      }
    });

    const classes = Array.from(classMap.entries()).map(([classNum, data]) => ({
      classNumber: classNum,
      label: `Class ${classNum}`,
      labelHi: `कक्षा ${classNum}`,
      bookCount: data.count,
      subjects: Array.from(data.subjects),
    }));

    res.json({ success: true, data: classes });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 3. GET /api/ncert-books/subjects (Subjects for Class)
// ----------------------------------------------------
router.get('/subjects', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { classNumber } = req.query;
    const where: any = { isActive: true };
    if (classNumber && classNumber !== 'ALL') {
      const cls = parseInt(String(classNumber), 10);
      if (!isNaN(cls)) where.classNumber = cls;
    }

    const books = await (prisma as any).ncertBook.findMany({
      where,
      select: { subject: true },
      distinct: ['subject'],
      orderBy: { subject: 'asc' },
    });

    res.json({
      success: true,
      data: books.map((b: any) => b.subject),
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 4. GET /api/ncert-books/:idOrSlug (Single Book Detail)
// ----------------------------------------------------
router.get('/:idOrSlug', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { idOrSlug } = req.params;
    const book = await (prisma as any).ncertBook.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (!book) {
      res.status(404).json({ success: false, message: 'NCERT textbook not found.' });
      return;
    }

    const formatted = {
      ...book,
      chapters: book.chaptersJson ? JSON.parse(book.chaptersJson) : [],
    };

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 5. POST /api/ncert-books/:id/track-view
// ----------------------------------------------------
router.post('/:id/track-view', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await (prisma as any).ncertBook.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });
    res.json({ success: true, message: 'View tracked' });
  } catch (error) {
    res.json({ success: false });
  }
});

// ----------------------------------------------------
// 6. POST /api/ncert-books/:id/track-download
// ----------------------------------------------------
router.post('/:id/track-download', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await (prisma as any).ncertBook.update({
      where: { id },
      data: { downloadsCount: { increment: 1 } },
    });
    res.json({ success: true, message: 'Official redirect tracked' });
  } catch (error) {
    res.json({ success: false });
  }
});

// ====================================================
// ADMIN PROTECTED ROUTES
// ====================================================

// ----------------------------------------------------
// 7. GET /api/ncert-books/admin/all (Admin Listing)
// ----------------------------------------------------
router.get('/admin/all', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      classNumber,
      subject,
      medium,
      status = 'ALL',
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * take;

    const where: any = {};

    if (status === 'ACTIVE') where.isActive = true;
    if (status === 'INACTIVE') where.isActive = false;

    if (classNumber && classNumber !== 'ALL') {
      const cls = parseInt(String(classNumber), 10);
      if (!isNaN(cls)) where.classNumber = cls;
    }

    if (subject && subject !== 'ALL') {
      where.subject = { equals: String(subject), mode: 'insensitive' };
    }

    if (medium && medium !== 'ALL') {
      where.medium = { equals: String(medium), mode: 'insensitive' };
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { bookName: { contains: q, mode: 'insensitive' } },
        { bookNameHi: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { bookCode: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [books, total] = await Promise.all([
      (prisma as any).ncertBook.findMany({
        where,
        orderBy: [{ classNumber: 'asc' }, { subject: 'asc' }, { bookName: 'asc' }],
        skip,
        take,
      }),
      (prisma as any).ncertBook.count({ where }),
    ]);

    const formattedBooks = books.map((b: any) => ({
      ...b,
      chapters: b.chaptersJson ? JSON.parse(b.chaptersJson) : [],
    }));

    res.json({
      success: true,
      data: formattedBooks,
      pagination: {
        page: pageNum,
        limit: take,
        total,
        totalPages: Math.ceil(total / take) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 8. POST /api/ncert-books/admin (Create NCERT Book)
// ----------------------------------------------------
router.post('/admin', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      classNumber,
      subject,
      bookName,
      bookNameHi,
      language = 'English',
      medium = 'English',
      edition = 'Rationalised Edition 2025-26',
      academicYear = '2025-26',
      bookCode,
      coverImageUrl,
      officialPageUrl = 'https://ncert.nic.in/textbook.php',
      officialPdfUrl,
      chapterCount = 0,
      chapters,
      isActive = true,
    } = req.body;

    if (!classNumber || !subject || !bookName || !officialPdfUrl) {
      res.status(400).json({
        success: false,
        message: 'Class, Subject, Book Name, and Official PDF URL are mandatory.',
      });
      return;
    }

    const slug = await generateUniqueSlug(`${classNumber}-${subject}-${bookName}`);

    const chaptersJson = Array.isArray(chapters) ? JSON.stringify(chapters) : (typeof chapters === 'string' ? chapters : null);

    const newBook = await (prisma as any).ncertBook.create({
      data: {
        classNumber: parseInt(String(classNumber), 10),
        subject: String(subject).trim(),
        bookName: String(bookName).trim(),
        bookNameHi: bookNameHi ? String(bookNameHi).trim() : null,
        slug,
        language: String(language).trim(),
        medium: String(medium).trim(),
        edition: edition ? String(edition).trim() : null,
        academicYear: academicYear ? String(academicYear).trim() : null,
        bookCode: bookCode ? String(bookCode).trim() : null,
        coverImageUrl: coverImageUrl ? String(coverImageUrl).trim() : null,
        officialPageUrl: String(officialPageUrl).trim(),
        officialPdfUrl: String(officialPdfUrl).trim(),
        chapterCount: parseInt(String(chapterCount), 10) || 0,
        chaptersJson,
        sourceName: 'NCERT',
        sourceType: 'OFFICIAL',
        sourceVerifiedAt: new Date(),
        isActive: Boolean(isActive),
      },
    });

    res.status(201).json({
      success: true,
      message: 'NCERT book catalogue entry created successfully.',
      data: newBook,
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 9. PUT /api/ncert-books/admin/:id (Update Metadata)
// ----------------------------------------------------
router.put('/admin/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      classNumber,
      subject,
      bookName,
      bookNameHi,
      language,
      medium,
      edition,
      academicYear,
      bookCode,
      coverImageUrl,
      officialPageUrl,
      officialPdfUrl,
      chapterCount,
      chapters,
      isActive,
    } = req.body;

    const existing = await (prisma as any).ncertBook.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'NCERT book entry not found.' });
      return;
    }

    const updateData: any = {};
    if (classNumber !== undefined) updateData.classNumber = parseInt(String(classNumber), 10);
    if (subject !== undefined) updateData.subject = String(subject).trim();
    if (bookName !== undefined) updateData.bookName = String(bookName).trim();
    if (bookNameHi !== undefined) updateData.bookNameHi = bookNameHi ? String(bookNameHi).trim() : null;
    if (language !== undefined) updateData.language = String(language).trim();
    if (medium !== undefined) updateData.medium = String(medium).trim();
    if (edition !== undefined) updateData.edition = edition ? String(edition).trim() : null;
    if (academicYear !== undefined) updateData.academicYear = academicYear ? String(academicYear).trim() : null;
    if (bookCode !== undefined) updateData.bookCode = bookCode ? String(bookCode).trim() : null;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl ? String(coverImageUrl).trim() : null;
    if (officialPageUrl !== undefined) updateData.officialPageUrl = String(officialPageUrl).trim();
    if (officialPdfUrl !== undefined) updateData.officialPdfUrl = String(officialPdfUrl).trim();
    if (chapterCount !== undefined) updateData.chapterCount = parseInt(String(chapterCount), 10) || 0;
    if (chapters !== undefined) {
      updateData.chaptersJson = Array.isArray(chapters) ? JSON.stringify(chapters) : (typeof chapters === 'string' ? chapters : null);
    }
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await (prisma as any).ncertBook.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'NCERT book catalogue entry updated successfully.',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 10. PATCH /api/ncert-books/admin/:id/status (Toggle Status)
// ----------------------------------------------------
router.patch('/admin/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = await (prisma as any).ncertBook.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });
    res.json({ success: true, message: `NCERT book ${updated.isActive ? 'activated' : 'deactivated'}`, data: updated });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 11. POST /api/ncert-books/admin/:id/verify-source
// ----------------------------------------------------
router.post('/admin/:id/verify-source', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const book = await (prisma as any).ncertBook.findUnique({ where: { id } });
    if (!book) {
      res.status(404).json({ success: false, message: 'Book not found' });
      return;
    }

    const verificationResult = await NcertDiscoveryService.verifyOfficialSource(book.officialPdfUrl || book.officialPageUrl);

    const updated = await (prisma as any).ncertBook.update({
      where: { id },
      data: {
        sourceVerifiedAt: verificationResult.verifiedAt,
      },
    });

    res.json({
      success: true,
      message: verificationResult.message,
      data: {
        book: updated,
        verification: verificationResult,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 12. DELETE /api/ncert-books/admin/:id (Delete Catalogue Entry Only)
// ----------------------------------------------------
router.delete('/admin/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // STRICT ISOLATION RULE: Deletion deletes ONLY the ncert_books record.
    // It must NOT delete anything from Google Drive, FileAsset, or Material.
    await (prisma as any).ncertBook.delete({ where: { id } });

    res.json({
      success: true,
      message: 'NCERT catalogue entry deleted successfully. No files or assets were altered.',
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 13. POST /api/ncert-books/admin/seed-official (Refresh/Seed Official Catalog)
// ----------------------------------------------------
router.post('/admin/seed-official', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const count = await seedNcertCatalog();
    res.json({
      success: true,
      message: `Official NCERT catalogue synced successfully with ${count} textbooks.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: `Failed to seed catalogue: ${error.message}` });
  }
});

export default router;
