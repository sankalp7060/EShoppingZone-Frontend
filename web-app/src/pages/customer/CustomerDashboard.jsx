import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyOrders } from '../../services/orderService';
import { getWalletBalance } from '../../services/walletService';
import Layout from '../../components/layout/Layout';
import { 
    ShoppingBag, 
    Wallet, 
    Truck, 
    ArrowRight, 
    Star, 
    Clock, 
    CheckCircle,
    ChevronRight,
    Search,
    Package
} from 'lucide-react';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalOrders: 0,
        activeOrders: 0,
        walletBalance: 0,
        recentOrder: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [ordersRes, walletRes] = await Promise.all([
                getMyOrders(),
                getWalletBalance()
            ]);

            if (ordersRes.success) {
                const orders = ordersRes.data || [];
                const active = orders.filter(o => !['Delivered', 'Cancelled', 'Failed'].includes(o.orderStatus));
                setStats(prev => ({
                    ...prev,
                    totalOrders: orders.length,
                    activeOrders: active.length,
                    recentOrder: orders[0] || null
                }));
            }

            if (walletRes.success) {
                setStats(prev => ({ ...prev, walletBalance: walletRes.data.currentBalance }));
            }
        } catch (error) {
            console.error('Failed to load customer dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="cust-dash-loading">
                    <div className="dash-spinner"></div>
                    <p>Building your personalized view...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="customer-dashboard">
                {/* Hero Greeting */}
                <header className="dash-hero">
                    <div className="dash-hero-content">
                        <h1>Welcome back!</h1>
                        <p>Manage your orders, track deliveries, and explore new arrivals.</p>
                    </div>
                    <div className="dash-hero-actions">
                        <button className="btn-shop-now" onClick={() => navigate('/products')}>
                            Start Shopping <ArrowRight size={18} />
                        </button>
                    </div>
                </header>

                <div className="dash-grid">
                    {/* Stats Grid */}
                    <div className="dash-stats-row">
                        <div className="dash-stat-card wallet" onClick={() => navigate('/wallet')}>
                            <div className="stat-icon-bg">
                                <Wallet size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Wallet Balance</span>
                                <h2 className="stat-value">₹{stats.walletBalance.toLocaleString()}</h2>
                                <span className="stat-meta">Ready for checkout</span>
                            </div>
                            <ChevronRight className="card-arrow" />
                        </div>

                        <div className="dash-stat-card orders" onClick={() => navigate('/orders')}>
                            <div className="stat-icon-bg">
                                <ShoppingBag size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Total Orders</span>
                                <h2 className="stat-value">{stats.totalOrders}</h2>
                                <span className="stat-meta">{stats.activeOrders} active deliveries</span>
                            </div>
                            <ChevronRight className="card-arrow" />
                        </div>

                        <div className="dash-stat-card tracking" onClick={() => navigate('/orders')}>
                            <div className="stat-icon-bg">
                                <Truck size={24} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">Active Trackers</span>
                                <h2 className="stat-value">{stats.activeOrders}</h2>
                                <span className="stat-meta">In-transit shipments</span>
                            </div>
                            <ChevronRight className="card-arrow" />
                        </div>
                    </div>

                    <div className="dash-main-row">
                        {/* Recent Order Section */}
                        <div className="dash-recent-order">
                            <div className="section-header">
                                <h3>Recently Placed</h3>
                                <button className="text-btn" onClick={() => navigate('/orders')}>View All</button>
                            </div>
                            
                            {stats.recentOrder ? (
                                <div className="recent-order-card">
                                    <div className="order-main-info">
                                        <div className="order-img-grid">
                                            {stats.recentOrder.items.slice(0, 1).map((item, idx) => (
                                                <img key={idx} src={item.imageUrl || 'https://via.placeholder.com/150'} alt="" />
                                            ))}
                                        </div>
                                        <div className="order-details">
                                            <div className="order-header-line">
                                                <h4>Order #{stats.recentOrder.orderId}</h4>
                                                <span className={`status-tag ${stats.recentOrder.orderStatus.toLowerCase()}`}>
                                                    {stats.recentOrder.orderStatus}
                                                </span>
                                            </div>
                                            <p className="order-price">₹{stats.recentOrder.amountPaid.toLocaleString()}</p>
                                            <div className="order-tracking-mini">
                                                <div className="tracking-step active">
                                                    <CheckCircle size={14} /> <span>Placed</span>
                                                </div>
                                                <div className="tracking-line"></div>
                                                <div className={`tracking-step ${['Confirmed', 'Packed', 'Shipped', 'Delivered'].includes(stats.recentOrder.orderStatus) ? 'active' : ''}`}>
                                                    <Package size={14} /> <span>Processing</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="btn-track-quick" onClick={() => navigate('/orders')}>
                                        Track Progress
                                    </button>
                                </div>
                            ) : (
                                <div className="empty-order-state">
                                    <ShoppingBag size={48} className="empty-icon" />
                                    <p>No orders yet. Start your journey today!</p>
                                    <button className="btn-primary" onClick={() => navigate('/products')}>Browse Products</button>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions & Explore */}
                        <div className="dash-side-actions">
                            <div className="action-card promo">
                                <div className="promo-tag">EShopping PLUS</div>
                                <h4>Free Delivery on Next 3 Orders</h4>
                                <p>Unlock premium benefits with our loyalty program.</p>
                                <button className="btn-secondary-dash">Learn More</button>
                            </div>

                            <div className="quick-links-card">
                                <h4>Quick Links</h4>
                                <div className="links-list">
                                    <button onClick={() => navigate('/profile')}>
                                        <div className="link-icon"><Star size={18} /></div>
                                        <span>My Profile</span>
                                    </button>
                                    <button onClick={() => navigate('/wallet')}>
                                        <div className="link-icon"><Wallet size={18} /></div>
                                        <span>Add Funds</span>
                                    </button>
                                    <button onClick={() => navigate('/products')}>
                                        <div className="link-icon"><Search size={18} /></div>
                                        <span>Find Products</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CustomerDashboard;
