import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById, rateProduct } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
    Star,
    StarHalf,
    ArrowLeft,
    ShoppingBag,
    Heart,
    Truck,
    ShieldCheck,
    Box,
    Info,
    Home as HomeIcon,
    CreditCard,
    Plus,
    Minus,
    Package
} from 'lucide-react';
import Layout from '../../components/layout/Layout';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false);
    const [isBuying, setIsBuying] = useState(false);
    const [isRating, setIsRating] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Quantity the user wants to add via stepper
    const [selectedQty, setSelectedQty] = useState(1);

    const { isAuthenticated, userRole } = useAuth();
    const { addToCart, cartItems } = useCart();

    const isCustomer = isAuthenticated && userRole?.toLowerCase() === 'customer';

    useEffect(() => { loadProduct(); }, [id]);
    useEffect(() => { setSelectedQty(1); }, [id]);

    const loadProduct = async () => {
        setLoading(true);
        try {
            const response = await getProductById(id);
            if (response.success) {
                setProduct(response.data);
            } else {
                setErrorMessage('Product not found');
                setTimeout(() => navigate('/'), 2000);
            }
        } catch (error) {
            console.error('Error loading product:', error);
            setErrorMessage('Failed to load product');
            setTimeout(() => navigate('/'), 2000);
        } finally {
            setLoading(false);
        }
    };

    // ─── STOCK HELPERS ─────────────────────────────────────────────────────────
    // Use null-safe access; treat undefined the same as "stock unknown"
    const stockQuantity = product?.stockQuantity ?? null; // null = unknown, 0 = confirmed OOS
    const stockKnown = stockQuantity !== null;

    // Units of THIS product already sitting in the user's cart
    const qtyAlreadyInCart = cartItems
        .filter(item => String(item.productId || item.id) === String(id))
        .reduce((sum, item) => sum + item.quantity, 0);

    // How many MORE units the user is still allowed to add (only meaningful when stock is known)
    const canAddMore = stockKnown ? Math.max(0, stockQuantity - qtyAlreadyInCart) : Infinity;

    // Cart already holds every available unit (only possible when stock is known and > 0)
    const cartFullyLoaded = stockKnown && stockQuantity > 0 && canAddMore === 0;
    // ───────────────────────────────────────────────────────────────────────────

    const decreaseQty = () => setSelectedQty(q => Math.max(1, q - 1));
    const increaseQty = () => setSelectedQty(q => Math.min(canAddMore === Infinity ? 99 : canAddMore, q + 1));

    // Re-clamp selectedQty if canAddMore shrinks
    useEffect(() => {
        if (canAddMore !== Infinity && canAddMore > 0 && selectedQty > canAddMore) setSelectedQty(canAddMore);
        if (canAddMore === 0) setSelectedQty(0);
    }, [canAddMore]);

    const showError = (msg, ms = 4000) => {
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(''), ms);
    };
    const showSuccess = (msg, ms = 3000) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), ms);
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated) { navigate('/login'); return; }
        if (!isCustomer) return;
        if (isOutOfStock) return; // only block when CONFIRMED out of stock

        if (cartFullyLoaded) {
            showError(`You already have all ${stockQuantity} available unit(s) in your cart.`);
            return;
        }
        if (selectedQty < 1) {
            showError('Please select at least 1 item.');
            return;
        }
        // Hard cap only enforced when stock count is known
        if (stockKnown && qtyAlreadyInCart + selectedQty > stockQuantity) {
            showError(`Cannot add ${selectedQty} — only ${canAddMore} more unit(s) available (${qtyAlreadyInCart} already in your cart).`);
            return;
        }

        setAddingToCart(true);
        try {
            const result = await addToCart(product, selectedQty);
            if (result.success) {
                showSuccess(`${selectedQty > 1 ? `${selectedQty} × ` : ''}${product.productName} added to cart!`);
                setSelectedQty(1);
            } else {
                showError(result.message || 'Failed to add to cart');
            }
        } catch (error) {
            showError('Failed to add to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        if (!isAuthenticated) { navigate('/login'); return; }
        if (!isCustomer) return;

        if (isOutOfStock) { // only block when CONFIRMED out of stock
            showError('This item is currently out of stock.');
            return;
        }

        // If user already has all available stock in cart, just go to checkout
        if (cartFullyLoaded) { navigate('/checkout'); return; }

        // Hard cap only enforced when stock count is known
        if (stockKnown && qtyAlreadyInCart + selectedQty > stockQuantity) {
            showError(`Only ${canAddMore} more unit(s) can be added (${qtyAlreadyInCart} already in cart).`);
            return;
        }

        setIsBuying(true);
        try {
            // addToCart does NOT deduct stock — stock only reduces at order placement.
            const result = await addToCart(product, selectedQty);
            if (result.success) {
                navigate('/checkout');
            } else {
                showError(result.message || 'Could not proceed to checkout');
                setIsBuying(false);
            }
        } catch (error) {
            showError(error.response?.data?.message || 'Could not proceed to checkout');
            setIsBuying(false);
        }
    };

    const handleRate = async (rating) => {
        if (!isCustomer || isRating) return;
        setIsRating(true);
        try {
            const response = await rateProduct(id, rating);
            if (response.success) {
                setProduct(response.data);
                showSuccess('Thank you for rating!');
            }
        } catch (error) {
            showError('Failed to submit rating');
        } finally {
            setIsRating(false);
        }
    };

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating || 0);
        const hasHalfStar = (rating || 0) % 1 >= 0.5;
        return (
            <div className={`product-rating ${isCustomer ? 'interactive' : ''}`}>
                <div className="stars">
                    {[...Array(5)].map((_, i) => {
                        const starValue = i + 1;
                        const isFilled = starValue <= fullStars;
                        const isHalf = !isFilled && starValue === fullStars + 1 && hasHalfStar;
                        return (
                            <span key={i} onClick={() => isCustomer && !isRating && handleRate(starValue)}
                                style={{ cursor: isCustomer ? 'pointer' : 'default' }}>
                                {isFilled ? <Star size={18} fill="currentColor" />
                                    : isHalf ? <StarHalf size={18} fill="currentColor" />
                                        : <Star size={18} />}
                            </span>
                        );
                    })}
                </div>
                <span className="rating-count">
                    {product.totalReviews > 0
                        ? `(${product.totalReviews} global ratings)`
                        : isCustomer ? '(No ratings yet - be the first!)' : '(No ratings yet)'}
                </span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="detail-loading">
                <div className="spinner"></div>
                <p>Fetching product details...</p>
            </div>
        );
    }

    if (!product) return null;

    // isOutOfStock only when stock is confirmed 0 — not when it's unknown (null)
    const isOutOfStock = stockKnown && stockQuantity <= 0;

    return (
        <Layout>
            <div className="product-detail-container">
                <nav className="breadcrumb" aria-label="Breadcrumb">
                    <Link to="/"><HomeIcon size={14} style={{ marginRight: '6px' }} /> Home</Link>
                    <span className="separator">/</span>
                    <Link to="/products">Collection</Link>
                    <span className="separator">/</span>
                    <span className="current">{product.productName}</span>
                </nav>

                {successMessage && (
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#10b981', padding: '12px 20px', borderRadius: '10px',
                        marginBottom: '16px', fontSize: '14px'
                    }}>✓ {successMessage}</div>
                )}
                {errorMessage && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#ef4444', padding: '12px 20px', borderRadius: '10px',
                        marginBottom: '16px', fontSize: '14px'
                    }}>⚠️ {errorMessage}</div>
                )}

                <div className="product-detail-card">
                    {/* ── IMAGE ── */}
                    <div className="product-detail-image">
                        <button className="back-btn" onClick={() => navigate(-1)}>
                            <ArrowLeft size={20} />
                        </button>
                        {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.productName || 'Product'}
                                loading="lazy"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/600x500?text=No+Image+Available'; }} />
                        ) : (
                            <div className="no-image-large">
                                <Box size={64} opacity={0.3} />
                                <p>No Visual Available</p>
                            </div>
                        )}
                        {isOutOfStock && <div className="detail-out-of-stock-badge">Sold Out</div>}
                    </div>

                    {/* ── INFO ── */}
                    <div className="product-detail-info">
                        <span className="detail-brand">{product.brand || 'Premium Collection'}</span>
                        <h1>{product.productName}</h1>
                        <p className="detail-category-tag">{product.category} • {product.productType}</p>

                        {renderStars(product.averageRating)}

                        <div className="detail-price-section">
                            <span className="currency">₹</span>
                            <span className="price-value">{(product.price || 0).toLocaleString()}</span>
                        </div>

                        <div className="trust-badges">
                            <div className="trust-badge"><Truck size={18} /><span>Express Delivery</span></div>
                            <div className="trust-badge"><ShieldCheck size={18} /><span>Secure Transaction</span></div>
                        </div>

                        {/* ── STOCK STATUS — actual number shown ── */}
                        <div className="detail-stock-status">
                            <span className={`status-dot ${stockQuantity > 0 ? 'online' : 'offline'}`}></span>
                            {isOutOfStock ? (
                                <span className="out-of-stock">Currently Out of Stock</span>
                            ) : (
                                <span className="in-stock" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Package size={14} />
                                    {stockKnown
                                        ? `${stockQuantity} unit${stockQuantity !== 1 ? 's' : ''} in stock`
                                        : 'In Stock'}
                                    {stockKnown && stockQuantity <= 5 && (
                                        <span style={{
                                            background: 'rgba(251,146,60,0.15)', color: '#fb923c',
                                            fontSize: 11, fontWeight: 700, padding: '2px 8px',
                                            borderRadius: 20, border: '1px solid rgba(251,146,60,0.3)'
                                        }}>
                                            Only {stockQuantity} left!
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>

                        {/* Cart-already-loaded notice */}
                        {isCustomer && !isOutOfStock && qtyAlreadyInCart > 0 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                                borderRadius: 10, padding: '8px 14px',
                                fontSize: 13, color: '#a5b4fc', marginBottom: 16
                            }}>
                                🛒 {qtyAlreadyInCart} unit{qtyAlreadyInCart !== 1 ? 's' : ''} already in your cart
                                {cartFullyLoaded && " — you've reached the maximum available stock"}
                            </div>
                        )}

                        <div className="detail-description">
                            <h3>Product Overview</h3>
                            <p>{product.description}</p>
                        </div>

                        {product.specifications && Object.keys(product.specifications).length > 0 && (
                            <div className="detail-specifications">
                                <h3>Technical Details</h3>
                                <div className="specs-grid">
                                    {Object.entries(product.specifications).map(([key, value]) => (
                                        <div className="spec-item" key={key}>
                                            <span className="spec-label">{key}</span>
                                            <span className="spec-value">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── ACTIONS ── */}
                        {isCustomer ? (
                            <div className="detail-actions">

                                {/* QUANTITY STEPPER — only when in stock and can still add */}
                                {!isOutOfStock && !cartFullyLoaded && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: 12, padding: '4px',
                                        marginBottom: 16, width: 'fit-content', gap: 0
                                    }}>
                                        <button onClick={decreaseQty} disabled={selectedQty <= 1}
                                            style={{
                                                width: 38, height: 38, border: 'none', borderRadius: 9,
                                                background: selectedQty <= 1 ? 'transparent' : 'rgba(255,255,255,0.08)',
                                                color: selectedQty <= 1 ? 'rgba(255,255,255,0.25)' : '#fff',
                                                cursor: selectedQty <= 1 ? 'not-allowed' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.15s'
                                            }}>
                                            <Minus size={16} />
                                        </button>
                                        <span style={{
                                            minWidth: 44, textAlign: 'center',
                                            fontSize: 16, fontWeight: 700, color: '#fff'
                                        }}>
                                            {selectedQty}
                                        </span>
                                        <button onClick={increaseQty} disabled={selectedQty >= canAddMore}
                                            style={{
                                                width: 38, height: 38, border: 'none', borderRadius: 9,
                                                background: selectedQty >= canAddMore ? 'transparent' : 'rgba(255,255,255,0.08)',
                                                color: selectedQty >= canAddMore ? 'rgba(255,255,255,0.25)' : '#fff',
                                                cursor: selectedQty >= canAddMore ? 'not-allowed' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.15s'
                                            }}>
                                            <Plus size={16} />
                                        </button>
                                        {canAddMore !== Infinity && (
                                            <span style={{
                                                fontSize: 12, color: 'rgba(255,255,255,0.4)',
                                                paddingLeft: 10, paddingRight: 8
                                            }}>
                                                Max {canAddMore}
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                    <button className="btn-add-to-cart-premium" onClick={handleAddToCart}
                                        disabled={addingToCart || isOutOfStock || cartFullyLoaded}>
                                        {addingToCart ? (
                                            <div className="btn-spinner"></div>
                                        ) : (
                                            <>
                                                <ShoppingBag size={20} style={{ marginRight: '10px' }} />
                                                {isOutOfStock
                                                    ? 'Currently Unavailable'
                                                    : cartFullyLoaded
                                                        ? 'Max Stock in Cart'
                                                        : `Add${selectedQty > 1 ? ` ${selectedQty}` : ''} to Shopping Bag`}
                                            </>
                                        )}
                                    </button>

                                    <button className="btn-wishlist">
                                        <Heart size={22} className="heart-icon-svg" />
                                    </button>

                                    <button className="btn-buy-now" onClick={handleBuyNow}
                                        disabled={isBuying || isOutOfStock}
                                        style={{
                                            background: 'linear-gradient(135deg, #ffffff 0%, #e2e4ec 100%)',
                                            color: '#0a0c10', border: 'none', padding: '12px 30px',
                                            borderRadius: '14px', fontWeight: '700', fontSize: '15px',
                                            cursor: isBuying || isOutOfStock ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            opacity: isOutOfStock ? 0.5 : 1
                                        }}>
                                        {isBuying ? (
                                            <div className="btn-spinner"
                                                style={{ borderColor: '#0a0c10 transparent #0a0c10 transparent' }}></div>
                                        ) : (
                                            <>
                                                <CreditCard size={18} />
                                                {cartFullyLoaded ? 'Go to Checkout' : 'Buy Now'}
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Cap-reached message */}
                                {cartFullyLoaded && (
                                    <p style={{
                                        marginTop: 12, fontSize: 13, color: '#fb923c',
                                        display: 'flex', alignItems: 'center', gap: 6
                                    }}>
                                        ⚠️ You've added all {stockQuantity} available unit(s) to your cart.
                                        Proceed to checkout to place your order.
                                    </p>
                                )}
                            </div>
                        ) : !isAuthenticated ? (
                            <div className="detail-actions">
                                <button className="btn-add-to-cart-premium" onClick={() => navigate('/login')}>
                                    <ShoppingBag size={20} style={{ marginRight: '10px' }} />
                                    Login to Purchase
                                </button>
                            </div>
                        ) : (
                            <div className="detail-actions-admin">
                                <span style={{
                                    color: 'rgba(255,255,255,0.5)', fontSize: '14px',
                                    background: 'rgba(255,255,255,0.05)', padding: '12px 20px',
                                    borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <Info size={16} /> Retail actions are disabled for staff accounts.
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProductDetail;
