import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

interface BackupData {
  [modelName: string]: any[];
}

function parseDates(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const dateFields = [
    'createdAt', 'updatedAt', 'enrolledAt', 'expiresAt', 'downloadedAt',
    'viewedAt', 'date', 'scheduledStart', 'scheduledEnd', 'submittedAt',
    'startDate', 'expiryDate', 'publishedAt', 'scheduledAt', 'readAt',
    'lastPracticeDate'
  ];

  const result: any = { ...obj };
  for (const key of Object.keys(result)) {
    if (dateFields.includes(key) && result[key]) {
      result[key] = new Date(result[key]);
    }
  }
  return result;
}

export async function migrateData() {
  console.log('🔄 ============================================================');
  console.log('🔄 LO SAMAJH LO — SQLITE TO POSTGRESQL DATA MIGRATION');
  console.log('🔄 ============================================================');

  const backupFilePath = path.join(__dirname, '../../prisma/sqlite-data-backup.json');
  if (!fs.existsSync(backupFilePath)) {
    console.error(`❌ Backup file not found at: ${backupFilePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(backupFilePath, 'utf-8');
  const backup: BackupData = JSON.parse(raw);

  // Models in strict foreign-key dependency order
  const modelImportOrder: { key: string; prismaName: string }[] = [
    // Level 1: Independent tables
    { key: 'user', prismaName: 'user' },
    { key: 'category', prismaName: 'category' },
    { key: 'studyTaxonomy', prismaName: 'studyTaxonomy' },
    { key: 'currentAffairs', prismaName: 'currentAffairs' },
    { key: 'sliderBanner', prismaName: 'sliderBanner' },
    { key: 'siteSetting', prismaName: 'siteSetting' },
    { key: 'typingExam', prismaName: 'typingExam' },
    { key: 'typingCourse', prismaName: 'typingCourse' },
    { key: 'testSeries', prismaName: 'testSeries' },
    { key: 'notification', prismaName: 'notification' },
    { key: 'promoCode', prismaName: 'promoCode' },

    // Level 2: Depends on Level 1
    { key: 'course', prismaName: 'course' },
    { key: 'typingLesson', prismaName: 'typingLesson' },
    { key: 'typingTest', prismaName: 'typingTest' },
    { key: 'typingDailyChallenge', prismaName: 'typingDailyChallenge' },
    { key: 'typingLiveSession', prismaName: 'typingLiveSession' },
    { key: 'typingUserProgress', prismaName: 'typingUserProgress' },

    // Level 3: Depends on Course / Level 1 & 2
    { key: 'courseLesson', prismaName: 'courseLesson' },
    { key: 'liveClass', prismaName: 'liveClass' },
    { key: 'recordedClass', prismaName: 'recordedClass' },
    { key: 'material', prismaName: 'material' },
    { key: 'test', prismaName: 'test' },
    { key: 'question', prismaName: 'question' },
    { key: 'order', prismaName: 'order' },

    // Level 4: Depends on Material / Test / Question / Order
    { key: 'materialBookmark', prismaName: 'materialBookmark' },
    { key: 'materialDownload', prismaName: 'materialDownload' },
    { key: 'materialView', prismaName: 'materialView' },
    { key: 'testQuestion', prismaName: 'testQuestion' },
    { key: 'testAttempt', prismaName: 'testAttempt' },
    { key: 'questionReport', prismaName: 'questionReport' },
    { key: 'typingAttempt', prismaName: 'typingAttempt' },
    { key: 'orderItem', prismaName: 'orderItem' },
    { key: 'enrollment', prismaName: 'enrollment' },
    { key: 'review', prismaName: 'review' },
    { key: 'cartItem', prismaName: 'cartItem' },
    { key: 'wishlistItem', prismaName: 'wishlistItem' },
    { key: 'promoCodeUsage', prismaName: 'promoCodeUsage' },
    { key: 'notificationRead', prismaName: 'notificationRead' },

    // Level 5: Depends on TestAttempt & Question
    { key: 'testAnswer', prismaName: 'testAnswer' },
  ];

  console.log('\n📥 Importing records into PostgreSQL...\n');

  for (const { key, prismaName } of modelImportOrder) {
    const records = backup[key] || [];
    if (records.length === 0) continue;

    console.log(`⏳ Migrating ${records.length} records for ${prismaName}...`);
    const delegate = (prisma as any)[prismaName];

    for (const item of records) {
      const data = parseDates(item);
      try {
        if (data.id) {
          await delegate.upsert({
            where: { id: data.id },
            update: data,
            create: data,
          });
        } else {
          await delegate.create({ data });
        }
      } catch (err: any) {
        console.error(`⚠️ Error inserting into ${prismaName} (ID: ${data.id || 'N/A'}):`, err.message);
      }
    }
  }

  // Verification Report
  console.log('\n============================================================');
  console.log('📊 DATA MIGRATION VERIFICATION REPORT');
  console.log('============================================================');
  console.log(
    'MODEL'.padEnd(25) +
    'SQLITE COUNT'.padEnd(16) +
    'POSTGRESQL COUNT'.padEnd(18) +
    'STATUS'
  );
  console.log('-'.repeat(70));

  let allMatch = true;

  for (const { key, prismaName } of modelImportOrder) {
    const sqliteCount = (backup[key] || []).length;
    let postgresCount = 0;
    try {
      postgresCount = await (prisma as any)[prismaName].count();
    } catch (e: any) {
      postgresCount = -1;
    }

    const status = postgresCount >= sqliteCount && postgresCount > 0
      ? '✅ MATCH'
      : (sqliteCount === 0 && postgresCount === 0 ? '✅ MATCH (0)' : '❌ MISMATCH');

    if (postgresCount < sqliteCount) {
      allMatch = false;
    }

    console.log(
      prismaName.padEnd(25) +
      String(sqliteCount).padEnd(16) +
      String(postgresCount).padEnd(18) +
      status
    );
  }

  console.log('============================================================');
  if (allMatch) {
    console.log('🎉 ALL MODEL COUNTS MATCH OR EXCEED SQLITE SNAPSHOT!');
  } else {
    console.warn('⚠️ Some model counts did not match. Please review the errors above.');
  }
  console.log('============================================================\n');

  await prisma.$disconnect();
}

if (require.main === module) {
  migrateData().catch((err) => {
    console.error('Fatal migration error:', err);
    process.exit(1);
  });
}
