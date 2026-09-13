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

async function seedTestSeries() {
  console.log('📚 Seeding Test Series Platform: Packages, Tests, Sections & Questions...');

  // 1. Create or Find UP Police & BSSC Categories if needed
  let upPoliceCat = await prisma.category.findFirst({ where: { name: { contains: 'Police' } } });
  if (!upPoliceCat) {
    upPoliceCat = await prisma.category.create({
      data: {
        name: 'UP Police',
        slug: 'up-police',
        color: '#6C63FF',
        description: 'Uttar Pradesh Police recruitment and exam preparations.',
      },
    });
  }

  let sscCat = await prisma.category.findFirst({ where: { name: { contains: 'SSC' } } });
  if (!sscCat) {
    sscCat = await prisma.category.create({
      data: {
        name: 'SSC & State Exams',
        slug: 'ssc-state-exams',
        color: '#3B82F6',
        description: 'Staff Selection Commission and State level competitive examinations.',
      },
    });
  }

  // 2. Create Test Series Packages matching the User's PDF
  const seriesData = [
    {
      title: 'UP Police ASI Mock Test 2025 - 26',
      slug: 'up-police-asi-mock-test-2025-26',
      examCategory: 'UP Police',
      subTitle: 'Target UP Police Assistant Sub Inspector & Clerk Vacancy',
      description:
        'Complete test series strictly matching latest UPPRPB exam syllabus: Live Mocks, Subject Tests, Sectional Tests, Chapter Drills, and Full Length Mock Papers with All-India Rankings.',
      badge: 'TOP CHOICE',
      totalTestsCount: 374,
      freeTestsCount: 3,
      rating: 4.9,
      enrolledCount: 49300,
      languages: 'English, Hindi',
      validityDays: 365,
      price: 199,
      originalPrice: 499,
      isFeatured: true,
      status: 'PUBLISHED',
    },
    {
      title: 'BSSC CGL Mock Test 2025',
      slug: 'bssc-cgl-mock-test-2025',
      examCategory: 'BSSC',
      subTitle: 'Bihar 4th Graduate Level Combined Competitive Exam',
      description:
        'Comprehensive mock test series for BSSC CGL 4th Notification: Prelims and Mains full mocks with detailed step-by-step Hindi & English solutions.',
      badge: 'POPULAR',
      totalTestsCount: 350,
      freeTestsCount: 5,
      rating: 4.8,
      enrolledCount: 62400,
      languages: 'English, Hindi',
      validityDays: 365,
      price: 249,
      originalPrice: 599,
      isFeatured: true,
      status: 'PUBLISHED',
    },
    {
      title: 'Bihar SSC (BSSC) Inter Level Mock Test 2024 - 26',
      slug: 'bihar-ssc-bssc-inter-level-mock-test-2024-26',
      examCategory: 'BSSC',
      subTitle: '12,199+ Vacancies Inter Level Examination Pack',
      description:
        'Master General Studies, General Science & Mathematics, and Mental Ability test papers. Real exam time constraints with exact negative marking formula.',
      badge: 'TRENDING',
      totalTestsCount: 616,
      freeTestsCount: 4,
      rating: 4.9,
      enrolledCount: 110000,
      languages: 'English, Hindi',
      validityDays: 365,
      price: 149,
      originalPrice: 399,
      isFeatured: true,
      status: 'PUBLISHED',
    },
    {
      title: 'UP Police Computer Operator Grade A Mock Test',
      slug: 'up-police-computer-operator-grade-a-mock-test',
      examCategory: 'UP Police',
      subTitle: 'Computer Science, GK, Mental Aptitude & Reasoning Mock Pack',
      description:
        'Targeted mock tests strictly covering Computer Science syllabus (DBMS, Networking, OS) alongside General Knowledge and Mental Ability.',
      badge: 'SPECIAL',
      totalTestsCount: 196,
      freeTestsCount: 2,
      rating: 4.7,
      enrolledCount: 34800,
      languages: 'English, Hindi',
      validityDays: 180,
      price: 179,
      originalPrice: 449,
      isFeatured: true,
      status: 'PUBLISHED',
    },
  ];

  const createdSeriesMap: Record<string, any> = {};
  for (const s of seriesData) {
    const series = await prisma.testSeries.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
    createdSeriesMap[s.slug] = series;
  }
  console.log(`✅ Seeded ${seriesData.length} Test Series Packages.`);

  const upPoliceSeries = createdSeriesMap['up-police-asi-mock-test-2025-26'];

  // 3. Create Tests under UP Police ASI Series matching subcategories
  const testsToCreate = [
    {
      title: 'UP Police ASI (अवसर) : Mini Live Test',
      slug: 'up-police-asi-mini-live-test',
      seriesId: upPoliceSeries.id,
      categoryId: upPoliceCat.id,
      testType: 'LIVE',
      subCategory: 'Live Test',
      description: 'Official all-India live test simulation with live leaderboard and timing.',
      durationMinutes: 50,
      totalMarks: 120,
      passMarks: 40,
      negativeMarking: 0.25,
      isFree: true,
      isLive: true,
      scheduledStart: new Date(Date.now() - 3600000 * 24),
      scheduledEnd: new Date(Date.now() + 3600000 * 48),
      instructions:
        '1. The clock will be set at the server.\n2. Each question carries 2 marks with 0.25 negative marking.\n3. Test cannot be resumed once time expires.',
      status: 'PUBLISHED',
    },
    {
      title: 'General Awareness/Current Affairs Sectional Test 1',
      slug: 'general-awareness-current-affairs-sectional-test-1',
      seriesId: upPoliceSeries.id,
      categoryId: upPoliceCat.id,
      testType: 'SECTIONAL',
      subCategory: 'Sectional Test',
      description: 'Indian Constitution, Polity, Science, and National Current Events.',
      durationMinutes: 30,
      totalMarks: 100,
      passMarks: 35,
      negativeMarking: 0.25,
      isFree: true,
      instructions:
        '1. The test contains 50 questions.\n2. Each question has 4 options out of which only one is correct.\n3. Total time is 30 minutes. +2 for correct, -0.5 for incorrect.',
      status: 'PUBLISHED',
    },
    {
      title: 'UP Police ASI Full Test 1',
      slug: 'up-police-asi-full-test-1',
      seriesId: upPoliceSeries.id,
      categoryId: upPoliceCat.id,
      testType: 'FULL_LENGTH',
      subCategory: 'Full Test',
      description: 'Complete 200-question comprehensive mock paper with all 4 sections.',
      durationMinutes: 150,
      totalMarks: 400,
      passMarks: 140,
      negativeMarking: 0.5,
      isFree: true,
      instructions:
        '1. Total 200 questions across 4 sections: General Hindi, GK & Law, Numerical Ability, and Mental Aptitude/Reasoning.\n2. Duration: 150 minutes.\n3. Each question carries 2 marks.',
      status: 'PUBLISHED',
    },
    {
      title: 'UP Police ASI Full Test 2',
      slug: 'up-police-asi-full-test-2',
      seriesId: upPoliceSeries.id,
      categoryId: upPoliceCat.id,
      testType: 'FULL_LENGTH',
      subCategory: 'Full Test',
      description: 'Standard Full Length Test 2 matching latest trend and difficulty.',
      durationMinutes: 150,
      totalMarks: 400,
      passMarks: 140,
      negativeMarking: 0.5,
      isFree: false,
      instructions: 'Full length exam instructions apply.',
      status: 'PUBLISHED',
    },
    {
      title: 'UP Police ASI Full Test 3',
      slug: 'up-police-asi-full-test-3',
      seriesId: upPoliceSeries.id,
      categoryId: upPoliceCat.id,
      testType: 'FULL_LENGTH',
      subCategory: 'Full Test',
      description: 'High difficulty challenge mock paper.',
      durationMinutes: 150,
      totalMarks: 400,
      passMarks: 140,
      negativeMarking: 0.5,
      isFree: false,
      instructions: 'Full length exam instructions apply.',
      status: 'PUBLISHED',
    },
    {
      title: 'Polity & Constitution Chapter Test 1',
      slug: 'polity-constitution-chapter-test-1',
      seriesId: upPoliceSeries.id,
      categoryId: upPoliceCat.id,
      testType: 'CHAPTER',
      subCategory: 'Chapter Test',
      description: 'Preamble, Fundamental Rights, Duties & DPSP Chapter Drill.',
      durationMinutes: 20,
      totalMarks: 50,
      passMarks: 20,
      negativeMarking: 0.25,
      isFree: true,
      instructions: 'Chapter practice test.',
      status: 'PUBLISHED',
    },
    {
      title: 'Numerical & Mental Ability Subject Test 1',
      slug: 'numerical-mental-ability-subject-test-1',
      seriesId: upPoliceSeries.id,
      categoryId: upPoliceCat.id,
      testType: 'SUBJECT',
      subCategory: 'Subject Test',
      description: 'Arithmetic, Number Systems, Percentages & Data Interpretation.',
      durationMinutes: 45,
      totalMarks: 100,
      passMarks: 35,
      negativeMarking: 0.25,
      isFree: true,
      instructions: 'Subject test instructions apply.',
      status: 'PUBLISHED',
    },
    {
      title: 'UP Police ASI Previous Year Paper 2021 (Shift 1)',
      slug: 'up-police-asi-pyp-2021-shift-1',
      seriesId: upPoliceSeries.id,
      categoryId: upPoliceCat.id,
      testType: 'PYQ',
      subCategory: 'PYPs',
      description: 'Official original question paper asked in UP Police ASI 2021 exam.',
      durationMinutes: 150,
      totalMarks: 400,
      passMarks: 140,
      negativeMarking: 0.5,
      isFree: true,
      instructions: 'Official exam paper.',
      status: 'PUBLISHED',
    },
  ];

  const createdTestsMap: Record<string, any> = {};
  for (const t of testsToCreate) {
    const test = await prisma.test.upsert({
      where: { slug: t.slug },
      update: t,
      create: t,
    });
    createdTestsMap[t.slug] = test;
  }
  console.log(`✅ Seeded ${testsToCreate.length} Tests with subcategories.`);

  // 4. Create Questions with authentic bilingual Hindi & English text matching PDF
  const rawQuestions = [
    {
      questionText: 'The aim of Directive Principles of State Policy is:',
      questionHindi: 'राज्य नीति के निदेशक सिद्धांतों का उद्देश्य है:',
      questionEnglish: 'The aim of Directive Principles of State Policy is:',
      options: JSON.stringify([
        'समाजवादी राज्य की स्थापना करना',
        'स्वतंत्र समाज की स्थापना करना',
        'कल्याणकारी राज्य की स्थापना करना',
        "गांधी जी के 'राम राज्य' की स्थापना करना",
      ]),
      optionsHindi: JSON.stringify([
        'समाजवादी राज्य की स्थापना करना',
        'स्वतंत्र समाज की स्थापना करना',
        'कल्याणकारी राज्य की स्थापना करना',
        "गांधी जी के 'राम राज्य' की स्थापना करना",
      ]),
      optionsEnglish: JSON.stringify([
        'To establish a socialist state',
        'To establish an independent society',
        'To establish a welfare state',
        "To establish 'Ram Rajya' of Gandhiji",
      ]),
      correctAnswer: '2', // 0-indexed: Option C
      explanation:
        'Directive Principles of State Policy (Part IV, Articles 36-51) aim to establish social and economic democracy through a Welfare State in India.',
      explanationHindi:
        'संविधान के भाग IV (अनुच्छेद 36-51) में वर्णित राज्य के नीति निदेशक तत्वों का मुख्य उद्देश्य भारत में एक "कल्याणकारी राज्य" (Welfare State) की स्थापना करना है।',
      explanationEnglish:
        'Directive Principles of State Policy (Part IV, Articles 36-51) aim to establish social and economic democracy through a Welfare State in India.',
      subject: 'Polity',
      chapter: 'Directive Principles',
      topic: 'Indian Constitution',
      difficulty: 'MEDIUM',
      marks: 2.0,
      negativeMarks: 0.5,
    },
    {
      questionText: 'Which Article of the Indian Constitution abolishes Untouchability?',
      questionHindi: 'भारतीय संविधान का कौन सा अनुच्छेद अस्पृश्यता (छुआछूत) का उन्मूलन करता है?',
      questionEnglish: 'Which Article of the Indian Constitution abolishes Untouchability?',
      options: JSON.stringify(['अनुच्छेद 14', 'अनुच्छेद 15', 'अनुच्छेद 17', 'अनुच्छेद 18']),
      optionsHindi: JSON.stringify(['अनुच्छेद 14', 'अनुच्छेद 15', 'अनुच्छेद 17', 'अनुच्छेद 18']),
      optionsEnglish: JSON.stringify(['Article 14', 'Article 15', 'Article 17', 'Article 18']),
      correctAnswer: '2',
      explanation:
        'Article 17 of the Constitution of India abolishes "Untouchability" and forbids its practice in any form.',
      explanationHindi:
        'भारतीय संविधान का अनुच्छेद 17 अस्पृश्यता को समाप्त करता है और किसी भी रूप में इसके आचरण का निषेध करता है।',
      explanationEnglish:
        'Article 17 of the Constitution of India abolishes "Untouchability" and forbids its practice in any form.',
      subject: 'Polity',
      chapter: 'Fundamental Rights',
      topic: 'Right to Equality',
      difficulty: 'EASY',
      marks: 2.0,
      negativeMarks: 0.5,
    },
    {
      questionText: 'Where is the headquarters of Uttar Pradesh Police located?',
      questionHindi: 'उत्तर प्रदेश पुलिस का मुख्यालय कहाँ स्थित है?',
      questionEnglish: 'Where is the headquarters of Uttar Pradesh Police located?',
      options: JSON.stringify(['प्रयागराज (Prayagraj)', 'लखनऊ (Lucknow)', 'कानपुर (Kanpur)', 'वाराणसी (Varanasi)']),
      optionsHindi: JSON.stringify(['प्रयागराज (Prayagraj)', 'लखनऊ (Lucknow)', 'कानपुर (Kanpur)', 'वाराणसी (Varanasi)']),
      optionsEnglish: JSON.stringify(['Prayagraj', 'Lucknow', 'Kanpur', 'Varanasi']),
      correctAnswer: '1',
      explanation: 'The headquarters of UP Police (Signature Building) is situated at Gomti Nagar Extension, Lucknow.',
      explanationHindi: 'उत्तर प्रदेश पुलिस का मुख्यालय (सिग्नेचर बिल्डिंग) गोमती नगर विस्तार, लखनऊ में स्थित है।',
      explanationEnglish: 'The headquarters of UP Police (Signature Building) is situated at Gomti Nagar Extension, Lucknow.',
      subject: 'General Awareness',
      chapter: 'UP Special',
      topic: 'Police Administration',
      difficulty: 'EASY',
      marks: 2.0,
      negativeMarks: 0.5,
    },
    {
      questionText: 'What is the sum of first 50 natural numbers?',
      questionHindi: 'प्रथम 50 प्राकृतिक संख्याओं का योग क्या है?',
      questionEnglish: 'What is the sum of first 50 natural numbers?',
      options: JSON.stringify(['1225', '1275', '1250', '1300']),
      optionsHindi: JSON.stringify(['1225', '1275', '1250', '1300']),
      optionsEnglish: JSON.stringify(['1225', '1275', '1250', '1300']),
      correctAnswer: '1',
      explanation: 'Sum = n*(n+1)/2 = 50 * 51 / 2 = 1275.',
      explanationHindi: 'सूत्र: योग = n*(n+1)/2 = 50 * 51 / 2 = 1275।',
      explanationEnglish: 'Formula: Sum = n*(n+1)/2 = 50 * 51 / 2 = 1275.',
      subject: 'Mathematics',
      chapter: 'Number System',
      topic: 'Natural Numbers',
      difficulty: 'MEDIUM',
      marks: 2.0,
      negativeMarks: 0.5,
    },
    {
      questionText: 'If A is brother of B, B is sister of C, and C is father of D, how is D related to A?',
      questionHindi: 'यदि A, B का भाई है, B, C की बहन है, और C, D का पिता है, तो D का A से क्या संबंध है?',
      questionEnglish: 'If A is brother of B, B is sister of C, and C is father of D, how is D related to A?',
      options: JSON.stringify(['भतीजा/भतीजी (Nephew/Niece)', 'भाई (Brother)', 'पिता (Father)', 'चाचा (Uncle)']),
      optionsHindi: JSON.stringify(['भतीजा/भतीजी (Nephew/Niece)', 'भाई (Brother)', 'पिता (Father)', 'चाचा (Uncle)']),
      optionsEnglish: JSON.stringify(['Nephew/Niece', 'Brother', 'Father', 'Uncle']),
      correctAnswer: '0',
      explanation: 'C is brother of A and B. D is child of C. Hence D is nephew or niece of A.',
      explanationHindi: 'A और C भाई हैं। D, C की संतान है। अतः D, A का भतीजा या भतीजी है।',
      explanationEnglish: 'A and C are brothers. D is C’s child. Hence D is nephew or niece of A.',
      subject: 'Reasoning',
      chapter: 'Blood Relations',
      topic: 'Family Tree',
      difficulty: 'MEDIUM',
      marks: 2.0,
      negativeMarks: 0.5,
    },
    {
      questionText: "'सूर्योदय' शब्द का सही संधि-विच्छेद क्या है?",
      questionHindi: "'सूर्योदय' शब्द का सही संधि-विच्छेद क्या है?",
      questionEnglish: "What is the correct Sandhi-Vichhed of the word 'Suryoday'?",
      options: JSON.stringify(['सूर्य + उदय', 'सूर्यो + दय', 'सूर्य + दय', 'सूर्या + उदय']),
      optionsHindi: JSON.stringify(['सूर्य + उदय', 'सूर्यो + दय', 'सूर्य + दय', 'सूर्या + उदय']),
      optionsEnglish: JSON.stringify(['Surya + Uday', 'Suryo + Day', 'Surya + Day', 'Suryaa + Uday']),
      correctAnswer: '0',
      explanation: "'सूर्य + उदय' = सूर्योदय (गुण स्वर संधि, अ + उ = ओ)।",
      explanationHindi: "'सूर्य + उदय' = सूर्योदय (गुण स्वर संधि का नियम: अ + उ = ओ)।",
      explanationEnglish: "'Surya + Uday' = Suryoday (Gun Sandhi rule: a + u = o).",
      subject: 'Hindi',
      chapter: 'संधि (Sandhi)',
      topic: 'स्वर संधि',
      difficulty: 'EASY',
      marks: 2.0,
      negativeMarks: 0.5,
    },
  ];

  const targetTest = createdTestsMap['general-awareness-current-affairs-sectional-test-1'];
  const fullTest = createdTestsMap['up-police-asi-full-test-1'];
  const liveTest = createdTestsMap['up-police-asi-mini-live-test'];

  for (let i = 0; i < rawQuestions.length; i++) {
    const qData = rawQuestions[i];
    const q = await prisma.question.create({
      data: qData,
    });

    // Link to Sectional Test
    if (targetTest) {
      await prisma.testQuestion.upsert({
        where: { testId_questionId: { testId: targetTest.id, questionId: q.id } },
        update: { position: i + 1, sectionName: qData.subject },
        create: { testId: targetTest.id, questionId: q.id, position: i + 1, sectionName: qData.subject },
      });
    }

    // Link to Live Test
    if (liveTest) {
      await prisma.testQuestion.upsert({
        where: { testId_questionId: { testId: liveTest.id, questionId: q.id } },
        update: { position: i + 1, sectionName: qData.subject },
        create: { testId: liveTest.id, questionId: q.id, position: i + 1, sectionName: qData.subject },
      });
    }

    // Link to Full Test
    if (fullTest) {
      await prisma.testQuestion.upsert({
        where: { testId_questionId: { testId: fullTest.id, questionId: q.id } },
        update: { position: i + 1, sectionName: qData.subject },
        create: { testId: fullTest.id, questionId: q.id, position: i + 1, sectionName: qData.subject },
      });
    }
  }

  console.log(`✅ Seeded ${rawQuestions.length} Questions linked across Sectional, Live, and Full Tests.`);
}

seedTestSeries()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
