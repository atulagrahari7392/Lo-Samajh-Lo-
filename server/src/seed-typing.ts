import { prisma } from './db';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function seedTyping() {
  console.log('⌨️  Seeding Typing Hub: Government Exams, Passages, Courses & Lessons...');

  // 1. Government Typing Exams
  const examsData = [
    {
      name: 'SSC CHSL Typing Test (Data Entry Operator & LDC)',
      slug: 'ssc-chsl-typing-test',
      category: 'SSC',
      post: 'Lower Division Clerk (LDC) / DEO',
      department: 'Staff Selection Commission (SSC)',
      language: 'BOTH',
      keyboardLayout: 'QWERTY',
      durationSeconds: 600, // 10 minutes
      targetSpeed: 35, // 35 WPM English, 30 WPM Hindi
      minAccuracy: 93, // 7% error allowed
      backspaceRule: 'ALLOWED',
      penaltyRate: 1.0,
      description: 'SSC CHSL आधिकारिक परीक्षा पैटर्न: 10 मिनट में 1750 Key Depressions (35 WPM English) अथवा 1500 Key Depressions (30 WPM Hindi)।',
      instructions: '1. परीक्षा की कुल अवधि 10 मिनट है।\n2. अंग्रेजी में न्यूनतम गति 35 शब्द प्रति मिनट (WPM) तथा हिंदी में 30 शब्द प्रति मिनट अनिवार्य है।\n3. बैकस्पेस का प्रयोग अनुमत है।\n4. पैराग्राफ पूरा होने के बाद स्वतः सबमिट होगा।',
      isFeatured: true,
      status: 'PUBLISHED',
    },
    {
      name: 'Railway RRB NTPC Senior Clerk-cum-Typist & Junior Clerk',
      slug: 'railway-rrb-ntpc-typing-test',
      category: 'RAILWAY',
      post: 'Senior Clerk-cum-Typist / Junior Accounts Assistant',
      department: 'Railway Recruitment Board (RRB)',
      language: 'BOTH',
      keyboardLayout: 'QWERTY',
      durationSeconds: 600, // 10 minutes
      targetSpeed: 30, // 30 WPM English or 25 WPM Hindi
      minAccuracy: 95, // 5% error allowed
      backspaceRule: 'ALLOWED',
      penaltyRate: 1.0,
      description: 'RRB NTPC स्किल टेस्ट: 10 मिनट में अंग्रेजी 30 WPM (1500 डिप्रेशन) या हिंदी 25 WPM (1250 डिप्रेशन - Krutidev/Mangal)।',
      instructions: '1. रेलवे स्किल टेस्ट केवल क्वालिफाइंग प्रकृति का है।\n2. हिंदी में कृतिदेव (Krutidev 010) अथवा मंगल (Mangal) फॉन्ट का चयन कर सकते हैं।\n3. बैकस्पेस सुविधा उपलब्ध है।',
      isFeatured: true,
      status: 'PUBLISHED',
    },
    {
      name: 'Allahabad High Court RO/ARO Review Officer Computer Typing',
      slug: 'allahabad-high-court-ro-aro-typing',
      category: 'HIGH_COURT',
      post: 'Review Officer (RO) / Assistant Review Officer (ARO)',
      department: 'High Court of Judicature at Allahabad',
      language: 'ENGLISH',
      keyboardLayout: 'QWERTY',
      durationSeconds: 1200, // 20 minutes
      targetSpeed: 25, // 25 WPM English
      minAccuracy: 95,
      backspaceRule: 'ALLOWED',
      penaltyRate: 1.5,
      description: 'इलाहाबाद उच्च न्यायालय समीक्षा अधिकारी परीक्षा: 500 शब्दों का पैराग्राफ 20 मिनट में (25 WPM अनिवार्य)।',
      instructions: '1. 50 अंकों का कंप्यूटर टाइपिंग टेस्ट।\n2. न्यूनतम गति 25 WPM तथा 17 अंक प्राप्त करना अनिवार्य है।\n3. फॉर्मेटिंग और स्पेसिंग का विशेष ध्यान रखें।',
      isFeatured: true,
      status: 'PUBLISHED',
    },
    {
      name: 'UP Police Computer Operator Grade-A & ASI (Clerk)',
      slug: 'up-police-computer-operator-typing',
      category: 'POLICE',
      post: 'Computer Operator Grade-A / Clerk',
      department: 'UP Police Recruitment and Promotion Board (UPPRPB)',
      language: 'BOTH',
      keyboardLayout: 'MANGAL',
      durationSeconds: 900, // 15 minutes
      targetSpeed: 25, // 25 WPM Hindi (Unicode/Inscript), 30 WPM English
      minAccuracy: 85,
      backspaceRule: 'ALLOWED',
      penaltyRate: 1.0,
      description: 'यूपी पुलिस भर्ती: हिंदी टाइपिंग 25 WPM (यूनिकोड/इनस्क्रिप्ट) एवं अंग्रेजी टाइपिंग 30 WPM (85% न्यूनतम शुद्धता)।',
      instructions: '1. हिंदी टाइपिंग हेतु Mangal / Inscript लेआउट अनिवार्य है।\n2. 15 मिनट की परीक्षा में 85% शुद्धता के साथ 25 WPM गति आवश्यक है।',
      isFeatured: true,
      status: 'PUBLISHED',
    },
    {
      name: 'UPSSSC Junior Assistant & Clerk Typing Skill Test',
      slug: 'upsssc-junior-assistant-typing-test',
      category: 'UPSSSC',
      post: 'Junior Assistant / Kanishtha Sahayak',
      department: 'Uttar Pradesh Subordinate Services Selection Commission',
      language: 'BOTH',
      keyboardLayout: 'KRUTIDEV',
      durationSeconds: 300, // 5 minutes Hindi + 5 minutes English
      targetSpeed: 25, // 25 WPM Hindi (Krutidev/Mangal), 30 WPM English
      minAccuracy: 90,
      backspaceRule: 'ALLOWED',
      penaltyRate: 1.0,
      description: 'UPSSSC कनिष्ठ सहायक: हिंदी 25 WPM (5 मिनट) तथा अंग्रेजी 30 WPM (5 मिनट) दोनों उत्तीर्ण करना अनिवार्य।',
      instructions: '1. दोनों भाषाओं में उत्तीर्ण होना आवश्यक है।\n2. हिंदी में Krutidev 010 अथवा Mangal फॉन्ट उपलब्ध रहेगा।',
      isFeatured: true,
      status: 'PUBLISHED',
    },
  ];

  const createdExams: any[] = [];
  for (const e of examsData) {
    const exam = await prisma.typingExam.upsert({
      where: { slug: e.slug },
      update: e,
      create: e,
    });
    createdExams.push(exam);
  }
  console.log(`✅ Seeded ${createdExams.length} Government Typing Exams.`);

  // 2. Typing Passages (Exam specific, practice, and Hindi)
  const passagesData = [
    {
      title: 'SSC CHSL Official Model Passage #1: Digital India and Good Governance',
      slug: 'ssc-chsl-official-model-passage-1',
      examId: createdExams[0]?.id,
      examCategory: 'SSC',
      language: 'ENGLISH',
      keyboardLayout: 'QWERTY',
      category: 'EXAM_MOCK',
      passageText: 'Digital India is a flagship programme of the Government of India with a vision to transform India into a digitally empowered society and knowledge economy. The initiative includes plans to connect rural areas with high speed internet networks and promote digital literacy. The focus is to provide government services electronically to citizens by reducing paperwork and creating a transparent governance mechanism. A digitally connected India can facilitate rapid economic growth and improve the quality of education and healthcare services across the country.',
      difficulty: 'MEDIUM',
      durationSeconds: 600,
      wordCount: 84,
      characterCount: 546,
      source: 'SSC Official Previous Paper',
      year: 2025,
      isFeatured: true,
      status: 'PUBLISHED',
    },
    {
      title: 'Railway NTPC English Typing: Indian Railways Modernization and Vande Bharat',
      slug: 'railway-ntpc-english-typing-modernization',
      examId: createdExams[1]?.id,
      examCategory: 'RAILWAY',
      language: 'ENGLISH',
      keyboardLayout: 'QWERTY',
      category: 'EXAM_MOCK',
      passageText: 'Indian Railways is one of the largest rail networks in the world and plays a vital role in national integration and economic prosperity. In recent years the network has seen massive transformations with the introduction of Vande Bharat express trains station redevelopment projects and the installation of automatic train protection systems known as Kavach. Enhanced safety punctuality and passenger amenities continue to be the primary objectives of ongoing modernization efforts.',
      difficulty: 'MEDIUM',
      durationSeconds: 600,
      wordCount: 76,
      characterCount: 512,
      source: 'RRB NTPC Previous Exam',
      year: 2024,
      isFeatured: true,
      status: 'PUBLISHED',
    },
    {
      title: 'Allahabad High Court Legal Typing: Constitutional Principles and Rule of Law',
      slug: 'allahabad-high-court-legal-typing-rule-of-law',
      examId: createdExams[2]?.id,
      examCategory: 'HIGH_COURT',
      language: 'ENGLISH',
      keyboardLayout: 'QWERTY',
      category: 'EXAM_MOCK',
      passageText: 'The Constitution of India guarantees justice liberty equality and fraternity to all its citizens. Judicial review is a fundamental feature of the constitutional framework which empowers the judiciary to protect basic human rights and preserve the balance of power between different organs of the state. The doctrine of the rule of law implies that no individual is above the law and every person is subjected to the jurisdiction of ordinary courts of justice irrespective of their position or status.',
      difficulty: 'HARD',
      durationSeconds: 1200,
      wordCount: 84,
      characterCount: 554,
      source: 'High Court Legal Drafting',
      year: 2025,
      isFeatured: true,
      status: 'PUBLISHED',
    },
    {
      title: 'UPSSSC / UP Police Hindi Typing: भारत में पंचायती राज एवं ग्रामीण विकास',
      slug: 'upsssc-hindi-typing-panchayati-raj',
      examId: createdExams[4]?.id,
      examCategory: 'UPSSSC',
      language: 'HINDI',
      keyboardLayout: 'MANGAL',
      category: 'EXAM_MOCK',
      passageText: 'भारत में पंचायती राज व्यवस्था लोकतंत्र की आधारशिला है। 73वें संविधान संशोधन अधिनियम द्वारा ग्रामीण स्थानीय निकायों को संवैधानिक दर्जा प्रदान किया गया। इसके माध्यम से ग्राम स्तर पर विकास योजनाओं का निर्माण और क्रियान्वयन जनता की प्रत्यक्ष सहभागिता से सुनिश्चित होता है। महिला सशक्तिकरण की दृष्टि से पंचायतों में महिलाओं को 33 प्रतिशत आरक्षण प्रदान किया गया है जिससे ग्रामीण भारत में व्यापक सामाजिक परिवर्तन देखने को मिल रहा है।',
      difficulty: 'MEDIUM',
      durationSeconds: 300,
      wordCount: 68,
      characterCount: 420,
      source: 'UPSSSC Official Typing Test',
      year: 2025,
      isFeatured: true,
      status: 'PUBLISHED',
    },
    {
      title: 'General English Speed Builder: Habit Formation and Daily Productivity',
      slug: 'general-english-speed-builder-habits',
      examCategory: 'GENERAL',
      language: 'ENGLISH',
      keyboardLayout: 'QWERTY',
      category: 'PRACTICE',
      passageText: 'Success is the product of daily habits and consistent dedication rather than once in a lifetime transformations. Small improvements when repeated every single day accumulate into remarkable achievements over time. If you want to master typing or any other skill focus on making incremental gains in your speed and accuracy without worrying excessively about immediate perfection.',
      difficulty: 'EASY',
      durationSeconds: 180,
      wordCount: 60,
      characterCount: 382,
      source: 'Standard Practice Series',
      year: 2026,
      isFeatured: false,
      status: 'PUBLISHED',
    },
    {
      title: '1-Minute Placement Assessment: Foundation Typing Evaluation',
      slug: '1-minute-placement-assessment-english',
      examCategory: 'GENERAL',
      language: 'ENGLISH',
      keyboardLayout: 'QWERTY',
      category: 'ASSESSMENT',
      passageText: 'The quick brown fox jumps over the lazy dog while practicing touch typing on a mechanical keyboard with precision and high speed.',
      difficulty: 'EASY',
      durationSeconds: 60,
      wordCount: 22,
      characterCount: 130,
      source: 'Diagnostic Placement Test',
      year: 2026,
      isFeatured: true,
      status: 'PUBLISHED',
    },
  ];

  for (const p of passagesData) {
    await prisma.typingTest.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }
  console.log(`✅ Seeded ${passagesData.length} Typing Passages.`);

  // 3. Learning Courses: English Typing Academy & Hindi Typing Academy
  const engCourse = await prisma.typingCourse.upsert({
    where: { slug: 'complete-english-touch-typing-course' },
    update: {},
    create: {
      title: 'Complete English Touch Typing Course (Zero to 50+ WPM)',
      slug: 'complete-english-touch-typing-course',
      language: 'ENGLISH',
      keyboardLayout: 'QWERTY',
      description: 'बिना कीबोर्ड देखे उंगलियों की सही स्थिति के साथ 50+ WPM गति प्राप्त करने का 12-मॉड्यूल संपूर्ण कोर्स।',
      level: 'BEGINNER',
      order: 1,
      isActive: true,
    },
  });

  const hindiCourse = await prisma.typingCourse.upsert({
    where: { slug: 'complete-hindi-typing-mangal-krutidev' },
    update: {},
    create: {
      title: 'Complete Hindi Typing Course (Mangal & Krutidev 010)',
      slug: 'complete-hindi-typing-mangal-krutidev',
      language: 'HINDI',
      keyboardLayout: 'MANGAL',
      description: 'सरकारी परीक्षाओं (UP Police, UPSSSC, High Court) के लिए हिंदी वर्णमाला, मात्राएं और संयुक्त अक्षर अभ्यास।',
      level: 'BEGINNER',
      order: 2,
      isActive: true,
    },
  });

  // Lessons for English Course
  const englishLessons = [
    {
      moduleName: 'Module 1: Keyboard Introduction & Posture',
      title: 'Lesson 1: Home Row Foundation (ASDF JKL;)',
      lessonOrder: 1,
      instructions: 'दोनों हाथों की तर्जनी उंगलियों को F और J की कुंजियों पर रखें। बिना देखे केवल होम रो टाइप करें।',
      practiceText: 'asdf jkl; asdf jkl; a s d f j k l ; asdf jkl;',
      targetSpeed: 15,
      minAccuracy: 90,
      highlightKeys: 'asdfjkl;',
      fingerTips: 'Left hand on ASDF, Right hand on JKL;',
    },
    {
      moduleName: 'Module 2: Top Row Mastery',
      title: 'Lesson 2: Reaching Top Row Keys (QWERTY UIOP)',
      lessonOrder: 2,
      instructions: 'होम रो से उंगलियों को ऊपर की पंक्ति (Q W E R T Y U I O P) पर ले जाएं और वापस होम रो पर लाएं।',
      practiceText: 'qwer tyui op qwer uiop were quiet write tree power',
      targetSpeed: 20,
      minAccuracy: 92,
      highlightKeys: 'qwertyuiop',
      fingerTips: 'Index reaches R/T and U/Y',
    },
    {
      moduleName: 'Module 3: Bottom Row Mastery',
      title: 'Lesson 3: Bottom Row Navigation (ZXCV BNM)',
      lessonOrder: 3,
      instructions: 'उंगलियों को नीचे की पंक्ति पर सावधानीपूर्वक ले जाएं। स्पेसबार के लिए दोनों में से किसी एक अंगूठे का प्रयोग करें।',
      practiceText: 'zxcv bnm zxcv bnm zoom calm view back next man cab',
      targetSpeed: 20,
      minAccuracy: 90,
      highlightKeys: 'zxcvbnm',
      fingerTips: 'Left pinky for Z, left ring for X',
    },
    {
      moduleName: 'Module 4: Common Words & Muscle Memory',
      title: 'Lesson 4: Top 50 High-Frequency English Words',
      lessonOrder: 4,
      instructions: 'इन शब्दों का अभ्यास आपकी गति को सीधे 30 WPM तक पहुंचाएगा। लय और निरंतरता बनाए रखें।',
      practiceText: 'the and that have for with this from they word what some time make like into',
      targetSpeed: 25,
      minAccuracy: 94,
      highlightKeys: 'abcdefghijklmnopqrstuvwxyz',
      fingerTips: 'Keep a steady rhythm without pausing',
    },
  ];

  for (const l of englishLessons) {
    await prisma.typingLesson.create({
      data: {
        courseId: engCourse.id,
        ...l,
      },
    });
  }

  // Lessons for Hindi Course
  const hindiLessons = [
    {
      moduleName: 'Module 1: वर्णमाला एवं होम रो',
      title: 'Lesson 1: होम रो व्यंजन एवं स्वर पहचान (क ख ग घ)',
      lessonOrder: 1,
      instructions: 'मंगल (इनस्क्रिप्ट) अथवा कृतिदेव फॉन्ट के अनुसार होम रो कुंजियों का अभ्यास करें।',
      practiceText: 'क ख ग घ च छ ज झ ट ठ ड ढ त थ द ध न प फ ब भ म',
      targetSpeed: 15,
      minAccuracy: 90,
      highlightKeys: 'kkgghh',
      fingerTips: 'हिंदी में मात्रा और हलंत का विशेष ध्यान रखें',
    },
    {
      moduleName: 'Module 2: मात्रा अभ्यास (Matras)',
      title: 'Lesson 2: इ, ई, उ, ऊ और ए की मात्राएं',
      lessonOrder: 2,
      instructions: 'मात्राओं के सही क्रम का अभ्यास करें ताकि सरकारी परीक्षा में गलतियां न्यूनतम हों।',
      practiceText: 'कि की कु कू के कै को कौ कं कः दिन रात नदी पानी भारत देश',
      targetSpeed: 18,
      minAccuracy: 92,
      highlightKeys: 'matras',
      fingerTips: 'Shift कुंजी के साथ दीर्घ मात्राएं टाइप होती हैं',
    },
  ];

  for (const l of hindiLessons) {
    await prisma.typingLesson.create({
      data: {
        courseId: hindiCourse.id,
        ...l,
      },
    });
  }
  console.log(`✅ Seeded Courses and Lessons for English and Hindi.`);

  // 4. Daily Challenge
  await prisma.typingDailyChallenge.create({
    data: {
      title: "Today's Daily Typing Challenge: 5-Minute Speed & Accuracy Sprint",
      date: new Date(),
      language: 'ENGLISH',
      passageText: 'Consistent typing practice trains your fingers to find keys through muscle memory rather than conscious sight. When you practice every day your brain builds neural pathways that make speed natural and effortless.',
      durationSeconds: 300,
      status: 'PUBLISHED',
    },
  });
  console.log('✅ Seeded Daily Challenge.');

  console.log('🎉 Typing Hub database initialization complete!');
}

seedTyping()
  .catch((e) => {
    console.error('Error seeding typing data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
