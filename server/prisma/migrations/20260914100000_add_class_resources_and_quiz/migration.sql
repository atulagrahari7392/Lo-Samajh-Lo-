-- AlterTable
ALTER TABLE "recorded_classes" ADD COLUMN IF NOT EXISTS "quizId" TEXT;

-- AlterTable
ALTER TABLE "course_lessons" ADD COLUMN IF NOT EXISTS "quizId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "class_resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL DEFAULT 'NOTES',
    "fileUrl" TEXT NOT NULL,
    "fileAssetId" TEXT,
    "fileSize" TEXT DEFAULT '1.0 MB',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "courseLessonId" TEXT,
    "recordedClassId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "class_resources_courseLessonId_idx" ON "class_resources"("courseLessonId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "class_resources_recordedClassId_idx" ON "class_resources"("recordedClassId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recorded_classes_quizId_fkey') THEN
        ALTER TABLE "recorded_classes" ADD CONSTRAINT "recorded_classes_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_lessons_quizId_fkey') THEN
        ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "tests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_resources_courseLessonId_fkey') THEN
        ALTER TABLE "class_resources" ADD CONSTRAINT "class_resources_courseLessonId_fkey" FOREIGN KEY ("courseLessonId") REFERENCES "course_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_resources_recordedClassId_fkey') THEN
        ALTER TABLE "class_resources" ADD CONSTRAINT "class_resources_recordedClassId_fkey" FOREIGN KEY ("recordedClassId") REFERENCES "recorded_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_resources_fileAssetId_fkey') THEN
        ALTER TABLE "class_resources" ADD CONSTRAINT "class_resources_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
