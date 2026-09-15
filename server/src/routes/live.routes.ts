import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, optionalAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { streamingProvider } from '../services/streaming/StreamingProvider';
import { io } from '../socket';

const router = Router();

// Helper to generate a URL-friendly slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ========================================================
// 1. PUBLIC / STUDENT HUB ROUTES
// ========================================================

/**
 * GET /api/live-classes
 * Student hub listing classes: live now, upcoming, past, with counts
 */
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { status, classType, courseId, search, tab } = req.query;

    const where: any = { isPublished: true };

    if (classType) where.classType = String(classType);
    if (courseId) where.courseId = String(courseId);

    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { instructor: { contains: String(search), mode: 'insensitive' } },
        { subject: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    // Filter by tab
    if (tab === 'live') {
      where.status = { in: ['LIVE', 'STARTING', 'STREAM_INTERRUPTED'] };
    } else if (tab === 'upcoming') {
      where.status = 'SCHEDULED';
    } else if (tab === 'past' || tab === 'recordings') {
      where.status = { in: ['COMPLETED', 'ENDED', 'PROCESSING'] };
    } else if (status) {
      where.status = String(status);
    }

    const classes = await prisma.liveClass.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // LIVE / SCHEDULED first
        { scheduledAt: 'asc' },
      ],
      include: {
        course: { select: { id: true, title: true, slug: true, thumbnail: true } },
        recordedClass: { select: { id: true, title: true, videoUrl: true } },
        _count: {
          select: {
            attendances: true,
            chatMessages: true,
            resources: true,
          },
        },
      },
    });

    // Compute hub tab metrics
    const [liveCount, upcomingCount, completedCount] = await Promise.all([
      prisma.liveClass.count({
        where: { isPublished: true, status: { in: ['LIVE', 'STARTING', 'STREAM_INTERRUPTED'] } },
      }),
      prisma.liveClass.count({
        where: { isPublished: true, status: 'SCHEDULED' },
      }),
      prisma.liveClass.count({
        where: { isPublished: true, status: { in: ['COMPLETED', 'ENDED'] } },
      }),
    ]);

    // Check enrollment for current user if logged in
    let enrolledCourseIds = new Set<string>();
    if (req.user) {
      const userEnrollments = await prisma.enrollment.findMany({
        where: { userId: req.user.id, status: 'ACTIVE' },
        select: { courseId: true },
      });
      enrolledCourseIds = new Set(userEnrollments.map((e) => e.courseId));
    }

    const mappedClasses = classes.map((c) => {
      let isAccessGranted = true;
      if (c.accessType === 'AUTHENTICATED' && !req.user) {
        isAccessGranted = false;
      } else if (c.accessType === 'COURSE' && c.courseId) {
        isAccessGranted = req.user?.role === 'ADMIN' || enrolledCourseIds.has(c.courseId);
      }

      return {
        ...c,
        isAccessGranted,
        // Strip sensitive internal session keys before sending to public
      };
    });

    res.json({
      success: true,
      classes: mappedClasses,
      metrics: {
        liveNow: liveCount,
        upcoming: upcomingCount,
        completed: completedCount,
        total: liveCount + upcomingCount + completedCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/live-classes/:slugOrId
 * Student live classroom page data: stream playback, resources, poll, announcements
 */
router.get('/:slugOrId', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { slugOrId } = req.params;

    const liveClass = await prisma.liveClass.findFirst({
      where: {
        OR: [{ id: slugOrId }, { slug: slugOrId }],
      },
      include: {
        course: { select: { id: true, title: true, slug: true, price: true } },
        quiz: { select: { id: true, title: true, durationMinutes: true, totalMarks: true } },
        resources: {
          where: { isPublished: true },
          orderBy: { createdAt: 'asc' },
        },
        announcements: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        polls: {
          where: { status: 'LIVE' },
          include: {
            options: { orderBy: { position: 'asc' } },
            _count: { select: { responses: true } },
          },
          take: 1,
        },
        recordedClass: {
          select: { id: true, videoUrl: true, durationMinutes: true },
        },
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!liveClass) {
      res.status(404).json({ success: false, message: 'Live class session not found.' });
      return;
    }

    // Server-side Access Control Check (Phase 18)
    let isAccessGranted = true;
    let accessReason = 'Granted';

    if (liveClass.accessType === 'AUTHENTICATED') {
      if (!req.user) {
        isAccessGranted = false;
        accessReason = 'LOGIN_REQUIRED';
      }
    } else if (liveClass.accessType === 'COURSE' && liveClass.courseId) {
      if (!req.user) {
        isAccessGranted = false;
        accessReason = 'LOGIN_REQUIRED';
      } else if (req.user.role !== 'ADMIN') {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: req.user.id,
              courseId: liveClass.courseId,
            },
          },
        });
        if (!enrollment || enrollment.status !== 'ACTIVE') {
          isAccessGranted = false;
          accessReason = 'ENROLLMENT_REQUIRED';
        }
      }
    }

    // Get playback information via StreamingProvider abstraction
    const activeSession = liveClass.sessions[0];
    const playbackInfo = activeSession?.providerStreamId
      ? await streamingProvider.getPlaybackInfo(activeSession.providerStreamId)
      : {
          hlsUrl: activeSession?.hlsPlaybackUrl || '',
          provider: 'CUSTOM_RTMP',
        };

    // NEVER expose streamKey or provider secrets in student response
    const sanitizedSession = activeSession
      ? {
          id: activeSession.id,
          streamStatus: activeSession.streamStatus,
          hlsPlaybackUrl: isAccessGranted ? playbackInfo.hlsUrl : null,
          actualStartedAt: activeSession.actualStartedAt,
        }
      : null;

    // Check if user has answered the active poll
    let userVotedPollOptionId: string | null = null;
    const activePoll = liveClass.polls[0];
    if (activePoll && req.user) {
      const response = await prisma.livePollResponse.findUnique({
        where: {
          pollId_userId: { pollId: activePoll.id, userId: req.user.id },
        },
      });
      if (response) {
        userVotedPollOptionId = response.optionId;
      }
    }

    res.json({
      success: true,
      liveClass: {
        id: liveClass.id,
        title: liveClass.title,
        slug: liveClass.slug,
        instructor: liveClass.instructor,
        description: liveClass.description,
        subject: liveClass.subject,
        chapter: liveClass.chapter,
        topic: liveClass.topic,
        thumbnail: liveClass.thumbnail,
        classType: liveClass.classType,
        language: liveClass.language,
        scheduledAt: liveClass.scheduledAt,
        scheduledEndAt: liveClass.scheduledEndAt,
        durationMinutes: liveClass.durationMinutes,
        status: liveClass.status,
        accessType: liveClass.accessType,
        course: liveClass.course,
        quiz: liveClass.quiz,
        resources: isAccessGranted ? liveClass.resources : [],
        announcements: liveClass.announcements,
        activePoll: activePoll
          ? {
              ...activePoll,
              userVotedOptionId: userVotedPollOptionId,
            }
          : null,
        session: sanitizedSession,
        meetingUrl: liveClass.meetingUrl,
        recordedClass: liveClass.recordedClass,
      },
      isAccessGranted,
      accessReason,
    });
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 2. DOUBTS & Q&A ROUTES
// ========================================================

/**
 * GET /api/live-classes/:id/questions
 */
router.get('/:id/questions', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const questions = await prisma.liveQuestion.findMany({
      where: { liveClassId: id },
      orderBy: [{ status: 'asc' }, { upvotes: 'desc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, questions });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/live-classes/:id/questions (Ask Doubt)
 */
router.post('/:id/questions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { question } = req.body;

    if (!question || !question.trim()) {
      res.status(400).json({ success: false, message: 'Question text is required.' });
      return;
    }

    const created = await prisma.liveQuestion.create({
      data: {
        liveClassId: id,
        userId: req.user!.id,
        userName: req.user!.name,
        question: question.trim().slice(0, 500),
      },
    });

    if (io) {
      io.to(`liveClass:${id}`).emit('question:new', created);
    }

    res.status(201).json({ success: true, question: created });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/live-classes/:id/questions/:qId/upvote
 */
router.post('/:id/questions/:qId/upvote', optionalAuth, async (req, res, next) => {
  try {
    const { id, qId } = req.params;

    const updated = await prisma.liveQuestion.update({
      where: { id: qId },
      data: { upvotes: { increment: 1 } },
    });

    if (io) {
      io.to(`liveClass:${id}`).emit('question:updated', updated);
    }

    res.json({ success: true, question: updated });
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 3. ATTENDANCE & HEARTBEAT ROUTES
// ========================================================

/**
 * POST /api/live-classes/:id/attendance/join
 */
router.post('/:id/attendance/join', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { deviceInfo } = req.body;

    const record = await prisma.liveAttendance.upsert({
      where: {
        userId_liveClassId: {
          userId: req.user!.id,
          liveClassId: id,
        },
      },
      update: {
        lastSeenAt: new Date(),
        reconnectCount: { increment: 1 },
        deviceInfo: deviceInfo || 'Browser',
      },
      create: {
        userId: req.user!.id,
        liveClassId: id,
        joinedAt: new Date(),
        lastSeenAt: new Date(),
        deviceInfo: deviceInfo || 'Browser',
      },
    });

    res.json({ success: true, attendance: record });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/live-classes/:id/attendance/heartbeat
 */
router.post('/:id/attendance/heartbeat', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { secondsWatched } = req.body;

    const delta = Math.min(Math.max(parseInt(secondsWatched, 10) || 25, 5), 60);

    const att = await prisma.liveAttendance.findUnique({
      where: {
        userId_liveClassId: {
          userId: req.user!.id,
          liveClassId: id,
        },
      },
    });

    if (att) {
      const newTotal = att.totalWatchSeconds + delta;
      const liveClass = await prisma.liveClass.findUnique({
        where: { id },
        select: { durationMinutes: true },
      });
      const totalClassSeconds = (liveClass?.durationMinutes || 60) * 60;
      const completionPercentage = Math.min(
        Math.round((newTotal / totalClassSeconds) * 100),
        100
      );

      await prisma.liveAttendance.update({
        where: { id: att.id },
        data: {
          lastSeenAt: new Date(),
          totalWatchSeconds: newTotal,
          completionPercentage,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ========================================================
// 4. ADMIN & TEACHER MANAGEMENT ROUTES
// ========================================================

/**
 * GET /api/live-classes/admin/all
 * Admin dashboard listing with full statistics and filter support
 */
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, courseId, search } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status);
    if (courseId) where.courseId = String(courseId);
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: 'insensitive' } },
        { instructor: { contains: String(search), mode: 'insensitive' } },
        { subject: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const classes = await prisma.liveClass.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        quiz: { select: { id: true, title: true } },
        recordedClass: { select: { id: true, title: true } },
        _count: {
          select: {
            attendances: true,
            chatMessages: true,
            questions: true,
            polls: true,
            resources: true,
          },
        },
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Summary statistics for widgets (Phase 50)
    const [liveNow, upcomingToday, totalClasses, completedCount] = await Promise.all([
      prisma.liveClass.count({ where: { status: { in: ['LIVE', 'STARTING'] } } }),
      prisma.liveClass.count({
        where: {
          status: 'SCHEDULED',
          scheduledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.liveClass.count(),
      prisma.liveClass.count({ where: { status: 'COMPLETED' } }),
    ]);

    // Average attendance calculation
    const totalAttendees = await prisma.liveAttendance.count();
    const avgAttendance = totalClasses > 0 ? Math.round(totalAttendees / totalClasses) : 0;

    res.json({
      success: true,
      classes,
      stats: {
        liveNow,
        upcomingToday,
        totalClasses,
        completedCount,
        avgAttendance,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/live-classes (Create Live Class - Multi-step Wizard)
 */
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const {
      title,
      courseId,
      batchId,
      subject,
      chapter,
      topic,
      instructor,
      description,
      thumbnail,
      classType,
      language,
      scheduledAt,
      durationMinutes,
      timezone,
      accessType,
      isPublished,
      quizId,
      resources,
      notifyStudents,
    } = req.body;

    if (!title || !scheduledAt) {
      res.status(400).json({ success: false, message: 'Class title and scheduled time are required.' });
      return;
    }

    const cleanTitle = title.trim();
    let generatedSlug = slugify(cleanTitle);

    // Ensure unique slug
    const existingWithSlug = await prisma.liveClass.findFirst({ where: { slug: generatedSlug } });
    if (existingWithSlug) {
      generatedSlug = `${generatedSlug}-${Date.now().toString().slice(-4)}`;
    }

    const scheduledDate = new Date(scheduledAt);
    const duration = parseInt(durationMinutes, 10) || 60;
    const scheduledEndAt = new Date(scheduledDate.getTime() + duration * 60000);

    // 1. Create LiveClass
    const newClass = await prisma.liveClass.create({
      data: {
        title: cleanTitle,
        slug: generatedSlug,
        courseId: courseId || null,
        batchId: batchId || null,
        subject: subject?.trim() || null,
        chapter: chapter?.trim() || null,
        topic: topic?.trim() || null,
        instructor: instructor?.trim() || 'Atul Agrahari',
        description: description?.trim() || null,
        thumbnail: thumbnail?.trim() || null,
        classType: classType || 'REGULAR',
        language: language || 'HINDI',
        scheduledAt: scheduledDate,
        scheduledEndAt,
        durationMinutes: duration,
        timezone: timezone || 'Asia/Kolkata',
        status: 'SCHEDULED',
        accessType: accessType || 'PUBLIC',
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true,
        createdBy: req.user!.id,
        quizId: quizId || null,
      },
    });

    // 2. Initialize Streaming Session via StreamingProvider
    const streamCreds = await streamingProvider.createStream(newClass.id, newClass.title);
    await prisma.liveSession.create({
      data: {
        liveClassId: newClass.id,
        streamProvider: 'CUSTOM_RTMP',
        providerStreamId: streamCreds.providerStreamId,
        streamKey: streamCreds.streamKey,
        rtmpIngestUrl: streamCreds.rtmpIngestUrl,
        hlsPlaybackUrl: streamCreds.hlsPlaybackUrl,
        streamStatus: 'IDLE',
      },
    });

    // 3. Attach resources if passed
    if (Array.isArray(resources) && resources.length > 0) {
      for (const resItem of resources) {
        if (resItem.title && resItem.fileUrl) {
          await prisma.classResource.create({
            data: {
              liveClassId: newClass.id,
              title: resItem.title.trim(),
              resourceType: resItem.resourceType || 'NOTES',
              fileUrl: resItem.fileUrl.trim(),
              fileAssetId: resItem.fileAssetId || null,
              fileSize: resItem.fileSize || '1.0 MB',
              isPublished: true,
            },
          });
        }
      }
    }

    // 4. Log Audit Action
    await prisma.liveAuditLog.create({
      data: {
        liveClassId: newClass.id,
        userId: req.user!.id,
        action: 'CREATED_CLASS',
        details: JSON.stringify({ title: newClass.title, scheduledAt: newClass.scheduledAt }),
      },
    });

    // 5. Broadcast Notification if requested (Phase 15 / 37)
    if (notifyStudents) {
      try {
        await prisma.notification.create({
          data: {
            title: `🔴 New Live Class Scheduled: ${cleanTitle}`,
            message: `Join ${newClass.instructor} on ${scheduledDate.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}.`,
            category: 'COURSE',
            priority: 'HIGH',
            linkUrl: `/live/${newClass.slug}`,
            status: 'PUBLISHED',
          },
        });
      } catch (notifErr) {
        console.warn('Failed to publish notification:', notifErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Live class scheduled successfully with OBS stream credentials generated.',
      liveClass: newClass,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/live-classes/:id/stream-config
 * ADMIN ONLY: Retrieve OBS Studio RTMP server and Stream Key (Phase 4)
 */
router.get('/:id/stream-config', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    let session = await prisma.liveSession.findFirst({
      where: { liveClassId: id },
      orderBy: { createdAt: 'desc' },
    });

    // If no session exists, generate one automatically
    if (!session) {
      const liveClass = await prisma.liveClass.findUnique({ where: { id } });
      if (!liveClass) {
        res.status(404).json({ success: false, message: 'Class not found' });
        return;
      }
      const streamCreds = await streamingProvider.createStream(id, liveClass.title);
      session = await prisma.liveSession.create({
        data: {
          liveClassId: id,
          streamProvider: 'CUSTOM_RTMP',
          providerStreamId: streamCreds.providerStreamId,
          streamKey: streamCreds.streamKey,
          rtmpIngestUrl: streamCreds.rtmpIngestUrl,
          hlsPlaybackUrl: streamCreds.hlsPlaybackUrl,
          streamStatus: 'IDLE',
        },
      });
    }

    res.json({
      success: true,
      streamConfig: {
        rtmpServer: session.rtmpIngestUrl,
        streamKey: session.streamKey,
        hlsPlaybackUrl: session.hlsPlaybackUrl,
        streamStatus: session.streamStatus,
        instructions: {
          service: 'Custom',
          server: session.rtmpIngestUrl,
          streamKey: session.streamKey,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/live-classes/:id/rotate-stream-key
 * ADMIN ONLY: Regenerate OBS stream key
 */
router.post('/:id/rotate-stream-key', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const session = await prisma.liveSession.findFirst({
      where: { liveClassId: id },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      res.status(404).json({ success: false, message: 'No live session found to rotate' });
      return;
    }

    const rotated = await streamingProvider.rotateStreamKey(session.providerStreamId || `stream_${id}`);

    const updatedSession = await prisma.liveSession.update({
      where: { id: session.id },
      data: {
        streamKey: rotated.streamKey,
        rtmpIngestUrl: rotated.rtmpIngestUrl,
        hlsPlaybackUrl: rotated.hlsPlaybackUrl,
      },
    });

    await prisma.liveAuditLog.create({
      data: {
        liveClassId: id,
        userId: req.user!.id,
        action: 'REGENERATED_STREAM_KEY',
      },
    });

    res.json({
      success: true,
      message: 'Stream key rotated successfully. Invalidate old OBS session.',
      streamConfig: {
        rtmpServer: updatedSession.rtmpIngestUrl,
        streamKey: updatedSession.streamKey,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/live-classes/:id/start
 * ADMIN ONLY: Start broadcasting live
 */
router.post('/:id/start', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const [updatedClass, updatedSession] = await prisma.$transaction([
      prisma.liveClass.update({
        where: { id },
        data: { status: 'LIVE' },
      }),
      prisma.liveSession.updateMany({
        where: { liveClassId: id },
        data: {
          streamStatus: 'LIVE',
          actualStartedAt: new Date(),
        },
      }),
    ]);

    await prisma.liveAuditLog.create({
      data: {
        liveClassId: id,
        userId: req.user!.id,
        action: 'STARTED',
      },
    });

    if (io) {
      io.to(`liveClass:${id}`).emit('live:status_change', { status: 'LIVE' });
    }

    res.json({ success: true, message: 'Class is now LIVE!', liveClass: updatedClass });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/live-classes/:id/interrupted
 * ADMIN ONLY: Mark connection issue / temporary interrupt
 */
router.post('/:id/interrupted', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    await prisma.liveClass.update({
      where: { id },
      data: { status: 'STREAM_INTERRUPTED' },
    });

    if (io) {
      io.to(`liveClass:${id}`).emit('live:status_change', { status: 'STREAM_INTERRUPTED' });
    }

    res.json({ success: true, message: 'Stream marked as interrupted.' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/live-classes/:id/end
 * ADMIN ONLY: End live broadcast
 */
router.post('/:id/end', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const [updatedClass] = await prisma.$transaction([
      prisma.liveClass.update({
        where: { id },
        data: { status: 'ENDED' },
      }),
      prisma.liveSession.updateMany({
        where: { liveClassId: id },
        data: {
          streamStatus: 'ENDED',
          actualEndedAt: new Date(),
          recordingStatus: 'PROCESSING',
        },
      }),
    ]);

    await prisma.liveAuditLog.create({
      data: {
        liveClassId: id,
        userId: req.user!.id,
        action: 'ENDED',
      },
    });

    if (io) {
      io.to(`liveClass:${id}`).emit('live:status_change', { status: 'ENDED' });
    }

    res.json({ success: true, message: 'Live class session ended.', liveClass: updatedClass });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/live-classes/:id/convert-to-recording
 * ADMIN ONLY: Automatically link or convert recording into RecordedClass (Phase 13 & 14)
 */
router.post('/:id/convert-to-recording', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { chapterTitle, recordingUrl } = req.body;

    const liveClass = await prisma.liveClass.findUnique({
      where: { id },
      include: {
        resources: true,
        sessions: { take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!liveClass) {
      res.status(404).json({ success: false, message: 'Live class not found.' });
      return;
    }

    if (!liveClass.courseId) {
      res.status(400).json({ success: false, message: 'Class must be linked to a Course to generate a Recorded Lecture.' });
      return;
    }

    const videoUrl = recordingUrl || liveClass.sessions[0]?.hlsPlaybackUrl || liveClass.meetingUrl || '';

    // Create RecordedClass entity
    const recorded = await prisma.recordedClass.create({
      data: {
        courseId: liveClass.courseId,
        title: liveClass.title,
        chapter: chapterTitle || liveClass.chapter || 'Chapter 1',
        durationMinutes: liveClass.durationMinutes || 45,
        videoUrl,
        thumbnail: liveClass.thumbnail,
        description: liveClass.description,
        isPublished: true,
        quizId: liveClass.quizId || null,
      },
    });

    // Link resources from live class to recorded lecture
    for (const resItem of liveClass.resources) {
      await prisma.classResource.create({
        data: {
          recordedClassId: recorded.id,
          title: resItem.title,
          resourceType: resItem.resourceType,
          fileUrl: resItem.fileUrl,
          fileAssetId: resItem.fileAssetId,
          fileSize: resItem.fileSize,
          isPublished: true,
        },
      });
    }

    // Update LiveClass status to COMPLETED & link recordedClassId
    await prisma.liveClass.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        recordedClassId: recorded.id,
      },
    });

    await prisma.liveAuditLog.create({
      data: {
        liveClassId: id,
        userId: req.user!.id,
        action: 'RECORDING_PUBLISHED',
        details: JSON.stringify({ recordedClassId: recorded.id }),
      },
    });

    res.json({
      success: true,
      message: 'Live class converted into official Recorded Lecture successfully!',
      recordedClass: recorded,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/live-classes/:id/analytics
 * ADMIN ONLY: Detailed attendee attendance, watch time, completion %, doubts asked
 */
router.get('/:id/analytics', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const liveClass = await prisma.liveClass.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true } },
        sessions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!liveClass) {
      res.status(404).json({ success: false, message: 'Class not found' });
      return;
    }

    const attendances = await prisma.liveAttendance.findMany({
      where: { liveClassId: id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { totalWatchSeconds: 'desc' },
    });

    const [chatCount, questionCount, pollCount] = await Promise.all([
      prisma.liveChatMessage.count({ where: { liveClassId: id } }),
      prisma.liveQuestion.count({ where: { liveClassId: id } }),
      prisma.livePoll.count({ where: { liveClassId: id } }),
    ]);

    const totalJoined = attendances.length;
    const totalWatchSeconds = attendances.reduce((acc, curr) => acc + curr.totalWatchSeconds, 0);
    const avgWatchMinutes = totalJoined > 0 ? Math.round(totalWatchSeconds / totalJoined / 60) : 0;
    const avgCompletion =
      totalJoined > 0
        ? Math.round(attendances.reduce((acc, curr) => acc + curr.completionPercentage, 0) / totalJoined)
        : 0;

    const session = liveClass.sessions[0];
    const peakViewers = session?.peakViewers || totalJoined;

    res.json({
      success: true,
      analytics: {
        liveClass,
        totalJoined,
        peakViewers,
        avgWatchMinutes,
        avgCompletion,
        chatCount,
        questionCount,
        pollCount,
        attendances,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/live-classes/:id/resources (Attach Study Resource)
 */
router.post('/:id/resources', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, resourceType, fileUrl, fileAssetId, fileSize } = req.body;

    if (!title || !fileUrl) {
      res.status(400).json({ success: false, message: 'Title and fileUrl are required' });
      return;
    }

    const resource = await prisma.classResource.create({
      data: {
        liveClassId: id,
        title: title.trim(),
        resourceType: resourceType || 'NOTES',
        fileUrl: fileUrl.trim(),
        fileAssetId: fileAssetId || null,
        fileSize: fileSize || '1.0 MB',
        isPublished: true,
      },
    });

    res.status(201).json({ success: true, resource });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/live-classes/:id (Update class)
 */
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      courseId,
      instructor,
      description,
      scheduledAt,
      durationMinutes,
      status,
      thumbnail,
      accessType,
      subject,
      chapter,
      topic,
      classType,
      language,
      quizId,
    } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (courseId !== undefined) updateData.courseId = courseId || null;
    if (instructor !== undefined) updateData.instructor = instructor.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (scheduledAt !== undefined) updateData.scheduledAt = new Date(scheduledAt);
    if (durationMinutes !== undefined) updateData.durationMinutes = parseInt(durationMinutes, 10) || 60;
    if (status !== undefined) updateData.status = status;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail ? thumbnail.trim() : null;
    if (accessType !== undefined) updateData.accessType = accessType;
    if (subject !== undefined) updateData.subject = subject ? subject.trim() : null;
    if (chapter !== undefined) updateData.chapter = chapter ? chapter.trim() : null;
    if (topic !== undefined) updateData.topic = topic ? topic.trim() : null;
    if (classType !== undefined) updateData.classType = classType;
    if (language !== undefined) updateData.language = language;
    if (quizId !== undefined) updateData.quizId = quizId || null;

    const updated = await prisma.liveClass.update({
      where: { id },
      data: updateData,
    });

    await prisma.liveAuditLog.create({
      data: {
        liveClassId: id,
        userId: req.user!.id,
        action: 'EDITED_CLASS',
        details: JSON.stringify(updateData),
      },
    });

    res.json({ success: true, message: 'Live class updated successfully.', liveClass: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/live-classes/:id
 */
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    await prisma.liveClass.delete({ where: { id } });
    res.json({ success: true, message: 'Live class deleted.' });
  } catch (error) {
    next(error);
  }
});

export default router;
