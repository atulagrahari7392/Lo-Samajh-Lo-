import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requireAdmin } from '../middleware/auth';
import { googleDriveService, DriveFolderCategory } from '../services/googleDrive.service';
import { prisma } from '../db';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB limit for HD recorded lectures
  fileFilter: (req, file, cb) => {
    const allowed = [
      // Images
      '.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif',
      // Videos
      '.mp4', '.webm', '.mkv', '.mov', '.avi',
      // Documents & Bulk data
      '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.csv', '.xlsx', '.json'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type (${ext}). Allowed: images, videos, and documents.`));
    }
  },
});

// GET /api/upload/check-duplicate (Check if file already exists in FileAsset)
router.get('/check-duplicate', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const fileName = req.query.fileName as string;
    if (!fileName) {
      res.json({ exists: false });
      return;
    }

    const existing = await prisma.fileAsset.findFirst({
      where: {
        name: fileName,
        storageStatus: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      res.json({
        exists: true,
        asset: {
          id: existing.id,
          name: existing.name,
          size: existing.size,
          webUrl: existing.webUrl,
          driveFileId: existing.driveFileId,
          createdAt: existing.createdAt,
        },
      });
      return;
    }

    res.json({ exists: false });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/upload/status (Check Google Drive connectivity)
router.get('/status', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const isConfigured = await googleDriveService.isConfigured();
    if (!isConfigured) {
      res.json({
        configured: false,
        storageProvider: 'LOCAL',
        message: 'Google Drive credentials not detected. Falling back to local storage.',
      });
      return;
    }

    const test = await googleDriveService.testConnection();
    res.json({
      configured: true,
      connected: test.connected,
      storageProvider: 'GOOGLE_DRIVE',
      message: test.message,
    });
  } catch (error: any) {
    res.status(500).json({ configured: false, error: error.message });
  }
});

// POST /api/upload
router.post('/', authenticate, requireAdmin, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded.' });
    return;
  }

  const localFilePath = req.file.path;
  const originalName = req.file.originalname;
  const mimeType = req.file.mimetype;
  const size = req.file.size;
  const categoryParam = (req.body.category || 'GENERAL') as DriveFolderCategory;
  const entityType = req.body.entityType || null;
  const entityId = req.body.entityId || null;

  try {
    // If Google Drive is configured, upload to Google Drive
    if (await googleDriveService.isConfigured()) {
      const driveResult = await googleDriveService.uploadFile({
        streamOrBuffer: localFilePath,
        fileName: originalName,
        mimeType,
        category: categoryParam,
        isPublic: true,
      });

      const isImage = mimeType.startsWith('image/');
      const directImageUrl = isImage ? `/api/google-drive/image/${driveResult.fileId}` : null;
      const finalFileUrl = directImageUrl || driveResult.webUrl;

      // Create persistent FileAsset metadata record in PostgreSQL
      const fileAsset = await prisma.fileAsset.create({
        data: {
          provider: 'GOOGLE_DRIVE',
          driveFileId: driveResult.fileId,
          name: driveResult.fileName,
          mimeType: driveResult.mimeType,
          size: driveResult.size || size,
          folderId: driveResult.folderId || null,
          folderCategory: categoryParam,
          webUrl: finalFileUrl,
          downloadUrl: driveResult.downloadUrl,
          thumbnailUrl: directImageUrl || driveResult.thumbnailUrl,
          storageStatus: 'ACTIVE',
          entityType,
          entityId,
        },
      });

      // Safely remove temporary file from local server disk
      try {
        if (fs.existsSync(localFilePath)) {
          fs.unlinkSync(localFilePath);
        }
      } catch (cleanupErr: any) {
        console.warn('Could not remove temporary upload file:', cleanupErr.message);
      }

      res.json({
        success: true,
        message: 'File uploaded successfully to Google Drive!',
        storageProvider: 'GOOGLE_DRIVE',
        fileUrl: finalFileUrl,
        downloadUrl: driveResult.downloadUrl,
        driveFileId: driveResult.fileId,
        filename: originalName,
        size,
        assetId: fileAsset.id,
      });
      return;
    }

    // Local Fallback (if Google Drive credentials are not yet set)
    const fileUrl = `/uploads/${req.file.filename}`;
    const fileAsset = await prisma.fileAsset.create({
      data: {
        provider: 'LOCAL',
        name: originalName,
        mimeType,
        size,
        folderCategory: categoryParam,
        webUrl: fileUrl,
        downloadUrl: fileUrl,
        storageStatus: 'ACTIVE',
        entityType,
        entityId,
      },
    });

    res.json({
      success: true,
      message: 'File uploaded successfully (Local storage)!',
      storageProvider: 'LOCAL',
      fileUrl,
      filename: originalName,
      size,
      assetId: fileAsset.id,
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    res.status(500).json({
      success: false,
      message: `File processing failed: ${err.message}`,
    });
  }
});

// DELETE /api/upload/:assetId (Safe soft-delete / move to Drive trash)
router.delete('/:assetId', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const asset = await prisma.fileAsset.findUnique({ where: { id: assetId } });

    if (!asset) {
      res.status(404).json({ success: false, message: 'File asset not found.' });
      return;
    }

    // If on Google Drive, move to trash according to policy
    if (asset.provider === 'GOOGLE_DRIVE' && asset.driveFileId) {
      await googleDriveService.trashFile(asset.driveFileId);
    }

    // Mark storageStatus as TRASHED in PostgreSQL
    await prisma.fileAsset.update({
      where: { id: assetId },
      data: { storageStatus: 'TRASHED' },
    });

    res.json({
      success: true,
      message: 'File moved to trash successfully.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
