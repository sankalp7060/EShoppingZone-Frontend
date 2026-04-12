import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, ArrowLeft, Box, MapPin, CreditCard, Star, AlertTriangle, Clock, CheckCircle, Package, Truck, XCircle } from 'lucide-react';
import { getMyOrders, trackOrder, cancelOrder } from '../../services/orderService';
import { rateProduct } from '../../services/productService';
import { useAlert } from '../../context/AlertContext';
import Layout from '../../components/layout/Layout';
import './Orders.css';

const Orders = () => {
    const { showAlert } = useAlert();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [trackingData, setTrackingData] = useState(null);
    const [showTrackModal, setShowTrackModal] = useState(false);
    const [filter, setFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // New Modals State
    const [orderToRate, setOrderToRate] = useState(null);
    const [orderToCancel, setOrderToCancel] = useState(null);
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const res = await getMyOrders();
            if (res.success) setOrders(res.data);
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTrack = async (orderId) => {
        try {
            const res = await trackOrder(orderId);
            if (res.success) {
                setTrackingData(res.data);
                setShowTrackModal(true);
            }
        } catch (error) {
            console.error('Track error:', error);
        }
    };

    const handleCancelClick = (order) => {
        setOrderToCancel(order);
    };

    const handleCancelConfirm = async () => {
        if (!orderToCancel) return;
        setSubmitting(true);
        try {
            const res = await cancelOrder(orderToCancel.orderId, 'User requested cancellation');
            if (res.success) {
                showAlert('Order cancelled successfully', 'success');
                loadOrders();
                setOrderToCancel(null);
            }
        } catch (error) {
            showAlert('Failed to cancel order', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRateSubmit = async () => {
        if (!orderToRate) return;
        setSubmitting(true);
        try {
            // In a real app we might rate each product, but for now we rate the primary one or first one
            const productId = orderToRate.items[0]?.productId;
            if (productId) {
                const res = await rateProduct(productId, rating);
                if (res.success) {
                    showAlert('Thank you for your feedback!', 'success');
                    setOrderToRate(null);
                }
            }
        } catch (error) {
            showAlert('Failed to submit rating', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchesStatus = filter === 'ALL' || o.orderStatus === filter;
        const matchesSearch = o.orderId.toString().includes(searchQuery) || 
                             o.items.some(item => item.productName.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'placed':          return <Clock size={16} className="text-amber-500" />;
            case 'confirmed':       return <CheckCircle size={16} className="text-blue-400" />;
            case 'packed':          return <Package size={16} className="text-yellow-400" />;
            case 'shipped':         return <Truck size={16} className="text-blue-500" />;
            case 'outfordelivery':  return <Truck size={16} className="text-purple-400" />;
            case 'delivered':       return <CheckCircle size={16} className="text-emerald-500" />;
            case 'cancelled':       return <XCircle size={16} className="text-rose-500" />;
            case 'failed':          return <XCircle size={16} className="text-red-400" />;
            default:                return <Package size={16} />;
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="orders-loading">
                    <div className="orders-spinner"></div>
                    <p>Fetching your order history...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="orders-page">
                {/* Header Section */}
                <div className="orders-hero">
                    <div className="orders-hero-bg"></div>
                    <div className="orders-hero-content">
                        <h1>My Orders</h1>
                        <p>Manage and track your shopping journey</p>
                    </div>
                </div>

                <div className="orders-main">
                    {/* Filters & Search */}
                    <div className="orders-controls">
                        <div className="filter-tabs">
                            {['ALL', 'Placed', 'Confirmed', 'Shipped', 'Delivered', 'OutForDelivery', 'Failed', 'Packed'].map(f => (
                                <button 
                                    key={f} 
                                    className={`filter-tab ${filter === f ? 'active' : ''}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <div className="orders-search-bar">
                            <Search size={18} className="orders-search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search by Order ID or Product name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Orders List */}
                    {filteredOrders.length === 0 ? (
                        <div className="orders-empty">
                            <Box size={64} className="empty-icon" />
                            <h2>No orders found</h2>
                            <p>Try adjusting your filters or continue shopping.</p>
                        </div>
                    ) : (
                        <div className="orders-list">
                            {filteredOrders.map(order => (
                                <div key={order.orderId} className="order-glass-card">
                                    <div className="order-card-top">
                                        <div className="order-id-section">
                                            <span className="order-label">Order</span>
                                            <span className="order-id">#{order.orderId}</span>
                                        </div>
                                        <div className="order-status-pill" data-status={order.orderStatus.toLowerCase()}>
                                            {getStatusIcon(order.orderStatus)}
                                            <span>{order.orderStatus}</span>
                                        </div>
                                    </div>

                                    <div className="order-card-body">
                                        <div className="order-items-minimal">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="minimal-item">
                                                    <div className="item-img-wrap">
                                                        <img src={item.imageUrl || 'https://via.placeholder.com/150'} alt="" />
                                                    </div>
                                                    <div className="item-details">
                                                        <h4>{item.productName}</h4>
                                                        <p>Qty: {item.quantity} • ₹{item.price.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="order-info-grid">
                                            <div className="info-item">
                                                <Clock size={14} />
                                                <span>Placed on {new Date(order.orderDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="info-item">
                                                <CreditCard size={14} />
                                                <span>{order.modeOfPayment}</span>
                                            </div>
                                            <div className="info-item">
                                                <MapPin size={14} />
                                                <span>Delivery to {order.address.city}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="order-card-footer">
                                        <div className="total-amount">
                                            <span className="label">Total Paid</span>
                                            <span className="value">₹{order.amountPaid.toLocaleString()}</span>
                                        </div>
                                        <div className="action-buttons">
                                            <button 
                                                className="btn-track" 
                                                onClick={() => handleTrack(order.orderId)}
                                            >
                                                Track Progress
                                            </button>
                                            {['Placed', 'Confirmed'].includes(order.orderStatus) && (
                                                <button 
                                                    className="btn-cancel" 
                                                    onClick={() => handleCancelClick(order)}
                                                >
                                                    Cancel Order
                                                </button>
                                            )}
                                            {order.orderStatus === 'Delivered' && (
                                                <button 
                                                    className="btn-rate" 
                                                    onClick={() => { setOrderToRate(order); setRating(5); }}
                                                >
                                                    Rate Experience
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tracking Modal */}
                {showTrackModal && trackingData && (
                    <div className="modal-overlay" onClick={() => setShowTrackModal(false)}>
                        <div className="tracking-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-title-wrap">
                                    <Truck className="title-icon" />
                                    <div>
                                        <h2>Order Journey</h2>
                                        <p>Tracking for #{trackingData.orderId}</p>
                                    </div>
                                </div>
                                <button className="modal-close-btn" onClick={() => setShowTrackModal(false)}>×</button>
                            </div>

                            <div className="tracking-timeline-v2">
                                {trackingData.statusHistory.length > 0 ? (
                                    trackingData.statusHistory.map((h, i) => (
                                        <div key={i} className={`timeline-node ${i === 0 ? 'current' : ''}`}>
                                            <div className="node-indicator">
                                                <div className="node-dot"></div>
                                                {i < trackingData.statusHistory.length - 1 && <div className="node-line"></div>}
                                            </div>
                                            <div className="node-info">
                                                <div className="node-header">
                                                    <h4>{h.status}</h4>
                                                    <span className="timestamp">{new Date(h.updatedAt).toLocaleString()}</span>
                                                </div>
                                                <p className="remarks">{h.remarks || 'No additional remarks'}</p>
                                                {h.updatedBy && <span className="updated-by">Updated by {h.updatedBy}</span>}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-history">No tracking history yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Rating Modal (#7) */}
                {orderToRate && (
                    <div className="modal-overlay" onClick={() => setOrderToRate(null)}>
                        <div className="tracking-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-title-wrap">
                                    <Star className="title-icon" style={{color: '#ffb800'}} />
                                    <div>
                                        <h2>Rate your Experience</h2>
                                        <p>How was your purchase for #{orderToRate.orderId}?</p>
                                    </div>
                                </div>
                                <button className="modal-close-btn" onClick={() => setOrderToRate(null)}>×</button>
                            </div>

                            <div className="star-rating">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button 
                                        key={s} 
                                        className={`star-btn ${rating >= s ? 'active' : ''}`}
                                        onClick={() => setRating(s)}
                                    >
                                        <Star size={32} fill={rating >= s ? 'currentColor' : 'none'} />
                                    </button>
                                ))}
                            </div>

                            <div className="modal-footer-actions">
                                <button className="btn-ghost-modal" onClick={() => setOrderToRate(null)}>Maybe Later</button>
                                <button 
                                    className="btn-confirm-modal" 
                                    style={{background: '#10b981'}}
                                    onClick={handleRateSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Rating'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Custom Cancellation Modal (#12) */}
                {orderToCancel && (
                    <div className="modal-overlay" onClick={() => setOrderToCancel(null)}>
                        <div className="tracking-modal" onClick={e => e.stopPropagation()}>
                            <div className="confirmation-card">
                                <AlertTriangle className="confirm-warning-icon" />
                                <h3>Cancel Order?</h3>
                                <p>
                                    Are you sure you want to cancel order <strong>#{orderToCancel.orderId}</strong>? 
                                    This action cannot be undone and your payment (if any) will be refunded to your wallet.
                                </p>
                                
                                <div className="modal-footer-actions">
                                    <button className="btn-ghost-modal" onClick={() => setOrderToCancel(null)}>Keep Order</button>
                                    <button 
                                        className="btn-confirm-modal" 
                                        style={{background: '#ef4444'}}
                                        onClick={handleCancelConfirm}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Orders;
