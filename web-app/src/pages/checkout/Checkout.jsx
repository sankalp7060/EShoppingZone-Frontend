import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart } from '../../services/cartService';
import { getAllAddresses, addAddress } from '../../services/userService';
import { getWalletBalance } from '../../services/walletService';
import { placeOrder } from '../../services/orderService';
import { useCart } from '../../context/CartContext';
import Layout from '../../components/layout/Layout';
import './Checkout.css';

const Checkout = () => {
    const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Success
    const [cart, setCart] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);
    const [paymentMode, setPaymentMode] = useState('COD');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [orderError, setOrderError] = useState('');
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        houseNumber: '', streetName: '', colonyName: '', city: '', state: '', pincode: '', landmark: ''
    });

    const navigate = useNavigate();
    const { loadCart } = useCart();

    useEffect(() => {
        loadCheckoutData();
    }, []);

    const loadCheckoutData = async () => {
        setLoading(true);
        try {
            const [cartRes, addrRes, walletRes] = await Promise.all([
                getCart(),
                getAllAddresses(),
                getWalletBalance()
            ]);

            if (cartRes.success) setCart(cartRes.data);
            if (addrRes.success) {
                setAddresses(addrRes.data);
                const def = addrRes.data.find(a => a.isDefault);
                if (def) setSelectedAddress(def.id);
            }
            if (walletRes.success) setWalletBalance(walletRes.data.currentBalance);
            
            if (!cartRes.data?.items?.length) {
                navigate('/cart');
            }
        } catch (error) {
            console.error('Checkout load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const res = await addAddress(newAddress);
            if (res.success) {
                const addedId = res.data.id;
                setAddresses([...addresses, res.data]);
                setSelectedAddress(addedId);
                // Auto-set as default so it appears next time
                try { await import('../../services/userService').then(m => m.setDefaultAddress(addedId)); } catch (_) {}
                setShowAddressForm(false);
            }
        } catch (error) {
            alert('Failed to add address');
        } finally {
            setProcessing(false);
        }
    };

    const subtotal = cart?.totalPrice ?? 0;
    const totalPayable = subtotal; // No additional tax — backend charges cart.TotalPrice exactly

    // ─── STOCK POLICY ───────────────────────────────────────────────────────────
    // Stock is reduced HERE and only here — when the order is confirmed.
    // Adding/removing items from the cart never touches stock.
    // The backend must atomically validate & decrement stock inside placeOrder.
    // ────────────────────────────────────────────────────────────────────────────
    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            alert('Please select a delivery address');
            return;
        }

        if (paymentMode === 'EWALLET' && (walletBalance ?? 0) < totalPayable) {
            alert('Insufficient wallet balance');
            return;
        }

        // Pre-validate: ensure cart is not empty (guard against stale state)
        if (!cart?.items?.length) {
            alert('Your cart is empty. Please add items before placing an order.');
            return;
        }

        setProcessing(true);
        setOrderError('');
        try {
            const orderData = {
                addressId: selectedAddress,
                modeOfPayment: paymentMode
            };

            // placeOrder hits the backend which atomically validates stock
            // and deducts it only upon confirmed placement.
            const res = await placeOrder(orderData);
            if (res.success) {
                setStep(3);
                await loadCart(); // Sync cart count after order (cart is cleared by backend)
            } else {
                // Backend returns specific messages for out-of-stock, insufficient funds, etc.
                setOrderError(res.message || 'Order placement failed. Please try again.');
            }
        } catch (error) {
            const msg = error.response?.data?.message;
            // Surface stock-specific errors clearly
            if (msg?.toLowerCase().includes('stock') || msg?.toLowerCase().includes('available')) {
                setOrderError(`Stock issue: ${msg}`);
            } else {
                setOrderError(msg || 'An error occurred during checkout. Please try again.');
            }
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <Layout><div className="loading">Securing your checkout session...</div></Layout>;

    return (
        <Layout>
            <div className="checkout-container">
                <div className="checkout-steps">
                    <button 
                        className={`step ${step >= 1 ? 'active' : ''}`}
                        onClick={() => step < 3 && setStep(1)}
                        disabled={step === 3}
                    >
                        1. Address
                    </button>
                    <div className="step-line"></div>
                    <button 
                        className={`step ${step >= 2 ? 'active' : ''}`}
                        onClick={() => step < 3 && selectedAddress && setStep(2)}
                        disabled={step === 3 || !selectedAddress}
                    >
                        2. Payment
                    </button>
                    <div className="step-line"></div>
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Confirmation</div>
                </div>

                <div className="checkout-grid">
                    <div className="checkout-main">
                        {step === 1 && (
                            <div className="address-step">
                                <div className="step-header">
                                    <h2>Delivery Address</h2>
                                    <p>Select your preferred shipping location</p>
                                </div>
                                <div className="address-options">
                                    {addresses.map(addr => (
                                        <div 
                                            key={addr.id} 
                                            className={`address-card ${selectedAddress === addr.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedAddress(addr.id)}
                                        >
                                            <div className="addr-badge">
                                                {addr.isDefault && <span className="def-badge">Default</span>}
                                            </div>
                                            <p className="addr-name">{addr.houseNumber}, {addr.streetName}</p>
                                            <p className="addr-details">{addr.colonyName}</p>
                                            <p className="addr-details">{addr.city}, {addr.state} - {addr.pincode}</p>
                                            <div className="select-indicator"></div>
                                        </div>
                                    ))}
                                    <button className="new-addr-btn" onClick={() => setShowAddressForm(true)}>
                                        <span className="plus">+</span>
                                        Add New Address
                                    </button>
                                </div>
                                
                                {showAddressForm && (
                                    <form className="address-form" onSubmit={handleAddAddress}>
                                        <div className="form-header">
                                            <h3>New Delivery Point</h3>
                                            <p>All fields are required for precise delivery</p>
                                        </div>
                                        <div className="form-row">
                                            <input placeholder="House No." value={newAddress.houseNumber} onChange={e => setNewAddress({...newAddress, houseNumber: e.target.value})} required />
                                            <input placeholder="Street Name" value={newAddress.streetName} onChange={e => setNewAddress({...newAddress, streetName: e.target.value})} required />
                                        </div>
                                        <input placeholder="Colony / Area" value={newAddress.colonyName} onChange={e => setNewAddress({...newAddress, colonyName: e.target.value})} required />
                                        <div className="form-row">
                                            <input placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} required />
                                            <input placeholder="State" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} required />
                                        </div>
                                        <input placeholder="Pincode" value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} required />
                                        <div className="form-actions">
                                            <button type="button" className="btn-cancel" onClick={() => setShowAddressForm(false)}>Cancel</button>
                                            <button type="submit" className="btn-save" disabled={processing}>Save & Use Address</button>
                                        </div>
                                    </form>
                                )}

                                <div className="step-actions">
                                    <button 
                                        className="continue-btn" 
                                        onClick={() => selectedAddress && setStep(2)}
                                        disabled={!selectedAddress}
                                    >
                                        Continue to Payment
                                        <span className="arrow">→</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="payment-step">
                                <div className="step-header">
                                    <h2>Payment Method</h2>
                                    <p>Select how you'd like to settle your order</p>
                                </div>
                                <div className="payment-options">
                                    <div 
                                        className={`pay-card ${paymentMode === 'COD' ? 'selected' : ''}`}
                                        onClick={() => setPaymentMode('COD')}
                                    >
                                        <div className="pay-icon-box">💵</div>
                                        <div className="pay-info">
                                            <h3>Cash on Delivery</h3>
                                            <p>Secure payment upon arrival</p>
                                        </div>
                                        <div className="pay-check"></div>
                                    </div>
                                    <div 
                                        className={`pay-card ${paymentMode === 'EWALLET' ? 'selected' : ''} ${(walletBalance ?? 0) < totalPayable ? 'disabled' : ''}`}
                                        onClick={() => (walletBalance ?? 0) >= totalPayable && setPaymentMode('EWALLET')}
                                    >
                                        <div className="pay-icon-box">👛</div>
                                        <div className="pay-info">
                                            <h3>E-Wallet</h3>
                                            <p>Available: ₹{(walletBalance ?? 0).toLocaleString()}</p>
                                            {(walletBalance ?? 0) < totalPayable && <span className="low-bal">Insufficient balance</span>}
                                        </div>
                                        <div className="pay-check"></div>
                                    </div>
                                </div>
                                <div className="payment-actions">
                                    <button className="back-btn" onClick={() => setStep(1)}>
                                        <span className="arrow">←</span>
                                        Back to Address
                                    </button>
                                    {orderError && (
                                        <div style={{ 
                                            display: 'flex', alignItems: 'flex-start', gap: 8,
                                            background: 'rgba(239,68,68,0.08)', 
                                            border: '1px solid rgba(239,68,68,0.3)',
                                            borderRadius: 8, padding: '12px 16px', 
                                            color: '#ef4444', fontSize: 14,
                                            marginBottom: 12, width: '100%'
                                        }}>
                                            <span>⚠️</span>
                                            <span>{orderError}</span>
                                        </div>
                                    )}
                                    <button className="place-order-btn" onClick={handlePlaceOrder} disabled={processing}>
                                        {processing ? 'Processing...' : `Confirm & Place Order (₹${totalPayable.toLocaleString()})`}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="success-step">
                                <div className="success-visual">
                                    <div className="check-circle">✓</div>
                                </div>
                                <h2>Order Placed Successfully!</h2>
                                <p>Thank you for choosing EShoppingZone. Your premium selection is being prepared for shipment.</p>
                                <div className="order-confirm-details">
                                    <div className="confirm-row">
                                        <span>Status</span>
                                        <span className="status-confirmed">Order Received ✓</span>
                                    </div>
                                    <div className="confirm-row">
                                        <span>Payment</span>
                                        <span>{paymentMode === 'EWALLET' ? 'Wallet Paid' : 'Cash on Delivery'}</span>
                                    </div>
                                </div>
                                <div className="success-actions">
                                    <button className="view-orders-btn" onClick={() => navigate('/customer/orders')}>View My Orders</button>
                                    <button className="continue-shop-btn" onClick={() => navigate('/shop')}>Continue Shopping</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {step < 3 && (
                        <aside className="checkout-summary">
                            <div className="summary-card-v2">
                                <h3>Order Summary</h3>
                                <div className="summary-items-list">
                                    {cart?.items?.map(item => (
                                        <div key={item.productId} className="summary-item-row">
                                            <div className="item-qty-name">
                                                <span className="item-qty">{item.quantity}x</span>
                                                <span className="item-name">{item.productName}</span>
                                            </div>
                                            <span className="item-price">₹{(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="summary-divider"></div>
                                
                                <div className="summary-calculations">
                                    <div className="calc-row">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="calc-row">
                                        <span>Delivery</span>
                                        <span className="free">Complimentary</span>
                                    </div>
                                </div>
                                
                                <div className="summary-grand-total">
                                    <span>Total Payable</span>
                                    <span className="grand-total-val">₹{totalPayable.toLocaleString()}</span>
                                </div>

                                <div className="summary-trust">
                                    <div className="trust-item">🛡️ Encrypted Transfer</div>
                                    <div className="trust-item">🔒 Secure Infrastructure</div>
                                </div>
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Checkout;
