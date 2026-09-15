-- AlterTable live_classes: add new columns safely
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "batchId" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "subject" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "chapter" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "topic" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "teacherId" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "thumbnailAssetId" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "classType" TEXT NOT NULL DEFAULT 'REGULAR';
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'HINDI';
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "scheduledEndAt" TIMESTAMP(3);
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "accessType" TEXT NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "recordedClassId" TEXT;
ALTER TABLE "live_classes" ADD COLUMN IF NOT EXISTS "quizId" TEXT;

-- Unique index on live_classes.slug
CREATE UNIQUE INDEX IF NOT EXISTS "live_classes_slug_key" ON "live_classes"("slug");
CREATE INDEX IF NOT EXISTS "live_classes_status_idx" ON "live_classes"("status");
CREATE INDEX IF NOT EXISTS "live_classes_scheduledAt_idx" ON "live_classes"("scheduledAt");
CREATE INDEX IF NOT EXISTS "live_classes_courseId_idx" ON "live_classes"("courseId");
CREATE INDEX IF NOT EXISTS "live_classes_teacherId_idx" ON "live_classes"("teacherId");

-- AlterTable class_resources
ALTER TABLE "class_resources" ADD COLUMN IF NOT EXISTS "liveClassId" TEXT;
CREATE INDEX IF NOT EXISTS "class_resources_liveClassId_idx" ON "class_resources"("liveClassId");

-- CreateTable live_sessions
CREATE TABLE IF NOT EXISTS "live_sessions" (
    "id" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "streamProvider" TEXT NOT NULL DEFAULT 'CUSTOM_RTMP',
    "providerStreamId" TEXT,
    "streamKey" TEXT,
    "rtmpIngestUrl" TEXT,
    "hlsPlaybackUrl" TEXT,
    "streamStatus" TEXT NOT NULL DEFAULT 'IDLE',
    "actualStartedAt" TIMESTAMP(3),
    "actualEndedAt" TIMESTAMP(3),
    "peakViewers" INTEGER NOT NULL DEFAULT 0,
    "totalUniqueViewers" INTEGER NOT NULL DEFAULT 0,
    "recordingStatus" TEXT NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "live_sessions_liveClassId_idx" ON "live_sessions"("liveClassId");
CREATE INDEX IF NOT EXISTS "live_sessions_streamStatus_idx" ON "live_sessions"("streamStatus");

-- CreateTable live_attendances
CREATE TABLE IF NOT EXISTS "live_attendances" (
    "id" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "liveSessionId" TEXT,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalWatchSeconds" INTEGER NOT NULL DEFAULT 0,
    "reconnectCount" INTEGER NOT NULL DEFAULT 0,
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_attendances_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "live_attendances_userId_liveClassId_key" ON "live_attendances"("userId", "liveClassId");
CREATE INDEX IF NOT EXISTS "live_attendances_liveClassId_idx" ON "live_attendances"("liveClassId");
CREATE INDEX IF NOT EXISTS "live_attendances_lastSeenAt_idx" ON "live_attendances"("lastSeenAt");

-- CreateTable live_chat_messages
CREATE TABLE IF NOT EXISTS "live_chat_messages" (
    "id" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "liveSessionId" TEXT,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" TEXT NOT NULL DEFAULT 'USER',
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VISIBLE',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_chat_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "live_chat_messages_liveClassId_createdAt_idx" ON "live_chat_messages"("liveClassId", "createdAt");

-- CreateTable live_questions
CREATE TABLE IF NOT EXISTS "live_questions" (
    "id" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "liveSessionId" TEXT,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "answer" TEXT,
    "answeredBy" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_questions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "live_questions_liveClassId_status_idx" ON "live_questions"("liveClassId", "status");
CREATE INDEX IF NOT EXISTS "live_questions_liveClassId_createdAt_idx" ON "live_questions"("liveClassId", "createdAt");

-- CreateTable live_polls
CREATE TABLE IF NOT EXISTS "live_polls" (
    "id" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "liveSessionId" TEXT,
    "question" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "multipleChoice" BOOLEAN NOT NULL DEFAULT false,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "showResults" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_polls_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "live_polls_liveClassId_status_idx" ON "live_polls"("liveClassId", "status");

-- CreateTable live_poll_options
CREATE TABLE IF NOT EXISTS "live_poll_options" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isCorrect" BOOLEAN,
    "voteCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "live_poll_options_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "live_poll_options_pollId_idx" ON "live_poll_options"("pollId");

-- CreateTable live_poll_responses
CREATE TABLE IF NOT EXISTS "live_poll_responses" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_poll_responses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "live_poll_responses_pollId_userId_key" ON "live_poll_responses"("pollId", "userId");

-- CreateTable live_announcements
CREATE TABLE IF NOT EXISTS "live_announcements" (
    "id" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NORMAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_announcements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "live_announcements_liveClassId_idx" ON "live_announcements"("liveClassId");

-- CreateTable live_recordings
CREATE TABLE IF NOT EXISTS "live_recordings" (
    "id" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "liveSessionId" TEXT,
    "providerRecordingId" TEXT,
    "processingStatus" TEXT NOT NULL DEFAULT 'PROCESSING',
    "playbackUrl" TEXT,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "fileAssetId" TEXT,
    "readyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_recordings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "live_recordings_liveClassId_idx" ON "live_recordings"("liveClassId");

-- CreateTable live_audit_logs
CREATE TABLE IF NOT EXISTS "live_audit_logs" (
    "id" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "live_audit_logs_liveClassId_idx" ON "live_audit_logs"("liveClassId");

-- Add Foreign Keys safely with DO $$ BEGIN blocks
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_classes_teacherId_fkey') THEN
        ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_classes_recordedClassId_fkey') THEN
        ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_recordedClassId_fkey" FOREIGN KEY ("recordedClassId") REFERENCES "recorded_classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_classes_quizId_fkey') THEN
        ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_resources_liveClassId_fkey') THEN
        ALTER TABLE "class_resources" ADD CONSTRAINT "class_resources_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_sessions_liveClassId_fkey') THEN
        ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_attendances_liveClassId_fkey') THEN
        ALTER TABLE "live_attendances" ADD CONSTRAINT "live_attendances_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_attendances_userId_fkey') THEN
        ALTER TABLE "live_attendances" ADD CONSTRAINT "live_attendances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_chat_messages_liveClassId_fkey') THEN
        ALTER TABLE "live_chat_messages" ADD CONSTRAINT "live_chat_messages_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_chat_messages_userId_fkey') THEN
        ALTER TABLE "live_chat_messages" ADD CONSTRAINT "live_chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_questions_liveClassId_fkey') THEN
        ALTER TABLE "live_questions" ADD CONSTRAINT "live_questions_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_questions_userId_fkey') THEN
        ALTER TABLE "live_questions" ADD CONSTRAINT "live_questions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_polls_liveClassId_fkey') THEN
        ALTER TABLE "live_polls" ADD CONSTRAINT "live_polls_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_poll_options_pollId_fkey') THEN
        ALTER TABLE "live_poll_options" ADD CONSTRAINT "live_poll_options_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "live_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_poll_responses_pollId_fkey') THEN
        ALTER TABLE "live_poll_responses" ADD CONSTRAINT "live_poll_responses_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "live_polls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_poll_responses_optionId_fkey') THEN
        ALTER TABLE "live_poll_responses" ADD CONSTRAINT "live_poll_responses_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "live_poll_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_poll_responses_userId_fkey') THEN
        ALTER TABLE "live_poll_responses" ADD CONSTRAINT "live_poll_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_announcements_liveClassId_fkey') THEN
        ALTER TABLE "live_announcements" ADD CONSTRAINT "live_announcements_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_recordings_liveClassId_fkey') THEN
        ALTER TABLE "live_recordings" ADD CONSTRAINT "live_recordings_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_recordings_liveSessionId_fkey') THEN
        ALTER TABLE "live_recordings" ADD CONSTRAINT "live_recordings_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "live_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_recordings_fileAssetId_fkey') THEN
        ALTER TABLE "live_recordings" ADD CONSTRAINT "live_recordings_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'live_audit_logs_liveClassId_fkey') THEN
        ALTER TABLE "live_audit_logs" ADD CONSTRAINT "live_audit_logs_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
