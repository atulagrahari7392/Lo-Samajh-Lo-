-- Migration: 20260917000000_add_ncert_official_books
-- CreateTable ncert_books
CREATE TABLE IF NOT EXISTS "ncert_books" (
    "id" TEXT NOT NULL,
    "classNumber" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "bookName" TEXT NOT NULL,
    "bookNameHi" TEXT,
    "slug" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'English',
    "medium" TEXT NOT NULL DEFAULT 'English',
    "edition" TEXT DEFAULT 'Rationalised Edition 2025-26',
    "academicYear" TEXT DEFAULT '2025-26',
    "bookCode" TEXT,
    "coverImageUrl" TEXT,
    "officialPageUrl" TEXT NOT NULL DEFAULT 'https://ncert.nic.in/textbook.php',
    "officialPdfUrl" TEXT NOT NULL,
    "chapterCount" INTEGER NOT NULL DEFAULT 0,
    "chaptersJson" TEXT,
    "sourceName" TEXT NOT NULL DEFAULT 'NCERT',
    "sourceType" TEXT NOT NULL DEFAULT 'OFFICIAL',
    "sourceVerifiedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "downloadsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ncert_books_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ncert_books_slug_key" ON "ncert_books"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ncert_books_classNumber_subject_idx" ON "ncert_books"("classNumber", "subject");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ncert_books_medium_idx" ON "ncert_books"("medium");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ncert_books_isActive_idx" ON "ncert_books"("isActive");
