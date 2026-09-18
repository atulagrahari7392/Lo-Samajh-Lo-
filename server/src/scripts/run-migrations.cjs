const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbUrl = process.env.DATABASE_URL || '';

if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
  console.log('🚀 Connecting to PostgreSQL and configuring database schema...');
  const serverDir = path.join(__dirname, '../..');

  // 1. If previous deployment attempt had a failed migration (P3009), resolve it first
  try {
    execSync('npx prisma migrate resolve --rolled-back "20260914000000_init"', {
      stdio: 'pipe',
      cwd: serverDir,
    });
    console.log('🔄 Cleared any previous failed migration state.');
  } catch (resolveErr) {
    // Normal if no previous failed migration exists
  }

  // 2. Deploy the clean migration
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: serverDir,
    });
    console.log('✅ Prisma migrations deployed successfully.');
  } catch (err) {
    console.warn('⚠️ Migration deploy notice:', err.message);
    console.log('🔄 Ensuring all tables exist via safe schema synchronization...');
    try {
      execSync('npx prisma db push', {
        stdio: 'inherit',
        cwd: serverDir,
      });
      console.log('✅ Database schema synchronized successfully.');
    } catch (pushErr) {
      if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
        console.warn('⚠️ Local PostgreSQL server not reachable at localhost:5432. Skipping schema sync for offline local build.');
      } else {
        console.error('❌ Schema synchronization error:', pushErr.message);
        process.exit(1);
      }
    }
  }
} else {
  console.log('ℹ️ DATABASE_URL is not a PostgreSQL URL (or not set). Skipping migration deployment.');
}
