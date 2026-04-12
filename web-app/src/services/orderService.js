import apiClient from './apiClient';

export const getMyOrders = async () => {
  const response = await apiClient.get('/api/orders');
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await apiClient.get(`/api/orders/${id}`);
  return response.data;
};

/**
 * Place an order. Stock is deducted HERE and only here — never on add-to-cart.
 * Backend must validate stock atomically before confirming.
 * If any item is out of stock, the backend returns an error with the product name.
 */
export const placeOrder = async (orderData) => {
  const endpoint = orderData.modeOfPayment === 'EWALLET' ? '/api/orders/pay' : '/api/orders/place';
  const response = await apiClient.post(endpoint, orderData);
  return response.data;
};

export const trackOrder = async (id) => {
    const response = await apiClient.get(`/api/orders/${id}/track`);
    return response.data;
};

export const cancelOrder = async (id, reason) => {
    const response = await apiClient.post(`/api/orders/${id}/cancel`, { reason });
    return response.data;
};

export const getMerchantOrders = async (params = {}) => {
    const response = await apiClient.get('/api/orders/merchant/orders', { params });
    return response.data;
};

