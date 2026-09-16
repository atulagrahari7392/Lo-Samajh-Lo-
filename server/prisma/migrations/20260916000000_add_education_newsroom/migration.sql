-- Migration: 20260916000000_add_education_newsroom
-- AlterTable notifications: add articleId and isNewsroom
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "articleId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "isNewsroom" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "notifications_publishedAt_idx" ON "notifications"("publishedAt");
CREATE INDEX IF NOT EXISTS "notifications_articleId_idx" ON "notifications"("articleId");

-- CreateTable education_articles
CREATE TABLE IF NOT EXISTS "education_articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'COMPETITIVE_EXAMS',
    "subCategory" TEXT,
    "organizationName" TEXT NOT NULL,
    "state" TEXT DEFAULT 'Uttar Pradesh',
    "examName" TEXT NOT NULL,
    "examCode" TEXT,
    "notificationNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "confidenceScore" TEXT NOT NULL DEFAULT 'HIGH',
    "authorType" TEXT NOT NULL DEFAULT 'AI',
    "seoTitle" TEXT,
    "metaDescription" TEXT,
    "focusKeyword" TEXT,
    "secondaryKeywords" TEXT,
    "canonicalUrl" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "faqData" TEXT,
    "structuredInfo" TEXT,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_articles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "education_articles_slug_key" ON "education_articles"("slug");
CREATE INDEX IF NOT EXISTS "education_articles_status_publishedAt_idx" ON "education_articles"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "education_articles_organizationName_idx" ON "education_articles"("organizationName");
CREATE INDEX IF NOT EXISTS "education_articles_examName_idx" ON "education_articles"("examName");
CREATE INDEX IF NOT EXISTS "education_articles_category_idx" ON "education_articles"("category");

-- CreateTable important_dates
CREATE TABLE IF NOT EXISTS "important_dates" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dateType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "source" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'HIGH',
    "note" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "important_dates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "important_dates_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "education_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "important_dates_articleId_date_idx" ON "important_dates"("articleId", "date");

-- CreateTable important_links
CREATE TABLE IF NOT EXISTS "important_links" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "source" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT true,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "important_links_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "important_links_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "education_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "important_links_articleId_idx" ON "important_links"("articleId");

-- CreateTable article_sources
CREATE TABLE IF NOT EXISTS "article_sources" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'OFFICIAL',
    "authorityLevel" TEXT NOT NULL DEFAULT 'PRIMARY',
    "publishedAt" TIMESTAMP(3),
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_sources_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "article_sources_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "education_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "article_sources_url_idx" ON "article_sources"("url");

-- CreateTable syllabus_sections
CREATE TABLE IF NOT EXISTS "syllabus_sections" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopics" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "syllabus_sections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "syllabus_sections_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "education_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "syllabus_sections_articleId_idx" ON "syllabus_sections"("articleId");

-- CreateTable article_versions
CREATE TABLE IF NOT EXISTS "article_versions" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "changedFields" TEXT NOT NULL,
    "previousData" TEXT,
    "newData" TEXT,
    "updateReason" TEXT NOT NULL,
    "source" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_versions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "article_versions_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "education_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "article_versions_articleId_versionNumber_idx" ON "article_versions"("articleId", "versionNumber");

-- CreateTable newsroom_research_jobs
CREATE TABLE IF NOT EXISTS "newsroom_research_jobs" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL DEFAULT 'MANUAL_RESEARCH',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "query" TEXT,
    "category" TEXT,
    "organization" TEXT,
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "newsroom_research_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "newsroom_research_jobs_status_idx" ON "newsroom_research_jobs"("status");

-- CreateTable ai_usage_logs
CREATE TABLE IF NOT EXISTS "ai_usage_logs" (
    "id" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "executionTimeMs" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "error" TEXT,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ai_usage_logs_createdAt_idx" ON "ai_usage_logs"("createdAt");

-- CreateTable newsroom_settings
CREATE TABLE IF NOT EXISTS "newsroom_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsroom_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "newsroom_settings_key_key" ON "newsroom_settings"("key");

-- CreateTable newsroom_audit_logs
CREATE TABLE IF NOT EXISTS "newsroom_audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "articleId" TEXT,
    "actor" TEXT NOT NULL DEFAULT 'SYSTEM',
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newsroom_audit_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "newsroom_audit_logs_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "education_articles"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "newsroom_audit_logs_articleId_idx" ON "newsroom_audit_logs"("articleId");
CREATE INDEX IF NOT EXISTS "newsroom_audit_logs_createdAt_idx" ON "newsroom_audit_logs"("createdAt");
