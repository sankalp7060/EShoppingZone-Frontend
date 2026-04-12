import apiClient from './apiClient';

export const getWalletBalance = async () => {
  const response = await apiClient.get('/api/wallet/balance');
  return response.data;
};

export const addMoneyToWallet = async (amount) => {
  const response = await apiClient.post('/api/wallet/add-money', { amount });
  return response.data;
};

export const getWalletStatements = async () => {
  const response = await apiClient.get('/api/wallet/statements');
  return response.data;
};

export const payWithWallet = async (amount, orderId) => {
    const response = await apiClient.post('/api/wallet/pay', { amount, orderId });
    return response.data;
};
export const withdrawFromWallet = async (amount) => {
    const response = await apiClient.post('/api/wallet/withdraw', { amount });
    return response.data;
};

/* Razorpay Integration */
export const createRazorpayOrder = async (amount) => {
    const response = await apiClient.post('/api/wallet/create-payment-order', { amount });
    return response.data;
};

export const verifyRazorpayPayment = async (verificationData) => {
    const response = await apiClient.post('/api/wallet/verify-payment', verificationData);
    return response.data;
};

export const createWallet = async () => {
    const response = await apiClient.post('/api/wallet/create');
    return response.data;
};
