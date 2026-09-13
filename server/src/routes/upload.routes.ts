import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requireAdmin } from '../middleware/auth';

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
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB limit for videos & banners
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

// POST /api/upload
router.post('/', authenticate, requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file uploaded.' });
    return;
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    message: 'File uploaded successfully!',
    fileUrl,
    filename: req.file.originalname,
    size: req.file.size,
  });
});

export default router;
