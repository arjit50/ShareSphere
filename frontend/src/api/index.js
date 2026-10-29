import api from './axiosClient';

// Auth API
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
};

// Users API
export const usersApi = {
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  getPublicProfile: (id) => api.get(`/users/public/${id}`),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  toggleStatus: (id) => api.patch(`/users/${id}/status`),
};

// Categories API
export const categoriesApi = {
  getAll: (includeInactive = false) =>
    api.get('/categories', { params: { includeInactive } }),
  getBySlug: (slug) => api.get(`/categories/${slug}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Items API
export const itemsApi = {
  getAll: (params) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  getMyItems: () => api.get('/items/me'),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
};

// Borrow Requests API
export const borrowRequestsApi = {
  checkAvailability: (params) => api.get('/borrow-requests/check-availability', { params }),
  create: (data) => api.post('/borrow-requests', data),
  getMyRequests: (params) => api.get('/borrow-requests/my-requests', { params }),
  getIncomingRequests: (params) => api.get('/borrow-requests/incoming', { params }),
  respond: (id, data) => api.patch(`/borrow-requests/${id}/respond`, data),
  cancel: (id) => api.patch(`/borrow-requests/${id}/cancel`),
};

// Loans API
export const loansApi = {
  getMyLoans: (params) => api.get('/loans/my-loans', { params }),
  getById: (id) => api.get(`/loans/${id}`),
  pickup: (id) => api.patch(`/loans/${id}/pickup`),
  checkOverdue: () => api.post('/loans/check-overdue'),
};

// Returns API
export const returnsApi = {
  processReturn: (loanId, data) => api.post(`/returns/${loanId}`, data),
  getByLoan: (loanId) => api.get(`/returns/loan/${loanId}`),
  getAll: (params) => api.get('/returns', { params }),
};

// Damage Reports API
export const damageReportsApi = {
  create: (data) => api.post('/damage-reports', data),
  getAll: (params) => api.get('/damage-reports', { params }),
  getById: (id) => api.get(`/damage-reports/${id}`),
  updateResolution: (id, data) => api.patch(`/damage-reports/${id}/resolution`, data),
};

// Reviews API
export const reviewsApi = {
  create: (data) => api.post('/reviews', data),
  getItemReviews: (itemId) => api.get(`/reviews/item/${itemId}`),
  getUserReviews: (userId) => api.get(`/reviews/user/${userId}`),
};

// Analytics API
export const analyticsApi = {
  getAdminDashboard: () => api.get('/admin/analytics/admin'),
  getUserHistory: () => api.get('/admin/analytics/history/me'),
  getExplainStats: (keyword) => api.get('/admin/analytics/explain', { params: { keyword } }),
  getLookupReport: () => api.get('/admin/analytics/lookup-report'),
};
