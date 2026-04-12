// frontend/web-app/src/services/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '', // Empty falls back to relative paths for Vite proxy
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip token-refresh logic for auth endpoints — these are intentional
    // auth failures (wrong password, wrong role, etc.) and must reach the
    // component's own catch block so the correct alert can be shown.
    const isAuthEndpoint = originalRequest?.url?.includes('/api/auth/login')
      || originalRequest?.url?.includes('/api/auth/register')
      || originalRequest?.url?.includes('/api/auth/google')
      || originalRequest?.url?.includes('/api/auth/check-email');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${apiClient.defaults.baseURL}/api/auth/refresh-token`, {
            refreshToken: refreshToken
          });
          
          if (response.data.success) {
            localStorage.setItem('token', response.data.data.accessToken);
            localStorage.setItem('refreshToken', response.data.data.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;