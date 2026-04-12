import apiClient from './apiClient';

// ==================== USER MANAGEMENT ====================
export const getAllUsers = async (filters = {}) => {
  const response = await apiClient.get('/api/admin/users', { params: filters });
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await apiClient.get(`/api/admin/users/${userId}`);
  return response.data;
};

export const createUserByAdmin = async (userData) => {
  const response = await apiClient.post('/api/admin/users', userData);
  return response.data;
};

export const updateUserByAdmin = async (userId, userData) => {
  const response = await apiClient.put(`/api/admin/users/${userId}`, userData);
  return response.data;
};

export const changeUserRole = async (userId, role) => {
  const response = await apiClient.patch(`/api/admin/users/${userId}/role`, { role });
  return response.data;
};

export const suspendUser = async (userId, reason) => {
  const response = await apiClient.post(`/api/admin/users/${userId}/suspend`, { reason });
  return response.data;
};

export const reactivateUser = async (userId) => {
  const response = await apiClient.post(`/api/admin/users/${userId}/reactivate`);
  return response.data;
};

export const deleteUserByAdmin = async (userId) => {
  const response = await apiClient.delete(`/api/admin/users/${userId}`);
  return response.data;
};

// ==================== PLATFORM ANALYTICS ====================
export const getDashboardAnalytics = async () => {
  const response = await apiClient.get('/api/admin/dashboard/analytics');
  return response.data;
};

export const getUserActivity = async (days = 7) => {
  const response = await apiClient.get('/api/admin/dashboard/user-activity', { params: { days } });
  return response.data;
};

export const getRevenueAnalytics = async (fromDate, toDate) => {
  const response = await apiClient.get('/api/admin/dashboard/revenue', { params: { fromDate, toDate } });
  return response.data;
};

// ==================== ORDER MANAGEMENT ====================
// Note: These hit the order-service via gateway
export const getAllOrders = async (filters = {}) => {
    const response = await apiClient.get('/api/orders/admin/all', { params: filters });
    return response.data;
};

export const updateOrderStatus = async (orderId, orderStatus, remarks = '') => {
    const response = await apiClient.put(`/api/orders/${orderId}/status`, { orderStatus, remarks });
    return response.data;
};

export const getOrderDetails = async (orderId) => {
    const response = await apiClient.get(`/api/orders/${orderId}`);
    return response.data;
};
