import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'losamajhlo_jwt_secret_token_2026_super_secure';

interface SocketUser {
  id: string;
  name: string;
  email?: string;
  role: string;
}

// In-memory room state tracking
interface RoomState {
  viewerSocketIds: Set<string>;
  peakViewers: number;
  isChatPaused: boolean;
  isSlowMode: boolean;
  slowModeSeconds: number;
  mutedUserIds: Set<string>;
}

const roomStates = new Map<string, RoomState>();
const userLastMessageTime = new Map<string, number>();

function getOrCreateRoomState(classId: string): RoomState {
  let state = roomStates.get(classId);
  if (!state) {
    state = {
      viewerSocketIds: new Set(),
      peakViewers: 0,
      isChatPaused: false,
      isSlowMode: false,
      slowModeSeconds: 5,
      mutedUserIds: new Set(),
    };
    roomStates.set(classId, state);
  }
  return state;
}

export let io: Server;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, name: true, email: true, role: true, isActive: true },
          });
          if (user && user.isActive) {
            socket.data.user = {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
            return next();
          }
        } catch {
          // Token invalid, fall through to guest
        }
      }

      // Guest access fallback (read-only / student with guest tag)
      socket.data.user = {
        id: `guest_${socket.id.slice(0, 8)}`,
        name: 'Guest Student',
        role: 'GUEST',
      };
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user: SocketUser = socket.data.user;
    let currentClassId: string | null = null;

    // Join Live Class Room
    socket.on('live:join', async (data: { classId: string; deviceInfo?: string }) => {
      try {
        const { classId, deviceInfo } = data;
        if (!classId) return;

        currentClassId = classId;
        socket.join(`liveClass:${classId}`);

        const roomState = getOrCreateRoomState(classId);
        roomState.viewerSocketIds.add(socket.id);
        const currentViewerCount = roomState.viewerSocketIds.size;
        if (currentViewerCount > roomState.peakViewers) {
          roomState.peakViewers = currentViewerCount;
        }

        // Broadcast updated viewer count to room
        io.to(`liveClass:${classId}`).emit('live:viewer_count', {
          count: currentViewerCount,
          peak: roomState.peakViewers,
        });

        // If authenticated user, record attendance entry
        if (user.role !== 'GUEST') {
          try {
            await prisma.liveAttendance.upsert({
              where: {
                userId_liveClassId: {
                  userId: user.id,
                  liveClassId: classId,
                },
              },
              update: {
                lastSeenAt: new Date(),
                reconnectCount: { increment: 1 },
                deviceInfo: deviceInfo || 'Web Browser',
              },
              create: {
                userId: user.id,
                liveClassId: classId,
                joinedAt: new Date(),
                lastSeenAt: new Date(),
                deviceInfo: deviceInfo || 'Web Browser',
              },
            });
          } catch (attErr) {
            console.warn('Attendance record error:', attErr);
          }
        }

        // Send current room state back to user
        socket.emit('live:room_state', {
          viewerCount: currentViewerCount,
          isChatPaused: roomState.isChatPaused,
          isSlowMode: roomState.isSlowMode,
          isMuted: roomState.mutedUserIds.has(user.id),
        });
      } catch (err: any) {
        socket.emit('live:error', { message: err.message });
      }
    });

    // Heartbeat for attendance aggregation
    socket.on('live:heartbeat', async (data: { classId: string; secondsWatched?: number }) => {
      try {
        const classId = data.classId || currentClassId;
        if (!classId) return;

        const roomState = getOrCreateRoomState(classId);
        roomState.viewerSocketIds.add(socket.id);

        if (user.role !== 'GUEST') {
          const deltaSeconds = Math.min(Math.max(data.secondsWatched || 25, 5), 60);
          try {
            const att = await prisma.liveAttendance.findUnique({
              where: {
                userId_liveClassId: {
                  userId: user.id,
                  liveClassId: classId,
                },
              },
              select: { id: true, totalWatchSeconds: true },
            });

            if (att) {
              const newTotal = att.totalWatchSeconds + deltaSeconds;
              // Fetch class expected duration
              const liveClass = await prisma.liveClass.findUnique({
                where: { id: classId },
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
          } catch (e) {
            // Heartbeat update safe ignore
          }
        }
      } catch {
        // Safe heartbeat ignore
      }
    });

    // Real-time Chat
    socket.on('chat:send', async (data: { classId: string; message: string }) => {
      try {
        const { classId, message } = data;
        if (!classId || !message?.trim()) return;

        const roomState = getOrCreateRoomState(classId);

        // Check if chat is paused
        if (roomState.isChatPaused && user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') {
          socket.emit('chat:error', { message: 'Chat is temporarily paused by the instructor.' });
          return;
        }

        // Check if user is muted
        if (roomState.mutedUserIds.has(user.id)) {
          socket.emit('chat:error', { message: 'You have been muted from sending messages in this live class.' });
          return;
        }

        // Anti-spam / Slow Mode Rate Limiting
        const now = Date.now();
        const lastTime = userLastMessageTime.get(user.id) || 0;
        const cooldownMs = roomState.isSlowMode ? roomState.slowModeSeconds * 1000 : 1500;

        if (now - lastTime < cooldownMs && user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') {
          const waitSec = Math.ceil((cooldownMs - (now - lastTime)) / 1000);
          socket.emit('chat:error', { message: `Please wait ${waitSec}s before sending another message.` });
          return;
        }
        userLastMessageTime.set(user.id, now);

        // Basic XSS sanitization
        const cleanMsg = message.trim().slice(0, 500);

        // Persist message
        const chatEntry = await prisma.liveChatMessage.create({
          data: {
            liveClassId: classId,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            message: cleanMsg,
          },
        });

        // Broadcast to room
        io.to(`liveClass:${classId}`).emit('chat:new', {
          id: chatEntry.id,
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          message: cleanMsg,
          isPinned: false,
          createdAt: chatEntry.createdAt.toISOString(),
        });
      } catch (err: any) {
        socket.emit('chat:error', { message: 'Failed to deliver message' });
      }
    });

    // Chat Moderation: Delete message
    socket.on('chat:delete', async (data: { classId: string; messageId: string }) => {
      try {
        if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') return;
        const { classId, messageId } = data;

        await prisma.liveChatMessage.update({
          where: { id: messageId },
          data: { status: 'DELETED' },
        });

        io.to(`liveClass:${classId}`).emit('chat:deleted', { messageId });
      } catch (err: any) {
        socket.emit('live:error', { message: err.message });
      }
    });

    // Chat Moderation: Pin message
    socket.on('chat:pin', async (data: { classId: string; messageId: string; isPinned: boolean }) => {
      try {
        if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') return;
        const { classId, messageId, isPinned } = data;

        const updated = await prisma.liveChatMessage.update({
          where: { id: messageId },
          data: { isPinned },
        });

        io.to(`liveClass:${classId}`).emit('chat:pinned', {
          messageId,
          isPinned: updated.isPinned,
          message: updated.message,
          userName: updated.userName,
        });
      } catch (err: any) {
        socket.emit('live:error', { message: err.message });
      }
    });

    // Chat Moderation: Pause/Resume or Slow Mode toggle
    socket.on('chat:mode', (data: { classId: string; isChatPaused?: boolean; isSlowMode?: boolean; slowModeSeconds?: number }) => {
      if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') return;
      const { classId, isChatPaused, isSlowMode, slowModeSeconds } = data;
      const roomState = getOrCreateRoomState(classId);

      if (isChatPaused !== undefined) roomState.isChatPaused = isChatPaused;
      if (isSlowMode !== undefined) roomState.isSlowMode = isSlowMode;
      if (slowModeSeconds !== undefined) roomState.slowModeSeconds = slowModeSeconds;

      io.to(`liveClass:${classId}`).emit('chat:settings', {
        isChatPaused: roomState.isChatPaused,
        isSlowMode: roomState.isSlowMode,
        slowModeSeconds: roomState.slowModeSeconds,
      });
    });

    // Chat Moderation: Mute user
    socket.on('chat:mute_user', (data: { classId: string; targetUserId: string; mute: boolean }) => {
      if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') return;
      const { classId, targetUserId, mute } = data;
      const roomState = getOrCreateRoomState(classId);

      if (mute) {
        roomState.mutedUserIds.add(targetUserId);
      } else {
        roomState.mutedUserIds.delete(targetUserId);
      }

      io.to(`liveClass:${classId}`).emit('chat:user_muted', {
        userId: targetUserId,
        isMuted: mute,
      });
    });

    // Q&A / Ask Doubt
    socket.on('question:ask', async (data: { classId: string; question: string }) => {
      try {
        const { classId, question } = data;
        if (!classId || !question?.trim()) return;

        const newQ = await prisma.liveQuestion.create({
          data: {
            liveClassId: classId,
            userId: user.id,
            userName: user.name,
            question: question.trim().slice(0, 500),
          },
        });

        io.to(`liveClass:${classId}`).emit('question:new', newQ);
      } catch (err: any) {
        socket.emit('live:error', { message: err.message });
      }
    });

    // Upvote Question
    socket.on('question:upvote', async (data: { classId: string; questionId: string }) => {
      try {
        const { classId, questionId } = data;
        const updated = await prisma.liveQuestion.update({
          where: { id: questionId },
          data: { upvotes: { increment: 1 } },
        });

        io.to(`liveClass:${classId}`).emit('question:updated', updated);
      } catch (err: any) {
        socket.emit('live:error', { message: err.message });
      }
    });

    // Answer / Pin / Dismiss Question
    socket.on('question:moderate', async (data: {
      classId: string;
      questionId: string;
      status?: string;
      answer?: string;
    }) => {
      try {
        if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') return;
        const { classId, questionId, status, answer } = data;

        const updateData: any = {};
        if (status) updateData.status = status;
        if (answer !== undefined) {
          updateData.answer = answer.trim();
          updateData.answeredBy = user.name;
          updateData.answeredAt = new Date();
          updateData.status = 'ANSWERED';
        }

        const updated = await prisma.liveQuestion.update({
          where: { id: questionId },
          data: updateData,
        });

        io.to(`liveClass:${classId}`).emit('question:updated', updated);
      } catch (err: any) {
        socket.emit('live:error', { message: err.message });
      }
    });

    // Live Polls: Launch, Vote, End
    socket.on('poll:start', async (data: {
      classId: string;
      question: string;
      options: string[];
      multipleChoice?: boolean;
    }) => {
      try {
        if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') return;
        const { classId, question, options, multipleChoice } = data;

        // End any active poll in this class first
        await prisma.livePoll.updateMany({
          where: { liveClassId: classId, status: 'LIVE' },
          data: { status: 'ENDED', endedAt: new Date() },
        });

        const poll = await prisma.livePoll.create({
          data: {
            liveClassId: classId,
            question: question.trim(),
            status: 'LIVE',
            multipleChoice: Boolean(multipleChoice),
            startedAt: new Date(),
            options: {
              create: options.map((opt, idx) => ({
                optionText: opt.trim(),
                position: idx,
                voteCount: 0,
              })),
            },
          },
          include: {
            options: { orderBy: { position: 'asc' } },
          },
        });

        io.to(`liveClass:${classId}`).emit('poll:started', poll);
      } catch (err: any) {
        socket.emit('live:error', { message: err.message });
      }
    });

    socket.on('poll:vote', async (data: { classId: string; pollId: string; optionId: string }) => {
      try {
        const { classId, pollId, optionId } = data;

        // Check if already voted
        const existing = await prisma.livePollResponse.findUnique({
          where: { pollId_userId: { pollId, userId: user.id } },
        });
        if (existing) {
          socket.emit('poll:error', { message: 'You have already voted in this poll.' });
          return;
        }

        await prisma.$transaction([
          prisma.livePollResponse.create({
            data: {
              pollId,
              optionId,
              userId: user.id,
            },
          }),
          prisma.livePollOption.update({
            where: { id: optionId },
            data: { voteCount: { increment: 1 } },
          }),
        ]);

        const poll = await prisma.livePoll.findUnique({
          where: { id: pollId },
          include: {
            options: { orderBy: { position: 'asc' } },
            _count: { select: { responses: true } },
          },
        });

        io.to(`liveClass:${classId}`).emit('poll:tally_update', poll);
      } catch (err: any) {
        socket.emit('poll:error', { message: 'Failed to record vote' });
      }
    });

    socket.on('poll:end', async (data: { classId: string; pollId: string }) => {
      try {
        if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') return;
        const { classId, pollId } = data;

        const updated = await prisma.livePoll.update({
          where: { id: pollId },
          data: { status: 'ENDED', endedAt: new Date() },
          include: { options: { orderBy: { position: 'asc' } } },
        });

        io.to(`liveClass:${classId}`).emit('poll:ended', updated);
      } catch (err: any) {
        socket.emit('live:error', { message: err.message });
      }
    });

    // Live Quiz: Launch mini-quiz / question
    socket.on('quiz:launch', (data: {
      classId: string;
      questionId?: string;
      questionText: string;
      options: string[];
      durationSeconds: number;
      correctOptionIndex?: number;
      explanation?: string;
    }) => {
      if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') return;
      const { classId, questionId, questionText, options, durationSeconds, correctOptionIndex, explanation } = data;

      // Broadcast quiz started to students (without correct answer)
      io.to(`liveClass:${classId}`).emit('quiz:started', {
        questionId: questionId || `q_${Date.now()}`,
        questionText,
        options,
        durationSeconds: durationSeconds || 30,
        expiresAt: new Date(Date.now() + (durationSeconds || 30) * 1000).toISOString(),
      });

      // After duration, reveal answer & explanation
      setTimeout(() => {
        io.to(`liveClass:${classId}`).emit('quiz:result', {
          questionId: questionId || `q_${Date.now()}`,
          correctOptionIndex,
          explanation: explanation || 'Great effort!',
        });
      }, (durationSeconds || 30) * 1000);
    });

    // Broadcast Announcement
    socket.on('announcement:send', async (data: {
      classId: string;
      message: string;
      type?: 'NORMAL' | 'PINNED' | 'URGENT';
    }) => {
      try {
        if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') return;
        const { classId, message, type } = data;

        const announcement = await prisma.liveAnnouncement.create({
          data: {
            liveClassId: classId,
            senderId: user.id,
            senderName: user.name,
            message: message.trim(),
            type: type || 'NORMAL',
          },
        });

        io.to(`liveClass:${classId}`).emit('announcement:new', announcement);
      } catch (err: any) {
        socket.emit('live:error', { message: err.message });
      }
    });

    // Stream status change
    socket.on('stream:status_change', async (data: {
      classId: string;
      status: string;
    }) => {
      try {
        if (user.role !== 'ADMIN' && user.role !== 'INSTRUCTOR') return;
        const { classId, status } = data;

        await prisma.liveClass.update({
          where: { id: classId },
          data: { status },
        });

        io.to(`liveClass:${classId}`).emit('live:status_change', { status });
      } catch (err: any) {
        socket.emit('live:error', { message: err.message });
      }
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      if (currentClassId) {
        const roomState = roomStates.get(currentClassId);
        if (roomState) {
          roomState.viewerSocketIds.delete(socket.id);
          io.to(`liveClass:${currentClassId}`).emit('live:viewer_count', {
            count: roomState.viewerSocketIds.size,
            peak: roomState.peakViewers,
          });
        }
      }
    });
  });

  return io;
}
