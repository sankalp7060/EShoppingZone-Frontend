import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
    ShoppingBag, 
    ShoppingCart, 
    User as UserIcon, 
    LogOut, 
    LayoutDashboard,
    Wallet as WalletIcon,
    Package,
    Settings as SettingsIcon,
    Home as HomeIcon,
    Search,
    ChevronDown,
    MapPin,
    Box
} from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const { isAuthenticated, user, logout, userRole } = useAuth();
    const { cartCount, loadCart } = useCart();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const role = userRole?.toLowerCase() || 'customer';

    useEffect(() => {
        if (isAuthenticated) {
            loadCart();
        }
    }, [isAuthenticated, loadCart]);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
        setMobileMenuOpen(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
        }
    };

    const getRoleConfig = () => {
        switch (role) {
            case 'admin':         return { label: 'Admin', icon: '🛡️', color: '#ff6e40', badgeClass: 'badge-admin' };
            case 'merchant':      return { label: 'Merchant', icon: '🏪', color: '#10b981', badgeClass: 'badge-merchant' };
            case 'deliveryagent': return { label: 'Delivery boy', icon: '🛵', color: '#f59e0b', badgeClass: 'badge-delivery' };
            default:              return { label: 'Customer', icon: '👤', color: '#3b82f6', badgeClass: 'badge-customer' };
        }
    };

    const rc = getRoleConfig();

    const renderRoleLinks = () => {
        switch (role) {
            case 'admin':
                return (
                    <>
                        <Link to="/admin/dashboard" className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>
                            <LayoutDashboard size={18} /> <span>Admin Console</span>
                        </Link>
                    </>
                );
            case 'merchant':
                return (
                    <>
                        <Link to="/merchant/dashboard" className={`nav-link ${location.pathname.startsWith('/merchant') ? 'active' : ''}`}>
                            <Package size={18} /> <span>Store Manager</span>
                        </Link>
                    </>
                );
            case 'deliveryagent':
                return (
                    <>
                        <Link to="/delivery/dashboard" className={`nav-link ${location.pathname.startsWith('/delivery') ? 'active' : ''}`}>
                            <Box size={18} /> <span>Deliveries</span>
                        </Link>
                    </>
                );
            default:
                return (
                    <>
                        <Link to="/customer/orders" className={`nav-link ${location.pathname === '/customer/orders' ? 'active' : ''}`}>
                            Orders
                        </Link>
                        <Link to="/wallet" className={`nav-link ${location.pathname === '/wallet' ? 'active' : ''}`}>
                            <WalletIcon size={18} /> <span>Wallet</span>
                        </Link>
                    </>
                );
        }
    };

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} style={{ '--role-theme': rc.color }}>
            <div className="nav-container">
                <Link to="/" className="nav-logo">
                    <div className="logo-icon-wrapper">
                        <ShoppingBag size={24} className="logo-icon-svg" />
                    </div>
                    <span className="logo-text">EShoppingZone</span>
                </Link>

                {/* Search is now consolidated cleanly into the dedicated Shop page */}

                <div className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
                    <div className="nav-links">
                        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                            <HomeIcon size={18} /> <span>Home</span>
                        </Link>
                        {isAuthenticated && renderRoleLinks()}
                    </div>

                    <div className="nav-actions">
                        {isAuthenticated ? (
                            <>
                                {role === 'customer' && (
                                    <Link to="/cart" className="cart-icon-wrapper">
                                        <div className="cart-icon">
                                            <ShoppingCart size={22} />
                                            {cartCount > 0 && (
                                                <span className="cart-badge">{cartCount}</span>
                                            )}
                                        </div>
                                    </Link>
                                )}
                                
                                <div className="user-menu-v2">
                                    <div className="user-trigger">
                                        {user?.profileImage ? (
                                            <img src={user.profileImage} alt="profile" className="nav-avatar-img" />
                                        ) : (
                                            <div className="nav-avatar-placeholder" style={{ backgroundColor: rc.color }}>
                                                {user?.fullName?.charAt(0) || 'U'}
                                            </div>
                                        )}
                                        <div className="user-trigger-info">
                                            <span className="trigger-name">{user?.fullName?.split(' ')[0]}</span>
                                            <span className={`trigger-role-badge ${rc.badgeClass}`}>{rc.label}</span>
                                        </div>
                                        <ChevronDown size={14} className="chevron" />
                                    </div>

                                    <div className="user-dropdown-v2">
                                        <div className="dropdown-user-info">
                                            <p className="full-name">{user?.fullName}</p>
                                            <p className="email-addr">{user?.email}</p>
                                        </div>
                                        <div className="dropdown-divider-v2"></div>
                                        <Link to="/profile" className="dropdown-item-v2">
                                            <div className="item-icon-wrap"><UserIcon size={16} /></div>
                                            <span>My Profile</span>
                                        </Link>
                                        <Link to="/profile" state={{ activeTab: 'security' }} className="dropdown-item-v2">
                                            <div className="item-icon-wrap"><SettingsIcon size={16} /></div>
                                            <span>Account Settings</span>
                                        </Link>
                                        {role === 'customer' && (
                                            <Link to="/wallet" className="dropdown-item-v2">
                                                <div className="item-icon-wrap"><WalletIcon size={16} /></div>
                                                <span>My Wallet Balance</span>
                                            </Link>
                                        )}
                                        <div className="dropdown-divider-v2"></div>
                                        <button onClick={handleLogout} className="dropdown-item-v2 logout">
                                            <div className="item-icon-wrap"><LogOut size={16} /></div>
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="auth-actions">
                                <Link to="/login" className="nav-btn-secondary">Log In</Link>
                                <Link to="/register" className="nav-btn-primary">Get Started</Link>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    className={`mobile-toggle ${mobileMenuOpen ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    );
};

export default Navbar;