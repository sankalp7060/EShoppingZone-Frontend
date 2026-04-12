import apiClient from './apiClient';

// ─── STOCK POLICY ─────────────────────────────────────────────────────────────
// Stock is READ here (for display purposes) but NEVER WRITTEN.
// Stock deduction happens exclusively at the order-service when an order is
// confirmed (POST /api/orders/place or /api/orders/pay).
// Cart add / update / remove operations do NOT touch stock.
// ──────────────────────────────────────────────────────────────────────────────

export const getProducts = async (params = {}) => {
  const response = await apiClient.get('/api/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await apiClient.get(`/api/products/${id}`);
  return response.data;
};

/**
 * Fetches the latest stock quantity for a product.
 * Use this for a live stock check (e.g. before incrementing cart quantity).
 * Does NOT modify stock.
 */
export const getProductStock = async (id) => {
  const response = await apiClient.get(`/api/products/${id}`);
  if (response.data?.success) {
    return { success: true, stockQuantity: response.data.data.stockQuantity ?? 0 };
  }
  return { success: false, stockQuantity: 0 };
};

export const createProduct = async (productData) => {
  const response = await apiClient.post('/api/products', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await apiClient.put(`/api/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await apiClient.delete(`/api/products/${id}`);
  return response.data;
};

export const rateProduct = async (id, rating) => {
  const response = await apiClient.post(`/api/products/${id}/rate`, { rating });
  return response.data;
};

// NOTE: Stock is NEVER reduced by frontend product actions.
// Stock deduction happens exclusively at the backend order-service
// when an order is confirmed (POST /api/orders/place or /api/orders/pay).
// Do NOT add any client-side stock mutation here.

export const getMerchantProducts = async () => {
  const response = await apiClient.get('/api/products/merchant/products');
  return response.data;
};

export const getCategories = async () => {
    // Currently assuming categories are derived from products or a separate endpoint
    // If separate endpoint exists:
    try {
        const response = await apiClient.get('/api/products/categories');
        return response.data;
    } catch (e) {
        // Fallback for immediate merchant accessibility
        return { success: true, data: ['Electronics', 'Fashion', 'Home Appliances', 'Beauty & Health', 'Sports & Fitness', 'Books & Stationery'] };
    }
};

export const getCategoryDistribution = async () => {
  const response = await apiClient.get('/api/products/stats/category-distribution');
  return response.data;
};

export const getProductTypes = async () => {
    try {
        const response = await apiClient.get('/api/products/types');
        return response.data;
    } catch (e) {
        return { success: true, data: ['Smartphone', 'Laptop', 'Audio/Headphones', 'Gaming Console', 'Smartwatch', 'Camera', 'Television', 'Hardware'] };
    }
};