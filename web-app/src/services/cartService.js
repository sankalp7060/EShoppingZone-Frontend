import apiClient from './apiClient';

export const getCart = async () => {
  const response = await apiClient.get('/api/cart');
  return response.data;
};

export const addToCart = async (product, quantity) => {
  // Resolve product ID — backend may call it productId or id
  const productId = product.productId || product.id;

  // Resolve image — product list uses images[], product detail also uses images[]
  // Cart items returned by backend use imageUrl (string)
  const imageUrl =
    (Array.isArray(product.images) && product.images[0]) ||
    product.imageUrl ||
    product.productImage ||
    '';

  const payload = {
    productId,
    productName: product.productName,
    price: Number(product.price),
    quantity: Number(quantity),
    imageUrl,
  };

  // Debug — remove after confirming payload matches backend expectation
  console.debug('[cartService] addToCart payload:', JSON.stringify(payload));

  const response = await apiClient.post('/api/cart/add', payload);
  return response.data;
};

export const updateCartItem = async (cartItemId, quantity) => {
  const response = await apiClient.put('/api/cart/update', { cartItemId, quantity });
  return response.data;
};

export const removeFromCart = async (cartItemId) => {
  const response = await apiClient.delete(`/api/cart/remove/${cartItemId}`);
  return response.data;
};

export const clearCart = async () => {
  const response = await apiClient.delete('/api/cart/clear');
  return response.data;
};
