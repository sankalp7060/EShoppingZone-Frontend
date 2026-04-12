import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Layout from '../../components/layout/Layout';
import { 
    Trash2, 
    Plus, 
    Minus, 
    ShoppingBag, 
    ArrowRight, 
    CreditCard, 
    ShieldCheck, 
    Truck,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import './Cart.css';

const Cart = () => {
    const { isAuthenticated } = useAuth();
    const { cartItems, loading, loadCart, updateQuantity, removeFromCart, clearCart } = useCart();
    const navigate = useNavigate();

    // Per-item error messages (e.g. "Only 2 in stock")
    const [itemErrors, setItemErrors] = useState({});
    // Global cart-level error
    const [cartError, setCartError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        loadCart();
    }, [isAuthenticated, loadCart, navigate]);

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal;

    const handleUpdateQuantity = async (itemId, newQty) => {
        // Clear previous error for this item
        setItemErrors(prev => ({ ...prev, [itemId]: '' }));

        const res = await updateQuantity(itemId, newQty);
        if (!res.success) {
            setItemErrors(prev => ({ ...prev, [itemId]: res.message }));
        }
    };

    const handleRemove = async (itemId) => {
        // Remove does NOT affect stock — just removes from cart
        setItemErrors(prev => ({ ...prev, [itemId]: '' }));
        await removeFromCart(itemId);
    };

    const handleClearCart = async () => {
        // Clear cart does NOT affect stock
        setItemErrors({});
        setCartError('');
        await clearCart();
    };

    if (loading && cartItems.length === 0) {
        return (
            <Layout>
                <div className="cart-loading">
                    <RefreshCw className="spinner" />
                    <p>Securing your selection...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="cart-page">
                <div className="cart-container">
                    <header className="cart-header">
                        <div className="cart-header-title">
                            <h1>Your Shopping Bag</h1>
                            <span>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} curated for you</span>
                        </div>
                        {cartItems.length > 0 && (
                            <button className="clear-bag-btn" onClick={handleClearCart}>
                                <Trash2 size={16} />
                                Clear Bag
                            </button>
                        )}
                    </header>

                    {cartError && (
                        <div className="cart-error-banner" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#ef4444' }}>
                            <AlertCircle size={16} />
                            <span>{cartError}</span>
                        </div>
                    )}

                    {cartItems.length === 0 ? (
                        <div className="empty-cart">
                            <div className="empty-icon-wrap">
                                <ShoppingBag size={48} />
                            </div>
                            <h2>Your bag is looking light</h2>
                            <p>Explore our premium collection and discover something extraordinary.</p>
                            <Link to="/shop" className="continue-shopping">
                                Start Shopping
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    ) : (
                        <div className="cart-layout">
                            {/* Items List */}
                            <div className="cart-items">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="cart-item">
                                        <div className="item-img-container">
                                            <img src={item.imageUrl || 'https://via.placeholder.com/150'} alt={item.productName} />
                                        </div>
                                        
                                        <div className="item-info">
                                            <div className="item-main-info">
                                                <div className="item-name-group">
                                                    <h3>{item.productName}</h3>
                                                    {item.category && <span className="item-category">{item.category}</span>}
                                                </div>
                                                <span className="item-price-unit">₹{item.price.toLocaleString()}</span>
                                            </div>
 
                                            <div className="item-controls">
                                                <div className="qty-stepper">
                                                    <button 
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus size={16} />
                                                    </button>
                                                    <span className="qty-val">{item.quantity}</span>
                                                    <button 
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>
 
                                                <div className="item-secondary-actions">
                                                    <span className="item-total-price">₹{(item.price * item.quantity).toLocaleString()}</span>
                                                    <button 
                                                        className="remove-btn" 
                                                        onClick={() => handleRemove(item.id)}
                                                        title="Remove item"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Per-item stock error */}
                                            {itemErrors[item.id] && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: '#ef4444', fontSize: 13 }}>
                                                    <AlertCircle size={14} />
                                                    <span>{itemErrors[item.id]}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <Link to="/shop" className="back-to-shop">
                                    <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} />
                                    Continue Shopping
                                </Link>
                            </div>

                            {/* Summary Card */}
                            <aside className="cart-summary">
                                <div className="summary-card">
                                    <h2>Order Summary</h2>
                                    
                                    <div className="summary-table">
                                        <div className="summary-row">
                                            <span>Subtotal</span>
                                            <span>₹{subtotal.toLocaleString()}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Shipping</span>
                                            <span className="free-tag">Complimentary</span>
                                        </div>
                                    </div>

                                    <div className="summary-divider"></div>

                                    <div className="summary-total">
                                        <span>Grand Total</span>
                                        <span className="total-val">₹{total.toLocaleString()}</span>
                                    </div>

                                    <button 
                                        className="checkout-proceed-btn"
                                        onClick={() => navigate('/checkout')}
                                    >
                                        Proceed to Checkout
                                        <ArrowRight size={20} />
                                    </button>

                                    <div className="checkout-trust-badges">
                                        <div className="badge">
                                            <ShieldCheck size={14} />
                                            Secure Checkout
                                        </div>
                                        <div className="badge">
                                            <CreditCard size={14} />
                                            Safe Payments
                                        </div>
                                        <div className="badge">
                                            <Truck size={14} />
                                            Global Delivery
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Cart;

