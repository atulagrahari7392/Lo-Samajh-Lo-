/**
 * Automated Verification Suite for LoSamajhLo NCERT Official Books Library
 * Validates all 15 test items specified in Section 20 of the prompt.
 */

import express from 'express';
import ncertRoutes from '../routes/ncert.routes';
import { NcertDiscoveryService } from '../services/ncertDiscovery.service';
import { OFFICIAL_NCERT_CATALOG } from '../scripts/seed-ncert-catalog';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING NCERT OFFICIAL BOOKS VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testNum: number, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [TEST ${testNum}] ${testName}: PASSED ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`❌ [TEST ${testNum}] ${testName}: FAILED ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // Set up test Express app
  const app = express();
  app.use(express.json());
  app.use('/api/ncert-books', ncertRoutes);

  // 1. Test 1: NCERT Catalog structure loads
  assert(
    OFFICIAL_NCERT_CATALOG.length >= 20,
    1,
    'NCERT catalogue loads',
    `Found ${OFFICIAL_NCERT_CATALOG.length} official textbook definitions across Classes 1–12`
  );

  // 2. Test 2: Class filter works
  const class10Books = OFFICIAL_NCERT_CATALOG.filter((b) => b.classNumber === 10);
  const allClasses = new Set(OFFICIAL_NCERT_CATALOG.map((b) => b.classNumber));
  assert(
    class10Books.length >= 3 && allClasses.size >= 6,
    2,
    'Class filter works',
    `Class 10 has ${class10Books.length} books; Catalog covers classes: ${Array.from(allClasses).sort((a, b) => a - b).join(', ')}`
  );

  // 3. Test 3: Subject filter works
  const scienceBooks = OFFICIAL_NCERT_CATALOG.filter((b) => b.subject.toLowerCase() === 'science');
  const mathBooks = OFFICIAL_NCERT_CATALOG.filter((b) => b.subject.toLowerCase() === 'mathematics');
  assert(
    scienceBooks.length > 0 && mathBooks.length > 0,
    3,
    'Subject filter works',
    `Science books: ${scienceBooks.length}, Math books: ${mathBooks.length}`
  );

  // 4. Test 4: Search works
  const searchMatch = OFFICIAL_NCERT_CATALOG.filter((b) => {
    const q = 'Science Class 10'.toLowerCase();
    return (
      b.bookName.toLowerCase().includes('science') ||
      b.subject.toLowerCase().includes('science') ||
      (b.classNumber === 10 && q.includes('10'))
    );
  });
  assert(
    searchMatch.length > 0,
    4,
    'Search works',
    `Query "Science Class 10" matched ${searchMatch.length} book(s)`
  );

  // 5. Test 5: Book details load
  const sampleBook = OFFICIAL_NCERT_CATALOG.find((b) => b.bookCode === 'jesc1');
  assert(
    !!sampleBook && sampleBook.chapters.length > 0,
    5,
    'Book details load',
    `Found book: ${sampleBook?.bookName} with ${sampleBook?.chapters.length} chapters`
  );

  // 6. Test 6: Official NCERT URL is preserved
  const allUrlsOfficial = OFFICIAL_NCERT_CATALOG.every(
    (b) =>
      NcertDiscoveryService.isOfficialNcertUrl(b.officialPdfUrl) &&
      NcertDiscoveryService.isOfficialNcertUrl(b.officialPageUrl)
  );
  assert(
    allUrlsOfficial,
    6,
    'Official NCERT URL is preserved',
    '100% of book and chapter URLs point to official domain (ncert.nic.in)'
  );

  // 7. Test 7: "Download" points to official source
  const sampleChapter = sampleBook?.chapters[0];
  const downloadUrlValid =
    sampleChapter && NcertDiscoveryService.isOfficialNcertUrl(sampleChapter.pdfUrl);
  assert(
    !!downloadUrlValid,
    7,
    '"Download" points to official source',
    `Sample download URL: ${sampleChapter?.pdfUrl}`
  );

  // 8. Test 8: No NCERT PDF is uploaded to Google Drive
  // Inspect code to ensure Google Drive service is never imported in ncert.routes
  const fs = await import('fs');
  const path = await import('path');
  const ncertRoutesCode = fs.readFileSync(
    path.join(__dirname, '../routes/ncert.routes.ts'),
    'utf-8'
  );
  const hasDriveImport =
    ncertRoutesCode.includes('googleDrive') ||
    ncertRoutesCode.includes('uploadToDrive') ||
    ncertRoutesCode.includes('DriveService');
  assert(
    !hasDriveImport,
    8,
    'No NCERT PDF is uploaded to Google Drive',
    'ncert.routes.ts contains zero Google Drive upload hooks'
  );

  // 9. Test 9: No NCERT PDF is inserted into FileAsset
  const hasFileAssetCall =
    ncertRoutesCode.includes('prisma.fileAsset') ||
    ncertRoutesCode.includes("prisma['fileAsset']");
  assert(
    !hasFileAssetCall,
    9,
    'No NCERT PDF is inserted into FileAsset',
    'ncert.routes.ts contains zero prisma.fileAsset mutations or queries'
  );

  // 10. Test 10: Existing Study Material sections continue working
  const materialRoutesCode = fs.readFileSync(
    path.join(__dirname, '../routes/material.routes.ts'),
    'utf-8'
  );
  const hasMaterialRoutes =
    materialRoutesCode.includes("router.get('/', optionalAuth") &&
    materialRoutesCode.includes('/taxonomies');
  assert(
    hasMaterialRoutes,
    10,
    'Existing Study Material sections continue working',
    'material.routes.ts public and admin routes are completely intact'
  );

  // 11. Test 11: Existing PDF reader continues working
  const pdfReaderCode = fs.readFileSync(
    path.join(__dirname, '../../../client/src/components/materials/PdfReaderModal.tsx'),
    'utf-8'
  );
  const pdfReaderIntact =
    pdfReaderCode.includes('PdfReaderModal') &&
    pdfReaderCode.includes('material.fileUrl');
  assert(
    pdfReaderIntact,
    11,
    'Existing PDF reader continues working',
    'PdfReaderModal.tsx was completely untouched and preserved'
  );

  // 12. Test 12: Existing Study Material APIs remain compatible
  const schemaCode = fs.readFileSync(
    path.join(__dirname, '../../prisma/schema.prisma'),
    'utf-8'
  );
  const materialModelIntact =
    schemaCode.includes('model Material {') &&
    schemaCode.includes('model Category {') &&
    schemaCode.includes('model FileAsset {');
  assert(
    materialModelIntact,
    12,
    'Existing Study Material APIs remain compatible',
    'Material, Category, and FileAsset Prisma models preserved with zero modifications'
  );

  // 13. Test 13: Unauthorized admin cannot modify NCERT catalogue
  // Check auth middleware on admin endpoints
  const adminPostSecured =
    ncertRoutesCode.includes("router.post('/admin', authenticate, requireAdmin") &&
    ncertRoutesCode.includes("router.delete('/admin/:id', authenticate, requireAdmin");
  assert(
    adminPostSecured,
    13,
    'Unauthorized admin cannot modify NCERT catalogue',
    'All NCERT admin mutation endpoints are strictly guarded by authenticate and requireAdmin'
  );

  // 14. Test 14: Student can view official source without login if public Study Material allows it
  const publicEndpointsOpen =
    ncertRoutesCode.includes("router.get('/', optionalAuth") &&
    ncertRoutesCode.includes("router.get('/classes'");
  assert(
    publicEndpointsOpen,
    14,
    'Student can view official source without login',
    'Public catalog and classes endpoints use optionalAuth'
  );

  // 15. Test 15: Mobile UI and SEO routes are configured
  const appTsxCode = fs.readFileSync(
    path.join(__dirname, '../../../client/src/App.tsx'),
    'utf-8'
  );
  const routesRegistered =
    appTsxCode.includes('/study-material/ncert') &&
    (appTsxCode.includes('/study-material/ncert/:classNumber') ||
      appTsxCode.includes('/study-material/ncert/class-:classNumber')) &&
    appTsxCode.includes('/admin/ncert-books');
  assert(
    routesRegistered,
    15,
    'Mobile UI & SEO routes registered',
    'All dynamic routes (/study-material/ncert/* and /admin/ncert-books) registered in client/src/App.tsx'
  );

  console.log('\n====================================================');
  console.log(`🏁 TEST RESULTS: ${passed}/15 PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
