import React, { useState, useEffect } from 'react';
import { useTabState } from '../../hooks/useTabState';
import { useAuth } from '../../context/AuthContext';
import { getAllOrders, updateOrderStatus } from '../../services/adminService';
import Layout from '../../components/layout/Layout';
import { useAlert } from '../../context/AlertContext';
import { 
    Truck, 
    Package, 
    CheckCircle, 
    Clock, 
    MapPin, 
    Phone, 
    Navigation,
    Search,
    Filter,
    ArrowRight,
    RefreshCw,
    Settings,
    User
} from 'lucide-react';
import './DeliveryDashboard.css';

const DeliveryDashboard = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useTabState('status', 'ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [statusUpdate, setStatusUpdate] = useState({ status: '', remarks: '' });
    const { showAlert } = useAlert();

    useEffect(() => {
        loadDeliveryOrders();
    }, [activeFilter]);

    const loadDeliveryOrders = async () => {
        setLoading(true);
        try {
            // Reusing admin filter but restricted to relevant delivery statuses
            const res = await getAllOrders({ 
                status: activeFilter === 'ALL' ? null : activeFilter,
                pageSize: 50 
            });
            if (res.success) {
                setOrders(res.data.orders || []);
            }
        } catch (error) {
            console.error('Failed to load delivery jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, nextStatus) => {
        try {
            const res = await updateOrderStatus(orderId, nextStatus, remarks || `Status updated by delivery agent ${user.fullName}`);
            if (res.success) {
                showAlert('Delivery progress updated successfully', 'success');
                loadDeliveryOrders();
                setSelectedOrder(null);
                setRemarks('');
            }
        } catch (error) {
            showAlert('Failed to update status: ' + (error.response?.data?.message || 'Unauthorized'), 'error');
        }
    };

    const isActiveOrder = (status) => {
        return !['Delivered', 'Failed', 'Cancelled'].includes(status);
    };

    const getStatusBtnLabel = (order) => {
        if (!isActiveOrder(order.orderStatus)) return null;
        if (order.orderStatus === 'Shipped') return 'Pick up for Delivery';
        if (order.orderStatus === 'OutForDelivery') {
             return order.deliveryAgentId === user.id ? 'Complete Task' : 'Picked by Other';
        }
        return 'Manage Delivery';
    };

    const filteredOrders = orders.filter(o => 
        o.orderId.toString().includes(searchTerm) || 
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && orders.length === 0) {
        return (
            <Layout>
                <div className="delivery-loading">
                    <RefreshCw className="spinner" />
                    <p>Fetching active deliveries...</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="delivery-dashboard">
                <div className="delivery-container">
                    {/* Toolbar */}
                    <div className="delivery-toolbar">
                        <div className="status-filters">
                            {['ALL', 'Placed', 'Confirmed', 'Packed', 'Shipped', 'OutForDelivery', 'Delivered', 'Failed'].map(status => (
                                <button 
                                    key={status} 
                                    className={`filter-btn ${activeFilter === status ? 'active' : ''}`}
                                    onClick={() => setActiveFilter(status)}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        <div className="delivery-search">
                            <Search size={18} className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search by Order ID or Name..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Orders Grid */}
                    {filteredOrders.length === 0 ? (
                        <div className="empty-state-delivery">
                            <Package size={64} />
                            <h3>No active tasks</h3>
                            <p>You're all caught up for the moment!</p>
                        </div>
                    ) : (
                        <div className="delivery-grid">
                            {filteredOrders.map(order => (
                                <div key={order.orderId} className="delivery-card">
                                    <div className="card-header">
                                        <span className="order-id">#{order.orderId}</span>
                                        <div className={`status-tag ${order.orderStatus.toLowerCase()}`}>
                                            {order.orderStatus}
                                        </div>
                                    </div>

                                    <div className="card-body">
                                        <div className="customer-info">
                                            <div className="avatar">{order.customerName?.[0]}</div>
                                            <div>
                                                <h4>{order.customerName}</h4>
                                                <p className="items-count">{order.items?.length} items ({order.quantity} qty)</p>
                                            </div>
                                        </div>

                                        <div className="address-box">
                                            <MapPin size={16} className="addr-icon" />
                                            <div className="address-text">
                                                <p>{order.address.houseNumber}, {order.address.streetName}</p>
                                                <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                                            </div>
                                        </div>

                                        <div className="order-items-preview">
                                            {order.items.slice(0, 2).map((item, i) => (
                                                <span key={i} className="item-chip">{item.productName}</span>
                                            ))}
                                            {order.items.length > 2 && <span className="item-chip">+{order.items.length - 2} more</span>}
                                        </div>
                                    </div>

                                    <div className="card-footer">
                                        {isActiveOrder(order.orderStatus) ? (
                                            <button 
                                                className="action-btn-main"
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setStatusUpdate({ status: order.orderStatus === 'Shipped' ? 'OutForDelivery' : '', remarks: '' });
                                                }}
                                            >
                                                {getStatusBtnLabel(order)}
                                                <ArrowRight size={18} />
                                            </button>
                                        ) : (
                                            <div className="completed-label">
                                                <CheckCircle size={18} />
                                                Closed
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Update Modal */}
                {selectedOrder && (
                    <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                        <div className="status-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <div className="modal-title-block">
                                    <span className="modal-icon">🚚</span>
                                    <div>
                                        <h3>Update Delivery Progress</h3>
                                        <p className="modal-subtitle">Order <strong>#{selectedOrder.orderId}</strong> · {selectedOrder.customerName}</p>
                                    </div>
                                </div>
                                <button className="close-btn" onClick={() => { setSelectedOrder(null); setStatusUpdate({ status: '', remarks: '' }); }}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="delivery-current-state">
                                    <span className="d-state-dot"></span>
                                    <div>
                                        <div className="d-state-micro">CURRENT STATUS</div>
                                        <div className="d-state-text">{selectedOrder.orderStatus}</div>
                                    </div>
                                </div>

                                <div className="status-choice-group">
                                    <label>Select New Stage</label>
                                    {selectedOrder.orderStatus !== 'Shipped' && selectedOrder.orderStatus !== 'OutForDelivery' ? (
                                        <div className="delivery-warning">Cannot change status from {selectedOrder.orderStatus}. Wait for it to be Shipped.</div>
                                    ) : selectedOrder.orderStatus === 'Shipped' ? (
                                    <div className="delivery-stage-grid">
                                        <button
                                            className={`delivery-stage-chip transit ${statusUpdate.status === 'OutForDelivery' ? 'active' : ''}`}
                                            onClick={() => setStatusUpdate({...statusUpdate, status: 'OutForDelivery'})}
                                        >
                                            <span className="dsc-icon">🛵</span>
                                            <span className="dsc-label">Out For Delivery</span>
                                        </button>
                                    </div>
                                    ) : (
                                    <div className="delivery-stage-grid">
                                        <button
                                            className={`delivery-stage-chip delivered ${statusUpdate.status === 'Delivered' ? 'active' : ''}`}
                                            onClick={() => setStatusUpdate({...statusUpdate, status: 'Delivered'})}
                                        >
                                            <span className="dsc-icon">✅</span>
                                            <span className="dsc-label">Delivered</span>
                                        </button>
                                        <button
                                            className={`delivery-stage-chip failed ${statusUpdate.status === 'Failed' ? 'active' : ''}`}
                                            onClick={() => setStatusUpdate({...statusUpdate, status: 'Failed'})}
                                        >
                                            <span className="dsc-icon">❌</span>
                                            <span className="dsc-label">Failed</span>
                                        </button>
                                    </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="remarks-label">
                                        {statusUpdate.status === 'Failed' ? '⚠️ Failure Reason (Required)' : 'Dispatch Notes (Optional)'}
                                    </label>
                                    <textarea
                                        className="delivery-textarea" 
                                        placeholder={statusUpdate.status === 'Failed' ? 'e.g. Door locked, customer unreachable...' : 'e.g. Handed to customer / Left at gate...'}
                                        value={remarks}
                                        onChange={e => setRemarks(e.target.value)}
                                        required={statusUpdate.status === 'Failed'}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setSelectedOrder(null)}>Cancel</button>
                                <button 
                                    className="btn-confirm"
                                    disabled={!statusUpdate.status || (statusUpdate.status === 'Failed' && !remarks)}
                                    onClick={() => handleStatusUpdate(selectedOrder.orderId, statusUpdate.status)}
                                >
                                    Confirm Update
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default DeliveryDashboard;
