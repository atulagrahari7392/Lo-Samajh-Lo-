import { prisma } from './db';

async function seedMaterials() {
  console.log('🌱 Seeding rich Study Materials, Taxonomies and Current Affairs...');

  // 1. Ensure Categories exist or fetch them
  const categories = await prisma.category.findMany();
  let upssscCat = categories.find(c => c.slug === 'upsssc') || categories[0];
  let railwayCat = categories.find(c => c.slug === 'railway') || categories[0];
  let sscCat = categories.find(c => c.slug === 'ssc') || categories[0];
  let generalCat = categories.find(c => c.slug === 'gs-science') || categories[0];

  // 2. Seed Study Taxonomies
  const taxonomiesData = [
    // Categories
    { type: 'CATEGORY', name: 'NCERT Textbooks & Solutions', slug: 'ncert', icon: 'BookOpen', color: '#6C63FF', order: 1 },
    { type: 'CATEGORY', name: 'E-Books & Standard Guides', slug: 'e-books', icon: 'Book', color: '#3B82F6', order: 2 },
    { type: 'CATEGORY', name: 'Handwritten Class Notes', slug: 'class-notes', icon: 'FileText', color: '#10B981', order: 3 },
    { type: 'CATEGORY', name: 'Current Affairs & Monthly Capsules', slug: 'current-affairs', icon: 'Sparkles', color: '#F59E0B', order: 4 },
    { type: 'CATEGORY', name: 'Previous Year Papers (PYQ)', slug: 'pyq', icon: 'Archive', color: '#EC4899', order: 5 },
    { type: 'CATEGORY', name: 'Practice Sets & Mock PDFs', slug: 'practice-sets', icon: 'CheckSquare', color: '#8B5CF6', order: 6 },
    { type: 'CATEGORY', name: 'Question Banks (1000+ MCQs)', slug: 'question-banks', icon: 'HelpCircle', color: '#06B6D4', order: 7 },
    { type: 'CATEGORY', name: 'Short Notes & Mind Maps', slug: 'short-notes', icon: 'Zap', color: '#F97316', order: 8 },
    { type: 'CATEGORY', name: 'One-Liners & Fact Sheets', slug: 'one-liners', icon: 'List', color: '#14B8A6', order: 9 },
    { type: 'CATEGORY', name: 'Worksheets & Daily Quizzes', slug: 'worksheets', icon: 'ClipboardCheck', color: '#6366F1', order: 10 },
    { type: 'CATEGORY', name: 'School Study Material (K-12)', slug: 'school-material', icon: 'GraduationCap', color: '#84CC16', order: 11 },
    { type: 'CATEGORY', name: 'Competitive Exam Material', slug: 'competitive-exams', icon: 'Trophy', color: '#E11D48', order: 12 },

    // Classes
    { type: 'CLASS', name: 'Class 6', slug: 'class-6', order: 1 },
    { type: 'CLASS', name: 'Class 7', slug: 'class-7', order: 2 },
    { type: 'CLASS', name: 'Class 8', slug: 'class-8', order: 3 },
    { type: 'CLASS', name: 'Class 9', slug: 'class-9', order: 4 },
    { type: 'CLASS', name: 'Class 10 (Board)', slug: 'class-10', order: 5 },
    { type: 'CLASS', name: 'Class 11', slug: 'class-11', order: 6 },
    { type: 'CLASS', name: 'Class 12 (Board)', slug: 'class-12', order: 7 },
    { type: 'CLASS', name: 'Graduation / College', slug: 'graduation', order: 8 },

    // Subjects
    { type: 'SUBJECT', name: 'Science & Technology (विज्ञान)', slug: 'science', order: 1 },
    { type: 'SUBJECT', name: 'Mathematics (गणित)', slug: 'mathematics', order: 2 },
    { type: 'SUBJECT', name: 'History (भारतीय इतिहास)', slug: 'history', order: 3 },
    { type: 'SUBJECT', name: 'Geography (भूगोल)', slug: 'geography', order: 4 },
    { type: 'SUBJECT', name: 'Polity & Constitution (राजव्यवस्था व संविधान)', slug: 'polity', order: 5 },
    { type: 'SUBJECT', name: 'Economics (अर्थशास्त्र)', slug: 'economics', order: 6 },
    { type: 'SUBJECT', name: 'General Hindi (सामान्य हिन्दी व्याकरण)', slug: 'hindi', order: 7 },
    { type: 'SUBJECT', name: 'English Grammar & Vocab', slug: 'english', order: 8 },
    { type: 'SUBJECT', name: 'Reasoning & Mental Ability (तर्कशक्ति)', slug: 'reasoning', order: 9 },
    { type: 'SUBJECT', name: 'Current Affairs & Static GK', slug: 'current-affairs', order: 10 },

    // Target Exams
    { type: 'EXAM', name: 'UPSSSC PET & Lekhpal', slug: 'upsssc-pet', order: 1 },
    { type: 'EXAM', name: 'SSC CGL & CHSL', slug: 'ssc-cgl', order: 2 },
    { type: 'EXAM', name: 'Railway RRB NTPC & Group D', slug: 'railway-ntpc', order: 3 },
    { type: 'EXAM', name: 'UP Police Constable & SI', slug: 'up-police', order: 4 },
    { type: 'EXAM', name: 'UPSC Civil Services / UPPSC', slug: 'upsc-uppsc', order: 5 },
    { type: 'EXAM', name: 'Teaching (CTET / UPTET)', slug: 'teaching-tet', order: 6 },
    { type: 'EXAM', name: 'Banking (IBPS / SBI PO & Clerk)', slug: 'banking-ibps', order: 7 },
  ];

  for (const tax of taxonomiesData) {
    await prisma.studyTaxonomy.upsert({
      where: { type_slug: { type: tax.type, slug: tax.slug } },
      update: { name: tax.name, icon: tax.icon || null, color: tax.color || '#6C63FF', order: tax.order },
      create: {
        type: tax.type,
        name: tax.name,
        slug: tax.slug,
        icon: tax.icon || null,
        color: tax.color || '#6C63FF',
        order: tax.order,
      },
    });
  }
  console.log('✅ Study Taxonomies initialized.');

  // 3. Realistic Study Materials
  const samplePdfs = [
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf',
  ];

  const materialsToSeed = [
    // NCERT Class 7 Science
    {
      title: 'NCERT Class 7 Science: Chapter 1 - Nutrition in Plants (पादपों में पोषण)',
      slug: 'class-7-science-nutrition-in-plants-notes',
      description: 'कक्षा 7 विज्ञान अध्याय 1 के संपूर्ण हस्तलिखित नोट्स, महत्वपूर्ण परिभाषाएं, प्रकाश संश्लेषण प्रक्रिया और अभ्यास प्रश्न उत्तर।',
      fullContent: 'इस अध्याय में पादपों में पोषण की विधियाँ: स्वपोषी पोषण, विषमपोषी पोषण, प्रकाश संश्लेषण (Photosynthesis), रंध्र (Stomata), पर्णहरित (Chlorophyll), कीटभक्षी पादप, मृतजीवी पोषण एवं मृदा में पोषकों की पुनः पूर्ति का विस्तृत विवरण है।',
      categoryId: generalCat.id,
      materialType: 'NCERT',
      classGrade: 'Class 7',
      subject: 'Science',
      chapter: 'Chapter 1: Nutrition in Plants',
      topic: 'Photosynthesis & Autotrophic Nutrition',
      examName: 'School & Foundation',
      year: 2026,
      language: 'BILINGUAL',
      pageCount: 18,
      fileUrl: samplePdfs[0],
      thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400',
      fileType: 'PDF',
      fileSize: '3.4 MB',
      author: 'Lo Samajh Lo Science Faculty',
      difficulty: 'EASY',
      isFree: true,
      isFeatured: true,
      isTrending: true,
      status: 'PUBLISHED',
      downloadsCount: 3820,
      viewsCount: 12450,
      metaTitle: 'NCERT Class 7 Science Chapter 1 Notes PDF Download',
      metaDescription: 'Download Free Class 7 Science Chapter 1 Nutrition in Plants complete Hindi/English notes and solutions.',
      keywords: 'ncert class 7 science, nutrition in plants, padapo me poshan, free pdf notes',
    },
    // NCERT Class 10 Science
    {
      title: 'NCERT Class 10 Science: Chemical Reactions and Equations (रासायनिक अभिक्रियाएँ एवं समीकरण)',
      slug: 'class-10-science-chemical-reactions-equations',
      description: 'बोर्ड परीक्षा के लिए अत्यंत महत्वपूर्ण: संयोजन, वियोजन, विस्थापन और द्विविस्थापन अभिक्रियाएं, ऑक्सीकरण एवं अपचयन तथा संक्षारण।',
      fullContent: 'कक्षा 10 बोर्ड परीक्षा में 8+ अंक सुनिश्चित करने हेतु विशेष रूप से तैयार रासायनिक समीकरण संतुलन (Balancing equations) नियम, महत्वपूर्ण बोर्ड PYQ और माइंड मैप।',
      categoryId: generalCat.id,
      materialType: 'NCERT',
      classGrade: 'Class 10 (Board)',
      subject: 'Science',
      chapter: 'Chapter 1: Chemical Reactions',
      topic: 'Types of Chemical Reactions & Redox',
      examName: 'CBSE & UP Board 10th',
      year: 2026,
      language: 'HINDI',
      pageCount: 24,
      fileUrl: samplePdfs[1],
      thumbnail: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400',
      fileType: 'PDF',
      fileSize: '4.8 MB',
      author: 'Atul Agrahari',
      difficulty: 'MEDIUM',
      isFree: true,
      isFeatured: true,
      isTrending: true,
      status: 'PUBLISHED',
      downloadsCount: 7150,
      viewsCount: 21900,
      metaTitle: 'Class 10 Science Chapter 1 Notes in Hindi PDF',
      metaDescription: 'Complete Chemical Reactions and Equations Class 10 Board exam notes with solved equations.',
      keywords: 'class 10 chemistry, rasayanik abhikriya, cbse 10th science notes, up board science',
    },
    // NCERT Class 9 Mathematics
    {
      title: 'NCERT Class 9 Mathematics: Number System (संख्या पद्धति) Quick Formula & Theorem Sheet',
      slug: 'class-9-maths-number-system-formula-sheet',
      description: 'परिमेय एवं अपरिमेय संख्याएं, वास्तविक संख्याओं का दशमलव प्रसार, घातांक नियम और हर का परिमेयकरण करने के सभी नियम।',
      fullContent: 'कक्षा 9 गणित के प्रथम अध्याय के सभी महत्वपूर्ण सूत्र, उदाहरण और पिछले वर्षों के परीक्षा प्रश्न।',
      categoryId: sscCat.id,
      materialType: 'SHORT_NOTES',
      classGrade: 'Class 9',
      subject: 'Mathematics',
      chapter: 'Chapter 1: Number System',
      topic: 'Rational & Irrational Numbers',
      examName: 'Class 9 Foundation',
      year: 2026,
      language: 'BILINGUAL',
      pageCount: 12,
      fileUrl: samplePdfs[0],
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
      fileType: 'PDF',
      fileSize: '2.1 MB',
      author: 'Lo Samajh Lo Maths Team',
      difficulty: 'MEDIUM',
      isFree: true,
      isFeatured: false,
      isTrending: true,
      status: 'PUBLISHED',
      downloadsCount: 4210,
      viewsCount: 9800,
      metaTitle: 'Class 9 Maths Number System Formula Sheet PDF',
      metaDescription: 'Download Class 9 Maths Chapter 1 Number System formula and cheat sheet.',
      keywords: 'number system class 9, sankhya paddhati, maths formulas class 9',
    },
    // PYQ: UPSSSC PET 2025 Shift 1
    {
      title: 'UPSSSC PET 2025 Official Question Paper with Detailed Answer Key (Shift 1 & 2)',
      slug: 'upsssc-pet-2025-official-paper-shift-1-2-answer-key',
      description: 'उत्तर प्रदेश अधीनस्थ सेवा चयन आयोग द्वारा आयोजित PET 2025 परीक्षा का प्रथम व द्वितीय पाली का पूर्ण हल प्रश्न पत्र।',
      fullContent: '100 प्रश्नों का शत-प्रतिशत सटीक हल, विषयवार विश्लेषण: भारतीय इतिहास, भूगोल, सामान्य विज्ञान, अंकगणित, हिंदी, तर्कशक्ति एवं सामयिकी।',
      categoryId: upssscCat.id,
      materialType: 'PYQ',
      classGrade: 'Competitive Exams',
      subject: 'General Awareness',
      chapter: 'Official Exam Papers',
      topic: 'Full Length Solved Paper',
      examName: 'UPSSSC PET',
      year: 2025,
      shift: 'Shift 1 & 2',
      language: 'HINDI',
      pageCount: 32,
      fileUrl: samplePdfs[1],
      thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
      fileType: 'PDF',
      fileSize: '5.2 MB',
      author: 'Exams Research Wing',
      difficulty: 'MEDIUM',
      isFree: true,
      isFeatured: true,
      isTrending: true,
      status: 'PUBLISHED',
      downloadsCount: 11400,
      viewsCount: 34200,
      metaTitle: 'UPSSSC PET 2025 Official Question Paper PDF Download',
      metaDescription: 'Download UPSSSC PET 2025 Shift 1 & 2 solved paper with official answer key in Hindi.',
      keywords: 'upsssc pet 2025 question paper, pet shift 1 answer key, upsssc pyq pdf',
    },
    // PYQ: SSC CGL Tier-1 2024
    {
      title: 'SSC CGL Tier-1 2024 All 39 Shifts Reasoning & Quantitative Aptitude Compilation',
      slug: 'ssc-cgl-2024-tier-1-all-shifts-maths-reasoning-pyq',
      description: 'विगत वर्ष 2024 की सभी पालियों में पूछे गए मैथ्स एवं रीजनिंग के 1000+ प्रश्नों का टॉपिक-वार वर्गीकरण।',
      fullContent: 'TCS द्वारा पूछे गए लेटेस्ट पैटर्न पर आधारित: एडवांस मैथ्स (अलजेब्रा, ट्रिग्नोमेट्री, ज्योमेट्री) और अंकगणित के शॉर्टकट सॉल्यूशन।',
      categoryId: sscCat.id,
      materialType: 'PYQ',
      classGrade: 'Graduation / College',
      subject: 'Mathematics',
      chapter: 'TCS Pattern PYQs',
      topic: 'Arithmetic & Advanced Maths',
      examName: 'SSC CGL',
      year: 2024,
      shift: 'All 39 Shifts',
      language: 'BILINGUAL',
      pageCount: 145,
      fileUrl: samplePdfs[0],
      thumbnail: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=400',
      fileType: 'PDF',
      fileSize: '12.4 MB',
      author: 'SSC Expert Faculty',
      difficulty: 'HARD',
      isFree: false,
      isFeatured: true,
      isTrending: true,
      status: 'PUBLISHED',
      downloadsCount: 8900,
      viewsCount: 28100,
      metaTitle: 'SSC CGL 2024 Tier 1 All Shifts Maths & Reasoning PYQ PDF',
      metaDescription: 'Download SSC CGL 2024 TCS pattern topic-wise previous year questions compilation.',
      keywords: 'ssc cgl 2024 pyq, cgl maths solved papers, tcs pattern ssc questions',
    },
    // Handwritten Notes: Indian Polity
    {
      title: 'Indian Polity & Constitution Topper Handwritten Class Notes (भारतीय राजव्यवस्था)',
      slug: 'indian-polity-topper-handwritten-class-notes',
      description: 'संविधान की प्रस्तावना, मूल अधिकार (भाग 3), नीति निदेशक तत्व, राष्ट्रपति, संसद एवं सर्वोच्च न्यायालय के सुरुचिपूर्ण हस्तलिखित नोट्स।',
      fullContent: 'सिविल सेवा और राज्य स्तरीय परीक्षाओं के लिए तैयार किए गए सुंदर फ्लोचार्ट्स, केस लॉज एवं संशोधन अधिनियमों का संपूर्ण संकलन।',
      categoryId: generalCat.id,
      materialType: 'CLASS_NOTES',
      classGrade: 'Graduation / College',
      subject: 'Polity',
      chapter: 'Fundamental Rights & Directive Principles',
      topic: 'Articles 12 to 51A & Case Laws',
      examName: 'UPSC / UPPSC / Police',
      year: 2026,
      language: 'HINDI',
      pageCount: 88,
      fileUrl: samplePdfs[1],
      thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400',
      fileType: 'PDF',
      fileSize: '9.8 MB',
      author: 'Topper Handwritten Notes Series',
      difficulty: 'MEDIUM',
      isFree: true,
      isFeatured: true,
      isTrending: true,
      status: 'PUBLISHED',
      downloadsCount: 9400,
      viewsCount: 31200,
      metaTitle: 'Indian Polity Handwritten Notes in Hindi PDF',
      metaDescription: 'Download Free Indian Polity Topper Handwritten Notes covering articles, amendments and landmark cases.',
      keywords: 'polity handwritten notes, bhartiya samvidhan notes, upsc polity hindi',
    },
    // E-Book: Static GK & Science
    {
      title: 'Samanya Gyan Master E-Book 2026: 5000+ Topicwise Static GK & Science One-Liners',
      slug: 'samanya-gyan-master-ebook-2026-static-gk',
      description: 'रेलवे, एसएससी, पुलिस व शिक्षक भर्ती के लिए रामबाण ई-बुक — भारत का भूगोल, इतिहास, विश्व संस्थाएं, खेल व पुरस्कार।',
      fullContent: 'एक ही पुस्तक में सभी सामान्य ज्ञान विषयों का त्वरित रिवीजन। प्रत्येक अध्याय के अंत में विगत वर्षों के 50 अभ्यास प्रश्न दिए गए हैं।',
      categoryId: generalCat.id,
      materialType: 'E_BOOK',
      classGrade: 'Competitive Exams',
      subject: 'General Awareness',
      chapter: 'Static GK Capsule',
      topic: 'Geography, History, Science & Sports',
      examName: 'All Competitive Exams',
      year: 2026,
      language: 'HINDI',
      pageCount: 160,
      fileUrl: samplePdfs[0],
      thumbnail: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
      fileType: 'PDF',
      fileSize: '15.6 MB',
      author: 'Atul Agrahari',
      difficulty: 'MEDIUM',
      isFree: false,
      isFeatured: true,
      isTrending: true,
      status: 'PUBLISHED',
      downloadsCount: 14200,
      viewsCount: 45000,
      metaTitle: 'Static GK 5000 One-Liner E-Book 2026 PDF',
      metaDescription: 'Complete 2026 Static GK Master E-Book for Railway, SSC, Police exams in Hindi.',
      keywords: 'static gk ebook, samanya gyan pdf, railway gk book, ssc gk master pdf',
    },
    // Practice Set: General Hindi 500 MCQs
    {
      title: 'General Hindi 500 High-Yield MCQ Practice Set (सामान्य हिन्दी वस्तुनिष्ठ संग्रह)',
      slug: 'general-hindi-500-mcq-practice-set',
      description: 'संधि, समास, विलोम, पर्यायवाची, मुहावरे, वर्तनी शुद्धि और रस-छंद-अलंकार के चुनिंदा 500 प्रश्न उत्तर सहित।',
      fullContent: 'UPSSSC PET, UP Police SI एवं कांस्टेबल तथा शिक्षक भर्ती में पूरे अंक प्राप्त करने हेतु तैयार किया गया विशेष अभ्यास सेट।',
      categoryId: upssscCat.id,
      materialType: 'PRACTICE_SET',
      classGrade: 'Competitive Exams',
      subject: 'General Hindi',
      chapter: 'Hindi Grammar MCQs',
      topic: 'Sandhi, Samas, Muhavare & Vartani',
      examName: 'UP Police & UPSSSC',
      year: 2026,
      language: 'HINDI',
      pageCount: 45,
      fileUrl: samplePdfs[1],
      thumbnail: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400',
      fileType: 'PDF',
      fileSize: '3.8 MB',
      author: 'Hindi Department',
      difficulty: 'MEDIUM',
      isFree: true,
      isFeatured: false,
      isTrending: true,
      status: 'PUBLISHED',
      downloadsCount: 5600,
      viewsCount: 17800,
      metaTitle: 'General Hindi 500 MCQ Practice Set PDF',
      metaDescription: 'Download 500 General Hindi Practice Questions for UP Police and UPSSSC exams.',
      keywords: 'hindi practice set, samanya hindi mcq, up police hindi questions',
    },
  ];

  for (const m of materialsToSeed) {
    await prisma.material.upsert({
      where: { slug: m.slug },
      update: m,
      create: m,
    });
  }
  console.log(`✅ Seeded ${materialsToSeed.length} comprehensive Study Materials.`);

  // 4. Seed Current Affairs
  const currentAffairsList = [
    {
      title: 'National Digital Education Architecture 2.0 (NDEAR) Launched by Education Ministry',
      slug: 'national-digital-education-architecture-2-launched-2026',
      category: 'NATIONAL',
      date: new Date('2026-09-12T10:00:00Z'),
      content: 'शिक्षा मंत्रालय ने भारत के सभी प्राथमिक एवं माध्यमिक विद्यालयों में कृत्रिम बुद्धिमत्ता (AI) आधारित शिक्षण को बढ़ावा देने के लिए NDEAR 2.0 फ्रेमवर्क का शुभारंभ किया है। इस पहल का मुख्य उद्देश्य छात्रों को क्षेत्रीय भाषाओं में उच्च गुणवत्ता की डिजिटल शिक्षण सामग्री और संवादात्मक ट्यूटरिंग प्रदान करना है।\n\nप्रमुख बिंदु:\n1. 22 संविधानिक भाषाओं में डिजिटल पाठ्यपुस्तकें उपलब्ध कराई जाएंगी।\n2. शिक्षकों के लिए स्वचालित असेसमेंट टूल्स का समावेश।\n3. ग्रामीण क्षेत्रों में बिना इंटरनेट के भी ऑफलाइन कंटेंट सिंक की सुविधा।',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600',
      source: 'Press Information Bureau (PIB)',
      tags: 'Education, AI, NEP 2020, Digital India',
      status: 'PUBLISHED',
      viewsCount: 1840,
    },
    {
      title: 'ISRO Successfully Deploys Next-Gen Earth Observation Satellite EOS-09',
      slug: 'isro-deploys-next-gen-earth-observation-satellite-eos-09',
      category: 'SCIENCE_TECH',
      date: new Date('2026-09-10T08:30:00Z'),
      content: 'भारतीय अंतरिक्ष अनुसंधान संगठन (ISRO) ने सतीश धवन अंतरिक्ष केंद्र (श्रीहरिकोटा) से PSLV-C61 रॉकेट के माध्यम से अत्याधुनिक पृथ्वी अवलोकन उपग्रह EOS-09 को सफलतापूर्वक सूर्य-तुल्यकालिक कक्षा में स्थापित कर दिया है। यह उपग्रह कृषि, वानिकी और आपदा प्रबंधन में उच्च-विभेदन वाली रडार छवियां प्रदान करेगा।',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
      source: 'ISRO Official Bulletin',
      tags: 'ISRO, Space, EOS-09, PSLV, Science & Tech',
      status: 'PUBLISHED',
      viewsCount: 2950,
    },
    {
      title: 'India Wins 14 Gold Medals at Asian Athletics Championship 2026',
      slug: 'india-wins-14-gold-medals-asian-athletics-championship-2026',
      category: 'SPORTS',
      date: new Date('2026-09-08T14:00:00Z'),
      content: 'भारतीय एथलीटों ने एशियाई एथलेटिक्स चैंपियनशिप 2026 में इतिहास रचते हुए कुल 34 पदक जीते, जिनमें 14 स्वर्ण, 11 रजत और 9 कांस्य पदक शामिल हैं। भाला फेंक, लंबी कूद और 4x400 मीटर रिले में भारतीय टीमों ने नए चैंपियनशिप रिकॉर्ड दर्ज किए।',
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600',
      source: 'Sports Authority of India (SAI)',
      tags: 'Sports, Asian Athletics, Gold Medals, Javelin',
      status: 'PUBLISHED',
      viewsCount: 3120,
    },
    {
      title: 'RBI Monetary Policy Committee Keeps Repo Rate Unchanged at 6.25%',
      slug: 'rbi-mpc-keeps-repo-rate-unchanged-september-2026',
      category: 'ECONOMY',
      date: new Date('2026-09-05T11:00:00Z'),
      content: 'भारतीय रिजर्व बैंक की मौद्रिक नीति समिति (MPC) ने सितंबर 2026 की द्विमासिक बैठक में नीतिगत रेपो दर को 6.25% पर स्थिर रखने का निर्णय लिया है। गवर्नर ने मुद्रास्फीति को 4% के लक्ष्य तक बनाए रखने और आर्थिक विकास को गति प्रदान करने के रुख को दोहराया।',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600',
      source: 'Reserve Bank of India (RBI)',
      tags: 'RBI, Economy, Repo Rate, Inflation, Banking',
      status: 'PUBLISHED',
      viewsCount: 2240,
    },
  ];

  for (const ca of currentAffairsList) {
    await prisma.currentAffairs.upsert({
      where: { slug: ca.slug },
      update: ca,
      create: ca,
    });
  }
  console.log(`✅ Seeded ${currentAffairsList.length} Current Affairs articles.`);

  console.log('🎉 Seeding completed successfully!');
}

seedMaterials()
  .catch((e) => {
    console.error('Error seeding materials:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
