export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'USER' | 'ADMIN' | 'INSTRUCTOR';
  avatar?: string | null;
  isActive?: boolean;
  createdAt?: string;
  _count?: {
    enrollments?: number;
    cartItems?: number;
    wishlistItems?: number;
    testAttempts?: number;
    orders?: number;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  _count?: {
    courses?: number;
    materials?: number;
    tests?: number;
  };
}

export interface CourseLesson {
  id: string;
  courseId: string;
  title: string;
  chapterTitle: string;
  durationMinutes: number;
  videoUrl?: string | null;
  pdfUrl?: string | null;
  content?: string | null;
  isFreePreview: boolean;
  position: number;
  thumbnail?: string | null;
  isRecordedClass?: boolean;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  thumbnail?: string | null;
  categoryId: string;
  instructorName: string;
  instructorBio?: string | null;
  price: number;
  discountedPrice?: number | null;
  duration?: string | null;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  featured: boolean;
  validityDays: number;
  createdAt: string;
  category?: Category;
  lessons?: CourseLesson[];
  recordedClasses?: RecordedClass[];
  reviews?: Review[];
  isEnrolled?: boolean;
  isWishlisted?: boolean;
  isInCart?: boolean;
  _count?: {
    lessons?: number;
    enrollments?: number;
    reviews?: number;
    recordedClasses?: number;
  };
}

export interface Material {
  id: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  fullContent?: string | null;
  categoryId: string;
  materialType?: string; // NCERT, E_BOOK, CLASS_NOTES, CURRENT_AFFAIRS, PYQ, PRACTICE_SET, QUESTION_BANK, SHORT_NOTES, ONE_LINER, WORKSHEET, OTHER
  classGrade?: string | null;
  subject: string;
  chapter?: string | null;
  topic?: string | null;
  examName: string;
  year?: number | null;
  shift?: string | null;
  language?: string; // HINDI, ENGLISH, BILINGUAL
  pageCount?: number | null;
  fileUrl: string;
  thumbnail?: string | null;
  fileType: string;
  fileSize: string;
  author?: string | null;
  difficulty?: string; // EASY, MEDIUM, HARD
  isFree: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  status: string;
  downloadsCount: number;
  viewsCount?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string | null;
  createdAt: string;
  updatedAt?: string;
  category?: Category;
  isBookmarked?: boolean;
  savedAt?: string;
  downloadedAt?: string;
}

export interface CurrentAffairs {
  id: string;
  title: string;
  slug: string;
  category: string;
  date: string;
  content: string;
  image?: string | null;
  pdfUrl?: string | null;
  source?: string | null;
  tags?: string | null;
  status: string;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudyTaxonomy {
  id: string;
  type: string; // CATEGORY, CLASS, SUBJECT, EXAM, TOPIC
  name: string;
  slug: string;
  parentId?: string | null;
  icon?: string | null;
  color?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface MaterialStats {
  totalMaterials: number;
  publishedMaterials: number;
  draftMaterials: number;
  archivedMaterials: number;
  totalDownloads: number;
  totalViews: number;
  todayDownloads: number;
  monthDownloads: number;
  freeMaterials: number;
  premiumMaterials: number;
}

export interface FileLibraryItem {
  filename: string;
  url: string;
  size: string;
  rawBytes: number;
  fileType: string;
  ext: string;
  modifiedAt: string;
}

export interface Question {
  id: string;
  questionId?: string;
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  explanation?: string | null;
  marks: number;
  negativeMarks: number;
  difficulty: string;
  subject: string;
  topic?: string | null;
  chapter?: string | null;
  exam?: string | null;
  year?: number | null;
  shift?: string | null;
  code?: string | null;
  questionHindi?: string | null;
  questionEnglish?: string | null;
  optionsHindi?: string[] | null;
  optionsEnglish?: string[] | null;
  explanationHindi?: string | null;
  explanationEnglish?: string | null;
  status?: string;
  position?: number;
  sectionName?: string;
  testQuestionId?: string;
}

export interface TestSeries {
  id: string;
  title: string;
  slug: string;
  examCategory: string;
  subTitle?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  badge?: string | null;
  totalTestsCount: number;
  freeTestsCount: number;
  rating: number;
  enrolledCount: number;
  languages: string;
  validityDays: number;
  price: number;
  originalPrice?: number | null;
  isFeatured: boolean;
  isActive: boolean;
  status: string;
  createdAt: string;
  tests?: Test[];
  _count?: {
    tests?: number;
  };
  userStats?: {
    attemptedCount: number;
    completedCount: number;
  };
}

export interface Test {
  id: string;
  title: string;
  slug: string;
  categoryId?: string | null;
  seriesId?: string | null;
  courseId?: string | null;
  description?: string | null;
  instructions?: string | null;
  durationMinutes: number;
  totalMarks: number;
  passMarks: number;
  negativeMarking: number;
  isFree: boolean;
  testType?: string;
  subCategory?: string;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  allowResume?: boolean;
  allowReattempt?: boolean;
  showRank?: boolean;
  showSolutions?: boolean;
  questionLanguageMode?: string;
  isLive?: boolean;
  status: string;
  createdAt: string;
  category?: Category;
  series?: TestSeries;
  course?: Course;
  questionsCount?: number;
  attemptsCount?: number;
  userHighestScore?: number | null;
  userAttempt?: {
    id: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'EVALUATED' | 'SUBMITTED' | string;
    score: number;
    accuracy: number;
    timeSpentSeconds: number;
    rank?: number | null;
    percentile?: number | null;
    submittedAt: string;
  } | null;
}

export interface TestAttempt {
  id: string;
  testId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  accuracy: number;
  timeSpentSeconds: number;
  rank?: number | null;
  percentile?: number | null;
  answersMap?: Record<string, string> | null;
  markedQuestions?: string[] | null;
  currentQuestionIndex?: number | null;
  timeSpentPerQuestion?: Record<string, number> | null;
  status: string;
  submittedAt: string;
  test?: {
    id: string;
    title: string;
    totalMarks: number;
    durationMinutes: number;
    passMarks?: number;
    negativeMarking?: number;
    subCategory?: string;
    series?: {
      id: string;
      title: string;
      slug: string;
    };
  };
}

export interface TypingExam {
  id: string;
  name: string;
  slug: string;
  category: string;
  post: string;
  department?: string | null;
  language: string;
  keyboardLayout: string;
  durationSeconds: number;
  targetSpeed: number;
  minAccuracy: number;
  backspaceRule: string;
  penaltyRate: number;
  description?: string | null;
  instructions?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  status: string;
  createdAt: string;
  tests?: TypingTest[];
  _count?: {
    tests?: number;
    attempts?: number;
  };
}

export interface TypingTest {
  id: string;
  title: string;
  slug?: string | null;
  examId?: string | null;
  examCategory?: string | null;
  language: 'ENGLISH' | 'HINDI' | string;
  keyboardLayout?: string;
  category?: string;
  passageText: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | string;
  durationSeconds: number;
  wordCount?: number;
  characterCount?: number;
  source?: string | null;
  year?: number | null;
  tags?: string | null;
  isFeatured?: boolean;
  viewsCount?: number;
  status?: string;
  createdAt?: string;
  exam?: TypingExam;
  _count?: {
    attempts?: number;
  };
}

export interface TypingAttempt {
  id: string;
  typingTestId: string;
  userId: string;
  examId?: string | null;
  mode?: string;
  wpm: number;
  grossWpm?: number;
  netWpm: number;
  accuracy: number;
  errors: number;
  correctChars?: number;
  wrongChars?: number;
  backspaces?: number;
  omissions?: number;
  substitutions?: number;
  totalCharacters: number;
  durationSeconds: number;
  timeSpentSeconds?: number;
  resultStatus?: string | null;
  readinessScore?: number | null;
  mistakeDetails?: string | null;
  createdAt: string;
  typingTest?: {
    id: string;
    title: string;
    language: string;
    difficulty: string;
  };
  exam?: {
    name: string;
    targetSpeed: number;
  };
}

export interface TypingCourse {
  id: string;
  title: string;
  slug: string;
  language: string;
  keyboardLayout: string;
  layoutType?: string;
  description?: string | null;
  level: string;
  order: number;
  isActive: boolean;
  lessons?: TypingLesson[];
}

export interface TypingLesson {
  id: string;
  courseId: string;
  moduleName?: string;
  title: string;
  lessonOrder?: number;
  orderIndex?: number;
  instructions?: string | null;
  description?: string | null;
  practiceText?: string;
  content?: string;
  targetSpeed: number;
  minAccuracy: number;
  highlightKeys?: string | null;
  keysCovered?: string | null;
  fingerTips?: string | null;
  durationSeconds?: number;
  course?: TypingCourse;
}

export interface TypingUserProgress {
  streakDays?: number;
  dailyGoalMinutes?: number;
  selectedExam?: string;
  targetSpeed?: number;
  targetAccuracy?: number;
  english?: {
    bestSpeed: number;
    avgSpeed: number;
    accuracy: number;
    testsCompleted: number;
  };
  hindi?: {
    bestSpeed: number;
    avgSpeed: number;
    accuracy: number;
    testsCompleted: number;
  };
  weakKeys?: string[];
  bestWpmEng?: number;
  avgWpmEng?: number;
  bestWpmHindi?: number;
  avgWpmHindi?: number;
  avgAccuracy?: number;
  currentStreak?: number;
  readinessScore?: number;
  targetWpm?: number;
  dailyTargetMins?: number;
}

export interface TypingDailyChallenge {
  id: string;
  title: string;
  date: string;
  language: string;
  passageText: string;
  durationSeconds: number;
  status: string;
  participantsCount?: number;
  typingTest?: TypingTest;
}

export interface TypingStats {
  totalPassages: number;
  totalExams: number;
  totalCourses: number;
  totalAttempts: number;
  todayAttempts: number;
  usersCount: number;
  avgWpm: number;
  avgAccuracy: number;
}

export interface CartItem {
  id: string;
  userId: string;
  courseId: string;
  course: Course;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number | null;
  startDate: string;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  isActive: boolean;
}

export interface OrderItem {
  id: string;
  courseId: string;
  price: number;
  course?: {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  paymentProvider: string;
  transactionId?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
  items: OrderItem[];
  promoCode?: {
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
}

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatar?: string | null;
    email?: string;
  };
  course?: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface LiveClass {
  id: string;
  courseId?: string | null;
  title: string;
  instructor: string;
  description?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  thumbnail?: string | null;
  course?: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface RecordedClass {
  id: string;
  courseId: string;
  title: string;
  chapter: string;
  durationMinutes: number;
  videoUrl: string;
  thumbnail?: string | null;
  description?: string | null;
  isPublished: boolean;
  createdAt: string;
  course?: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: 'GENERAL' | 'EXAM' | 'UNIVERSITY' | 'COURSE' | 'ACADEMIC';
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  linkUrl?: string | null;
  publishedAt: string;
  expiresAt?: string | null;
  status: string;
  isRead?: boolean;
}

export interface SliderBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  buttonText?: string | null;
  position: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FooterSettings {
  aboutText: string;
  address: string;
  email: string;
  phone: string;
  whatsappUrl: string;
  youtubeUrl: string;
  telegramUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  copyrightText: string;
  newsletterHeadline: string;
  newsletterText: string;
}
