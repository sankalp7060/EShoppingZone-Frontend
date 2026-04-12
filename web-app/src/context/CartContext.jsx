import React, { createContext, useState, useContext, useCallback } from 'react';
import { getCart, addToCart as addToCartAPI, updateCartItem, removeFromCart as removeFromCartAPI, clearCart as clearCartAPI } from '../services/cartService';
import { getProductStock } from '../services/productService';

// ─── STOCK POLICY ─────────────────────────────────────────────────────────────
// Cart operations (add, update, remove, clear) NEVER modify stock.
// Stock is deducted exclusively when an order is placed (checkout/order-service).
// Removing an item from the cart does NOT restore stock (stock was never deducted).
// ──────────────────────────────────────────────────────────────────────────────

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartCount, setCartCount] = useState(0);
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadCart = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setCartCount(0);
            setCartItems([]);
            return;
        }

        setLoading(true);
        try {
            const response = await getCart();
            if (response.success && response.data) {
                setCartItems(response.data.items || []);
                const itemsCount = response.data.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                setCartCount(itemsCount);
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            setCartCount(0);
            setCartItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Add to cart — does NOT affect stock. Enforces stock cap using current cart state.
    // Prevents user from adding more quantity than what's available in stock.
    const addToCart = async (product, quantity = 1) => {
        try {
            // stockQuantity may be undefined if the API field name differs —
            // only block when we are CERTAIN it is 0 (explicitly set, not missing).
            const stockQty = product.stockQuantity;
            const stockKnown = stockQty !== undefined && stockQty !== null;

            // Guard 1: only block if stock is EXPLICITLY 0 or less (not just unknown)
            if (stockKnown && stockQty <= 0) {
                return { success: false, message: 'This item is currently out of stock' };
            }

            // Guards 2-4 only apply when stock count is known
            if (stockKnown && stockQty > 0) {
                // Guard 2: how many of this product are already in the cart
                const productId = String(product.id || product.productId);
                const alreadyInCart = cartItems
                    .filter(item => String(item.productId || item.id) === productId)
                    .reduce((sum, item) => sum + item.quantity, 0);

                // Guard 3: cart already holds all available stock
                if (alreadyInCart >= stockQty) {
                    return {
                        success: false,
                        message: `You already have all ${stockQty} available unit(s) in your cart`
                    };
                }

                // Guard 4: requested quantity would push cart over stock limit
                const allowedToAdd = stockQty - alreadyInCart;
                if (quantity > allowedToAdd) {
                    return {
                        success: false,
                        message: `Only ${allowedToAdd} more unit(s) can be added (${alreadyInCart} already in your cart, ${stockQty} in stock)`
                    };
                }
            }

            const res = await addToCartAPI(product, quantity);
            if (res.success) {
                await loadCart();
                return { success: true };
            }
            return { success: false, message: res.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Failed to add item' };
        }
    };

    // Update cart item quantity — does NOT affect stock.
    // Enforces stock cap: total cart qty for this item cannot exceed stockQuantity.
    const updateQuantity = async (cartItemId, quantity) => {
        if (quantity < 1) return { success: false, message: 'Quantity must be at least 1' };

        try {
            // Always fetch fresh stock before allowing any quantity change
            const cartItem = cartItems.find(i => i.id === cartItemId);
            if (cartItem) {
                try {
                    const stockRes = await getProductStock(cartItem.productId || cartItem.id);
                    if (stockRes.success) {
                        const availableStock = stockRes.stockQuantity;
                        if (availableStock <= 0) {
                            return { success: false, message: 'This item is out of stock' };
                        }
                        if (quantity > availableStock) {
                            return {
                                success: false,
                                message: `Only ${availableStock} unit(s) available in stock — you cannot add more than that`
                            };
                        }
                    }
                } catch (_) {
                    // If stock fetch fails, fall through — backend validates at order time
                }
            }

            const res = await updateCartItem(cartItemId, quantity);
            if (res.success) {
                await loadCart();
                return { success: true };
            }
            return { success: false, message: res.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Failed to update quantity' };
        }
    };

    // Remove from cart — does NOT restore or affect stock in any way.
    const removeFromCart = async (cartItemId) => {
        try {
            const res = await removeFromCartAPI(cartItemId);
            if (res.success) {
                await loadCart();
                return { success: true };
            }
            return { success: false, message: res.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Failed to remove item' };
        }
    };

    // Clear cart — does NOT restore or affect stock in any way.
    const clearCart = async () => {
        try {
            const res = await clearCartAPI();
            if (res.success) {
                setCartCount(0);
                setCartItems([]);
                return { success: true };
            }
            return { success: false, message: res.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Failed to clear cart' };
        }
    };

    const clearCartState = () => {
        setCartCount(0);
        setCartItems([]);
    };

    const value = {
        cartCount,
        cartItems,
        loading,
        loadCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        clearCartState
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
