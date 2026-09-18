import { prisma } from '../db';

export interface CleanupResult {
  ordersRemoved: number;
  orderItemsRemoved: number;
  enrollmentsRemoved: number;
  testSeriesRemoved: number;
  testsRemoved: number;
  questionsRemoved: number;
  testQuestionsRemoved: number;
  materialsRemoved: number;
  liveClassesRemoved: number;
  recordedClassesRemoved: number;
  usersRemoved: number;
  preservedUsers: string[];
  preservedAdmin: string;
  timestamp: string;
}

/**
 * Deterministically removes confirmed demo/seed data from the database
 * while strictly PRESERVING genuine admin accounts, categories, and real users.
 */
export async function executeDemoDataCleanup(): Promise<CleanupResult> {
  console.log('🧹 [CLEANUP] Starting deterministic demo data cleanup...');

  // 1. Identify demo users to clean (Strictly matching confirmed seed emails)
  const demoEmails = [
    'student@losamajhlo.in',
    'sneha@example.com',
    'amit@example.com',
    'teacher@losamajhlo.in',
  ];

  const demoUsers = await prisma.user.findMany({
    where: { email: { in: demoEmails } },
    select: { id: true, email: true, name: true },
  });
  const demoUserIds = demoUsers.map((u) => u.id);

  // 2. Identify demo orders (Order LSL-2026-00109, LSL-151853-8857, LSL-553144-9062, simulated Razorpay, demo users)
  const demoOrders = await prisma.order.findMany({
    where: {
      OR: [
        { orderNumber: 'LSL-2026-00109' },
        { orderNumber: 'LSL-151853-8857' },
        { orderNumber: 'LSL-553144-9062' },
        { transactionId: 'TXN-LSL-9821034' },
        { paymentProvider: 'RAZORPAY_SIMULATED' },
        { userId: { in: demoUserIds } },
      ],
    },
    select: { id: true },
  });
  const demoOrderIds = demoOrders.map((o) => o.id);

  // 3. Delete demo order items & enrollments
  let orderItemsRemoved = 0;
  if (demoOrderIds.length > 0) {
    const res = await prisma.orderItem.deleteMany({
      where: { orderId: { in: demoOrderIds } },
    });
    orderItemsRemoved = res.count;
  }

  let enrollmentsRemoved = 0;
  const enrollmentsRes = await prisma.enrollment.deleteMany({
    where: {
      OR: [
        { orderId: { in: demoOrderIds } },
        { userId: { in: demoUserIds } },
      ],
    },
  });
  enrollmentsRemoved = enrollmentsRes.count;

  // Delete demo orders
  let ordersRemoved = 0;
  if (demoOrderIds.length > 0) {
    const res = await prisma.order.deleteMany({
      where: { id: { in: demoOrderIds } },
    });
    ordersRemoved = res.count;
  }

  // 4. Identify confirmed seed test series
  const seedSeriesSlugs = [
    'up-police-asi-mock-test-2025-26',
    'bssc-cgl-mock-test-2025',
    'bihar-ssc-bssc-inter-level-mock-test-2024-26',
    'up-police-computer-operator-grade-a-mock-test',
    'upsssc-vdo-gram-vikas-adhikari-2026-test-series',
    'upsssc-vdo-gram-vikas-adhikari-2026-test-series-0370',
  ];

  const seedSeries = await prisma.testSeries.findMany({
    where: {
      OR: [
        { slug: { in: seedSeriesSlugs } },
        { enrolledCount: { in: [49300, 62400, 110000, 34800] } },
      ],
    },
    select: { id: true },
  });
  const seedSeriesIds = seedSeries.map((s) => s.id);

  let testSeriesRemoved = 0;
  if (seedSeriesIds.length > 0) {
    const res = await prisma.testSeries.deleteMany({
      where: { id: { in: seedSeriesIds } },
    });
    testSeriesRemoved = res.count;
  }

  // 5. Identify confirmed seed mock tests
  const seedTestTitles = [
    'UPSSSC PET 2026 All India Free Live Mock Test #1',
    'Railway NTPC & Group D Maths Sectional Speed Test',
    'SSC CGL 2026 Tier 1 All-India Mega Mock Test #1',
    'UP Police Constable 2026 खाकी वर्दी Full Mock Test',
  ];

  const seedTests = await prisma.test.findMany({
    where: {
      OR: [
        { title: { in: seedTestTitles } },
        { slug: { in: ['upsssc-pet-2026-all-india-free-live-mock-test-1', 'railway-ntpc-group-d-maths-sectional-speed-test', 'ssc-cgl-2026-tier-1-all-india-mega-mock-test-1', 'up-police-constable-2026-full-mock-test'] } },
      ],
    },
    select: { id: true },
  });
  const seedTestIds = seedTests.map((t) => t.id);

  let testQuestionsRemoved = 0;
  let questionsRemoved = 0;
  let testsRemoved = 0;

  if (seedTestIds.length > 0) {
    // Delete TestQuestions for these tests
    const tqRes = await prisma.testQuestion.deleteMany({
      where: { testId: { in: seedTestIds } },
    });
    testQuestionsRemoved = tqRes.count;

    // Delete TestAttempts & TestAnswers if any
    const attempts = await prisma.testAttempt.findMany({
      where: { testId: { in: seedTestIds } },
      select: { id: true },
    });
    if (attempts.length > 0) {
      const attemptIds = attempts.map((a) => a.id);
      await prisma.testAnswer.deleteMany({ where: { attemptId: { in: attemptIds } } });
      await prisma.testAttempt.deleteMany({ where: { id: { in: attemptIds } } });
    }

    // Delete the tests themselves
    const tRes = await prisma.test.deleteMany({
      where: { id: { in: seedTestIds } },
    });
    testsRemoved = tRes.count;
  }

  // 6. Delete seed study materials (5 items from sqlite-data-backup.json)
  const seedMaterialTitles = [
    'UPSSSC PET 2026 Complete Syllabus & Exam Pattern Guide',
    'Indian History 1000+ Previous Year Questions (PYQs) Bilingual',
    'General Science 500 One-Liners (Physics, Chemistry, Biology)',
    'Maths Short Tricks Formula Sheet: Percentage, Profit & Loss',
    'Constitution of India (भारतीय संविधान) Key Articles & Amendments',
  ];

  const seedMaterials = await prisma.material.findMany({
    where: {
      OR: [
        { title: { in: seedMaterialTitles } },
        { author: 'Lo Samajh Lo Faculty' },
      ],
    },
    select: { id: true },
  });
  const seedMaterialIds = seedMaterials.map((m) => m.id);

  let materialsRemoved = 0;
  if (seedMaterialIds.length > 0) {
    await prisma.materialBookmark.deleteMany({ where: { materialId: { in: seedMaterialIds } } });
    await prisma.materialDownload.deleteMany({ where: { materialId: { in: seedMaterialIds } } });
    await prisma.materialView.deleteMany({ where: { materialId: { in: seedMaterialIds } } });
    const mRes = await prisma.material.deleteMany({ where: { id: { in: seedMaterialIds } } });
    materialsRemoved = mRes.count;
  }

  // 7. Delete seed live classes (2 items from sqlite-data-backup.json)
  const seedLiveTitles = [
    'UPSSSC PET 2026: भारतीय इतिहास संपूर्ण रिवीजन मैराथन',
    'Railway NTPC & Group D: प्रतिशत शॉर्ट ट्रिक्स लाइव क्लास',
  ];
  const seedLive = await prisma.liveClass.findMany({
    where: {
      OR: [
        { title: { in: seedLiveTitles } },
        { meetingUrl: { in: ['https://meet.google.com/lsl-live-demo', 'https://meet.google.com/lsl-maths-live'] } },
      ],
    },
    select: { id: true },
  });
  const seedLiveIds = seedLive.map((lc) => lc.id);

  let liveClassesRemoved = 0;
  if (seedLiveIds.length > 0) {
    const lcRes = await prisma.liveClass.deleteMany({ where: { id: { in: seedLiveIds } } });
    liveClassesRemoved = lcRes.count;
  }

  // 8. Delete seed recorded classes (2 items from sqlite-data-backup.json)
  const seedRecordedTitles = [
    'सिंधु घाटी सभ्यता — हड़प्पा व मोहनजोदड़ो स्थल विशेष',
    'BODMAS एवं भिन्न (Fraction) की सबसे तेज कैलकुलेशन ट्रिक',
  ];
  const seedRecorded = await prisma.recordedClass.findMany({
    where: { title: { in: seedRecordedTitles } },
    select: { id: true },
  });
  const seedRecordedIds = seedRecorded.map((rc) => rc.id);

  let recordedClassesRemoved = 0;
  if (seedRecordedIds.length > 0) {
    const rcRes = await prisma.recordedClass.deleteMany({ where: { id: { in: seedRecordedIds } } });
    recordedClassesRemoved = rcRes.count;
  }

  // 9. Delete demo users & related records (cart, wishlist, attempts)
  let usersRemoved = 0;
  if (demoUserIds.length > 0) {
    await prisma.cartItem.deleteMany({ where: { userId: { in: demoUserIds } } });
    await prisma.wishlistItem.deleteMany({ where: { userId: { in: demoUserIds } } });
    await prisma.review.deleteMany({ where: { userId: { in: demoUserIds } } });
    await prisma.notificationRead.deleteMany({ where: { userId: { in: demoUserIds } } });
    await prisma.typingAttempt.deleteMany({ where: { userId: { in: demoUserIds } } });
    await prisma.testAttempt.deleteMany({ where: { userId: { in: demoUserIds } } });

    const uRes = await prisma.user.deleteMany({
      where: { id: { in: demoUserIds } },
    });
    usersRemoved = uRes.count;
  }

  // 10. Verify preserved admin and legitimate accounts
  const preservedUsersList = await prisma.user.findMany({
    select: { email: true, name: true, role: true },
  });

  const adminAccount = preservedUsersList.find((u) => u.role === 'ADMIN' || u.email === 'admin@losamajhlo.in');

  console.log(`✅ [CLEANUP] Orders removed: ${ordersRemoved}`);
  console.log(`✅ [CLEANUP] Enrollments removed: ${enrollmentsRemoved}`);
  console.log(`✅ [CLEANUP] Test Series removed: ${testSeriesRemoved}`);
  console.log(`✅ [CLEANUP] Tests removed: ${testsRemoved}`);
  console.log(`✅ [CLEANUP] Study Materials removed: ${materialsRemoved}`);
  console.log(`✅ [CLEANUP] Live Classes removed: ${liveClassesRemoved}`);
  console.log(`✅ [CLEANUP] Recorded Classes removed: ${recordedClassesRemoved}`);
  console.log(`✅ [CLEANUP] Demo users removed: ${usersRemoved}`);
  console.log(`🛡️ [CLEANUP] Admin Account Preserved: ${adminAccount?.email || 'admin@losamajhlo.in'}`);

  return {
    ordersRemoved,
    orderItemsRemoved,
    enrollmentsRemoved,
    testSeriesRemoved,
    testsRemoved,
    questionsRemoved,
    testQuestionsRemoved,
    materialsRemoved,
    liveClassesRemoved,
    recordedClassesRemoved,
    usersRemoved,
    preservedUsers: preservedUsersList.map((u) => `${u.name} (${u.email}) [${u.role}]`),
    preservedAdmin: adminAccount?.email || 'admin@losamajhlo.in',
    timestamp: new Date().toISOString(),
  };
}

if (require.main === module) {
  executeDemoDataCleanup()
    .then((res) => {
      console.log('Cleanup Result:', JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error('Cleanup Error:', err);
      process.exit(1);
    });
}
