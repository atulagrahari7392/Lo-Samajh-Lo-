import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db';
import { authenticate, requireAdmin } from '../middleware/auth';
import { googleDriveService } from '../services/googleDrive.service';

function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                url.match(/id=([a-zA-Z0-9_-]+)/) ||
                url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

const router = Router();

// GET /api/recorded-classes
router.get('/', async (req, res, next) => {
  try {
    const { courseId } = req.query;
    const where: any = { isPublished: true };
    if (courseId) where.courseId = String(courseId);

    const classes = await prisma.recordedClass.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { id: true, title: true, slug: true } },
      },
    });

    res.json({ success: true, classes });
  } catch (error) {
    next(error);
  }
});

// Admin Recorded Classes
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const classes = await prisma.recordedClass.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { id: true, title: true } },
      },
    });
    res.json({ success: true, classes });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { courseId, title, chapter, durationMinutes, videoUrl, thumbnail, description, isPublished } = req.body;

    if (!courseId || !title || !videoUrl) {
      res.status(400).json({ success: false, message: 'Course ID, title, and video URL are required.' });
      return;
    }

    const recorded = await prisma.recordedClass.create({
      data: {
        courseId,
        title: title.trim(),
        chapter: chapter?.trim() || 'Chapter 1',
        durationMinutes: parseInt(durationMinutes, 10) || 45,
        videoUrl: videoUrl.trim(),
        thumbnail: thumbnail?.trim() || null,
        description: description?.trim() || null,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
      },
    });

    res.status(201).json({ success: true, message: 'Recorded class added.', recorded });
  } catch (error) {
    next(error);
  }
});

// GET /api/recorded-classes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const lecture = await prisma.recordedClass.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, slug: true } },
      },
    });

    if (!lecture) {
      res.status(404).json({ success: false, message: 'Recorded lecture not found.' });
      return;
    }

    res.json({ success: true, lecture });
  } catch (error) {
    next(error);
  }
});

// PUT /api/recorded-classes/:id (Update recorded lecture)
router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { courseId, title, chapter, durationMinutes, videoUrl, thumbnail, description, isPublished } = req.body;

    const data: any = {};
    if (courseId !== undefined) data.courseId = courseId;
    if (title !== undefined) data.title = title.trim();
    if (chapter !== undefined) data.chapter = chapter.trim();
    if (durationMinutes !== undefined) data.durationMinutes = parseInt(durationMinutes, 10) || 45;
    if (videoUrl !== undefined) data.videoUrl = videoUrl.trim();
    if (thumbnail !== undefined) data.thumbnail = thumbnail ? thumbnail.trim() : null;
    if (description !== undefined) data.description = description ? description.trim() : null;
    if (isPublished !== undefined) data.isPublished = Boolean(isPublished);

    const updated = await prisma.recordedClass.update({
      where: { id },
      data,
      include: {
        course: { select: { id: true, title: true } },
      },
    });

    res.json({ success: true, message: 'Recorded lecture updated successfully.', lecture: updated });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.recordedClass.delete({ where: { id } });
    res.json({ success: true, message: 'Recorded class deleted.' });
  } catch (error) {
    next(error);
  }
});

// GET /api/recorded-classes/stream/:id (Direct Video Stream with Byte-Range & Anti-Download)
router.get('/stream/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const lecture = await prisma.recordedClass.findUnique({
      where: { id },
    });

    if (!lecture) {
      res.status(404).json({ success: false, message: 'Recorded lecture not found.' });
      return;
    }

    const videoUrl = lecture.videoUrl;
    const driveFileId = extractDriveFileId(videoUrl);

    if (driveFileId) {
      try {
        const { stream, status, headers } = await googleDriveService.streamVideo(
          driveFileId,
          req.headers.range
        );
        res.writeHead(status, headers);
        stream.pipe(res);
        return;
      } catch (streamErr: any) {
        console.error('Google Drive direct streaming error:', streamErr.message);
        res.redirect(videoUrl);
        return;
      }
    }

    if (videoUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), videoUrl);
      if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
        return;
      }
    }

    res.redirect(videoUrl);
  } catch (error) {
    next(error);
  }
});

export default router;
