const API_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('lsl_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message || 'An error occurred while processing request', response.status, data);
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request<any>('/auth/me'),
    updateProfile: (body: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },

  // Courses
  courses: {
    getAll: (params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/courses${q}`);
    },
    getBySlug: (slugOrId: string) => request<any>(`/courses/${slugOrId}`),
    getLearningPlayer: (slugOrId: string) => request<any>(`/courses/${slugOrId}/learn`),
    adminGetAll: () => request<any>('/courses/admin/all'),
    create: (body: any) => request<any>('/courses', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/courses/${id}`, { method: 'DELETE' }),
    addLesson: (courseId: string, body: any) => request<any>(`/courses/${courseId}/lessons`, { method: 'POST', body: JSON.stringify(body) }),
    updateLesson: (lessonId: string, body: any) => request<any>(`/courses/lessons/${lessonId}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteLesson: (lessonId: string) => request<any>(`/courses/lessons/${lessonId}`, { method: 'DELETE' }),
  },

  // Categories
  categories: {
    getAll: () => request<any>('/categories'),
    create: (body: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/categories/${id}`, { method: 'DELETE' }),
  },

  // Study Materials
  materials: {
    getAll: (params?: Record<string, any>) => {
      const cleanParams: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') cleanParams[k] = String(v);
        });
      }
      const q = Object.keys(cleanParams).length > 0 ? '?' + new URLSearchParams(cleanParams).toString() : '';
      return request<any>(`/materials${q}`);
    },
    getBySlug: (slug: string) => request<any>(`/materials/slug/${slug}`),
    getFeatured: () => request<any>('/materials/featured'),
    getTrending: () => request<any>('/materials/trending'),
    getMostDownloaded: () => request<any>('/materials/most-downloaded'),
    getRecent: () => request<any>('/materials/recent'),
    getUserLibrary: () => request<any>('/materials/user/library'),
    toggleBookmark: (id: string) => request<any>(`/materials/${id}/bookmark`, { method: 'POST' }),
    incrementDownload: (id: string) => request<any>(`/materials/${id}/download`, { method: 'POST' }),
    incrementView: (id: string) => request<any>(`/materials/${id}/view`, { method: 'POST' }),
    getAdminStats: () => request<any>('/materials/admin/stats'),
    adminGetAll: (params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/materials/admin/all${q}`);
    },
    create: (body: any) => request<any>('/materials', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/materials/${id}`, { method: 'DELETE' }),
    bulkAction: (action: string, ids: string[]) =>
      request<any>('/materials/bulk-action', { method: 'POST', body: JSON.stringify({ action, ids }) }),
    getTaxonomies: (type?: string) => {
      const q = type ? `?type=${type}` : '';
      return request<any>(`/materials/taxonomies${q}`);
    },
    saveTaxonomy: (body: any) => request<any>('/materials/taxonomies', { method: 'POST', body: JSON.stringify(body) }),
    deleteTaxonomy: (id: string) => request<any>(`/materials/taxonomies/${id}`, { method: 'DELETE' }),
    getFileLibrary: () => request<any>('/materials/files'),
  },

  // Current Affairs
  currentAffairs: {
    getAll: (params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/current-affairs${q}`);
    },
    getByIdOrSlug: (idOrSlug: string) => request<any>(`/current-affairs/${idOrSlug}`),
    adminGetAll: (params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/current-affairs/admin/all${q}`);
    },
    create: (body: any) => request<any>('/current-affairs', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/current-affairs/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/current-affairs/${id}`, { method: 'DELETE' }),
  },

  // Test Series
  testSeries: {
    getAll: (params?: Record<string, any>) => {
      const cleanParams: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') cleanParams[k] = String(v);
        });
      }
      const q = Object.keys(cleanParams).length > 0 ? '?' + new URLSearchParams(cleanParams).toString() : '';
      return request<any>(`/test-series${q}`);
    },
    getById: (idOrSlug: string, subCategory?: string) => {
      const q = subCategory ? `?subCategory=${subCategory}` : '';
      return request<any>(`/test-series/${idOrSlug}${q}`);
    },
    adminCreate: (body: any) => request<any>('/test-series', { method: 'POST', body: JSON.stringify(body) }),
    adminUpdate: (id: string, body: any) => request<any>(`/test-series/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    adminDelete: (id: string) => request<any>(`/test-series/${id}`, { method: 'DELETE' }),
  },

  // Tests
  tests: {
    getAll: (params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/tests${q}`);
    },
    getById: (idOrSlug: string) => request<any>(`/tests/${idOrSlug}`),
    start: (idOrSlug: string, body?: any, params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/tests/${idOrSlug}/start${q}`, {
        method: 'POST',
        body: JSON.stringify(body || {}),
      });
    },
    saveProgress: (idOrSlug: string, body: any) =>
      request<any>(`/tests/${idOrSlug}/save-progress`, { method: 'POST', body: JSON.stringify(body) }),
    takeTest: (idOrSlug: string) => request<any>(`/tests/${idOrSlug}/take`),
    submitTest: (idOrSlug: string, body: any) => request<any>(`/tests/${idOrSlug}/submit`, { method: 'POST', body: JSON.stringify(body) }),
    getResult: (idOrSlug: string, attemptId: string) => request<any>(`/tests/${idOrSlug}/result/${attemptId}`),
    getSolutions: (idOrSlug: string, attemptId: string) => request<any>(`/tests/${idOrSlug}/solutions/${attemptId}`),
    reportQuestion: (body: any) => request<any>('/tests/report-question', { method: 'POST', body: JSON.stringify(body) }),
    getMyAttempts: () => request<any>('/tests/my-attempts'),
    adminGetAll: () => request<any>('/tests/admin/all'),
    create: (body: any) => request<any>('/tests', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/tests/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/tests/${id}`, { method: 'DELETE' }),
  },

  // Questions
  questions: {
    getAll: (params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/questions${q}`);
    },
    create: (body: any) => request<any>('/questions', { method: 'POST', body: JSON.stringify(body) }),
    bulkCreate: (body: { questions: any[]; testId?: string; sectionName?: string }) =>
      request<any>('/questions/bulk', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/questions/${id}`, { method: 'DELETE' }),
    assignToTest: (body: any) => request<any>('/questions/assign-to-test', { method: 'POST', body: JSON.stringify(body) }),
    getAvailableForTest: (testId: string, params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/questions/available-for-test/${testId}${q}`);
    },
    batchAssignToTest: (body: { testId: string; questionIds: string[]; sectionName?: string }) =>
      request<any>('/questions/batch-assign-to-test', { method: 'POST', body: JSON.stringify(body) }),
    removeFromTest: (testId: string, questionId: string) =>
      request<any>('/questions/remove-from-test', { method: 'POST', body: JSON.stringify({ testId, questionId }) }),
  },

  // Typing Tests & Hub
  typing: {
    getAll: (params?: Record<string, any>) => {
      const cleanParams: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') cleanParams[k] = String(v);
        });
      }
      const q = Object.keys(cleanParams).length > 0 ? '?' + new URLSearchParams(cleanParams).toString() : '';
      return request<any>(`/typing-tests${q}`);
    },
    getById: (idOrSlug: string) => request<any>(`/typing-tests/${idOrSlug}`),
    getExams: (category?: string) => {
      const q = category ? `?category=${category}` : '';
      return request<any>(`/typing-tests/exams${q}`);
    },
    getExamBySlug: (slug: string) => request<any>(`/typing-tests/exams/${slug}`),
    getExam: (slug: string) => request<any>(`/typing-tests/exams/${slug}`),
    getCourses: (language?: string) => {
      const q = language ? `?language=${language}` : '';
      return request<any>(`/typing-tests/courses${q}`);
    },
    getCourseBySlug: (slug: string) => request<any>(`/typing-tests/courses/${slug}`),
    getCourse: (slug: string) => request<any>(`/typing-tests/courses/${slug}`),
    getDailyChallenge: () => request<any>('/typing-tests/daily-challenge'),
    getUserDashboard: () => request<any>('/typing-tests/user/dashboard'),
    updateUserGoal: (body: any) => request<any>('/typing-tests/user/goal', { method: 'POST', body: JSON.stringify(body) }),
    updateGoal: (body: any) => request<any>('/typing-tests/user/goal', { method: 'POST', body: JSON.stringify(body) }),
    saveAttempt: (body: any) => request<any>('/typing-tests/attempt', { method: 'POST', body: JSON.stringify(body) }),
    submitAttempt: (body: any) => request<any>('/typing-tests/attempt', { method: 'POST', body: JSON.stringify(body) }),
    getMyHistory: (params?: Record<string, any> | number) => {
      if (typeof params === 'number') {
        return request<any>(`/typing-tests/user/history?limit=${params}`);
      }
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/typing-tests/user/history${q}`);
    },
    getAdminStats: () => request<any>('/typing-tests/admin/stats'),
    adminGetStats: () => request<any>('/typing-tests/admin/stats'),
    adminCreateExam: (body: any) => request<any>('/typing-tests/admin/exams', { method: 'POST', body: JSON.stringify(body) }),
    adminUpdateExam: (id: string, body: any) => request<any>(`/typing-tests/admin/exams/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    adminDeleteExam: (id: string) => request<any>(`/typing-tests/admin/exams/${id}`, { method: 'DELETE' }),
    create: (body: any) => request<any>('/typing-tests', { method: 'POST', body: JSON.stringify(body) }),
    adminCreateTest: (body: any) => request<any>('/typing-tests', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/typing-tests/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    adminUpdateTest: (id: string, body: any) => request<any>(`/typing-tests/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/typing-tests/${id}`, { method: 'DELETE' }),
    adminDeleteTest: (id: string) => request<any>(`/typing-tests/${id}`, { method: 'DELETE' }),
    adminGetUsers: () => request<any>('/typing-tests/admin/users'),
  },

  // Cart
  cart: {
    get: () => request<any>('/cart'),
    add: (courseId: string) => request<any>('/cart/add', { method: 'POST', body: JSON.stringify({ courseId }) }),
    remove: (courseId: string) => request<any>(`/cart/${courseId}`, { method: 'DELETE' }),
    clear: () => request<any>('/cart', { method: 'DELETE' }),
  },

  // Wishlist
  wishlist: {
    get: () => request<any>('/wishlist'),
    toggle: (courseId: string) => request<any>('/wishlist/toggle', { method: 'POST', body: JSON.stringify({ courseId }) }),
    moveToCart: (courseId: string) => request<any>('/wishlist/move-to-cart', { method: 'POST', body: JSON.stringify({ courseId }) }),
  },

  // Promo Codes
  promo: {
    validate: (code: string, subtotal: number) => request<any>('/promo-codes/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) }),
    adminGetAll: () => request<any>('/promo-codes'),
    create: (body: any) => request<any>('/promo-codes', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/promo-codes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/promo-codes/${id}`, { method: 'DELETE' }),
  },

  // Orders
  orders: {
    checkout: (body: any) => request<any>('/orders/checkout', { method: 'POST', body: JSON.stringify(body) }),
    getMyOrders: () => request<any>('/orders/my-orders'),
    adminGetAll: (params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/orders${q}`);
    },
    updateStatus: (id: string, status: string) => request<any>(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  },

  // Reviews
  reviews: {
    getFeatured: () => request<any>('/reviews/featured'),
    submit: (body: any) => request<any>('/reviews', { method: 'POST', body: JSON.stringify(body) }),
    adminGetAll: () => request<any>('/reviews/admin/all'),
    updateStatus: (id: string, body: any) => request<any>(`/reviews/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/reviews/${id}`, { method: 'DELETE' }),
  },

  // Live Classes
  // Live Classes
  live: {
    getAll: (params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/live-classes${q}`);
    },
    getBySlugOrId: (slugOrId: string) => request<any>(`/live-classes/${slugOrId}`),
    adminGetAll: (params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/live-classes/admin/all${q}`);
    },
    create: (body: any) => request<any>('/live-classes', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/live-classes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/live-classes/${id}`, { method: 'DELETE' }),

    // OBS Streaming & Session State
    getStreamConfig: (id: string) => request<any>(`/live-classes/${id}/stream-config`),
    rotateStreamKey: (id: string) => request<any>(`/live-classes/${id}/rotate-stream-key`, { method: 'POST' }),
    startSession: (id: string) => request<any>(`/live-classes/${id}/start`, { method: 'POST' }),
    interruptedSession: (id: string) => request<any>(`/live-classes/${id}/interrupted`, { method: 'POST' }),
    endSession: (id: string) => request<any>(`/live-classes/${id}/end`, { method: 'POST' }),
    convertToRecording: (id: string, body: any) =>
      request<any>(`/live-classes/${id}/convert-to-recording`, { method: 'POST', body: JSON.stringify(body) }),

    // Doubts & Q&A
    getQuestions: (id: string) => request<any>(`/live-classes/${id}/questions`),
    askQuestion: (id: string, question: string) =>
      request<any>(`/live-classes/${id}/questions`, { method: 'POST', body: JSON.stringify({ question }) }),
    upvoteQuestion: (id: string, qId: string) =>
      request<any>(`/live-classes/${id}/questions/${qId}/upvote`, { method: 'POST' }),

    // Attendance & Heartbeat
    joinAttendance: (id: string, deviceInfo?: string) =>
      request<any>(`/live-classes/${id}/attendance/join`, { method: 'POST', body: JSON.stringify({ deviceInfo }) }),
    sendHeartbeat: (id: string, secondsWatched?: number) =>
      request<any>(`/live-classes/${id}/attendance/heartbeat`, { method: 'POST', body: JSON.stringify({ secondsWatched }) }),

    // Resources & Analytics
    attachResource: (id: string, body: any) =>
      request<any>(`/live-classes/${id}/resources`, { method: 'POST', body: JSON.stringify(body) }),
    getAnalytics: (id: string) => request<any>(`/live-classes/${id}/analytics`),
  },

  // Recorded Classes
  recorded: {
    getAll: (courseId?: string) => request<any>(`/recorded-classes${courseId ? `?courseId=${courseId}` : ''}`),
    adminGetAll: () => request<any>('/recorded-classes/admin/all'),
    getById: (id: string) => request<any>(`/recorded-classes/${id}`),
    create: (body: any) => request<any>('/recorded-classes', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/recorded-classes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/recorded-classes/${id}`, { method: 'DELETE' }),
    addResource: (classId: string, body: any) =>
      request<any>(`/recorded-classes/${classId}/resources`, { method: 'POST', body: JSON.stringify(body) }),
    deleteResource: (resourceId: string) =>
      request<any>(`/recorded-classes/resources/${resourceId}`, { method: 'DELETE' }),
  },

  // Notifications
  notifications: {
    getAll: (category?: string) => request<any>(`/notifications${category ? `?category=${category}` : ''}`),
    markAsRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),
    adminGetAll: () => request<any>('/notifications/admin/all'),
    create: (body: any) => request<any>('/notifications', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/notifications/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/notifications/${id}`, { method: 'DELETE' }),
  },

  // Admin Dashboard & Users
  admin: {
    getStats: () => request<any>('/admin/stats'),
    getUsers: (params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/admin/users${q}`);
    },
    updateUserStatus: (id: string, isActive: boolean) => request<any>(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ isActive }) }),
    updateUserRole: (id: string, role: string) => request<any>(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  },

  // File Upload (Direct from computer to Google Drive / Server)
  upload: {
    file: async (
      file: File,
      options?: { category?: string; entityType?: string; entityId?: string }
    ): Promise<{
      success: boolean;
      fileUrl: string;
      downloadUrl?: string;
      driveFileId?: string;
      storageProvider?: string;
      filename: string;
      size: number;
      assetId?: string;
      message?: string;
    }> => {
      const token = localStorage.getItem('lsl_token');
      const formData = new FormData();
      formData.append('file', file);
      if (options?.category) formData.append('category', options.category);
      if (options?.entityType) formData.append('entityType', options.entityType);
      if (options?.entityId) formData.append('entityId', options.entityId);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new ApiError(data.message || 'File upload failed', response.status, data);
      }

      return data;
    },
    uploadWithProgress: (
      file: File,
      options?: { category?: string; entityType?: string; entityId?: string },
      onProgress?: (progress: { loaded: number; total: number; percent: number; speedBytesPerSec: number; remainingSeconds: number }) => void,
      cancelRef?: { cancel?: () => void }
    ): Promise<{
      success: boolean;
      fileUrl: string;
      downloadUrl?: string;
      driveFileId?: string;
      storageProvider?: string;
      filename: string;
      size: number;
      assetId?: string;
      message?: string;
    }> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        if (cancelRef) {
          cancelRef.cancel = () => {
            xhr.abort();
          };
        }

        const formData = new FormData();
        formData.append('file', file);
        if (options?.category) formData.append('category', options.category);
        if (options?.entityType) formData.append('entityType', options.entityType);
        if (options?.entityId) formData.append('entityId', options.entityId);

        let lastTime = Date.now();
        let lastLoaded = 0;
        let smoothedSpeed = 0;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const now = Date.now();
            const timeDiff = (now - lastTime) / 1000;
            if (timeDiff >= 0.25 || event.loaded === event.total) {
              const loadedDiff = event.loaded - lastLoaded;
              const instantSpeed = timeDiff > 0 ? loadedDiff / timeDiff : 0;
              smoothedSpeed = smoothedSpeed === 0 ? instantSpeed : 0.7 * smoothedSpeed + 0.3 * instantSpeed;
              lastTime = now;
              lastLoaded = event.loaded;
            }

            const remainingBytes = Math.max(0, event.total - event.loaded);
            const remainingSeconds = smoothedSpeed > 0 ? Math.round(remainingBytes / smoothedSpeed) : 0;
            const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));

            onProgress({
              loaded: event.loaded,
              total: event.total,
              percent,
              speedBytesPerSec: smoothedSpeed,
              remainingSeconds,
            });
          }
        };

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText || '{}');
            if (xhr.status >= 200 && xhr.status < 300 && data.success) {
              resolve(data);
            } else {
              reject(new ApiError(data.message || `Upload failed with status ${xhr.status}`, xhr.status, data));
            }
          } catch (e: any) {
            reject(new ApiError('Invalid response from upload server', xhr.status));
          }
        };

        xhr.onerror = () => {
          reject(new ApiError('Network connection interrupted during upload. Please check your internet connection.', 0));
        };

        xhr.onabort = () => {
          reject(new ApiError('Upload cancelled by user', -1));
        };

        xhr.open('POST', `${API_URL}/upload`);
        const token = localStorage.getItem('lsl_token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
      });
    },
    checkDuplicate: (fileName: string) => request<any>(`/upload/check-duplicate?fileName=${encodeURIComponent(fileName)}`),
    getStatus: () => request<any>('/upload/status'),
    deleteAsset: (assetId: string) => request<any>(`/upload/${assetId}`, { method: 'DELETE' }),
  },

  // Sliders / Hero Banners
  sliders: {
    getAll: () => request<any>('/sliders'),
    adminGetAll: () => request<any>('/sliders/admin/all'),
    create: (body: any) => request<any>('/sliders', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/sliders/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/sliders/${id}`, { method: 'DELETE' }),
  },

  // Site Settings (Footer & Social Media)
  settings: {
    getFooter: () => request<any>('/settings/footer'),
    updateFooter: (body: any) => request<any>('/settings/footer', { method: 'PUT', body: JSON.stringify(body) }),
  },

  // Google Drive Storage Management (5 TB Personal Storage)
  googleDrive: {
    getAuthUrl: () => request<any>('/google-drive/auth'),
    getStatus: () => request<any>('/google-drive/status'),
    testConnection: () => request<any>('/google-drive/test', { method: 'POST' }),
    disconnect: () => request<any>('/google-drive/disconnect', { method: 'POST' }),
  },
};
