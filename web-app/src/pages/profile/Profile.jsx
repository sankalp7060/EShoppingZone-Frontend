import React, { useState, useEffect, useCallback } from 'react';
import { useTabState } from '../../hooks/useTabState';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    getMyProfile,
    updateProfile,
    uploadProfileImage,
    deleteProfileImage,
    getAllAddresses,
    addAddress,
    updateAddress as updateAddressAPI,
    deleteAddress,
    setDefaultAddress,
} from '../../services/userService';
import Layout from '../../components/layout/Layout';
import { 
    User, MapPin, Shield, Edit3, Trash2, CheckCircle, 
    Plus, X, Camera, Save, ChevronRight, Lock
} from 'lucide-react';
import './Profile.css';

const roleConfig = {
    customer:      { label: 'Customer',       color: '#3b82f6', badge: 'bg-blue' },
    merchant:      { label: 'Merchant',       color: '#10b981', badge: 'bg-green' },
    deliveryagent: { label: 'Delivery Scout', color: '#f59e0b', badge: 'bg-yellow' },
    admin:         { label: 'Administrator',  color: '#ff6e40', badge: 'bg-orange' },
};

const Profile = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [tab, setTab] = useTabState('tab', 'info');
    const [profile, setProfile] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);


    /* Edit Info State */
    const [editMode, setEditMode] = useState(false);
    const [infoForm, setInfoForm] = useState({ fullName: '', mobileNumber: '', about: '', gender: '', dateOfBirth: '' });
    const [infoSaving, setInfoSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [avatarUploading, setAvatarUploading] = useState(false);

    /* Address State */
    const [showAddrForm, setShowAddrForm] = useState(false);
    const [editingAddrId, setEditingAddrId] = useState(null);
    const [addrForm, setAddrForm] = useState({ houseNumber: '', streetName: '', colonyName: '', city: '', state: '', pincode: '', landmark: '' });

    const role = user?.role?.toLowerCase() || 'customer';
    const rc = roleConfig[role] || roleConfig.customer;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [profRes, addrRes] = await Promise.all([
                getMyProfile(),
                getAllAddresses()
            ]);

            if (profRes.success) {
                setProfile(profRes.data);
                setInfoForm({
                    fullName: profRes.data.fullName || '',
                    mobileNumber: profRes.data.mobileNumber?.toString() || '',
                    about: profRes.data.about || '',
                    gender: profRes.data.gender || '',
                    dateOfBirth: profRes.data.dateOfBirth ? profRes.data.dateOfBirth.split('T')[0] : ''
                });
            }
            if (addrRes.success) setAddresses(addrRes.data);
        } catch (error) {
            console.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Sync location.state activeTab (e.g. from Navbar "Account Settings" link) into URL param
    useEffect(() => {
        if (location.state?.activeTab) {
            setTab(location.state.activeTab);
            // Clear the state so back-navigation doesn't re-trigger
            window.history.replaceState({}, document.title);
        }
    }, [location.state, setTab]);

    const handleInfoSave = async (e) => {
        e.preventDefault();
        setInfoSaving(true);
        try {
            const res = await updateProfile(infoForm);
            if (res.success) {
                setProfile(res.data);
                updateUser({ ...user, fullName: res.data.fullName });
                setEditMode(false);
                setMessage({ type: 'success', text: 'Profile updated successfully' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Update failed' });
        } finally {
            setInfoSaving(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarUploading(true);
        try {
            const res = await uploadProfileImage(file);
            if (res.success) {
                setProfile(prev => ({ ...prev, profileImage: res.data.imageUrl || res.data }));
                setMessage({ type: 'success', text: 'Profile photo updated!' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Photo upload failed' });
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleAddressSubmit = async (e) => {
        e.preventDefault();
        try {
            let res;
            if (editingAddrId) {
                res = await updateAddressAPI(editingAddrId, addrForm);
            } else {
                res = await addAddress(addrForm);
            }
            if (res.success) {
                setShowAddrForm(false);
                setAddrForm({ houseNumber: '', streetName: '', colonyName: '', city: '', state: '', pincode: '', landmark: '' });
                setEditingAddrId(null);
                loadData();
            }
        } catch (error) {
            console.error('Failed to save address');
        }
    };

    const handleEditAddr = (addr) => {
        setAddrForm({
            houseNumber: addr.houseNumber,
            streetName: addr.streetName,
            colonyName: addr.colonyName,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            landmark: addr.landmark || ''
        });
        setEditingAddrId(addr.id);
        setShowAddrForm(true);
    };

    const handleDelAddr = async (id) => {
        if(window.confirm('Are you sure you want to delete this address?')) {
            try {
                const res = await deleteAddress(id);
                if(res.success) loadData();
            } catch (err) {
                console.error(err);
            }
        }
    };

    if (loading) return <Layout><div className="loading">Initializing Dashboard...</div></Layout>;

    return (
        <Layout>
            <div className="profile-container">
                <div className="profile-layout">
                    {/* Left Sidebar */}
                    <aside className="profile-sidebar">
                        <div className="user-quick-info">
                            <div className="avatar-wrapper">
                                <img 
                                    src={profile?.profileImage || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400'} 
                                    alt="Avatar" 
                                    className="avatar-main"
                                />
                                <label className="avatar-camera-btn" title="Change photo">
                                    {avatarUploading ? <span style={{fontSize:'12px'}}>...</span> : <Camera size={16} />}
                                    <input type="file" accept="image/*" style={{display:'none'}} onChange={handleAvatarChange} />
                                </label>
                                <span className={`role-badge ${rc.badge}`}>{rc.label}</span>
                            </div>
                            <h2>{profile?.fullName}</h2>
                            <p>{user?.email}</p>
                        </div>

                        <nav className="profile-nav">
                            <div className={`nav-item ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>
                                <User size={18} />
                                <span>My Profile</span>
                            </div>
                            <div className={`nav-item ${tab === 'address' ? 'active' : ''}`} onClick={() => setTab('address')}>
                                <MapPin size={18} />
                                <span>Addresses</span>
                            </div>
                            <div className={`nav-item ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}>
                                <Shield size={18} />
                                <span>Security</span>
                            </div>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="profile-content">
                        {tab === 'info' && (
                            <section className="profile-section">
                                <div className="section-header">
                                    <h1>Personal Information</h1>
                                    <button className="edit-btn" onClick={() => setEditMode(!editMode)}>
                                        {editMode ? <X size={16} /> : <Edit3 size={16} />}
                                        <span>{editMode ? 'Cancel' : 'Edit Profile'}</span>
                                    </button>
                                </div>

                                {editMode ? (
                                    <form className="profile-form" onSubmit={handleInfoSave}>
                                        <div className="info-grid">
                                            <div className="form-group">
                                                <label>Full Name</label>
                                                <input value={infoForm.fullName} onChange={e => setInfoForm({...infoForm, fullName: e.target.value})} required />
                                            </div>
                                            <div className="form-group">
                                                <label>Mobile Number</label>
                                                <input value={infoForm.mobileNumber} onChange={e => setInfoForm({...infoForm, mobileNumber: e.target.value})} />
                                            </div>
                                            <div className="form-group">
                                                <label>Gender</label>
                                                <select value={infoForm.gender} onChange={e => setInfoForm({...infoForm, gender: e.target.value})}>
                                                    <option value="">Select</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Date of Birth</label>
                                                <input type="date" value={infoForm.dateOfBirth} onChange={e => setInfoForm({...infoForm, dateOfBirth: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>About Me</label>
                                            <textarea rows="4" value={infoForm.about} onChange={e => setInfoForm({...infoForm, about: e.target.value})} placeholder="Tell us about yourself..." />
                                        </div>
                                        <div className="form-actions">
                                            <button type="submit" className="save-btn" disabled={infoSaving}>
                                                {infoSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="info-grid">
                                        <div className="info-box">
                                            <label>Full Name</label>
                                            <p>{profile?.fullName}</p>
                                        </div>
                                        <div className="info-box">
                                            <label>Email Address</label>
                                            <p>{user?.email}</p>
                                        </div>
                                        <div className="info-box">
                                            <label>Mobile</label>
                                            <p>{profile?.mobileNumber || 'Not provided'}</p>
                                        </div>
                                        <div className="info-box">
                                            <label>Gender</label>
                                            <p>{profile?.gender || 'Not specified'}</p>
                                        </div>
                                        <div className="info-box">
                                            <label>Joined On</label>
                                            <p>{new Date(profile?.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {tab === 'address' && (
                            <section className="profile-section">
                                <div className="section-header">
                                    <h1>Shipping Addresses</h1>
                                    <button className="edit-btn" onClick={() => setShowAddrForm(!showAddrForm)}>
                                        <Plus size={16} />
                                        <span>Add New</span>
                                    </button>
                                </div>

                                {showAddrForm && (
                                    <div className="addr-overlay">
                                        <div className="address-form-modal">
                                            <h3 style={{marginBottom: '20px', color: 'white'}}>{editingAddrId ? 'Edit Address' : 'Add New Address'}</h3>
                                            <form onSubmit={handleAddressSubmit} className="checkout-addr-form">
                                                <div className="form-group-inline">
                                                    <input placeholder="House No." value={addrForm.houseNumber} onChange={e => setAddrForm({...addrForm, houseNumber: e.target.value})} required />
                                                    <input placeholder="Street Name" value={addrForm.streetName} onChange={e => setAddrForm({...addrForm, streetName: e.target.value})} required />
                                                </div>
                                                <div className="form-group">
                                                    <input placeholder="Colony / Area" value={addrForm.colonyName} onChange={e => setAddrForm({...addrForm, colonyName: e.target.value})} required />
                                                </div>
                                                <div className="form-group-inline">
                                                    <input placeholder="City" value={addrForm.city} onChange={e => setAddrForm({...addrForm, city: e.target.value})} required />
                                                    <input placeholder="State" value={addrForm.state} onChange={e => setAddrForm({...addrForm, state: e.target.value})} required />
                                                </div>
                                                <div className="form-group-inline">
                                                    <input placeholder="Pincode" value={addrForm.pincode} onChange={e => setAddrForm({...addrForm, pincode: e.target.value})} required />
                                                    <input placeholder="Landmark (Optional)" value={addrForm.landmark} onChange={e => setAddrForm({...addrForm, landmark: e.target.value})} />
                                                </div>
                                                <div className="form-actions" style={{justifyContent: 'flex-end', gap: '15px', marginTop: '20px'}}>
                                                    <button type="button" className="edit-btn" onClick={() => {
                                                        setShowAddrForm(false);
                                                        setEditingAddrId(null);
                                                        setAddrForm({ houseNumber: '', streetName: '', colonyName: '', city: '', state: '', pincode: '', landmark: '' });
                                                    }} style={{background: 'rgba(255,255,255,0.05)', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px'}}>Cancel</button>
                                                    <button type="submit" className="save-btn" style={{background: '#3b82f6', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold'}}>{editingAddrId ? 'Update' : 'Save'} Address</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                <div className="address-grid">
                                    {addresses.length === 0 ? (
                                        <div className="empty-tab">
                                            <MapPin size={48} />
                                            <p>No addresses added yet.</p>
                                        </div>
                                    ) : (
                                        addresses.map(addr => (
                                            <div key={addr.id} className={`addr-card ${addr.isDefault ? 'default' : ''}`}>
                                                {addr.isDefault && <div className="def-tag">Default</div>}
                                                <p className="addr-line">{addr.houseNumber}, {addr.streetName}</p>
                                                <p className="addr-loc">{addr.city}, {addr.state} - {addr.pincode}</p>
                                                <div className="addr-actions">
                                                    <button className="addr-btn btn-edit-addr" onClick={() => handleEditAddr(addr)}><Edit3 size={14} /></button>
                                                    <button className="addr-btn btn-del-addr" onClick={() => handleDelAddr(addr.id)}><Trash2 size={14} /></button>
                                                    {!addr.isDefault && <button className="addr-btn btn-def-addr" onClick={() => 
                                                        setDefaultAddress(addr.id)
                                                            .then(loadData)
                                                            .catch(() => setMessage({ type: 'error', text: 'Failed to set default address' }))
                                                    }>Set Default</button>}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        )}

                        {tab === 'security' && (
                            <section className="profile-section">
                                <div className="section-header">
                                    <h1>Account Security</h1>
                                    <p>Manage your authentication and protection preferences</p>
                                </div>
                                <div className="security-card info-box">
                                    <div className="security-icon-bg">
                                        <Lock size={32} />
                                    </div>
                                    <div className="sec-content">
                                        <h3>Password Management</h3>
                                        <p>Regularly updating your password ensures account safety and protects your wallet funds.</p>
                                    <div className="sec-status">
                                        <span className="status-label">Password Strength:</span>
                                        <span className="status-val" style={{color: 'rgba(255,255,255,0.4)', fontSize: '12px'}}>Unknown — consider updating regularly</span>
                                    </div>
                                    </div>
                                    <button className="primary-action-btn" onClick={() => navigate('/forgot-password')}>
                                        Reset Password
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </section>
                        )}
                    </main>
                </div>
            </div>
        </Layout>
    );
};

export default Profile;
