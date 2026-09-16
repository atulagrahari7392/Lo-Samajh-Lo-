import assert from 'assert';
import { calculateDeadlineStatus, getTimelineBucket } from '../services/aiNewsroom/deadlineCalculator';
import { validateSafeUrl, classifySourceAuthority } from '../services/aiNewsroom/webResearcher';
import { generateNewsroomSlug, RuleBasedEducationParser } from '../services/aiNewsroom/aiProvider';
import { verifyExtractedFacts } from '../services/aiNewsroom/verificationEngine';
import { ExtractedFacts } from '../services/aiNewsroom/types';

async function runTests() {
  console.log('🧪 Running AI Education Newsroom 2.0 Test Suite...\n');
  let passedCount = 0;
  let failedCount = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passedCount++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}\n     ${err.message}`);
      failedCount++;
    }
  }

  // 1. Deadline Status Intelligence Tests
  test('Deadline Intelligence: Calculates Expired correctly', () => {
    const yesterday = new Date(Date.now() - 2 * 86400000);
    const res = calculateDeadlineStatus(yesterday);
    assert.strictEqual(res.isExpired, true, 'Should be marked as expired');
    assert.strictEqual(getTimelineBucket(yesterday), 'EXPIRED');
  });

  test('Deadline Intelligence: Calculates Today/Tomorrow/Days Left', () => {
    const tomorrow = new Date(Date.now() + 1 * 86400000);
    const resTomorrow = calculateDeadlineStatus(tomorrow);
    assert.strictEqual(resTomorrow.isExpired, false);
    assert.strictEqual(resTomorrow.daysRemaining, 1);

    const fiveDays = new Date(Date.now() + 5 * 86400000);
    const resFiveDays = calculateDeadlineStatus(fiveDays);
    assert.strictEqual(resFiveDays.daysRemaining, 5);
    assert.strictEqual(getTimelineBucket(fiveDays), 'CLOSING_SOON');
  });

  // 2. SSRF & URL Safety Tests
  test('SSRF Protection: Blocks localhost and 127.0.0.1', () => {
    const res1 = validateSafeUrl('http://localhost:5000/secret');
    assert.strictEqual(res1.safe, false, 'Localhost should be blocked');

    const res2 = validateSafeUrl('http://127.0.0.1:8080');
    assert.strictEqual(res2.safe, false, '127.0.0.1 should be blocked');
  });

  test('SSRF Protection: Blocks Private IP Ranges (10.x, 192.168.x, 169.254.x)', () => {
    assert.strictEqual(validateSafeUrl('http://10.0.0.1/admin').safe, false);
    assert.strictEqual(validateSafeUrl('http://192.168.1.1/').safe, false);
    assert.strictEqual(validateSafeUrl('http://169.254.169.254/latest/meta-data/').safe, false);
    assert.strictEqual(validateSafeUrl('file:///etc/passwd').safe, false);
  });

  test('SSRF Protection: Allows Valid Official HTTP/HTTPS URLs', () => {
    assert.strictEqual(validateSafeUrl('https://upsssc.gov.in/notice').safe, true);
    assert.strictEqual(validateSafeUrl('https://ssc.gov.in/').safe, true);
  });

  // 3. Source Authority Classification Tests
  test('Source Classification: Official Government Authority (.gov.in, .nic.in, .ac.in)', () => {
    const upsssc = classifySourceAuthority('http://upsssc.gov.in');
    assert.strictEqual(upsssc.sourceType, 'OFFICIAL');
    assert.strictEqual(upsssc.authorityLevel, 'PRIMARY');
    assert.strictEqual(upsssc.isOfficial, true);

    const uppsc = classifySourceAuthority('https://uppsc.up.nic.in');
    assert.strictEqual(uppsc.sourceType, 'OFFICIAL');

    const nta = classifySourceAuthority('https://nta.ac.in');
    assert.strictEqual(nta.sourceType, 'OFFICIAL');
  });

  test('Source Classification: Secondary Education Publishers', () => {
    const jagran = classifySourceAuthority('https://www.jagranjosh.com/articles/upsssc-pet');
    assert.strictEqual(jagran.sourceType, 'RELIABLE_SECONDARY');
    assert.strictEqual(jagran.authorityLevel, 'SECONDARY');
    assert.strictEqual(jagran.isOfficial, false);
  });

  // 4. Slug Generation Tests
  test('Slug Generation: Clean, lowercase, hyphenated, safe for URLs', () => {
    const slug = generateNewsroomSlug('UPSSSC PET 2026: Official Notification & Exam Dates!!');
    assert.strictEqual(slug, 'upsssc-pet-2026-official-notification-exam-dates');
  });

  // 5. Verification & Fact-Locking Engine Tests
  test('Verification Engine: Detects Chronological Date Conflicts', () => {
    const conflictingFacts: ExtractedFacts = {
      title: 'Sample Conflicting Notice',
      examName: 'Test Exam',
      organizationName: 'UPSSSC',
      category: 'COMPETITIVE_EXAMS',
      summary: 'Summary with inverted application dates',
      structuredInfo: {},
      dates: [
        {
          date: '2026-10-30T00:00:00.000Z',
          dateType: 'APPLICATION_START',
          label: 'Application Starts',
          confidence: 'HIGH',
        },
        {
          date: '2026-10-10T00:00:00.000Z',
          dateType: 'APPLICATION_END',
          label: 'Application Closes',
          confidence: 'HIGH',
        },
      ],
      links: [],
      sources: [{ title: 'UPSSSC', url: 'https://upsssc.gov.in', domain: 'upsssc.gov.in', sourceType: 'OFFICIAL', authorityLevel: 'PRIMARY', verificationStatus: 'VERIFIED' }],
      syllabus: [],
      confidence: 'HIGH',
    };

    const result = verifyExtractedFacts(conflictingFacts);
    assert.strictEqual(result.conflictDetected, true, 'Should detect that End Date is before Start Date');
    assert.strictEqual(result.confidence, 'LOW');
  });

  test('Verification Engine: Preserves Fact-Locked Fields', () => {
    const facts: ExtractedFacts = {
      title: 'UPSSSC PET 2026 Notification',
      examName: 'UPSSSC PET',
      organizationName: 'UPSSSC',
      category: 'COMPETITIVE_EXAMS',
      summary: 'Normal update',
      structuredInfo: {},
      dates: [
        {
          date: '2026-11-20T00:00:00.000Z',
          dateType: 'EXAM_DATE',
          label: 'PET Exam Date (Unverified AI speculation)',
          confidence: 'LOW',
        },
      ],
      links: [],
      sources: [],
      syllabus: [],
      confidence: 'HIGH',
    };

    const lockedFacts = {
      dates: [
        {
          date: '2026-11-15T00:00:00.000Z',
          dateType: 'EXAM_DATE',
          label: 'PET Exam Date (Admin Verified & Locked)',
          confidence: 'HIGH' as const,
          isVerified: true,
        },
      ],
    };

    const result = verifyExtractedFacts(facts, lockedFacts);
    const examDate = result.verifiedFacts.dates.find((d) => d.dateType === 'EXAM_DATE');
    assert.strictEqual(examDate?.isVerified, true, 'Locked date must be preserved');
    assert.strictEqual(examDate?.label, 'PET Exam Date (Admin Verified & Locked)');
  });

  // 6. Article Template & Generation Tests
  test('Article Generator: Produces Section 14 Compliant Template', async () => {
    const parser = new RuleBasedEducationParser();
    const catalog = await parser.research('UPSSSC');
    assert.ok(catalog.length > 0, 'Catalog should return items');

    const generated = await parser.generateArticle(catalog[0]);
    assert.ok(generated.content.includes('## Quick Summary'), 'Must contain Quick Summary');
    assert.ok(generated.content.includes('## Important Dates'), 'Must contain Important Dates');
    assert.ok(generated.content.includes('## How to Apply Step-by-Step'), 'Must contain How to Apply');
    assert.ok(generated.content.includes('## Official Source'), 'Must contain Official Source');
    assert.ok(generated.content.includes('## Last Updated'), 'Must contain Last Updated');
  });

  console.log(`\n📊 Test Results: ${passedCount} passed, ${failedCount} failed.`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
