import React, { useState, useEffect } from 'react';
import { useTabState } from '../../hooks/useTabState';
import { useAuth } from '../../context/AuthContext';
import { 
    getAllUsers, 
    getDashboardAnalytics, 
    getUserActivity, 
    changeUserRole, 
    suspendUser, 
    reactivateUser, 
    deleteUserByAdmin,
    createUserByAdmin,
    getAllOrders,
    updateOrderStatus,
    getRevenueAnalytics
} from '../../services/adminService';
import { getCategoryDistribution } from '../../services/productService';
import Layout from '../../components/layout/Layout';
import { useAlert } from '../../context/AlertContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
    // Data State
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [marketDist, setMarketDist] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Current logged-in admin — use AuthContext (reactive, always in sync)
    const { user: currentUser } = useAuth();

    // UI Navigation - URL Synced
    const [activeTab, setActiveTab] = useTabState('tab', 'overview');
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const { showAlert } = useAlert();
    
    // Forms
    const [newUser, setNewUser] = useState({
        fullName: '', email: '', password: '', mobileNumber: '',
        role: 'Customer', gender: 'Male', dateOfBirth: ''
    });
    const [statusUpdate, setStatusUpdate] = useState({ status: '', remarks: '' });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [analyticsRes, usersRes, activityRes, revenueRes, ordersRes, marketRes] = await Promise.allSettled([
                getDashboardAnalytics(),
                getAllUsers(),
                getUserActivity(7),
                getRevenueAnalytics(),
                getAllOrders(),
                getCategoryDistribution()
            ]);

            if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.success)
                setStats(analyticsRes.value.data);
            else if (analyticsRes.status === 'rejected')
                console.warn('Analytics failed:', analyticsRes.reason?.message);

            if (usersRes.status === 'fulfilled' && usersRes.value?.success)
                setUsers(usersRes.value.data.users || []);
            else if (usersRes.status === 'rejected')
                console.warn('Users failed:', usersRes.reason?.message);

            if (activityRes.status === 'fulfilled' && activityRes.value?.success)
                setActivities(activityRes.value.data || []);
            else if (activityRes.status === 'rejected')
                console.warn('Activity feed unavailable:', activityRes.reason?.message);

            if (revenueRes.status === 'fulfilled' && revenueRes.value?.success)
                setRevenueData(revenueRes.value.data?.dailyRevenue || []);
            else if (revenueRes.status === 'rejected')
                console.warn('Revenue data unavailable:', revenueRes.reason?.message);

            if (ordersRes.status === 'fulfilled' && ordersRes.value?.success)
                setOrders(ordersRes.value.data?.orders || []);
            else if (ordersRes.status === 'rejected')
                console.warn('Orders service unavailable:', ordersRes.reason?.message);

            if (marketRes.status === 'fulfilled' && marketRes.value?.success)
                setMarketDist(marketRes.value.data);
            else if (marketRes.status === 'rejected')
                console.warn('Market intelligence unavailable:', marketRes.reason?.message);

        } catch (error) {
            console.error('Unexpected data load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            // Fix: Ensure empty strings for optional fields are sent as null to prevent 400 errors
            const payload = {
                ...newUser,
                mobileNumber: parseInt(newUser.mobileNumber),
                role: newUser.role === 'Delivery' ? 'DeliveryAgent' : newUser.role,
                dateOfBirth: newUser.dateOfBirth === '' ? null : newUser.dateOfBirth,
                gender: newUser.gender === '' ? null : newUser.gender
            };
            const res = await createUserByAdmin(payload);
            if (res.success) {
                showAlert('Member registered successfully', 'success');
                setShowAddModal(false);
                setNewUser({
                    fullName: '', email: '', password: '', mobileNumber: '',
                    role: 'Customer', gender: 'Male', dateOfBirth: ''
                });
                loadInitialData();
            }
        } catch (error) {
            console.error('Registration error:', error);
            showAlert('Member registration failed: ' + (error.response?.data?.message || 'Check connection'), 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            if (user.isActive) {
                const res = await suspendUser(user.id, 'Regulatory administrative action');
                if (res.success) {
                    setUsers(users.map(u => u.id === user.id ? { ...u, isActive: false } : u));
                }
            } else {
                const res = await reactivateUser(user.id);
                if (res.success) {
                    showAlert(`Subject ${user.fullName} access restored`, 'success');
                    setUsers(users.map(u => u.id === user.id ? { ...u, isActive: true } : u));
                }
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message || 'Action failed';
            showAlert(msg, 'error');
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedItem) return;
        setProcessing(true);
        try {
            const res = await deleteUserByAdmin(selectedItem.id);
            if (res.success) {
                showAlert('Subject nullified successfully', 'success');
                setUsers(users.filter(u => u.id !== selectedItem.id));
                setShowConfirmModal(false);
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message || 'Delete failed';
            showAlert(msg, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateOrderStatus = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const res = await updateOrderStatus(selectedItem.orderId, statusUpdate.status, statusUpdate.remarks);
            if (res.success) {
                showAlert('Logistics stage updated', 'success');
                setOrders(orders.map(o => o.orderId === selectedItem.orderId ? { ...o, orderStatus: statusUpdate.status } : o));
                setShowOrderModal(false);
            }
        } catch (error) {
            showAlert('Logistics update failed: ' + (error.response?.data?.message || 'Check sequence rules'), 'error');
        } finally {
            setProcessing(false);
        }
    };

    const renderRevenueChart = () => {
        if (!revenueData || revenueData.length === 0) return <div className="no-chart">Gathering trend data...</div>;
        
        const maxRev = Math.max(...revenueData.map(d => d.revenue)) || 1;
        const width = 800;
        const height = 240;
        
        // Smoothing: Create a cubic bezier path for a premium "Apple-style" chart
        const points = revenueData.map((d, i) => ({
            x: (i / (revenueData.length - 1)) * width,
            y: height - (d.revenue / (maxRev * 1.1)) * height // Buffer at top
        }));

        let d = `M ${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];
            const cp1x = curr.x + (next.x - curr.x) / 3;
            const cp2x = curr.x + 2 * (next.x - curr.x) / 3;
            d += ` C ${cp1x},${curr.y} ${cp2x},${next.y} ${next.x},${next.y}`;
        }

        return (
            <div className="revenue-trend-container">
                <div className="revenue-trend-viz">
                    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ff6e40" stopOpacity="0.3" />
                                <stop offset="60%" stopColor="#ff6e40" stopOpacity="0.05" />
                                <stop offset="100%" stopColor="#ff6e40" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d={`${d} L ${width},${height} L 0,${height} Z`} fill="url(#chartGradient)" />
                        <path d={d} fill="none" stroke="#ff6e40" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="main-path" />
                        
                        {/* Data Points on hover effect placeholder */}
                        {points.map((p, i) => (
                            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#ff6e40" className="chart-dot" />
                        ))}
                    </svg>
                </div>
                <div className="chart-labels">
                    {revenueData.map((d, i) => (
                        <span key={i}>{new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                    ))}
                </div>
            </div>
        );
    };

    const renderSparkline = (data, color = '#ff6e40') => {
        if (!data || data.length < 2) return null;
        const width = 100;
        const height = 30;
        const max = Math.max(...data) || 1;
        const points = data.map((v, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - (v / max) * height;
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'All' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <Layout>
            <div className="pro-admin-layout">
                <aside className="pro-sidebar">
                    <div className="sidebar-brand">
                        <div className="brand-logo">EZ</div>
                        <h3>Admin Pro</h3>
                    </div>
                    <nav className="sidebar-nav">
                        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
                            <span className="icon">📊</span> Overview
                        </button>
                        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
                            <span className="icon">👥</span> Identities
                        </button>
                        <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
                            <span className="icon">📦</span> Logistics
                        </button>
                        <button className={activeTab === 'activity' ? 'active' : ''} onClick={() => setActiveTab('activity')}>
                            <span className="icon">🕒</span> Telemetry
                        </button>
                    </nav>
                </aside>

                <main className="pro-content">
                    {loading ? (
                        <div className="pane-loader">
                            <div className="spinner-pro"></div>
                            <span>Syncing Neural Network...</span>
                        </div>
                    ) : (
                        <>
                    {activeTab === 'overview' && (
                        <div className="pane fade-in">
                            <div className="stats-grid-pro">
                                <div className="stat-pro-card">
                                    <div className="stat-header-wrap">
                                        <span className="label">Total Capital</span>
                                        {renderSparkline(stats?.revenueTrend)}
                                    </div>
                                    <span className="value">₹{stats?.totalRevenue?.toLocaleString()}</span>
                                    <div className="trend positive">↑ Velocity Managed</div>
                                </div>
                                <div className="stat-pro-card">
                                    <div className="stat-header-wrap">
                                        <span className="label">Entities</span>
                                        {/* Merchant growth trend (proxied by activity for now) */}
                                        {renderSparkline([2, 2, 2, 2, 2, 2, stats?.merchants || 0], '#60a5fa')}
                                    </div>
                                    <span className="value">{stats?.merchants || 0}</span>
                                    <div className="trend">Stable Nodes</div>
                                </div>
                                <div className="stat-pro-card">
                                    <div className="stat-header-wrap">
                                        <span className="label">Identities</span>
                                        {renderSparkline(stats?.identityTrend, '#10b981')}
                                    </div>
                                    <span className="value">{stats?.totalUsers || 0}</span>
                                    <div className="trend positive">↑ Active Population</div>
                                </div>
                                <div className="stat-pro-card">
                                    <div className="stat-header-wrap">
                                        <span className="label">Throughput</span>
                                        {renderSparkline(stats?.throughputTrend, '#f59e0b')}
                                    </div>
                                    <span className="value">{stats?.totalOrders || 0}</span>
                                    <div className="trend positive">↑ Fulfillment Rate</div>
                                </div>
                            </div>

                            <div className="viz-row-pro">
                                <section className="revenue-viz">
                                    <div className="viz-header">
                                        <h3>Revenue Flux Intelligence</h3>
                                        <div className="time-filter">Real-time Stream</div>
                                    </div>
                                    {renderRevenueChart()}
                                </section>

                                <section className="distribution-viz">
                                    <h3>Market Distribution</h3>
                                    <div className="dist-bars">
                                        {marketDist ? Object.entries(marketDist).map(([label, count], idx) => {
                                            const total = Object.values(marketDist).reduce((a, b) => a + b, 0);
                                            const percentage = total > 0 ? (count / total) * 100 : 0;
                                            const colors = ['#ff6e40', '#60a5fa', '#10b981', '#f59e0b', '#8b5cf6'];
                                            return (
                                                <div key={label} className="dist-row">
                                                    <div className="dist-label-wrap">
                                                        <span>{label}</span>
                                                        <span>{percentage.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="dist-progress-bg">
                                                        <div className="dist-progress-fill" style={{ 
                                                            width: `${percentage}%`, 
                                                            background: colors[idx % colors.length] 
                                                        }}></div>
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <div className="no-data">Syncing catalog distribution...</div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="pane fade-in">
                            <header className="pane-header">
                                <div>
                                    <h1>Identity Governance</h1>
                                    <p>Subject access management</p>
                                </div>
                                <button className="pro-btn-primary" onClick={() => setShowAddModal(true)}>+ Register Subject</button>
                            </header>

                            <div className="pane-toolbar">
                                <div className="search-wrapper">
                                    <span className="search-icon">🔍</span>
                                    <input 
                                        placeholder="Filter identities by name or email..." 
                                        value={searchTerm} 
                                        onChange={e => setSearchTerm(e.target.value)} 
                                        className="pro-search-input" 
                                    />
                                </div>
                                <div className="filter-group">
                                    <label>Access Tier:</label>
                                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="pro-filter-select">
                                        <option value="All">All Tiers</option>
                                        <option value="Admin">Administrators</option>
                                        <option value="Merchant">Entity Merchants</option>
                                        <option value="Customer">Verified Customers</option>
                                        <option value="DeliveryAgent">Delivery Logistics</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pro-table-wrapper">
                                <table className="pro-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Email</th>
                                            <th>Access Tier</th>
                                            <th>State</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(u => (
                                            <tr key={u.id}>
                                                <td>
                                                    <div className="subject-box">
                                                        <div className="avatar-mini">{u.fullName[0]}</div>
                                                        <span>{u.fullName}</span>
                                                    </div>
                                                </td>
                                                <td>{u.email}</td>
                                                <td><span className={`tier-chip ${u.role.toLowerCase()}`}>{u.role}</span></td>
                                                <td>
                                                    <span className={`state-badge ${u.isActive ? 'online' : 'restricted'}`}>
                                                        {u.isActive ? 'Online' : 'Restricted'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-cluster">
                                                        {/* Disabled only for own account */}
                                                        {u.id !== currentUser?.id ? (
                                                            <button className="btn-icon" onClick={() => handleToggleStatus(u)}>
                                                                {u.isActive ? 'Suspend' : 'Resume'}
                                                            </button>
                                                        ) : (
                                                            <span className="btn-icon disabled" title="Cannot act on your own account">
                                                                {u.isActive ? 'Suspend' : 'Resume'}
                                                            </span>
                                                        )}
                                                        {/* Disabled only for own account */}
                                                        {u.id !== currentUser?.id ? (
                                                            <button className="btn-icon del" onClick={() => { setSelectedItem(u); setShowConfirmModal(true); }}>
                                                                Nullify
                                                            </button>
                                                        ) : (
                                                            <span className="btn-icon del disabled" title="Cannot delete your own account">
                                                                Nullify
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="pane fade-in">
                            <header className="pane-header">
                                <h1>Logistics Stream</h1>
                                <p>Platform fulfillment telemetry</p>
                            </header>

                            <div className="pro-table-wrapper">
                                <table className="pro-table">
                                    <thead>
                                        <tr>
                                            <th>Fulfillment ID</th>
                                            <th>Customer ID</th>
                                            <th>Capital</th>
                                            <th>Mode</th>
                                            <th>Logistics Stage</th>
                                            <th>Control</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(o => (
                                            <tr key={o.orderId}>
                                                <td><strong>#{o.orderId}</strong></td>
                                                <td>{o.customerId}</td>
                                                <td>₹{o.amountPaid?.toLocaleString()}</td>
                                                <td>{o.modeOfPayment}</td>
                                                <td><span className={`stage-chip ${o.orderStatus.toLowerCase()}`}>{o.orderStatus}</span></td>
                                                <td>
                                                    <button className="btn-icon" onClick={() => { setSelectedItem(o); setStatusUpdate({ status: o.orderStatus, remarks: '' }); setShowOrderModal(true); }}>
                                                        Process
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <div className="pane fade-in">
                            <header className="pane-header">
                                <h1>Telemetry Feed</h1>
                                <p>Recursive user activity logs</p>
                            </header>
                            <div className="telemetry-grid">
                                {activities.map((a, i) => (
                                    <div className="telemetry-card" key={i}>
                                        <div className="tele-header">
                                            <div className="tele-dot"></div>
                                            <h4>{a.userName} Analytics</h4>
                                        </div>
                                        <div className="tele-stats">
                                            <div className="t-stat"><span>Trans:</span> {a.orderCount}</div>
                                            <div className="t-stat"><span>Assets:</span> ₹{a.totalSpent?.toLocaleString()}</div>
                                        </div>
                                        <div className="tele-footer">Sync: {new Date(a.lastLoginAt).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                        </>
                    )}
                </main>

                {/* ===== REGISTER SUBJECT MODAL ===== */}
                {showAddModal && (
                    <div className="pro-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
                        <div className="reg-modal-box">
                            {/* Modal Header */}
                            <div className="reg-modal-header">
                                <div className="reg-modal-icon">👤</div>
                                <div>
                                    <h2>Register New Subject</h2>
                                    <p>Create a platform account with assigned access tier</p>
                                </div>
                                <button className="reg-modal-close" type="button" onClick={() => setShowAddModal(false)}>✕</button>
                            </div>

                            <form onSubmit={handleCreateUser} className="reg-form">
                                {/* Identity Section */}
                                <div className="reg-section-label">Identity</div>
                                <div className="pro-form-row">
                                    <div className="field">
                                        <label>Full Name</label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">👤</span>
                                            <input
                                                placeholder="e.g. John Doe"
                                                required
                                                value={newUser.fullName}
                                                onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="field">
                                        <label>Email Address</label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">✉️</span>
                                            <input
                                                type="email"
                                                placeholder="e.g. user@email.com"
                                                required
                                                value={newUser.email}
                                                onChange={e => setNewUser({...newUser, email: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Security Section */}
                                <div className="reg-section-label">Security &amp; Contact</div>
                                <div className="pro-form-row">
                                    <div className="field">
                                        <label>Password</label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">🔒</span>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Min. 6 characters"
                                                required
                                                value={newUser.password}
                                                onChange={e => setNewUser({...newUser, password: e.target.value})}
                                            />
                                            <button
                                                type="button"
                                                className="eye-toggle"
                                                onClick={() => setShowPassword(p => !p)}
                                                title={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="field">
                                        <label>Mobile Number</label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">📱</span>
                                            <input
                                                type="number"
                                                placeholder="10-digit mobile"
                                                required
                                                value={newUser.mobileNumber}
                                                onChange={e => setNewUser({...newUser, mobileNumber: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Role & Profile Section */}
                                <div className="reg-section-label">Role &amp; Profile</div>
                                <div className="pro-form-row">
                                    <div className="field">
                                        <label>Access Tier</label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">🏷️</span>
                                            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                                <option value="Customer">Customer</option>
                                                <option value="Merchant">Merchant</option>
                                                <option value="Delivery">Delivery Agent</option>
                                                <option value="Admin">Administrator</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="field">
                                        <label>Gender</label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">⚧️</span>
                                            <select value={newUser.gender} onChange={e => setNewUser({...newUser, gender: e.target.value})}>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="reg-modal-footer">
                                    <button type="button" className="btn-abort" onClick={() => setShowAddModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-reg-commit" disabled={processing}>
                                        {processing ? (
                                            <><span className="spinner-tiny"></span> Creating...</>
                                        ) : (
                                            <>+ Register Subject</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showOrderModal && (
                    <div className="pro-modal-overlay">
                        <div className="reg-modal-box" style={{ maxWidth: '500px' }}>
                            <div className="reg-modal-header">
                                <div className="reg-modal-icon">📦</div>
                                <div>
                                    <h2>Process Fulfilment #{selectedItem?.orderId}</h2>
                                    <p>Define the centralized logistics lifecycle</p>
                                </div>
                            </div>
                            <form className="reg-form" onSubmit={handleUpdateOrderStatus} style={{ padding: '2rem 2.5rem' }}>
                                <div className="field mb-3" style={{ marginBottom: '1.5rem' }}>
                                    <label>Logistics Stage</label>
                                    <div className="input-wrapper">
                                        <select value={statusUpdate.status} onChange={e => setStatusUpdate({...statusUpdate, status: e.target.value})} required style={{ paddingLeft: '1rem' }}>
                                            <option value="Placed">Placed</option>
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="Packed">Packed</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="field">
                                    <label>Internal Remarks / Triggers</label>
                                    <div className="input-wrapper">
                                        <textarea 
                                            value={statusUpdate.remarks} 
                                            onChange={e => setStatusUpdate({...statusUpdate, remarks: e.target.value})} 
                                            placeholder="Enter any necessary dispatch details..."
                                            style={{ 
                                                width: '100%', 
                                                background: 'rgba(255, 255, 255, 0.02)', 
                                                border: '1px solid rgba(255, 255, 255, 0.06)', 
                                                borderRadius: '12px', 
                                                padding: '1rem', 
                                                color: '#f1f5f9', 
                                                fontFamily: 'inherit',
                                                minHeight: '100px',
                                                marginTop: '0.35rem'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="reg-modal-footer" style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn-abort" onClick={() => setShowOrderModal(false)}>Cancel</button>
                                    <button type="submit" className="btn-reg-commit" disabled={processing} style={{ padding: '0.8rem 2rem' }}>
                                        {processing ? 'Processing...' : 'Commit Change'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showConfirmModal && (
                    <div className="pro-modal-overlay">
                        <div className="pro-modal-box sm text-center">
                            <h3>Nullify Subject?</h3>
                            <p>Are you sure you want to permanently delete <strong>{selectedItem?.fullName}</strong> from the registry?</p>
                            <div className="pro-modal-footer">
                                <button className="btn-abort" onClick={() => setShowConfirmModal(false)}>Abort</button>
                                <button className="btn-danger" onClick={handleDeleteUser} disabled={processing}>Nullify Subject</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AdminDashboard;
