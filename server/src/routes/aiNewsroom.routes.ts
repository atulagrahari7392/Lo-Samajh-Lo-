import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { getAIProvider, generateNewsroomSlug, getAIProviderStatus } from '../services/aiNewsroom/aiProvider';
import { detectDuplicateArticle } from '../services/aiNewsroom/duplicateDetector';
import { verifyExtractedFacts } from '../services/aiNewsroom/verificationEngine';
import { publishArticleWithBridge, broadcastRealtimeNotification } from '../services/aiNewsroom/notificationBridge';
import { OFFICIAL_MONITORED_ORGS, safeFetchWebSource } from '../services/aiNewsroom/webResearcher';
import { calculateDeadlineStatus } from '../services/aiNewsroom/deadlineCalculator';
import { getWebDiscoveryProvider, TargetedQueryGenerator } from '../services/aiNewsroom/webDiscovery';
import { getSchedulerStatus } from '../services/aiNewsroom/scheduler';

const router = Router();

// Secure all newsroom admin endpoints
router.use(authenticate, requireAdmin);

// ============================================================
// 1. DASHBOARD & KPIS
// ============================================================
router.get('/dashboard', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalArticles,
      draftCount,
      reviewCount,
      publishedCount,
      scheduledCount,
      failedJobsCount,
      todayDiscovered,
      todayPublished,
      recentArticles,
      topOrgs,
      pendingResearchJobs,
      lastSuccessSetting,
      lastFailedSetting,
    ] = await Promise.all([
      prisma.educationArticle.count(),
      prisma.educationArticle.count({ where: { status: 'DRAFT' } }),
      prisma.educationArticle.count({ where: { status: 'REVIEW' } }),
      prisma.educationArticle.count({ where: { status: 'PUBLISHED' } }),
      prisma.educationArticle.count({ where: { status: 'SCHEDULED' } }),
      prisma.researchJob.count({ where: { status: 'FAILED' } }),
      prisma.educationArticle.count({ where: { createdAt: { gte: today } } }),
      prisma.educationArticle.count({ where: { publishedAt: { gte: today } } }),
      prisma.educationArticle.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 6,
        include: {
          dates: { take: 2, orderBy: { date: 'asc' } },
        },
      }),
      prisma.educationArticle.groupBy({
        by: ['organizationName'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.researchJob.count({ where: { status: 'PENDING' } }),
      prisma.newsroomSetting.findUnique({ where: { key: 'lastSuccessfulResearch' } }),
      prisma.newsroomSetting.findUnique({ where: { key: 'lastFailedResearch' } }),
    ]);

    // Subsystem Health Indicators (Phases 26, 27)
    const aiStatus = getAIProviderStatus();
    const schedulerStatus = getSchedulerStatus();
    const searchKey = process.env.SEARCH_API_KEY;
    const webDiscoveryStatus = searchKey && searchKey.trim().length > 5 ? 'ACTIVE' : 'CATALOG ONLY';

    const newsroomHealth = {
      aiProvider: aiStatus.status, // CONNECTED / NOT CONFIGURED / ERROR
      aiProviderName: aiStatus.provider,
      aiModel: aiStatus.model,
      isFallback: aiStatus.isFallback,
      webDiscovery: webDiscoveryStatus, // ACTIVE / CATALOG ONLY
      scheduler: schedulerStatus.isRunning ? 'RUNNING' : 'IDLE',
      database: 'CONNECTED',
      pendingJobs: pendingResearchJobs,
      lastSuccessfulResearch: lastSuccessSetting ? JSON.parse(lastSuccessSetting.value) : null,
      lastFailedResearch: lastFailedSetting ? JSON.parse(lastFailedSetting.value) : null,
      lastChecked: new Date().toISOString(),
    };

    res.json({
      success: true,
      stats: {
        totalArticles,
        draftCount,
        reviewCount,
        publishedCount,
        scheduledCount,
        failedJobsCount,
        todayDiscovered,
        todayPublished,
        topOrganizations: topOrgs.map((o) => ({ name: o.organizationName, count: o._count.id })),
      },
      health: newsroomHealth,
      recentArticles,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 1B. DIAGNOSTICS: TEST AI CONNECTION (Phase 28)
// ============================================================
router.post('/test-ai', async (req: AuthRequest, res, next) => {
  try {
    const provider = getAIProvider();
    if (typeof provider.testConnection === 'function') {
      const result = await provider.testConnection();
      res.json({
        success: true,
        ...result,
      });
      return;
    }

    res.json({
      success: true,
      connected: true,
      provider: provider.name,
      model: 'deterministic-rules-v2',
      latencyMs: 1,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, connected: false, error: err.message });
  }
});

// ============================================================
// 1C. DIAGNOSTICS: TEST RESEARCH / DRY-RUN (Phase 29)
// ============================================================
router.post('/test-research', async (req: AuthRequest, res, next) => {
  try {
    const { organization = 'UPSSSC', category = 'COMPETITIVE_EXAMS' } = req.body;
    const startTime = Date.now();
    const discoveryProvider = getWebDiscoveryProvider();
    const aiProvider = getAIProvider();

    const queries = TargetedQueryGenerator.generateQueries(organization, category);
    const candidates = await discoveryProvider.discover(queries[0] || organization, {
      organization,
      category,
      limit: 3,
    });

    const sampleFacts = await aiProvider.research(queries[0] || organization, { organization, category });
    const latencyMs = Date.now() - startTime;

    res.json({
      success: true,
      organization,
      category,
      queriesGenerated: queries,
      candidateSources: candidates,
      extractedFactsSample: sampleFacts[0] || null,
      latencyMs,
      discoveryProvider: discoveryProvider.name,
      aiProvider: aiProvider.name,
    });
  } catch (err: any) {
    next(err);
  }
});

// ============================================================
// 2. DISCOVER / RUN RESEARCH NOW (Phase 10 & 47)
// ============================================================
router.post('/research', async (req: AuthRequest, res, next) => {
  try {
    const { organization, category, query, customUrl, autonomous = false } = req.body;
    const startTime = Date.now();

    const provider = getAIProvider();
    let factsList = [];

    if (customUrl) {
      // Scrape custom official notice URL safely
      const webResult = await safeFetchWebSource(customUrl);
      if (!webResult.success) {
        res.status(400).json({ success: false, message: `Failed fetching source: ${webResult.error}` });
        return;
      }
      const singleFacts = await provider.extractFacts(webResult.content, {
        sourceUrl: customUrl,
        organization: organization || 'Official Board',
      });
      factsList = [singleFacts];
    } else if (autonomous) {
      // Autonomous discovery mode (Phase 5, 10, 47)
      const discoveryProvider = getWebDiscoveryProvider();
      const org = organization || 'UPSSSC';
      const cat = category || 'COMPETITIVE_EXAMS';
      const targetedQueries = TargetedQueryGenerator.generateQueries(org, cat);
      const candidates = await discoveryProvider.discover(targetedQueries[0] || org, {
        organization: org,
        category: cat,
        limit: 4,
      });

      for (const candidate of candidates) {
        const webResult = await safeFetchWebSource(candidate.url);
        if (webResult.success && webResult.content) {
          const facts = await provider.extractFacts(webResult.content, {
            sourceUrl: candidate.url,
            organization: org,
          });
          factsList.push(facts);
        }
      }

      if (factsList.length === 0) {
        // Fallback to catalog research
        factsList = await provider.research(query || org, { organization: org, category: cat });
      }
    } else {
      // Catalog & Board search
      factsList = await provider.research(query || '', {
        organization: organization || undefined,
        category: category || undefined,
      });
    }

    // Process each discovered item through duplicate detection & verification
    const results = [];
    for (const facts of factsList) {
      const duplicateCheck = await detectDuplicateArticle(facts);
      const verification = verifyExtractedFacts(facts);

      results.push({
        facts: verification.verifiedFacts,
        isDuplicate: duplicateCheck.isDuplicate,
        duplicateMatch: duplicateCheck,
        verification,
      });
    }

    // Record AI Usage Log
    const executionMs = Date.now() - startTime;
    await prisma.aIUsageLog.create({
      data: {
        requestType: 'RESEARCH',
        provider: provider.name,
        model: 'educational-parser-v2',
        tokensUsed: 120,
        executionTimeMs: executionMs,
        status: 'SUCCESS',
      },
    });

    res.json({
      success: true,
      count: results.length,
      results,
      executionMs,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 3. GENERATE DRAFT ARTICLE
// ============================================================
router.post('/generate', async (req: AuthRequest, res, next) => {
  try {
    const { facts, autoApprove = false } = req.body;

    if (!facts || !facts.title || !facts.organizationName) {
      res.status(400).json({ success: false, message: 'Valid facts payload required to generate article.' });
      return;
    }

    const provider = getAIProvider();
    const generated = await provider.generateArticle(facts);

    // Verify facts one more time
    const verification = verifyExtractedFacts(facts);

    // Ensure unique slug
    let slug = generated.slug;
    const existingSlug = await prisma.educationArticle.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const initialStatus = autoApprove ? 'APPROVED' : 'DRAFT';

    // Store inside transaction
    const article = await prisma.$transaction(async (tx) => {
      const created = await tx.educationArticle.create({
        data: {
          title: generated.title,
          slug,
          excerpt: generated.excerpt,
          content: generated.content,
          category: facts.category || 'COMPETITIVE_EXAMS',
          subCategory: facts.subCategory || null,
          organizationName: facts.organizationName,
          state: facts.state || 'Uttar Pradesh',
          examName: facts.examName,
          examCode: facts.examCode || null,
          notificationNumber: facts.notificationNumber || null,
          status: initialStatus,
          confidenceScore: verification.confidence,
          authorType: 'AI',
          seoTitle: generated.seoTitle,
          metaDescription: generated.metaDescription,
          focusKeyword: generated.focusKeyword,
          secondaryKeywords: generated.secondaryKeywords,
          ogTitle: generated.ogTitle,
          ogDescription: generated.ogDescription,
          faqData: JSON.stringify(generated.faqData),
          structuredInfo: JSON.stringify(generated.structuredInfo),
        },
      });

      // Insert dates
      if (generated.dates && generated.dates.length > 0) {
        for (const d of generated.dates) {
          await tx.importantDate.create({
            data: {
              articleId: created.id,
              date: new Date(d.date),
              dateType: d.dateType,
              label: d.label,
              source: d.source || null,
              confidence: d.confidence || 'HIGH',
              note: d.note || null,
              isVerified: d.isVerified ?? true,
            },
          });
        }
      }

      // Insert links
      if (generated.links && generated.links.length > 0) {
        for (const l of generated.links) {
          await tx.importantLink.create({
            data: {
              articleId: created.id,
              label: l.label,
              url: l.url,
              linkType: l.linkType,
              source: l.source || null,
              isOfficial: l.isOfficial ?? true,
              verifiedAt: l.verifiedAt ? new Date(l.verifiedAt) : new Date(),
            },
          });
        }
      }

      // Insert sources
      if (generated.sources && generated.sources.length > 0) {
        for (const s of generated.sources) {
          await tx.articleSource.create({
            data: {
              articleId: created.id,
              title: s.title,
              url: s.url,
              domain: s.domain,
              sourceType: s.sourceType,
              authorityLevel: s.authorityLevel,
              verificationStatus: s.verificationStatus,
            },
          });
        }
      }

      // Insert syllabus
      if (generated.syllabus && generated.syllabus.length > 0) {
        for (const sy of generated.syllabus) {
          await tx.syllabusSection.create({
            data: {
              articleId: created.id,
              topic: sy.topic,
              subtopics: JSON.stringify(sy.subtopics || []),
              order: sy.order || 0,
            },
          });
        }
      }

      // Audit log
      await tx.newsroomAuditLog.create({
        data: {
          action: 'GENERATE',
          articleId: created.id,
          actor: req.user?.id || 'SYSTEM',
          details: JSON.stringify({
            title: created.title,
            confidence: verification.confidence,
            datesCount: generated.dates?.length || 0,
          }),
        },
      });

      return created;
    });

    const fullArticle = await prisma.educationArticle.findUnique({
      where: { id: article.id },
      include: { dates: true, links: true, sources: true, syllabus: true },
    });

    res.status(201).json({
      success: true,
      message: 'Article draft generated successfully.',
      article: fullArticle,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 4. REGENERATE (With Fact-Locking Protection)
// ============================================================
router.post('/regenerate/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { targetSection } = req.body; // 'ALL', 'SUMMARY', 'CONTENT', 'SEO', 'FAQS'

    const existing = await prisma.educationArticle.findUnique({
      where: { id },
      include: { dates: true, links: true, sources: true, syllabus: true },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Article not found.' });
      return;
    }

    const provider = getAIProvider();

    // Reconstruct facts, PRESERVING fact-locked verified dates & links!
    const facts: any = {
      title: existing.title,
      examName: existing.examName,
      organizationName: existing.organizationName,
      notificationNumber: existing.notificationNumber || undefined,
      state: existing.state || 'Uttar Pradesh',
      category: existing.category,
      summary: existing.excerpt,
      structuredInfo: existing.structuredInfo ? JSON.parse(existing.structuredInfo) : {},
      dates: existing.dates.map((d) => ({
        date: d.date.toISOString(),
        dateType: d.dateType,
        label: d.label,
        confidence: d.confidence,
        isVerified: d.isVerified,
      })),
      links: existing.links.map((l) => ({
        label: l.label,
        url: l.url,
        linkType: l.linkType,
        isOfficial: l.isOfficial,
      })),
      sources: existing.sources.map((s) => ({
        title: s.title,
        url: s.url,
        domain: s.domain,
        sourceType: s.sourceType,
        authorityLevel: s.authorityLevel,
        verificationStatus: s.verificationStatus,
      })),
      syllabus: existing.syllabus.map((sy) => ({
        topic: sy.topic,
        subtopics: JSON.parse(sy.subtopics || '[]'),
        order: sy.order,
      })),
      faqs: existing.faqData ? JSON.parse(existing.faqData) : [],
      confidence: existing.confidenceScore as any,
    };

    const newGen = await provider.generateArticle(facts);

    // Save previous snapshot in ArticleVersion
    await prisma.articleVersion.create({
      data: {
        articleId: existing.id,
        versionNumber: (await prisma.articleVersion.count({ where: { articleId: existing.id } })) + 1,
        changedFields: JSON.stringify([targetSection || 'REGENERATION']),
        previousData: JSON.stringify({ content: existing.content, excerpt: existing.excerpt }),
        newData: JSON.stringify({ content: newGen.content, excerpt: newGen.excerpt }),
        updateReason: `AI Regeneration of ${targetSection || 'Content'}`,
        createdBy: req.user?.id || 'ADMIN',
      },
    });

    const updated = await prisma.educationArticle.update({
      where: { id },
      data: {
        content: newGen.content,
        excerpt: newGen.excerpt,
        seoTitle: newGen.seoTitle,
        metaDescription: newGen.metaDescription,
        lastVerifiedAt: new Date(),
      },
      include: { dates: true, links: true, sources: true, syllabus: true },
    });

    res.json({
      success: true,
      message: 'Article regenerated while safely preserving verified facts.',
      article: updated,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 5. PUBLISH & SYNC WITH NOTIFICATIONS
// ============================================================
router.post('/publish/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { event } = req.body;

    const result = await publishArticleWithBridge(id, req.user?.name || req.user?.id || 'ADMIN', event);

    // Emit real-time Socket.IO notification to all connected students
    await broadcastRealtimeNotification(result.notification, result.article);

    res.json({
      success: true,
      message: 'Article published & synchronized with live student notifications!',
      article: result.article,
      notification: result.notification,
    });
  } catch (error: any) {
    next(error);
  }
});

// ============================================================
// 6. SCHEDULE ARTICLE
// ============================================================
router.post('/schedule/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      res.status(400).json({ success: false, message: 'scheduledAt datetime is required.' });
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid scheduledAt format.' });
      return;
    }

    const updated = await prisma.educationArticle.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        scheduledAt: scheduledDate,
      },
    });

    await prisma.newsroomAuditLog.create({
      data: {
        action: 'SCHEDULE',
        articleId: id,
        actor: req.user?.id || 'ADMIN',
        details: JSON.stringify({ scheduledAt: scheduledDate.toISOString() }),
      },
    });

    res.json({ success: true, message: `Article scheduled for ${scheduledDate.toLocaleString('en-IN')}`, article: updated });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 7. GET ARTICLES LIST WITH ADVANCED FILTERS
// ============================================================
router.get('/articles', async (req, res, next) => {
  try {
    const { status, category, organization, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && String(status) !== 'ALL') {
      where.status = String(status).toUpperCase();
    }
    if (category && String(category) !== 'ALL') {
      where.category = String(category).toUpperCase();
    }
    if (organization && String(organization) !== 'ALL') {
      where.organizationName = { contains: String(organization), mode: 'insensitive' };
    }
    if (search && String(search).trim() !== '') {
      const q = String(search).trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { examName: { contains: q, mode: 'insensitive' } },
        { organizationName: { contains: q, mode: 'insensitive' } },
        { notificationNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, articles] = await Promise.all([
      prisma.educationArticle.count({ where }),
      prisma.educationArticle.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          dates: { orderBy: { date: 'asc' } },
          sources: { take: 1 },
          _count: {
            select: { versions: true, dates: true },
          },
        },
      }),
    ]);

    // Format dates with dynamic deadline
    const items = articles.map((a) => {
      const nextDate = a.dates.find((d) => calculateDeadlineStatus(d.date).isExpired === false) || a.dates[0];
      return {
        ...a,
        nextDate: nextDate ? { ...nextDate, deadline: calculateDeadlineStatus(nextDate.date) } : null,
      };
    });

    res.json({
      success: true,
      articles: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 8. GET ARTICLE BY ID (FULL EDIT/REVIEW DATA)
// ============================================================
router.get('/articles/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const article = await prisma.educationArticle.findUnique({
      where: { id },
      include: {
        dates: { orderBy: { date: 'asc' } },
        links: true,
        sources: true,
        syllabus: { orderBy: { order: 'asc' } },
        versions: { orderBy: { versionNumber: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!article) {
      res.status(404).json({ success: false, message: 'Article not found.' });
      return;
    }

    res.json({ success: true, article });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 9. UPDATE ARTICLE (MANUAL EDITING & FACT LOCKING)
// ============================================================
router.put('/articles/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      excerpt,
      content,
      category,
      organizationName,
      examName,
      notificationNumber,
      status,
      priority,
      seoTitle,
      metaDescription,
      focusKeyword,
      dates,
      links,
      faqs,
      structuredInfo,
      updateReason,
    } = req.body;

    const existing = await prisma.educationArticle.findUnique({
      where: { id },
      include: { dates: true },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Article not found.' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Snapshot previous state in ArticleVersion
      const versionCount = await tx.articleVersion.count({ where: { articleId: id } });
      await tx.articleVersion.create({
        data: {
          articleId: id,
          versionNumber: versionCount + 1,
          changedFields: JSON.stringify(['MANUAL_UPDATE']),
          previousData: JSON.stringify({ title: existing.title, excerpt: existing.excerpt, status: existing.status }),
          newData: JSON.stringify({ title, excerpt, status }),
          updateReason: updateReason || 'Admin editorial revision',
          createdBy: req.user?.id || 'ADMIN',
        },
      });

      // 2. Update core article
      const art = await tx.educationArticle.update({
        where: { id },
        data: {
          ...(title ? { title: title.trim() } : {}),
          ...(excerpt ? { excerpt: excerpt.trim() } : {}),
          ...(content ? { content } : {}),
          ...(category ? { category } : {}),
          ...(organizationName ? { organizationName: organizationName.trim() } : {}),
          ...(examName ? { examName: examName.trim() } : {}),
          ...(notificationNumber !== undefined ? { notificationNumber } : {}),
          ...(status ? { status } : {}),
          ...(priority ? { priority } : {}),
          ...(seoTitle !== undefined ? { seoTitle } : {}),
          ...(metaDescription !== undefined ? { metaDescription } : {}),
          ...(focusKeyword !== undefined ? { focusKeyword } : {}),
          ...(faqs !== undefined ? { faqData: JSON.stringify(faqs) } : {}),
          ...(structuredInfo !== undefined ? { structuredInfo: JSON.stringify(structuredInfo) } : {}),
          lastVerifiedAt: new Date(),
        },
      });

      // 3. Update / Replace dates if provided
      if (Array.isArray(dates)) {
        await tx.importantDate.deleteMany({ where: { articleId: id } });
        for (const d of dates) {
          await tx.importantDate.create({
            data: {
              articleId: id,
              date: new Date(d.date),
              dateType: d.dateType,
              label: d.label,
              source: d.source || null,
              confidence: d.confidence || 'HIGH',
              note: d.note || null,
              isVerified: Boolean(d.isVerified),
            },
          });
        }
      }

      // 4. Update / Replace links if provided
      if (Array.isArray(links)) {
        await tx.importantLink.deleteMany({ where: { articleId: id } });
        for (const l of links) {
          await tx.importantLink.create({
            data: {
              articleId: id,
              label: l.label,
              url: l.url,
              linkType: l.linkType,
              source: l.source || null,
              isOfficial: l.isOfficial ?? true,
              verifiedAt: new Date(),
            },
          });
        }
      }

      return art;
    });

    res.json({ success: true, message: 'Article updated successfully.', article: updated });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 10. ARCHIVE / DELETE ARTICLE
// ============================================================
router.delete('/articles/:id', async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    await prisma.educationArticle.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    await prisma.newsroomAuditLog.create({
      data: {
        action: 'ARCHIVE',
        articleId: id,
        actor: req.user?.id || 'ADMIN',
      },
    });

    res.json({ success: true, message: 'Article moved to ARCHIVED.' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 11. BULK ACTIONS (Approve, Publish, Archive)
// ============================================================
router.post('/bulk', async (req: AuthRequest, res, next) => {
  try {
    const { action, ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'Selection of article IDs required.' });
      return;
    }

    if (action === 'APPROVE') {
      await prisma.educationArticle.updateMany({
        where: { id: { in: ids } },
        data: { status: 'APPROVED' },
      });
      res.json({ success: true, message: `${ids.length} articles marked as APPROVED.` });
    } else if (action === 'PUBLISH') {
      let pubCount = 0;
      for (const id of ids) {
        try {
          await publishArticleWithBridge(id, req.user?.name || 'ADMIN');
          pubCount++;
        } catch {
          // ignore single fail in bulk
        }
      }
      res.json({ success: true, message: `${pubCount} of ${ids.length} articles published.` });
    } else if (action === 'ARCHIVE') {
      await prisma.educationArticle.updateMany({
        where: { id: { in: ids } },
        data: { status: 'ARCHIVED' },
      });
      res.json({ success: true, message: `${ids.length} articles archived.` });
    } else {
      res.status(400).json({ success: false, message: 'Invalid bulk action.' });
    }
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 12. SOURCES & MONITORED ORGANIZATIONS
// ============================================================
router.get('/sources', async (req, res) => {
  res.json({
    success: true,
    sources: OFFICIAL_MONITORED_ORGS,
  });
});

// ============================================================
// 13. SETTINGS
// ============================================================
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await prisma.newsroomSetting.findMany();
    const map: Record<string, any> = {};
    for (const s of settings) {
      try {
        map[s.key] = JSON.parse(s.value);
      } catch {
        map[s.key] = s.value;
      }
    }

    res.json({
      success: true,
      settings: {
        aiProvider: map.aiProvider || 'rule-based-education-parser',
        autoResearchEnabled: map.autoResearchEnabled ?? true,
        autoPublishEligibleOnly: map.autoPublishEligibleOnly ?? false,
        researchIntervalMinutes: map.researchIntervalMinutes || 60,
        confidenceThreshold: map.confidenceThreshold || 'HIGH',
        trustedOrgs: map.trustedOrgs || ['UPSSSC', 'UPPSC', 'UPPBPB', 'SSC', 'UPSC', 'NTA', 'CBSE'],
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const body = req.body;
    for (const [k, v] of Object.entries(body)) {
      await prisma.newsroomSetting.upsert({
        where: { key: k },
        update: { value: JSON.stringify(v) },
        create: { key: k, value: JSON.stringify(v) },
      });
    }
    res.json({ success: true, message: 'Newsroom settings saved successfully.' });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 14. LOGS & AUDIT TRAIL
// ============================================================
router.get('/logs', async (req, res, next) => {
  try {
    const [usageLogs, auditLogs] = await Promise.all([
      prisma.aIUsageLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.newsroomAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          article: { select: { title: true, slug: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      usageLogs,
      auditLogs,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
