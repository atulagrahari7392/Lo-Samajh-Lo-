import bcrypt from 'bcryptjs';
import { prisma } from './db';

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    console.error('⛔ FATAL: Database seeding is permanently disabled in production to prevent data loss.');
    process.exit(1);
  }
  console.log('🌱 Starting Lo Samajh Lo database seeding...');

  // Clean old data
  await prisma.notificationRead.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.sliderBanner.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.recordedClass.deleteMany();
  await prisma.liveClass.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.promoCodeUsage.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.typingAttempt.deleteMany();
  await prisma.typingTest.deleteMany();
  await prisma.testAnswer.deleteMany();
  await prisma.testAttempt.deleteMany();
  await prisma.testQuestion.deleteMany();
  await prisma.question.deleteMany();
  await prisma.test.deleteMany();
  await prisma.material.deleteMany();
  await prisma.courseLesson.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const teacherPasswordHash = await bcrypt.hash('teacher123', salt);
  const studentPasswordHash = await bcrypt.hash('student123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'Atul Agrahari (Admin)',
      email: 'admin@losamajhlo.in',
      phone: '9000000001',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const teacher = await prisma.user.create({
    data: {
      name: 'Rakesh Sir (Maths Expert)',
      email: 'teacher@losamajhlo.in',
      phone: '9000000002',
      passwordHash: teacherPasswordHash,
      role: 'INSTRUCTOR',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const student = await prisma.user.create({
    data: {
      name: 'Ravi Kumar',
      email: 'student@losamajhlo.in',
      phone: '9876500001',
      passwordHash: studentPasswordHash,
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Sneha Singh',
      email: 'sneha@example.com',
      phone: '9876500002',
      passwordHash: studentPasswordHash,
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const student3 = await prisma.user.create({
    data: {
      name: 'Amit Verma',
      email: 'amit@example.com',
      phone: '9876500003',
      passwordHash: studentPasswordHash,
      role: 'USER',
    },
  });

  console.log('✅ Users created.');

  // 2. Create Categories
  const catUpsssc = await prisma.category.create({
    data: {
      name: 'UPSSSC Exams',
      slug: 'upsssc',
      description: 'UPSSSC PET, VDO, Lekhpal & Junior Assistant preparation batches',
      icon: 'Award',
      color: '#6C63FF',
    },
  });

  const catRailway = await prisma.category.create({
    data: {
      name: 'Railway RRB',
      slug: 'railway',
      description: 'RRB NTPC, Group D, ALP & RPF exam courses and test series',
      icon: 'Train',
      color: '#3B82F6',
    },
  });

  const catSsc = await prisma.category.create({
    data: {
      name: 'SSC Exams',
      slug: 'ssc',
      description: 'SSC CGL, CHSL, GD Constable, MTS & CPO live batches',
      icon: 'Target',
      color: '#FF6584',
    },
  });

  const catPolice = await prisma.category.create({
    data: {
      name: 'UP Police',
      slug: 'up-police',
      description: 'UP Police Constable, Sub-Inspector (SI), Jail Warder',
      icon: 'Shield',
      color: '#10B981',
    },
  });

  const catGraduation = await prisma.category.create({
    data: {
      name: 'Graduation (B.A./B.Sc.)',
      slug: 'graduation',
      description: 'University degree courses: Hindi, History, Pol Science, Physics, Chemistry',
      icon: 'GraduationCap',
      color: '#F59E0B',
    },
  });

  const catGeneral = await prisma.category.create({
    data: {
      name: 'General Studies & Science',
      slug: 'gs-science',
      description: 'Static GK, Current Affairs, Science one-liners and foundational books',
      icon: 'BookOpen',
      color: '#8B5CF6',
    },
  });

  console.log('✅ Categories created.');

  // 3. Create Courses
  const course1 = await prisma.course.create({
    data: {
      title: 'UPSSSC PET 2026 Complete Foundation & Selection Batch',
      slug: 'upsssc-pet-2026',
      shortDescription: 'उत्तर प्रदेश प्रारंभिक अहर्ता परीक्षा (PET) का संपूर्ण पाठ्यक्रम — लाइव क्लासेज, नोट्स, टेस्ट सीरीज और डाउट समाधान।',
      fullDescription: `UPSSSC PET 2026 परीक्षा में 99+ परसेंटाइल स्कोर करने के लिए विशेष रूप से डिज़ाइन किया गया बैच। इसमें भारतीय इतिहास, भारतीय राष्ट्रीय आंदोलन, भूगोल, भारतीय अर्थव्यवस्था, भारतीय संविधान, सामान्य विज्ञान, प्रारंभिक अंकगणित, सामान्य हिंदी, तर्कशक्ति, सामयिकी और सामान्य जागरूकता के सभी टॉपिक्स कवर किए गए हैं।\n\nकोर्स की विशेषताएं:\n- 120+ घंटे के लाइव एवं रिकॉर्डेड वीडियो लेक्चर्स\n- सभी चैप्टर्स के हिंदी हस्तलिखित नोट्स व पीडीएफ\n- 20 फुल लेंथ मॉक टेस्ट + 50 सेक्शनल टेस्ट\n- पिछले 5 वर्षों के हल किए गए प्रश्न पत्र (PYQs)`,
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
      categoryId: catUpsssc.id,
      instructorName: 'Atul Agrahari & Team',
      instructorBio: '8+ वर्षों का प्रतियोगी परीक्षाओं का अध्यापन अनुभव। 10,000+ विद्यार्थियों का सफल मार्गदर्शन।',
      price: 999,
      discountedPrice: 699,
      duration: '120+ Hours',
      status: 'PUBLISHED',
      featured: true,
      validityDays: 365,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      title: 'RRB NTPC & Group D 2026 Complete Selection Batch (Hindi Medium)',
      slug: 'rrb-ntpc-group-d-2026',
      shortDescription: 'रेलवे NTPC और ग्रुप डी के 10,000+ पदों हेतु संपूर्ण सिलेबस: गणित, रीजनिंग, सामान्य विज्ञान एवं करेंट अफेयर्स।',
      fullDescription: `रेलवे भर्ती बोर्ड द्वारा आयोजित NTPC (CBT-1 & CBT-2) तथा ग्रुप डी परीक्षा के लिए संपूर्ण समाधान। शॉर्ट ट्रिक्स, फॉर्मूला शीट्स और पिछले वर्षों के पेपर्स पर आधारित अभ्यास।\n\nकोर्स में शामिल:\n- बेसिक से एडवांस लेवल मैथ्स ट्रिक्स\n- साइंस के 1000+ अति महत्वपूर्ण प्रश्न\n- ऑल इंडिया टेस्ट सीरीज ऑल इंडिया रैंक के साथ`,
      thumbnail: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800',
      categoryId: catRailway.id,
      instructorName: 'Rakesh Sir (Maths)',
      instructorBio: 'Railway Exams Specialist with 7+ years of teaching excellence.',
      price: 1499,
      discountedPrice: 899,
      duration: '150+ Hours',
      status: 'PUBLISHED',
      featured: true,
      validityDays: 365,
    },
  });

  const course3 = await prisma.course.create({
    data: {
      title: 'SSC GD Constable 2026 Target Batch (वर्दी बैच)',
      slug: 'ssc-gd-constable-2026',
      shortDescription: 'SSC GD परीक्षा 2026 हेतु टारगेटेड क्लास — हिंदी, रीजनिंग, मैथ्स और सामान्य ज्ञान की दैनिक प्रैक्टिस।',
      fullDescription: `SSC GD कॉन्स्टेबल परीक्षा को प्रथम प्रयास में पास करने हेतु समर्पित बैच। शारीरिक दक्षता मार्गदर्शन और लिखित परीक्षा का शत-प्रतिशत सिलेबस।`,
      thumbnail: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800',
      categoryId: catSsc.id,
      instructorName: 'Atul Agrahari',
      instructorBio: 'Founder, Lo Samajh Lo',
      price: 1299,
      discountedPrice: 799,
      duration: '100+ Hours',
      status: 'PUBLISHED',
      featured: true,
      validityDays: 365,
    },
  });

  const course4 = await prisma.course.create({
    data: {
      title: 'UP Police Constable 2026 - खाकी वर्दी बैच',
      slug: 'up-police-constable-2026',
      shortDescription: 'उत्तर प्रदेश पुलिस आरक्षी भर्ती परीक्षा की संपूर्ण तैयारी — सामान्य ज्ञान, सामान्य हिंदी, संख्यात्मक व मानसिक योग्यता।',
      fullDescription: `यूपी पुलिस भर्ती परीक्षा के नवीनतम परीक्षा पैटर्न पर आधारित पूर्ण पाठ्यक्रम। पिछले 10 वर्षों के प्रश्न पत्रों का गहन विश्लेषण।`,
      thumbnail: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800',
      categoryId: catPolice.id,
      instructorName: 'Atul Agrahari & Rakesh Sir',
      instructorBio: 'Senior Faculty Team',
      price: 1199,
      discountedPrice: 649,
      duration: '90+ Hours',
      status: 'PUBLISHED',
      featured: false,
      validityDays: 365,
    },
  });

  const course5 = await prisma.course.create({
    data: {
      title: 'General Science & Daily Current Affairs (100% Free)',
      slug: 'free-science-current-affairs',
      shortDescription: 'सभी प्रतियोगी परीक्षाओं हेतु सामान्य विज्ञान और दैनिक करेंट अफेयर्स के वीडियो एवं पीडीएफ नोट्स बिल्कुल मुफ्त।',
      fullDescription: `विद्यार्थियों की सहायता हेतु लो समझ लो का निःशुल्क प्रयास। भौतिक विज्ञान, रसायन विज्ञान और जीव विज्ञान के महत्वपूर्ण वन-लाइनर्स।`,
      thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
      categoryId: catGeneral.id,
      instructorName: 'Atul Agrahari',
      instructorBio: 'Educator & Mentor',
      price: 0,
      discountedPrice: 0,
      duration: '40+ Hours',
      status: 'PUBLISHED',
      featured: true,
      validityDays: 365,
    },
  });

  console.log('✅ Courses created.');

  // 4. Create Lessons for Course 1 (UPSSSC PET)
  await prisma.courseLesson.createMany({
    data: [
      {
        courseId: course1.id,
        title: 'UPSSSC PET 2026 Syllabus & Exam Strategy (Demo)',
        chapterTitle: 'Course Overview & Strategy',
        durationMinutes: 20,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        isFreePreview: true,
        position: 1,
        content: 'इस कक्षा में PET 2026 के पूरे पाठ्यक्रम और 90+ स्कोर करने की रणनीति पर विस्तृत चर्चा की गई है।',
      },
      {
        courseId: course1.id,
        title: 'सिंधु घाटी सभ्यता एवं वैदिक संस्कृति (Indian History Part 1)',
        chapterTitle: 'भारतीय इतिहास (Indian History)',
        durationMinutes: 45,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        isFreePreview: true,
        position: 2,
        content: 'हड़प्पा, मोहनजोदड़ो, लोथल, कालीबंगा और वैदिक काल के प्रमुख प्रश्न।',
      },
      {
        courseId: course1.id,
        title: 'बौद्ध धर्म एवं जैन धर्म — महत्वपूर्ण तथ्य व सिद्धांत',
        chapterTitle: 'भारतीय इतिहास (Indian History)',
        durationMinutes: 40,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        isFreePreview: false,
        position: 3,
        content: 'गौतम बुद्ध और भगवान महावीर के उपदेश, संगीतियाँ और प्रमुख ग्रंथ।',
      },
      {
        courseId: course1.id,
        title: 'मौर्य वंश एवं गुप्त साम्राज्य (सम्राट अशोक व समुद्रगुप्त)',
        chapterTitle: 'भारतीय इतिहास (Indian History)',
        durationMinutes: 50,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        isFreePreview: false,
        position: 4,
      },
      {
        courseId: course1.id,
        title: 'भारतीय संविधान: मूल अधिकार एवं नीति निदेशक तत्व',
        chapterTitle: 'भारतीय संविधान व राजव्यवस्था',
        durationMinutes: 55,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        isFreePreview: false,
        position: 5,
        content: 'अनुच्छेद 12 से 35 (मौलिक अधिकार) और अनुच्छेद 36 से 51 (DPSP) की सरल व्याख्या।',
      },
      {
        courseId: course1.id,
        title: 'प्रतिशत (Percentage) बेसिक से एडवांस शॉर्ट ट्रिक्स',
        chapterTitle: 'प्रारंभिक अंकगणित (Elementary Maths)',
        durationMinutes: 60,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        isFreePreview: true,
        position: 6,
        content: 'बिना पेन उठाए प्रतिशत के प्रश्नों को 10 सेकंड में हल करने का फॉर्मूला।',
      },
      {
        courseId: course1.id,
        title: 'साधारण ब्याज एवं चक्रवृद्धि ब्याज (SI & CI Tricks)',
        chapterTitle: 'प्रारंभिक अंकगणित (Elementary Maths)',
        durationMinutes: 50,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        isFreePreview: false,
        position: 7,
      },
    ],
  });

  // Lessons for Course 2 (Railway)
  await prisma.courseLesson.createMany({
    data: [
      {
        courseId: course2.id,
        title: 'Railway NTPC Maths: Number System Fast Calculation (Demo)',
        chapterTitle: 'Mathematics Foundation',
        durationMinutes: 30,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        isFreePreview: true,
        position: 1,
      },
      {
        courseId: course2.id,
        title: 'Time and Work LCM Short Trick Method',
        chapterTitle: 'Mathematics Foundation',
        durationMinutes: 45,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        isFreePreview: false,
        position: 2,
      },
      {
        courseId: course2.id,
        title: 'Railway General Science: Physics Units & Dimensions',
        chapterTitle: 'General Science',
        durationMinutes: 40,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        isFreePreview: true,
        position: 3,
      },
    ],
  });

  console.log('✅ Course lessons created.');

  // 5. Create Study Materials
  await prisma.material.createMany({
    data: [
      {
        title: 'UPSSSC PET 2026 Complete Syllabus & Exam Pattern Guide',
        description: 'अधिकारिक नवीनतम पाठ्यक्रम, अंक विभाजन और विषयवार महत्वपूर्ण टॉपिक सूची।',
        categoryId: catUpsssc.id,
        subject: 'General Awareness',
        examName: 'UPSSSC PET 2026',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
        fileType: 'PDF',
        fileSize: '1.8 MB',
        isFree: true,
        downloadsCount: 1420,
      },
      {
        title: 'Indian History 1000+ Previous Year Questions (PYQs) Bilingual',
        description: 'प्राचीन, मध्यकालीन एवं आधुनिक भारत के विगत वर्षों में पूछे गए 1000 वस्तुनिष्ठ प्रश्न।',
        categoryId: catUpsssc.id,
        subject: 'History',
        examName: 'All UP & Railway Exams',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        thumbnail: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400',
        fileType: 'PDF',
        fileSize: '4.2 MB',
        isFree: true,
        downloadsCount: 2850,
      },
      {
        title: 'General Science 500 One-Liners (Physics, Chemistry, Biology)',
        description: 'रेलवे ग्रुप डी और एसएससी जीडी के लिए विशेष रूप से संकलित क्विक रिवीजन नोट्स।',
        categoryId: catRailway.id,
        subject: 'Science',
        examName: 'RRB NTPC / Group D',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400',
        fileType: 'PDF',
        fileSize: '3.1 MB',
        isFree: true,
        downloadsCount: 3100,
      },
      {
        title: 'Maths Short Tricks Formula Sheet: Percentage, Profit & Loss',
        description: 'गणित के कठिन प्रश्नों को मात्र 10 सेकंड में हल करने के 40 गुप्त सूत्र और उदाहरण।',
        categoryId: catSsc.id,
        subject: 'Mathematics',
        examName: 'SSC CGL / GD / Railway',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
        fileType: 'PDF',
        fileSize: '2.0 MB',
        isFree: true,
        downloadsCount: 4500,
      },
      {
        title: 'Constitution of India (भारतीय संविधान) Key Articles & Amendments',
        description: 'संविधान सभा, अनुच्छेद, अनुसूचियां और अब तक के प्रमुख संविधान संशोधन।',
        categoryId: catPolice.id,
        subject: 'Polity',
        examName: 'UP Police Constable / SI',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400',
        fileType: 'PDF',
        fileSize: '2.7 MB',
        isFree: true,
        downloadsCount: 1980,
      },
    ],
  });

  console.log('✅ Study materials created.');

  // 6. Create Test Series
  const test1 = await prisma.test.create({
    data: {
      title: 'UPSSSC PET 2026 All India Free Live Mock Test #1',
      slug: 'upsssc-pet-2026-mock-1',
      categoryId: catUpsssc.id,
      courseId: course1.id,
      description: 'UPSSSC PET के वास्तविक परीक्षा पैटर्न पर आधारित 100 प्रश्नों का पूर्ण मॉक टेस्ट।',
      instructions: '1. परीक्षा की कुल अवधि 120 मिनट है।\n2. प्रत्येक सही उत्तर के लिए 1 अंक दिया जाएगा।\n3. प्रत्येक गलत उत्तर के लिए 0.25 (1/4) अंक की नकारात्मक कटौती होगी।\n4. टेस्ट सबमिट करने के बाद आपको स्कोरकार्ड, रैंक और संपूर्ण समाधान प्राप्त होगा।',
      durationMinutes: 60,
      totalMarks: 50,
      passMarks: 20,
      negativeMarking: 0.25,
      isFree: true,
      status: 'PUBLISHED',
    },
  });

  const test2 = await prisma.test.create({
    data: {
      title: 'Railway NTPC & Group D Maths Sectional Speed Test',
      slug: 'rrb-maths-sectional-test-1',
      categoryId: catRailway.id,
      courseId: course2.id,
      description: 'प्रतिशत, लाभ-हानि और कार्य-समय के 25 महत्वपूर्ण प्रश्नों का स्पीड टेस्ट।',
      instructions: 'प्रत्येक प्रश्न 1 अंक का है। गलत उत्तर पर 0.33 अंक की कटौती होगी।',
      durationMinutes: 25,
      totalMarks: 25,
      passMarks: 10,
      negativeMarking: 0.33,
      isFree: true,
      status: 'PUBLISHED',
    },
  });

  const test3 = await prisma.test.create({
    data: {
      title: 'SSC CGL 2026 Tier 1 All-India Mega Mock Test #1',
      slug: 'ssc-cgl-2026-tier-1-mock-1',
      categoryId: catSsc.id,
      courseId: course3.id,
      description: 'SSC CGL टियर 1 परीक्षा पैटर्न पर आधारित पूर्ण मॉक टेस्ट (रीजनिंग, जीए, क्वांट व इंग्लिश)।',
      instructions: '1. कुल अवधि 60 मिनट है।\n2. सही उत्तर पर 2 अंक।\n3. गलत उत्तर पर 0.50 अंक की कटौती।',
      durationMinutes: 60,
      totalMarks: 50,
      passMarks: 25,
      negativeMarking: 0.50,
      isFree: true,
      status: 'PUBLISHED',
    },
  });

  const test4 = await prisma.test.create({
    data: {
      title: 'UP Police Constable 2026 खाकी वर्दी Full Mock Test',
      slug: 'up-police-constable-2026-mock-1',
      categoryId: catPolice.id,
      courseId: course4.id,
      description: 'यूपी पुलिस आरक्षी भर्ती परीक्षा के नवीनतम सिलेबस पर आधारित पूर्ण परीक्षा सिमुलेटर।',
      instructions: '1. कुल अवधि 90 मिनट है।\n2. सही उत्तर पर 2 अंक।\n3. गलत उत्तर पर 0.50 अंक की कटौती।',
      durationMinutes: 90,
      totalMarks: 60,
      passMarks: 30,
      negativeMarking: 0.50,
      isFree: true,
      status: 'PUBLISHED',
    },
  });

  console.log('✅ Tests created.');

  // 7. Create Questions for Test 1
  const questionsData = [
    {
      questionText: 'हड़प्पा सभ्यता की खोज किस वर्ष में और किसके द्वारा की गई थी?',
      options: JSON.stringify([
        '1921 में दयाराम साहनी द्वारा',
        '1922 में राखालदास बनर्जी द्वारा',
        '1925 में जॉन मार्शल द्वारा',
        '1930 in आर. डी. बनर्जी द्वारा',
      ]),
      correctAnswer: '0',
      explanation: 'हड़प्पा की खोज वर्ष 1921 में रायबहादुर दयाराम साहनी ने की थी। यह पाकिस्तान के पंजाब प्रांत में रावी नदी के तट पर स्थित है।',
      marks: 1.0,
      negativeMarks: 0.25,
      subject: 'भारतीय इतिहास',
      difficulty: 'EASY',
    },
    {
      questionText: 'भारतीय राष्ट्रीय कांग्रेस के प्रथम अधिवेशन की अध्यक्षता किसने की थी?',
      options: JSON.stringify([
        'दादाभाई नौरोजी',
        'व्योमेश चन्द्र बनर्जी (W.C. Bonnerjee)',
        'सुरेंद्रनाथ बनर्जी',
        'ए. ओ. ह्यूम',
      ]),
      correctAnswer: '1',
      explanation: 'भारतीय राष्ट्रीय कांग्रेस का पहला अधिवेशन 28 दिसंबर 1885 को बंबई के गोकुलदास तेजपाल संस्कृत कॉलेज में हुआ, जिसकी अध्यक्षता व्योमेश चन्द्र बनर्जी ने की थी। इसमें 72 प्रतिनिधियों ने भाग लिया।',
      marks: 1.0,
      negativeMarks: 0.25,
      subject: 'भारतीय राष्ट्रीय आंदोलन',
      difficulty: 'EASY',
    },
    {
      questionText: 'यदि किसी संख्या का 35% मान 140 है, तो वह संख्या क्या होगी?',
      options: JSON.stringify(['350', '400', '420', '450']),
      correctAnswer: '1',
      explanation: 'मान लें संख्या x है। x × (35 / 100) = 140 => x = (140 × 100) / 35 = 4 × 100 = 400.',
      marks: 1.0,
      negativeMarks: 0.25,
      subject: 'प्रारंभिक अंकगणित',
      difficulty: 'EASY',
    },
    {
      questionText: 'भारतीय संविधान का कौन सा अनुच्छेद "समानता का अधिकार" (Right to Equality) प्रदान करता है?',
      options: JSON.stringify([
        'अनुच्छेद 12',
        'अनुच्छेद 14 से 18',
        'अनुच्छेद 19 से 22',
        'अनुच्छेद 25 से 28',
      ]),
      correctAnswer: '1',
      explanation: 'अनुच्छेद 14 से 18 भारतीय नागरिकों को विधि के समक्ष समानता और धर्म, मूलवंश, जाति, लिंग के आधार पर भेदभाव का निषेध करता है।',
      marks: 1.0,
      negativeMarks: 0.25,
      subject: 'भारतीय संविधान',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'कोशिका का "पावरहाउस" (Powerhouse of the Cell) किसे कहा जाता है?',
      options: JSON.stringify(['राइबोसोम', 'लाइसोसोम', 'माइटोकॉन्ड्रिया', 'गॉल्जीकाय']),
      correctAnswer: '2',
      explanation: 'माइटोकॉन्ड्रिया में कोशिकीय श्वसन द्वारा ATP के रूप में ऊर्जा उत्पन्न और संचित होती है, इसलिए इसे कोशिका का पावरहाउस कहते हैं।',
      marks: 1.0,
      negativeMarks: 0.25,
      subject: 'सामान्य विज्ञान',
      difficulty: 'EASY',
    },
    {
      questionText: 'यदि एक निश्चित कूट भाषा में "WATER" को "XBUFS" लिखा जाता है, तो "EARTH" को क्या लिखा जाएगा?',
      options: JSON.stringify(['FBSUI', 'FBSUJ', 'FBTUI', 'ECTUI']),
      correctAnswer: '0',
      explanation: 'प्रत्येक अक्षर में +1 की वृद्धि हो रही है: E(+1)=F, A(+1)=B, R(+1)=S, T(+1)=U, H(+1)=I -> FBSUI.',
      marks: 1.0,
      negativeMarks: 0.25,
      subject: 'तर्कशक्ति (Reasoning)',
      difficulty: 'EASY',
    },
    {
      questionText: 'A किसी कार्य को 12 दिन में और B उसी कार्य को 18 दिन में पूरा कर सकता है। दोनों मिलकर उस कार्य को कितने दिन में समाप्त करेंगे?',
      options: JSON.stringify(['7.2 दिन', '8 दिन', '7.5 दिन', '6.8 दिन']),
      correctAnswer: '0',
      explanation: 'LCM(12, 18) = 36 यूनिट कुल कार्य। A की क्षमता = 36/12 = 3 यूनिट/दिन, B की क्षमता = 36/18 = 2 यूनिट/दिन। दोनों मिलकर = 5 यूनिट/दिन। दिन = 36 / 5 = 7.2 दिन।',
      marks: 1.0,
      negativeMarks: 0.25,
      subject: 'प्रारंभिक अंकगणित',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'उत्तर प्रदेश का राज्य पक्षी (State Bird) कौन सा है?',
      options: JSON.stringify(['मोर', 'सारस (क्रौंच)', 'तोता', 'कोयल']),
      correctAnswer: '1',
      explanation: 'उत्तर प्रदेश का राजकीय पक्षी सारस (Grus antigone) है। राजकीय पशु बारहसिंगा तथा राजकीय वृक्ष अशोक है।',
      marks: 1.0,
      negativeMarks: 0.25,
      subject: 'सामान्य जागरूकता (UP GK)',
      difficulty: 'EASY',
    },
  ];

  for (let i = 0; i < questionsData.length; i++) {
    const qData = questionsData[i];
    const q = await prisma.question.create({
      data: qData,
    });

    await prisma.testQuestion.create({
      data: {
        testId: test1.id,
        questionId: q.id,
        sectionName: q.subject,
        position: i + 1,
      },
    });

    // Also link to other exam tests
    const otherTestId = i % 3 === 0 ? test2.id : (i % 2 === 0 ? test3.id : test4.id);
    await prisma.testQuestion.create({
      data: {
        testId: otherTestId,
        questionId: q.id,
        sectionName: q.subject,
        position: i + 1,
      },
    });
  }

  console.log('✅ Questions created and assigned to all mock tests.');

  // 8. Create Sample Completed Test Attempt for Student
  await prisma.testAttempt.create({
    data: {
      testId: test1.id,
      userId: student.id,
      score: 6.0,
      totalQuestions: 8,
      correctCount: 6,
      incorrectCount: 1,
      skippedCount: 1,
      accuracy: 85.7,
      timeSpentSeconds: 740,
      status: 'EVALUATED',
    },
  });

  // 9. Create Typing Tests
  const typing1 = await prisma.typingTest.create({
    data: {
      title: 'SSC CGL / CHSL English Speed Practice Test (35 WPM Benchmark)',
      language: 'ENGLISH',
      passageText: 'Education is the most powerful weapon which you can use to change the world. In the twenty-first century, digital technology has completely transformed the landscape of higher learning and competitive examinations across India. Students from every rural village and urban city can now access high quality interactive lectures, comprehensive study materials, and rigorous mock tests from the comfort of their homes. Continuous practice, disciplined revision, and self-belief remain the true pillars of extraordinary success.',
      difficulty: 'MEDIUM',
      durationSeconds: 60,
      status: 'PUBLISHED',
    },
  });

  const typing2 = await prisma.typingTest.create({
    data: {
      title: 'UP Police & High Court RO/ARO Hindi Typing Passage (मंगल फॉन्ट)',
      language: 'HINDI',
      passageText: 'शिक्षा मनुष्य के जीवन का सबसे महत्वपूर्ण प्रकाश पुंज है। सही समय पर किया गया निरंतर अभ्यास और दृढ संकल्प किसी भी कठिन परीक्षा को आसान बना देता है। लो समझ लो के इस आधुनिक मंच पर आप अपनी टाइपिंग गति और सटीकता को निखार सकते हैं। दैनिक अभ्यास से न केवल गति बढ़ती है बल्कि गलतियों की संख्या भी न्यूनतम हो जाती है।',
      difficulty: 'EASY',
      durationSeconds: 60,
      status: 'PUBLISHED',
    },
  });

  // Sample typing attempt
  await prisma.typingAttempt.create({
    data: {
      typingTestId: typing1.id,
      userId: student.id,
      wpm: 38.5,
      netWpm: 36.2,
      accuracy: 94.0,
      errors: 3,
      totalCharacters: 210,
      durationSeconds: 60,
    },
  });

  console.log('✅ Typing tests created.');

  // 10. Create Promo Codes
  await prisma.promoCode.createMany({
    data: [
      {
        code: 'WELCOME10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderAmount: 200,
        maxDiscount: 200,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 60 * 24 * 3600 * 1000),
        usageLimit: 1000,
        perUserLimit: 1,
        isActive: true,
      },
      {
        code: 'RAILWAY50',
        discountType: 'PERCENTAGE',
        discountValue: 50,
        minOrderAmount: 500,
        maxDiscount: 500,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        usageLimit: 200,
        perUserLimit: 1,
        isActive: true,
      },
      {
        code: 'NTPC300',
        discountType: 'FIXED',
        discountValue: 300,
        minOrderAmount: 799,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 45 * 24 * 3600 * 1000),
        usageLimit: 100,
        perUserLimit: 1,
        isActive: true,
      },
    ],
  });

  console.log('✅ Promo codes created.');

  // 11. Create Sample Enrollment & Order for Student
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'LSL-2026-00109',
      userId: student.id,
      subtotal: 699,
      discount: 0,
      tax: 0,
      totalAmount: 699,
      status: 'COMPLETED',
      paymentMethod: 'UPI_PHONEPE',
      paymentProvider: 'RAZORPAY_SIMULATED',
      transactionId: 'TXN-LSL-9821034',
      items: {
        create: [
          {
            courseId: course1.id,
            price: 699,
          },
        ],
      },
    },
  });

  await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course1.id,
      orderId: order1.id,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
    },
  });

  // Free course enrollment
  await prisma.enrollment.create({
    data: {
      userId: student.id,
      courseId: course5.id,
      status: 'ACTIVE',
    },
  });

  // Wishlist item for student
  await prisma.wishlistItem.create({
    data: {
      userId: student.id,
      courseId: course2.id,
    },
  });

  console.log('✅ Enrollment and orders created.');

  // 12. Create Live Classes
  await prisma.liveClass.createMany({
    data: [
      {
        courseId: course1.id,
        title: 'UPSSSC PET 2026: भारतीय इतिहास संपूर्ण रिवीजन मैराथन',
        instructor: 'Atul Agrahari',
        description: 'सिंधु घाटी सभ्यता से लेकर 1947 स्वतंत्रता संग्राम तक के 100 अति महत्वपूर्ण प्रश्न।',
        scheduledAt: new Date(Date.now() + 2 * 3600 * 1000), // Today in 2 hours
        durationMinutes: 90,
        meetingUrl: 'https://meet.google.com/lsl-live-demo',
        status: 'UPCOMING',
        thumbnail: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600',
      },
      {
        courseId: course2.id,
        title: 'Railway NTPC & Group D: प्रतिशत शॉर्ट ट्रिक्स लाइव क्लास',
        instructor: 'Rakesh Sir (Maths)',
        description: 'बिना फॉर्मूला ट्रिक द्वारा लाभ-हानि व प्रतिशत के कठिन सवालों का समाधान।',
        scheduledAt: new Date(Date.now() + 26 * 3600 * 1000), // Tomorrow
        durationMinutes: 60,
        meetingUrl: 'https://meet.google.com/lsl-maths-live',
        status: 'UPCOMING',
        thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600',
      },
    ],
  });

  // 13. Create Recorded Classes
  await prisma.recordedClass.createMany({
    data: [
      {
        courseId: course1.id,
        title: 'सिंधु घाटी सभ्यता — हड़प्पा व मोहनजोदड़ो स्थल विशेष',
        chapter: 'प्राचीन भारतीय इतिहास',
        durationMinutes: 48,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        description: 'हड़प्पा, मोहनजोदड़ो, चन्हूदड़ो, कालीबंगा, लोथल के पुरातात्विक साक्ष्य।',
      },
      {
        courseId: course2.id,
        title: 'BODMAS एवं भिन्न (Fraction) की सबसे तेज कैलकुलेशन ट्रिक',
        chapter: 'बेसिक मैथ्स',
        durationMinutes: 40,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        description: 'ग्रुप डी परीक्षा में हर साल आने वाले 5 पक्के नंबर।',
      },
    ],
  });

  // 14. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        title: 'UPSSSC PET 2026 आधिकारिक अधिसूचना जारी — ऑनलाइन आवेदन प्रारंभ',
        message: 'उत्तर प्रदेश अधीनस्थ सेवा चयन आयोग द्वारा PET 2026 के लिए आवेदन प्रक्रिया शुरू हो चुकी है। सभी अभ्यर्थी अंतिम तिथि से पूर्व आवेदन करें।',
        category: 'EXAM',
        priority: 'URGENT',
        linkUrl: '/courses/upsssc-pet-2026',
        publishedAt: new Date(),
      },
      {
        title: 'रेलवे आरआरबी 10,000+ पदों की भर्ती सूचना — बैच में भारी छूट',
        message: 'NTPC एवं ग्रुप डी की नई भर्ती के उपलक्ष्य में कूपन कोड RAILWAY50 द्वारा 50% की विशेष छूट प्राप्त करें।',
        category: 'COURSE',
        priority: 'HIGH',
        linkUrl: '/courses/rrb-ntpc-group-d-2026',
        publishedAt: new Date(Date.now() - 3600 * 1000),
      },
      {
        title: 'रविवार विशेष ऑल इंडिया लाइव मॉक टेस्ट सुबह 10 बजे',
        message: 'सभी नामांकित छात्रों के लिए संपूर्ण पाठ्यक्रम आधारित टेस्ट आयोजित किया जाएगा। रैंकिंग तुरंत जारी होगी।',
        category: 'ACADEMIC',
        priority: 'NORMAL',
        linkUrl: '/test-series',
        publishedAt: new Date(Date.now() - 86400 * 1000),
      },
      {
        title: 'लो समझ लो नए मोबाइल ऐप और वेब फीचर्स एक्टिवेट',
        message: 'अब आप लाइव क्लास, स्पीड टाइपिंग टेस्ट और पीडीएफ डाउनलोड एक ही जगह पर अनुभव कर सकते हैं।',
        category: 'GENERAL',
        priority: 'NORMAL',
        publishedAt: new Date(Date.now() - 2 * 86400 * 1000),
      },
    ],
  });

  // 15. Create Student Reviews
  await prisma.review.createMany({
    data: [
      {
        courseId: course1.id,
        userId: student.id,
        rating: 5,
        comment: 'अतुल सर का पढ़ाने का तरीका बहुत ही सरल और प्रभावी है। PET में मुझे 98.4 परसेंटाइल मिला। बहुत-बहुत धन्यवाद!',
        isApproved: true,
        isFeatured: true,
      },
      {
        courseId: course1.id,
        userId: student2.id,
        rating: 5,
        comment: 'हैंड रिटेन नोट्स और मॉक टेस्ट परीक्षा के स्तर के बिल्कुल अनुरूप हैं। हर छात्र को यह कोर्स लेना चाहिए।',
        isApproved: true,
        isFeatured: true,
      },
      {
        courseId: course2.id,
        userId: student3.id,
        rating: 5,
        comment: 'राकेश सर की मैथ्स ट्रिक्स अद्भुत हैं। टाइम एंड वर्क का जो सवाल 2 मिनट में होता था, अब 15 सेकंड में बन जाता है।',
        isApproved: true,
        isFeatured: true,
      },
    ],
  });

  // 15. Create Initial Hero Slider Banners
  console.log('🖼️ Seeding Hero Sliders...');
  await prisma.sliderBanner.createMany({
    data: [
      {
        title: 'UPSSSC PET 2026 संपूर्ण सिलेक्शन लाइव बैच',
        subtitle: 'लाइव कक्षाएं, द्विभाषी हस्तलिखित क्लास नोट्स, अध्यायवार PYQs एवं 50+ फुल-लेंथ ऑनलाइन मॉक टेस्ट।',
        badge: '🔥 2026 NEW BATCH OPEN',
        buttonText: 'Explore Courses / बैच देखें',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400',
        linkUrl: '/courses',
        position: 1,
        isActive: true,
      },
      {
        title: 'All India Live CBT Mock Test Series 2026',
        subtitle: 'NTA व SSC पैटर्न पर आधारित ऑनलाइन परीक्षा इंजन, तुरंत एक्यूरेसी %, रैंक एवं विस्तृत समाधान।',
        badge: '🎯 100% FREE ALL INDIA MOCK',
        buttonText: 'Attempt Free Test / मॉक टेस्ट दें',
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1400',
        linkUrl: '/test-series',
        position: 2,
        isActive: true,
      },
      {
        title: 'दृष्टि IAS शैली में हस्तलिखित पीडीएफ नोट्स व पुस्तकें',
        subtitle: 'मनोविज्ञान, सामान्य विज्ञान, जीव विज्ञान, अर्थव्यवस्था, संविधान, भूगोल व इतिहास के रंग-बिरंगे सार नोट्स।',
        badge: '📚 FREE STUDY MATERIALS',
        buttonText: 'Download Notes / मुफ्त डाउनलोड',
        imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1400',
        linkUrl: '/study-materials',
        position: 3,
        isActive: true,
      },
    ],
  });

  // 16. Create Initial Site Settings (Footer & Social Media)
  console.log('⚙️ Seeding Footer & Social Settings...');
  await prisma.siteSetting.create({
    data: {
      key: 'footer',
      value: JSON.stringify({
        aboutText: "India's premier digital learning platform dedicated to competitive exams (UPSSSC, Railway, SSC, UP Police) and graduation studies. Concept-based learning with comprehensive study materials, live mock tests, and bilingual notes.",
        address: "Raebareli, Uttar Pradesh",
        email: "support@losamajhlo.in",
        phone: "+91 99999 99999",
        whatsappUrl: "https://wa.me/919999999999?text=Hello%20Lo%20Samajh%20Lo%20Team%2C%20I%20need%20course%20guidance",
        youtubeUrl: "https://youtube.com/@losamajhlo",
        telegramUrl: "https://t.me/losamajhlo",
        instagramUrl: "https://instagram.com/losamajhlo",
        facebookUrl: "https://facebook.com/losamajhlo",
        twitterUrl: "https://twitter.com/losamajhlo",
        linkedinUrl: "https://linkedin.com/company/losamajhlo",
        copyrightText: "Lo Samajh Lo (लो समझ लो). All rights reserved.",
        newsletterHeadline: "Stay Connected with Lo Samajh Lo",
        newsletterText: "Subscribe to get immediate alerts for new government job vacancies, PDF circulars, and test updates.",
      }),
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
