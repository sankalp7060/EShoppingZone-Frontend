import apiClient from './apiClient';

export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration API error:', error);
    throw error;
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post('/api/auth/login', credentials);
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  } catch (error) {
    console.error('Login API error:', error);
    throw error;
  }
};

export const googleLogin = async (idToken, role) => {
  try {
    const response = await apiClient.post('/api/auth/google', { idToken, role });
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  } catch (error) {
    console.error('Google login API error:', error);
    throw error;
  }
};

export const checkEmail = async (email) => {
  try {
    const response = await apiClient.post('/api/auth/check-email', { email });
    return response.data;
  } catch (error) {
    console.error('Check email API error:', error);
    throw error;
  }
};

export const logout = async (refreshToken) => {
  try {
    await apiClient.post('/api/auth/logout', { refreshToken });
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

export const refreshToken = async (token) => {
  try {
    const response = await apiClient.post('/api/auth/refresh-token', { refreshToken: token });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
    }
    return response.data;
  } catch (error) {
    console.error('Refresh token error:', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};