import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, Check, Loader2, AlertCircle } from 'lucide-react';
import './ProductCard.css';

const ProductCard = ({ product, showAddButton = true }) => {
    const { id, productName, price, description, images, category, stockQuantity } = product;
    const { addToCart } = useCart();
    const { isAuthenticated, userRole } = useAuth();
    const navigate = useNavigate();
    
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);
    const [addError, setAddError] = useState('');

    // Cart button is only shown/functional for Customer role
    const isCustomer = isAuthenticated && userRole?.toLowerCase() === 'customer';

    // Adding to cart does NOT reduce stock — stock is only reduced at order placement.
    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (!isCustomer) return;
        // Only block when stock is EXPLICITLY 0 (confirmed OOS), not when field is missing
        if (stockQuantity !== undefined && stockQuantity !== null && stockQuantity <= 0) return;

        setAdding(true);
        setAddError('');
        const res = await addToCart(product, 1);
        setAdding(false);

        if (res.success) {
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        } else {
            setAddError(res.message || 'Could not add to cart');
            setTimeout(() => setAddError(''), 3000);
        }
    };

    // isOutOfStock only when CONFIRMED 0 — undefined means unknown (treat as in-stock)
    const isOutOfStock = stockQuantity !== undefined && stockQuantity !== null && stockQuantity <= 0;

    // Only show the add-to-cart button for customers (or unauthenticated → redirects to login)
    const shouldShowCartBtn = showAddButton && (isCustomer || !isAuthenticated);

    return (
        <div className="product-card">
            <Link to={`/products/${id}`} className="card-link">
                <div className="product-image">
                    <img 
                        src={images?.[0] || 'https://via.placeholder.com/600x400?text=Premium+Collection'} 
                        alt={productName || 'Product'} 
                        onError={(e) => e.target.src = 'https://via.placeholder.com/600x400?text=No+Visual+Available'}
                    />
                    <div className="product-category">{category}</div>
                    {isOutOfStock && <div className="out-of-stock-badge">Out of Stock</div>}
                </div>
                <div className="product-info">
                    <h3 className="product-title">{productName}</h3>
                    <p className="product-description">{description?.substring(0, 60)}...</p>
                    <div className="product-footer">
                        <div className="price-tag">
                            <span className="currency">₹</span>
                            <span className="price-value">{price.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </Link>
            
            {shouldShowCartBtn && (
                <button 
                    className={`add-cart-btn ${added ? 'success' : ''} ${isOutOfStock ? 'disabled' : ''}`}
                    onClick={handleAddToCart}
                    disabled={adding || isOutOfStock}
                    title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                >
                    {adding ? (
                        <Loader2 className="spinner" size={18} />
                    ) : added ? (
                        <Check size={18} />
                    ) : (
                        <ShoppingCart size={18} />
                    )}
                </button>
            )}

            {/* Inline error for failed add-to-cart (e.g. stock exhausted) */}
            {addError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', color: '#ef4444', fontSize: 12 }}>
                    <AlertCircle size={12} />
                    <span>{addError}</span>
                </div>
            )}
        </div>
    );
};

export default ProductCard;
