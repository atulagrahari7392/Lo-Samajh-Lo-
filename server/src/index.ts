import http from 'http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initSocket } from './socket';
import authRoutes from './routes/auth.routes';
import courseRoutes from './routes/course.routes';
import categoryRoutes from './routes/category.routes';
import materialRoutes from './routes/material.routes';
import testRoutes from './routes/test.routes';
import testSeriesRoutes from './routes/test-series.routes';
import questionRoutes from './routes/question.routes';
import typingRoutes from './routes/typing.routes';
import cartRoutes from './routes/cart.routes';
import wishlistRoutes from './routes/wishlist.routes';
import promoRoutes from './routes/promo.routes';
import orderRoutes from './routes/order.routes';
import reviewRoutes from './routes/review.routes';
import liveRoutes from './routes/live.routes';
import recordedRoutes from './routes/recorded.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';
import sliderRoutes from './routes/slider.routes';
import settingsRoutes from './routes/settings.routes';
import currentAffairsRoutes from './routes/current-affairs.routes';
import googleDriveRoutes from './routes/googleDrive.routes';
import aiNewsroomRoutes from './routes/aiNewsroom.routes';
import { initNewsroomScheduler } from './services/aiNewsroom/scheduler';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));
const altUploadDir = path.join(process.cwd(), 'server', 'uploads');
if (fs.existsSync(altUploadDir)) {
  app.use('/uploads', express.static(altUploadDir));
}

// Health check (Real database ping)
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      service: 'Lo Samajh Lo LMS API',
      database: 'connected',
      provider: 'postgresql',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Health check database error:', error.message);
    res.status(503).json({
      status: 'error',
      service: 'Lo Samajh Lo LMS API',
      database: 'disconnected',
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/test-series', testSeriesRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/typing-tests', typingRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/promo-codes', promoRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/live-classes', liveRoutes);
app.use('/api/recorded-classes', recordedRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/ai-newsroom', aiNewsroomRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sliders', sliderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/current-affairs', currentAffairsRoutes);
app.use('/api/google-drive', googleDriveRoutes);

// Serve frontend client build in production if available
const possibleClientPaths = [
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../../client/dist'),
];
const clientDistPath = possibleClientPaths.find((p) => fs.existsSync(p));

if (clientDistPath) {
  app.use(
    express.static(clientDistPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      },
    })
  );
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Error handling
app.use(errorHandler);

import { migrateData } from './scripts/migrate-data';

const httpServer = http.createServer(app);
initSocket(httpServer);
initNewsroomScheduler(60000);

// Periodic Live Scheduler (Phase 34)
// Checks for scheduled classes approaching start time, stale live sessions, and recording status
setInterval(async () => {
  try {
    const now = new Date();
    // 1. Transition SCHEDULED classes that are past their start time to STARTING
    const startingClasses = await prisma.liveClass.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      select: { id: true, title: true, slug: true },
      take: 10,
    });

    for (const sc of startingClasses) {
      await prisma.liveClass.update({
        where: { id: sc.id },
        data: { status: 'STARTING' },
      });
      // Broadcast to room if connected
      const { io } = await import('./socket');
      if (io) {
        io.to(`liveClass:${sc.id}`).emit('live:status_change', { status: 'STARTING' });
      }
    }
  } catch (err: any) {
    // Suppress background schedule error
  }
}, 30000);

httpServer.listen(Number(PORT), '0.0.0.0', async () => {
  console.log(`🚀 Lo Samajh Lo Server + Socket.IO running on port ${PORT}`);

  // Safe initial data import if target PostgreSQL database is completely empty
  try {
    const categoryCount = await prisma.category.count();
    if (categoryCount === 0) {
      console.log('📦 PostgreSQL database is empty. Running safe one-time migration from SQLite backup...');
      await migrateData();
    } else {
      console.log(`✅ Database ready. Found ${categoryCount} existing categories. Production data preserved.`);
    }

    // Safe seed for AI Education Newsroom if empty
    const { seedEducationNewsroom } = await import('./scripts/seed-newsroom');
    await seedEducationNewsroom();
  } catch (err: any) {
    console.warn('⚠️ Database startup notice:', err.message);
  }

  // AI Newsroom Startup/Configuration Validation (Phase Fix Item 10)
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10) {
    const geminiModel = (process.env.GEMINI_MODEL || 'gemini-3.5-flash').trim();
    console.log('Gemini Provider: configured');
    console.log(`Gemini Model: ${geminiModel}`);
  } else if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 10) {
    const openaiModel = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();
    console.log('OpenAI Provider: configured');
    console.log(`OpenAI Model: ${openaiModel}`);
  } else {
    console.log('AI Provider: RuleBasedEducationParser (Fallback configured)');
  }
});

export default app;

