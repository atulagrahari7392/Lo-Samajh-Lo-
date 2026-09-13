const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbUrl = process.env.DATABASE_URL || '';

if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
  console.log('🚀 Connecting to PostgreSQL and applying Prisma migrations...');
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../..'),
    });
    console.log('✅ Prisma migrations deployed successfully.');
  } catch (err) {
    console.error('❌ Failed to deploy migrations:', err.message);
    process.exit(1);
  }
} else {
  console.log('ℹ️ DATABASE_URL is not a PostgreSQL URL (or not set). Skipping migration deployment.');
}
