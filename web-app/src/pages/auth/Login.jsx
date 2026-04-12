import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { loginUser, googleLogin } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { validateLoginForm } from '../../utils/validators';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const { showAlert } = useAlert();
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: ''
    });

    const [errors, setErrors] = useState({});
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [googleAuthData, setGoogleAuthData] = useState(null);
    const [selectedModalRole, setSelectedModalRole] = useState('');
    const [modalError, setModalError] = useState('');

    const roles = [
        { value: 'Customer', label: 'Customer', desc: 'Shop and order products', icon: '👤' },
        { value: 'Merchant', label: 'Merchant', desc: 'Sell and manage products', icon: '🏪' },
        { value: 'DeliveryAgent', label: 'Delivery boy', desc: 'Deliver orders to customers', icon: '🛵' },
        { value: 'Admin', label: 'Admin', desc: 'Manage platform and users', icon: '🛡️' }
    ];

    useEffect(() => {
        if (location.state?.message) {
            showAlert(location.state.message, 'success');
            window.history.replaceState({}, document.title);
        }
    }, [location, showAlert]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleRoleSelect = (roleValue) => {
        setFormData(prev => ({ ...prev, role: roleValue }));
        if (errors.role) {
            setErrors(prev => ({ ...prev, role: '' }));
        }
    };

    const handleRedirect = (_user) => {
        // Redirection always lands on the Homepage (/) as per unified UI strategy
        navigate('/', { replace: true });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validateLoginForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);

        try {
            const response = await loginUser(formData);

            if (response.success && response.data) {
                const { token, refreshToken, user } = response.data;
                login(user, token, refreshToken);
                showAlert(`Welcome back, ${user.fullName || 'User'}!`, 'success');
                handleRedirect(user);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || '';
            const status = err.response?.status;

            let displayError = 'Login failed. Please check your credentials.';
            if (errorMsg.toLowerCase().includes('role') || errorMsg.toLowerCase().includes('registered as')) {
                const roleLabel = roles.find(r => r.value === formData.role)?.label || formData.role;
                displayError = `This account is not registered as a "${roleLabel}". Please select the correct role.`;
            } else if (errorMsg.toLowerCase().includes('suspend') || errorMsg.toLowerCase().includes('banned')) {
                displayError = 'Your account has been suspended. Please contact support.';
            } else if (status === 401 || status === 404) {
                displayError = 'Incorrect email or password. Please try again.';
            } else if (errorMsg) {
                displayError = errorMsg;
            }
            
            showAlert(displayError, 'error');
        } finally {
            setLoading(false);
        }
    };

    const completeGoogleLogin = async (roleValue) => {
        if (!roleValue) {
            setModalError('Please select a role before continuing.');
            return;
        }
        setGoogleLoading(true);
        setModalError('');
        try {
            const response = await googleLogin(googleAuthData.token, roleValue);
            if (response.success && response.data) {
                const { token, refreshToken: rToken, user } = response.data;
                login(user, token, rToken);
                showAlert('Google login successful!', 'success');
                setShowRoleModal(false);
                handleRedirect(user);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || '';
            const status = err.response?.status;

            if (errorMsg.toLowerCase().includes('role') || errorMsg.toLowerCase().includes('registered as')) {
                const roleLabel = roles.find(r => r.value === roleValue)?.label || roleValue;
                setModalError(`Not registered as a "${roleLabel}". Please select the correct role.`);
            } else if (status === 403) {
                setModalError('Your account has been suspended.');
            } else if (status === 404) {
                setModalError('No account found for this Google email. Please register first.');
            } else {
                setModalError(errorMsg || 'Google login failed.');
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setGoogleLoading(true);
            try {
                // Get user info first
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await userInfoResponse.json();

                // If role is already selected on the screen, use it
                if (formData.role) {
                    const response = await googleLogin(tokenResponse.access_token, formData.role);
                    if (response.success && response.data) {
                        const { token, refreshToken: rToken, user } = response.data;
                        login(user, token, rToken);
                        showAlert('Login successful!', 'success');
                        handleRedirect(user);
                        return;
                    }
                }

                // Otherwise, show modal
                setGoogleAuthData({ token: tokenResponse.access_token, email: userInfo.email });
                setShowRoleModal(true);
            } catch (err) {
                const errMsg = err.response?.data?.message || 'Google login failed.';
                showAlert(errMsg, 'error');
            } finally {
                setGoogleLoading(false);
            }
        },
        onError: () => showAlert('Google sign-in failed.', 'error'),
        flow: 'implicit',
    });

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-left">
                    <div className="brand-content">
                        <div className="logo">
                            <span className="logo-icon">🛍️</span>
                            <span className="logo-text">EShoppingZone</span>
                        </div>
                        <h1>Welcome Back</h1>
                        <p>Sign in to continue your shopping journey and manage your account.</p>

                        <div className="features desktop-features">
                            <div className="feature">
                                <span className="feature-icon">✓</span>
                                <span>Secure payments with E-Wallet</span>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">✓</span>
                                <span>Easy product listing for merchants</span>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">✓</span>
                                <span>Real-time order tracking</span>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">✓</span>
                                <span>24/7 customer support</span>
                            </div>
                        </div>

                        <div className="welcome-quote">
                            <div className="quote-text">
                                "The best e-commerce experience with seamless wallet payments and real-time tracking."
                            </div>
                            <div className="quote-author">— Our Happy Customers</div>
                        </div>
                    </div>
                </div>

                <div className="login-right">
                    <div className="form-header">
                        <h2>Sign In</h2>
                        <p>Don't have an account? <Link to="/register">Create one</Link></p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Email Address <span className="required">*</span></label>
                            <div className="input-wrapper">
                                <span className="input-icon">📧</span>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    className={errors.email ? 'error' : ''}
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && <span className="error-text">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password <span className="required">*</span></label>
                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className={errors.password ? 'error' : ''}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {errors.password && <span className="error-text">{errors.password}</span>}
                        </div>

                        <div className="form-group role-selection-group">
                            <label>Login As <span className="required">*</span></label>
                            <div className="role-cards">
                                {roles.map((role) => (
                                    <div
                                        key={role.value}
                                        className={`role-card ${formData.role === role.value ? 'selected' : ''}`}
                                        onClick={() => handleRoleSelect(role.value)}
                                    >
                                        <div className="role-icon">{role.icon}</div>
                                        <div className="role-name">{role.label}</div>
                                    </div>
                                ))}
                            </div>
                            {errors.role && <span className="error-text">{errors.role}</span>}
                        </div>

                        <div className="forgot-password">
                            <Link to="/forgot-password">Forgot Password?</Link>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? <span className="loading-spinner"></span> : 'Sign In'}
                        </button>

                        <div className="alternative-login">
                            <div className="divider">
                                <span>OR</span>
                            </div>
                            <button
                                type="button"
                                className="google-btn"
                                onClick={() => handleGoogleLogin()}
                                disabled={loading || googleLoading}
                            >
                                {googleLoading ? (
                                    <span className="loading-spinner"></span>
                                ) : (
                                    <>
                                        <span className="google-icon">G</span>
                                        Continue with Google
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mobile-features-footer">
                        <div className="footer-features">
                            <div className="footer-feature">
                                <span className="footer-feature-icon">✓</span>
                                <span>Secure payments with E-Wallet</span>
                            </div>
                            <div className="footer-feature">
                                <span className="footer-feature-icon">✓</span>
                                <span>Easy product listing for merchants</span>
                            </div>
                            <div className="footer-feature">
                                <span className="footer-feature-icon">✓</span>
                                <span>Real-time order tracking</span>
                            </div>
                            <div className="footer-feature">
                                <span className="footer-feature-icon">✓</span>
                                <span>24/7 customer support</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Role Selection Modal for Google Login */}
            {showRoleModal && (
                <div className="modal-overlay">
                    <div className="role-modal">
                        <div className="modal-header">
                            <h3>Continue as...</h3>
                            <p>Select the role this Google account is registered under</p>
                        </div>

                        {modalError && (
                            <div className="alert alert-error modal-alert">{modalError}</div>
                        )}

                        <div className="role-options">
                            {roles.map((role) => (
                                <div
                                    key={role.value}
                                    className={`role-option ${selectedModalRole === role.value ? 'selected' : ''}`}
                                    onClick={() => { setSelectedModalRole(role.value); setModalError(''); }}
                                >
                                    <span className="role-option-icon">{role.icon}</span>
                                    <div className="role-option-content">
                                        <span className="role-label">{role.label}</span>
                                        <span className="role-desc">{role.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="cancel-btn"
                                type="button"
                                onClick={() => {
                                    setShowRoleModal(false);
                                    setGoogleAuthData(null);
                                    setSelectedModalRole('');
                                    setModalError('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="confirm-btn"
                                type="button"
                                onClick={() => completeGoogleLogin(selectedModalRole)}
                                disabled={googleLoading}
                            >
                                {googleLoading ? <span className="spinner-tiny"></span> : 'Continue Login'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;