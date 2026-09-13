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
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/materials${q}`);
    },
    adminGetAll: () => request<any>('/materials/admin/all'),
    incrementDownload: (id: string) => request<any>(`/materials/${id}/download`, { method: 'POST' }),
    create: (body: any) => request<any>('/materials', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/materials/${id}`, { method: 'DELETE' }),
  },

  // Tests
  tests: {
    getAll: (params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/tests${q}`);
    },
    getById: (idOrSlug: string) => request<any>(`/tests/${idOrSlug}`),
    takeTest: (idOrSlug: string) => request<any>(`/tests/${idOrSlug}/take`),
    submitTest: (idOrSlug: string, body: any) => request<any>(`/tests/${idOrSlug}/submit`, { method: 'POST', body: JSON.stringify(body) }),
    getResult: (idOrSlug: string, attemptId: string) => request<any>(`/tests/${idOrSlug}/result/${attemptId}`),
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
    update: (id: string, body: any) => request<any>(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/questions/${id}`, { method: 'DELETE' }),
    assignToTest: (body: any) => request<any>('/questions/assign-to-test', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Typing Tests
  typing: {
    getAll: (params?: Record<string, any>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/typing-tests${q}`);
    },
    getById: (id: string) => request<any>(`/typing-tests/${id}`),
    saveAttempt: (body: any) => request<any>('/typing-tests/attempt', { method: 'POST', body: JSON.stringify(body) }),
    getMyHistory: () => request<any>('/typing-tests/user/history'),
    create: (body: any) => request<any>('/typing-tests', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/typing-tests/${id}`, { method: 'DELETE' }),
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
  live: {
    getAll: () => request<any>('/live-classes'),
    adminGetAll: () => request<any>('/live-classes/admin/all'),
    create: (body: any) => request<any>('/live-classes', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/live-classes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/live-classes/${id}`, { method: 'DELETE' }),
  },

  // Recorded Classes
  recorded: {
    getAll: (courseId?: string) => request<any>(`/recorded-classes${courseId ? `?courseId=${courseId}` : ''}`),
    adminGetAll: () => request<any>('/recorded-classes/admin/all'),
    create: (body: any) => request<any>('/recorded-classes', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/recorded-classes/${id}`, { method: 'DELETE' }),
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

  // File Upload (Direct from computer)
  upload: {
    file: async (file: File): Promise<{ success: boolean; fileUrl: string; filename: string; size: number }> => {
      const token = localStorage.getItem('lsl_token');
      const formData = new FormData();
      formData.append('file', file);

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
};
