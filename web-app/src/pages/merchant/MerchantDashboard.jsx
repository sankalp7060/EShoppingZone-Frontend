import React, { useState, useEffect } from 'react';
import { useTabState } from '../../hooks/useTabState';
import { getMerchantProducts, getCategories, getProductTypes, createProduct, updateProduct, deleteProduct } from '../../services/productService';
import { getMerchantOrders } from '../../services/orderService';
import { updateOrderStatus } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/layout/Layout';
import { useAlert } from '../../context/AlertContext';
import { 
    LayoutDashboard, 
    Package, 
    ShoppingCart, 
    Wallet, 
    Settings, 
    Plus, 
    Search, 
    Edit2, 
    Edit3,
    Trash2, 
    TrendingUp, 
    Users, 
    DollarSign,
    MoreVertical,
    CheckCircle,
    Truck,
    Clock,
    Box,
    ShoppingBag,
    ArrowUpRight,
    Upload
} from 'lucide-react';
import './MerchantDashboard.css';

const MerchantDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useTabState('tab', 'dashboard');
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [categories, setCategories] = useState([]);
    const [productTypes, setProductTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusUpdate, setStatusUpdate] = useState({ status: '', remarks: '' });
    const [processing, setProcessing] = useState(false);
    const { showAlert } = useAlert();
    const [formData, setFormData] = useState({
        productName: '',
        description: '',
        price: '',
        stockQuantity: '',
        category: '',
        productType: '',
        images: [''], // Array of image URLs
        specifications: {} // Dictionary of specs
    });

    const [specEntries, setSpecEntries] = useState([{ key: '', value: '' }]);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                getMerchantProducts(),
                getCategories(),
                getProductTypes(),
                getMerchantOrders()
            ]);

            const [pRes, cRes, tRes, oRes] = results.map(r => r.status === 'fulfilled' ? r.value : null);

            // Robust data normalization helper
            const getD = (res, keys, fallback = []) => {
                if (!res) return fallback;
                const data = res.data || res.Data || res;
                for (const k of keys) {
                    if (data && data[k] !== undefined) return data[k];
                }
                return Array.isArray(data) ? data : fallback;
            };

            const productsData = getD(pRes, ['products', 'Products']);
            const categoriesData = getD(cRes, ['categories', 'Categories']);
            const typesData = getD(tRes, ['productTypes', 'ProductTypes']);
            const ordersData = getD(oRes, ['orders', 'Orders']);

            if (pRes) setProducts(productsData);
            if (cRes) setCategories(categoriesData);
            if (tRes) setProductTypes(typesData);
            if (oRes) setOrders(ordersData);
        } catch (err) {
            console.error('Critical Dashboard Load Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        if (!product) return;
        setIsEditing(true);
        setCurrentProduct(product);
        setFormData({
            productName: product.productName || '',
            description: product.description || '',
            price: product.price || '',
            stockQuantity: product.stockQuantity || '',
            category: product.category || '',
            productType: product.productType || '',
            images: Array.isArray(product.images) && product.images.length > 0 ? product.images : [''],
            specifications: product.specifications || {}
        });

        const specs = product.specifications || {};
        const entries = Object.entries(specs).map(([key, value]) => ({ key, value }));
        setSpecEntries(entries.length > 0 ? entries : [{ key: '', value: '' }]);
        setShowModal(true);
    };
    
    const handleAddImageField = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
    };

    const handleImageChange = (index, value) => {
        const newImages = [...formData.images];
        newImages[index] = value;
        setFormData(prev => ({ ...prev, images: newImages }));
    };

    const handleRemoveImageField = (index) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, images: newImages.length ? newImages : [''] }));
    };

    const handleLocalImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // To keep it simple, we replace the first empty image field or append
                const emptyIdx = formData.images.findIndex(img => !img || img.trim() === '');
                if (emptyIdx !== -1) {
                    handleImageChange(emptyIdx, reader.result);
                } else {
                    setFormData(prev => ({ ...prev, images: [...prev.images, reader.result] }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddSpecRow = () => {
        setSpecEntries([...specEntries, { key: '', value: '' }]);
    };

    const handleSpecChange = (index, field, value) => {
        const newEntries = [...specEntries];
        newEntries[index][field] = value;
        setSpecEntries(newEntries);
    };

    const handleRemoveSpecRow = (index) => {
        setSpecEntries(specEntries.filter((_, i) => i !== index));
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        try {
            const id = productToDelete.id || productToDelete.productId;
            const response = await deleteProduct(id);
            if (response.success || response.Success) {
                setProducts(products.filter(p => (p.id || p.productId) !== id));
                setShowDeleteModal(false);
                setProductToDelete(null);
            }
        } catch (err) {
            showAlert('Delete failed', 'error');
        }
    };

    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Convert spec entries back to object
        const finalSpecs = {};
        specEntries.forEach(entry => {
            if (entry.key && entry.value) finalSpecs[entry.key] = entry.value;
        });

        const data = { 
            ...formData, 
            price: parseFloat(formData.price) || 0,
            stockQuantity: parseInt(formData.stockQuantity) || 0,
            specifications: finalSpecs,
            images: formData.images.filter(img => img && img.trim() !== '')
        };

        try {
            let res = isEditing ? await updateProduct(currentProduct.id, data) : await createProduct(data);
            if (res.success) {
                showAlert(isEditing ? 'Product synched successfully' : 'Product published successfully', 'success');
                setShowModal(false);
                loadAllData();
                resetForm();
            }
        } catch (err) {
            showAlert('Save failed: ' + err.message, 'error');
        }
    };

    const handleUpdateOrderStatus = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const id = selectedOrder.orderId || selectedOrder.Id;
            const res = await updateOrderStatus(id, statusUpdate.status, statusUpdate.remarks);
            if (res.success) {
                showAlert('Order status updated successfully', 'success');
                setOrders(orders.map(o => (o.orderId || o.Id) === id ? { ...o, orderStatus: statusUpdate.status } : o));
                setShowOrderModal(false);
                setSelectedOrder(null);
            }
        } catch (error) {
            showAlert('Status update failed: ' + (error.response?.data?.message || 'Unauthorized'), 'error');
        } finally {
            setProcessing(false);
        }
    };

    const resetForm = () => {
        setFormData({ 
            productName: '', 
            description: '', 
            price: '', 
            stockQuantity: '', 
            category: '', 
            productType: '',
            images: [''], 
            specifications: {} 
        });
        setSpecEntries([{ key: '', value: '' }]);
        setIsEditing(false);
        setCurrentProduct(null);
    };



    const filteredProducts = products.filter(p => 
        p.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const deliveredOrders = orders.filter(o => (o.orderStatus || o.OrderStatus) === 'Delivered');
    const totalEarnings = deliveredOrders.reduce((acc, o) => acc + (o.amountPaid ?? o.AmountPaid ?? 0), 0);
    const pendingSettlements = orders
        .filter(o => !['Delivered', 'Cancelled'].includes(o.orderStatus || o.OrderStatus))
        .reduce((acc, o) => acc + (o.amountPaid ?? o.AmountPaid ?? 0), 0);
    const uniqueCustomers = new Set(orders.map(o => o.customerId ?? o.CustomerId)).size;

    return (
        <Layout>
            <div className="merchant-dashboard-layout">
                {/* Sidebar */}
                <aside className="merchant-sidebar">
                    <div className="sidebar-header">
                        <h2>Merchant Suite</h2>
                    </div>
                    <nav className="sidebar-nav">
                        <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                            <LayoutDashboard className="nav-icon" />
                            <span className="nav-text">Overview</span>
                        </div>
                        <div className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
                            <Package className="nav-icon" />
                            <span className="nav-text">Inventory</span>
                        </div>
                        <div className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                            <ShoppingCart className="nav-icon" />
                            <span className="nav-text">Orders</span>
                        </div>
                        <div className={`nav-item ${activeTab === 'wallet' ? 'active' : ''}`} onClick={() => setActiveTab('wallet')}>
                            <Wallet className="nav-icon" />
                            <span className="nav-text">Earnings</span>
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="merchant-content fade-in">
                    {loading ? (
                        <div className="pane-loader">
                            <div className="spinner-pro"></div>
                            <span>Initializing Merchant Suite...</span>
                        </div>
                    ) : (
                        <>
                    {activeTab === 'dashboard' && (
                        <div className="tab-view">
                            <div className="stat-cards-grid">
                                <div className="stat-card revenue">
                                    <div className="stat-icon-wrapper">
                                        <TrendingUp />
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-label">Net Earnings</span>
                                        <div className="stat-value">₹{totalEarnings.toLocaleString()}</div>
                                        <div className="stat-meta">₹{pendingSettlements.toLocaleString()} pending</div>
                                    </div>
                                    <div className="stat-trend trend-up">
                                        <ArrowUpRight size={14} /> <span>Settled</span>
                                    </div>
                                </div>
                                <div className="stat-card orders">
                                    <div className="stat-icon-wrapper">
                                        <ShoppingBag />
                                    </div>
                                    <span className="stat-label">Total Orders</span>
                                    <div className="stat-value">{orders.length}</div>
                                    <div className="stat-trend trend-up">
                                        <ArrowUpRight size={14} /> <span>All-time Sales</span>
                                    </div>
                                </div>
                                <div className="stat-card customers">
                                    <div className="stat-icon-wrapper">
                                        <Users />
                                    </div>
                                    <span className="stat-label">Unique Customers</span>
                                    <div className="stat-value">{uniqueCustomers}</div>
                                    <div className="stat-trend trend-up">
                                        <ArrowUpRight size={14} /> <span>Audience Reach</span>
                                    </div>
                                </div>
                                <div className="stat-card inventory">
                                    <div className="stat-icon-wrapper">
                                        <Package />
                                    </div>
                                    <span className="stat-label">Active Listing</span>
                                    <div className="stat-value">{products.length} Products</div>
                                    <div className="stat-trend trend-up">
                                        <ArrowUpRight size={14} /> <span>Catalog Size</span>
                                    </div>
                                </div>
                            </div>

                            <div className="recent-activity merchant-table-container">
                                <h4 style={{ marginBottom: '1.5rem' }}>Recent Orders</h4>
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Date</th>
                                            <th>Items</th>
                                            <th>Status</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.length > 0 ? orders.slice(0, 5).map(o => (
                                            <tr key={o.orderId}>
                                                <td>#{o.orderId}</td>
                                                <td>{o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'N/A'}</td>
                                                <td>{o.customerName || 'Guest'}</td>
                                                <td>
                                                    <span className={`stock-badge ${o.orderStatus === 'Delivered' ? 'in' : 'low'}`}>
                                                        {o.orderStatus || 'Pending'}
                                                    </span>
                                                </td>
                                                <td>₹{o.amountPaid || 0}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#8b949e' }}>No recent orders found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="tab-view">
                            <div className="content-header">
                                <div>
                                    <h3>Inventory Management</h3>
                                    <p>Add and manage your product catalog</p>
                                </div>
                                <button className="add-btn" onClick={() => { resetForm(); setShowModal(true); }}>
                                    <Plus size={20} /> Add New Product
                                </button>
                            </div>

                            <div className="merchant-table-container">
                                <div className="table-header-actions">
                                    <div className="search-input-wrapper">
                                        <Search className="search-icon" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                        <input 
                                            type="text" 
                                            className="search-input" 
                                            placeholder="Search products..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <table className="merchant-table">
                                    <thead>
                                        <tr>
                                            <th>Product Identity</th>
                                            <th>Category / Type</th>
                                            <th>Price</th>
                                            <th>Stock Status</th>
                                            <th style={{ textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredProducts.length > 0 ? filteredProducts.map(product => (
                                            <tr key={product.id || product.productId}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                        <div style={{ width: '45px', height: '45px', borderRadius: '10px', overflow: 'hidden', background: '#1c2128' }}>
                                                            <img src={product.images?.[0] || 'https://via.placeholder.com/150'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: 'white' }}>{product.productName || 'Unnamed Product'}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--merchant-text-muted)', marginTop: '2px' }}>ID: #{product.id || product.productId}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 500 }}>{product.category || 'Uncategorized'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--merchant-text-muted)' }}>{product.productType || 'Standard'}</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 700, color: 'var(--merchant-primary)' }}>₹{(product.price || 0).toLocaleString()}</div>
                                                </td>
                                                <td>
                                                    <span className={`stock-badge ${product.stockQuantity > 10 ? 'in' : product.stockQuantity > 0 ? 'low' : 'out'}`}>
                                                        {(product.stockQuantity || 0) > 0 ? `${product.stockQuantity} in Stock` : 'Out of Stock'}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                                                        <button className="table-action-btn edit" onClick={() => handleEdit(product)} title="Edit Product">
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button className="table-action-btn delete" onClick={() => handleDeleteClick(product)} title="Delete Product">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>No products match your search.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="tab-view">
                            <div className="content-header">
                                <div>
                                    <h3>Product Orders</h3>
                                    <p>Track customer orders for your products</p>
                                </div>
                            </div>

                            <div className="merchant-table-container">
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>Order</th>
                                            <th>Customer Details</th>
                                            <th>Date</th>
                                            <th>Payment</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.length > 0 ? orders.map(o => (
                                            <tr key={o.orderId}>
                                                <td>#{o.orderId}</td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>{o.customerName || 'Guest'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{o.address?.city || 'N/A'}, {o.address?.state || ''}</div>
                                                </td>
                                                <td>{o.orderDate ? new Date(o.orderDate).toLocaleDateString() : 'N/A'}</td>
                                                <td>
                                                    <div style={{ fontWeight: 600 }}>₹{o.amountPaid || 0}</div>
                                                    <div style={{ fontSize: '0.7rem' }}>{o.modeOfPayment || 'Online'}</div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        {o.orderStatus === 'Delivered' ? <CheckCircle size={14} color="#10b981" /> : 
                                                         o.orderStatus === 'Shipped' ? <Truck size={14} color="#6366f1" /> : <Clock size={14} color="#f59e0b" />}
                                                        <span className={`stock-badge ${o.orderStatus === 'Delivered' ? 'in' : o.orderStatus === 'Shipped' ? 'info' : 'low'}`}>
                                                            {o.orderStatus || 'Processing'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button 
                                                        className="table-action-btn edit" 
                                                        onClick={() => { setSelectedOrder(o); setStatusUpdate({ status: o.orderStatus, remarks: '' }); setShowOrderModal(true); }}
                                                        title="Manage Order Status"
                                                    >
                                                        <ArrowUpRight size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#8b949e' }}>No orders recorded yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'wallet' && (
                        <div className="tab-view">
                            <div className="content-header">
                                <div>
                                    <h3>Earnings & Payouts</h3>
                                    <p>Track your revenue and withdrawal history</p>
                                </div>
                            </div>

                            <div className="stat-cards-grid">
                                <div className="stat-card revenue">
                                    <div className="stat-icon-wrapper">
                                        <TrendingUp />
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-label">Settled Earnings</span>
                                        <div className="stat-value">₹{totalEarnings.toLocaleString()}</div>
                                        <div className="stat-meta">Lifetime delivered revenue</div>
                                    </div>
                                </div>

                                <div className="stat-card inventory">
                                    <div className="stat-icon-wrapper">
                                        <Clock />
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-label">Pending Settlements</span>
                                        <div className="stat-value">₹{pendingSettlements.toLocaleString()}</div>
                                        <div className="stat-meta">Awaiting delivery completion</div>
                                    </div>
                                </div>

                                <div className="stat-card orders">
                                    <div className="stat-icon-wrapper">
                                        <CheckCircle />
                                    </div>
                                    <div className="stat-content">
                                        <span className="stat-label">Completed Sales</span>
                                        <div className="stat-value">{deliveredOrders.length} Orders</div>
                                        <div className="stat-meta">Successfully fulfilled</div>
                                    </div>
                                </div>
                            </div>

                            <div className="merchant-table-container">
                                <h4 style={{ marginBottom: '1.5rem' }}>Settled Earnings History</h4>
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>Order Ref</th>
                                            <th>Date Settled</th>
                                            <th>Customer</th>
                                            <th>Status</th>
                                            <th>Amount Earned</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deliveredOrders.length > 0 ? (
                                            deliveredOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)).map(s => (
                                                <tr key={s.orderId}>
                                                    <td>#{s.orderId}</td>
                                                    <td>{new Date(s.orderDate).toLocaleDateString()}</td>
                                                    <td style={{ color: '#94a3b8' }}>
                                                        {s.customerName || 'Guest'}
                                                    </td>
                                                    <td><span className="stock-badge in" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Credited</span></td>
                                                    <td style={{ fontWeight: 700, color: '#10b981' }}>+ ₹{(s.amountPaid ?? s.AmountPaid ?? 0).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--merchant-text-muted)' }}>
                                                    No settled earnings recorded yet. Deliver orders to start earning.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                        </>
                    )}
                </main>

                {/* Modal */}
                {showModal && (
                    <div className="premium-modal-overlay">
                        <div className="premium-modal" style={{ maxWidth: '800px', width: '95%' }}>
                            <div className="modal-header">
                                <h3>{isEditing ? 'Synch Catalog' : 'Launch New Product'}</h3>
                                <p>Provide technical and catalog specifications for your store</p>
                            </div>
                            <form onSubmit={handleSubmit} className="premium-modal-form">
                                <div className="modal-body-scroller">
                                    <div className="modal-grid">
                                        <div className="form-group">
                                            <label>Product Name</label>
                                            <input type="text" className="form-input" value={formData.productName} onChange={e => setFormData({ ...formData, productName: e.target.value })} required placeholder="e.g. Sony WH-1000XM5" />
                                        </div>
                                        <div className="form-group">
                                            <label>Launch Price (₹)</label>
                                            <input type="number" className="form-input" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} required placeholder="0.00" />
                                        </div>
                                    </div>

                                    <div className="modal-grid">
                                        <div className="form-group">
                                            <label>Catalog Category</label>
                                            <select className="form-select" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required>
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Product Variant / Type</label>
                                            <select className="form-select" value={formData.productType} onChange={e => setFormData({ ...formData, productType: e.target.value })} required>
                                                <option value="">Select Type</option>
                                                {productTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Product Story / Description</label>
                                        <textarea className="form-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required rows="3" placeholder="Tell customers about your product..." />
                                    </div>

                                    <div className="modal-grid" style={{ marginBottom: '25px' }}>
                                        <div className="form-group">
                                            <label>Available Stock</label>
                                            <input type="number" className="form-input" value={formData.stockQuantity} onChange={e => setFormData({ ...formData, stockQuantity: e.target.value })} required placeholder="Input count" />
                                        </div>
                                    </div>

                                    {/* Images Section */}
                                    <div className="form-group">
                                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <span>Image Gallery URLs</span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input 
                                                    type="file" 
                                                    id="local-img-upload" 
                                                    hidden 
                                                    accept="image/*" 
                                                    onChange={handleLocalImageUpload} 
                                                />
                                                <button type="button" onClick={() => document.getElementById('local-img-upload').click()} className="action-btn-small upload">
                                                    <Upload size={14} /> Upload Local
                                                </button>
                                                <button type="button" onClick={handleAddImageField} className="action-btn-small">+ Add URL</button>
                                            </div>
                                        </label>
                                        <div className="image-field-scroller">
                                            {formData.images.map((img, idx) => (
                                                <div key={idx} className="image-input-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                    <div className="img-preview-mini">
                                                        {img ? <img src={img} alt="" /> : <Box size={16} />}
                                                    </div>
                                                    <input type="text" className="form-input" placeholder="https://..." value={img} onChange={(e) => handleImageChange(idx, e.target.value)} required />
                                                    {formData.images.length > 1 && (
                                                        <button type="button" onClick={() => handleRemoveImageField(idx)} className="action-btn" style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Specs Section */}
                                    <div className="form-group" style={{ marginTop: '20px' }}>
                                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <span>Product Specifications</span>
                                            <button type="button" onClick={handleAddSpecRow} className="action-btn-small">+ Add Row</button>
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {specEntries.map((spec, idx) => (
                                                <div key={idx} className="spec-row" style={{ display: 'flex', gap: '8px' }}>
                                                    <input type="text" className="form-input" placeholder="Property (e.g. RAM)" value={spec.key} onChange={(e) => handleSpecChange(idx, 'key', e.target.value)} />
                                                    <input type="text" className="form-input" placeholder="Value (e.g. 16GB)" value={spec.value} onChange={(e) => handleSpecChange(idx, 'value', e.target.value)} />
                                                    <button type="button" onClick={() => handleRemoveSpecRow(idx)} className="action-btn" style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    </div>

                                <div className="modal-footer">
                                    <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ minWidth: '150px' }}>
                                        {isEditing ? 'Save Changes' : 'Publish Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Custom Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="confirm-modal-overlay">
                        <div className="confirm-modal">
                            <div className="confirm-icon-wrapper">
                                <Trash2 size={32} />
                            </div>
                            <h4>Delete Product?</h4>
                            <p>
                                Are you sure you want to delete <strong>{productToDelete?.productName}</strong>? 
                                This action cannot be undone and will remove it from the catalog.
                            </p>
                            <div className="confirm-actions">
                                <button className="btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                                <button className="btn-danger" onClick={confirmDelete}>Delete Product</button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Order Status Modal */}
                {showOrderModal && (
                    <div className="premium-modal-overlay">
                        <div className="premium-modal" style={{ maxWidth: '500px' }}>
                            <div className="modal-header">
                                <h3>Manage Fulfillment #{selectedOrder?.orderId}</h3>
                                <p>Update the logistics lifecycle for this order</p>
                            </div>
                            <form onSubmit={handleUpdateOrderStatus} className="premium-modal-form">
                                <div className="modal-body-scroller">
                                    <div className="current-state-banner">
                                        <span className="state-pulse"></span>
                                        <div>
                                            <div className="state-label">CURRENT STATUS</div>
                                            <div className="state-value" data-status={selectedOrder?.orderStatus}>{selectedOrder?.orderStatus || 'Pending'}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="form-group mb-4" style={{ marginTop: '1.5rem' }}>
                                        <label>Select Next Stage</label>
                                        <div className="god-tier-stepper">
                                            {[
                                                { val: 'Confirmed', label: 'Confirmed', icon: '✅', color: '#3b82f6', glow: 'rgba(59,130,246,0.5)' },
                                                { val: 'Packed', label: 'Packed', icon: '📦', color: '#f59e0b', glow: 'rgba(245,158,11,0.5)' },
                                                { val: 'Shipped', label: 'Shipped', icon: '🚚', color: '#a855f7', glow: 'rgba(168,85,247,0.5)' },
                                                { val: 'Cancelled', label: 'Aborted', icon: '❌', color: '#ef4444', glow: 'rgba(239,68,68,0.5)' }
                                            ].map(stage => (
                                                <button 
                                                    type="button"
                                                    key={stage.val}
                                                    onClick={() => setStatusUpdate({...statusUpdate, status: stage.val})}
                                                    className={`god-tier-chip ${statusUpdate.status === stage.val ? 'active' : ''}`}
                                                    style={{ '--chip-color': stage.color, '--chip-glow': stage.glow }}
                                                >
                                                    <span className="gt-icon">{stage.icon}</span>
                                                    <span className="gt-label">{stage.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Dispatch Triggers / Remarks</label>
                                        <textarea 
                                            className="form-textarea gt-textarea" 
                                            rows="3"
                                            placeholder="Specify logistics courier ID, tracking links, or delay reasons..."
                                            value={statusUpdate.remarks}
                                            onChange={e => setStatusUpdate({...statusUpdate, remarks: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn-secondary" onClick={() => setShowOrderModal(false)}>Abort</button>
                                    <button type="submit" className="btn-primary" disabled={processing || !statusUpdate.status} style={{ minWidth: '180px' }}>
                                        {processing ? 'Saving...' : 'Deploy Stage Update'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default MerchantDashboard;
