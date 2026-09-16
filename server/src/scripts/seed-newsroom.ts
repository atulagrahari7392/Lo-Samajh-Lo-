import { prisma } from '../db';
import { RuleBasedEducationParser } from '../services/aiNewsroom/aiProvider';
import { publishArticleWithBridge } from '../services/aiNewsroom/notificationBridge';

export async function seedEducationNewsroom() {
  try {
    const existingCount = await prisma.educationArticle.count();
    if (existingCount > 0) {
      console.log(`ℹ️ [Newsroom Seed] Database already contains ${existingCount} education articles. Skipping initial seed.`);
      return;
    }

    console.log('🌱 [Newsroom Seed] Seeding initial verified education updates for UP & National Exams...');
    const parser = new RuleBasedEducationParser();
    const catalog = await parser.research('');

    for (const facts of catalog) {
      const generated = await parser.generateArticle(facts);

      let slug = generated.slug;
      const existing = await prisma.educationArticle.findUnique({ where: { slug } });
      if (existing) {
        slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const article = await prisma.educationArticle.create({
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
          notificationNumber: facts.notificationNumber || null,
          status: 'DRAFT',
          featured: true,
          priority: 'NORMAL',
          confidenceScore: 'HIGH',
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

      // Add dates
      for (const d of generated.dates) {
        await prisma.importantDate.create({
          data: {
            articleId: article.id,
            date: new Date(d.date),
            dateType: d.dateType,
            label: d.label,
            source: d.source || null,
            confidence: 'HIGH',
            isVerified: true,
          },
        });
      }

      // Add links
      for (const l of generated.links) {
        await prisma.importantLink.create({
          data: {
            articleId: article.id,
            label: l.label,
            url: l.url,
            linkType: l.linkType,
            isOfficial: true,
            verifiedAt: new Date(),
          },
        });
      }

      // Add sources
      for (const s of generated.sources) {
        await prisma.articleSource.create({
          data: {
            articleId: article.id,
            title: s.title,
            url: s.url,
            domain: s.domain,
            sourceType: 'OFFICIAL',
            authorityLevel: 'PRIMARY',
            verificationStatus: 'VERIFIED',
          },
        });
      }

      // Add syllabus
      for (const sy of generated.syllabus) {
        await prisma.syllabusSection.create({
          data: {
            articleId: article.id,
            topic: sy.topic,
            subtopics: JSON.stringify(sy.subtopics || []),
            order: sy.order || 0,
          },
        });
      }

      // Automatically publish & bridge to existing Notification table
      await publishArticleWithBridge(article.id, 'SYSTEM / SEED');
      console.log(`✅ [Newsroom Seed] Published: ${article.title}`);
    }

    console.log('🎉 [Newsroom Seed] Finished seeding verified education articles!');
  } catch (err: any) {
    console.error('⚠️ [Newsroom Seed] Error:', err.message);
  }
}

// Run standalone if invoked directly
if (require.main === module) {
  seedEducationNewsroom()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
