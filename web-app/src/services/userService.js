import apiClient from './apiClient';

export const getMyProfile = async () => {
  const response = await apiClient.get('/api/profile/me');
  return response.data;
};

export const updateProfile = async (userData) => {
  const response = await apiClient.put('/api/profile/update', userData);
  return response.data;
};

export const uploadProfileImage = async (imageUrl) => {
  const response = await apiClient.post('/api/profile/upload-image', { imageUrl });
  return response.data;
};

export const deleteProfileImage = async () => {
  const response = await apiClient.delete('/api/profile/image');
  return response.data;
};

export const getAllAddresses = async () => {
  const response = await apiClient.get('/api/profile/addresses');
  return response.data;
};

export const addAddress = async (addressData) => {
  const response = await apiClient.post('/api/profile/address', addressData);
  return response.data;
};

export const updateAddress = async (addressData) => {
  const response = await apiClient.put('/api/profile/address', addressData);
  return response.data;
};

export const deleteAddress = async (addressId) => {
  const response = await apiClient.delete(`/api/profile/address/${addressId}`);
  return response.data;
};

export const setDefaultAddress = async (addressId) => {
  const response = await apiClient.patch(`/api/profile/address/${addressId}/default`);
  return response.data;
};
