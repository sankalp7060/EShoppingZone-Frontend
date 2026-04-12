import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { registerUser, googleLogin, checkEmail } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { validateRegisterForm } from '../../utils/validators';
import './Register.css';

const Register = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [roleError, setRoleError] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        mobileNumber: '',
        gender: '',
        dateOfBirth: '',
        role: '' // Changed from 'Customer' to empty string
    });

    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [googleAuthData, setGoogleAuthData] = useState(null);
    const [modalError, setModalError] = useState('');

    const roles = [
        { value: 'Customer', label: 'Customer - Buy products' },
        { value: 'Merchant', label: 'Merchant - Sell products' },
        { value: 'DeliveryAgent', label: 'Delivery Agent - Deliver orders' }
    ];

    const genders = [
        { value: '', label: 'Select Gender' },
        { value: 'Male', label: 'Male' },
        { value: 'Female', label: 'Female' },
        { value: 'Other', label: 'Other' },
        { value: 'Prefer not to say', label: 'Prefer not to say' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (apiError) setApiError('');
        if (roleError) setRoleError('');
    };

    // Auto-dismiss alerts after 5 seconds or upon any screen click
    useEffect(() => {
        if (apiError || successMessage) {
            const timer = setTimeout(() => {
                setApiError('');
                setSuccessMessage('');
            }, 5000);

            const handleGlobalClick = () => {
                setApiError('');
                setSuccessMessage('');
            };

            // Using capture: true to ensure it runs even if bubbles are stopped
            window.addEventListener('click', handleGlobalClick);

            return () => {
                clearTimeout(timer);
                window.removeEventListener('click', handleGlobalClick);
            };
        }
    }, [apiError, successMessage]);

    const validateRole = () => {
        if (!formData.role) {
            setRoleError('Please select your role before continuing');
            return false;
        }
        setRoleError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate role first
        if (!validateRole()) {
            // Scroll to role field
            const roleField = document.querySelector('#role');
            if (roleField) {
                roleField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Validate form with gender and DOB required
        const validationErrors = validateRegisterForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            // Scroll to the first error
            const firstError = document.querySelector('.error-text');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setLoading(true);
        setApiError('');
        setSuccessMessage('');

        try {
            const { confirmPassword, ...registerData } = formData;

            // Convert date to ISO format
            if (registerData.dateOfBirth) {
                registerData.dateOfBirth = new Date(registerData.dateOfBirth).toISOString();
            }

            registerData.mobileNumber = parseInt(registerData.mobileNumber, 10);

            const response = await registerUser(registerData);

            if (response.success) {
                setSuccessMessage('Registration successful! Redirecting to login...');
                navigate('/login', {
                    state: { message: 'Registration successful! Please login.' },
                    replace: true
                });
            }
        } catch (err) {
            console.error('Registration error:', err);
            const errorMsg = err.response?.data?.message || '';
            const status = err.response?.status;

            if (errorMsg.toLowerCase().includes('email') && (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('exists') || errorMsg.toLowerCase().includes('taken'))) {
                setApiError('📧 This email is already registered. Please use a different email or go to Login.');
                setErrors(prev => ({ ...prev, email: 'Email already in use' }));
            } else if (errorMsg.toLowerCase().includes('mobile') || errorMsg.toLowerCase().includes('phone')) {
                if (errorMsg.toLowerCase().includes('already') || errorMsg.toLowerCase().includes('exists')) {
                    setApiError('📱 This mobile number is already registered. Please use a different number.');
                    setErrors(prev => ({ ...prev, mobileNumber: 'Mobile number already in use' }));
                } else {
                    setApiError('📱 Invalid mobile number. Please enter a valid 10-digit number.');
                    setErrors(prev => ({ ...prev, mobileNumber: 'Invalid mobile number' }));
                }
            } else if (errorMsg.toLowerCase().includes('password')) {
                setApiError('🔑 Password does not meet requirements. Please use at least 6 characters.');
                setErrors(prev => ({ ...prev, password: 'Password issue — check requirements' }));
            } else if (errorMsg.toLowerCase().includes('role')) {
                setApiError('⚠️ Invalid role selected. Please choose a valid role and try again.');
                setErrors(prev => ({ ...prev, role: 'Invalid role' }));
            } else if (errorMsg.toLowerCase().includes('gender')) {
                setApiError('👥 Please select your gender to continue.');
                setErrors(prev => ({ ...prev, gender: 'Gender is required' }));
            } else if (errorMsg.toLowerCase().includes('date') || errorMsg.toLowerCase().includes('birth')) {
                setApiError('🎂 Please enter a valid date of birth.');
                setErrors(prev => ({ ...prev, dateOfBirth: 'Date of birth is required' }));
            } else if (errorMsg.toLowerCase().includes('name')) {
                setApiError('👤 Please enter a valid full name.');
                setErrors(prev => ({ ...prev, fullName: 'Invalid name' }));
            } else if (status === 409) {
                setApiError('📧 An account with this email already exists. Please login instead.');
                setErrors(prev => ({ ...prev, email: 'Email already in use' }));
            } else if (status === 400) {
                setApiError(errorMsg || '⚠️ Invalid details provided. Please review your information and try again.');
            } else if (errorMsg) {
                setApiError(errorMsg);
            } else if (err.message) {
                setApiError(err.message);
            } else {
                setApiError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const completeGoogleRegistration = async (selectedRole) => {
        if (!selectedRole) {
            setModalError('⚠️ Please select a role to continue registration.');
            return;
        }

        setGoogleLoading(true);
        setModalError('');

        try {
            const response = await googleLogin(googleAuthData.token, selectedRole);
            if (response.success && response.data) {
                const { token, refreshToken: rToken, user } = response.data;
                login(user, token, rToken);
                setSuccessMessage('Google registration successful! Redirecting...');
                setShowRoleModal(false);
                setModalError('');
                navigate('/', { replace: true });
            }
        } catch (err) {
            console.error('Google registration error:', err);
            const errMsg = err.response?.data?.message || '';
            const status = err.response?.status;
            if (errMsg.toLowerCase().includes('role') || errMsg.toLowerCase().includes('registered as')) {
                setModalError('⚠️ This Google account is already registered under a different role. Please select the correct role.');
            } else if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('exists') || status === 409) {
                setModalError('📧 This Google account is already registered. Please go to the Login page instead.');
            } else if (errMsg.toLowerCase().includes('suspend') || errMsg.toLowerCase().includes('banned') || status === 403) {
                setModalError('🚫 This account has been suspended. Please contact support.');
            } else if (errMsg) {
                setModalError(errMsg);
            } else {
                setModalError('Google registration failed. Please try again.');
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setGoogleLoading(true);
            setApiError('');
            setRoleError('');

            try {
                // 1. Fetch user info from Google to get email
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await userInfoResponse.json();
                const email = userInfo.email;

                // 2. Check if email already exists
                const emailCheck = await checkEmail(email);
                
                if (emailCheck.success) {
                    setApiError('📧 This email is already registered. Please go to the Login page instead.');
                    setErrors(prev => ({ ...prev, email: 'Email already in use — please login' }));
                    const emailField = document.querySelector('#email');
                    if (emailField) {
                        emailField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                }

                // 3. Email does NOT exist - Check if role is already selected
                if (formData.role) {
                    const response = await googleLogin(tokenResponse.access_token, formData.role);
                    if (response.success && response.data) {
                        const { token, refreshToken: rToken, user } = response.data;
                        login(user, token, rToken);
                        setSuccessMessage('Registration successful! Redirecting...');
                        navigate('/', { replace: true });
                    }
                } else {
                    // Role not selected - show modal
                    setGoogleAuthData({
                        token: tokenResponse.access_token,
                        email: email,
                        name: userInfo.name
                    });
                    setShowRoleModal(true);
                }
            } catch (err) {
                console.error('Google login error:', err);
                const errMsg = err.response?.data?.message || '';
                if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('exists')) {
                    setApiError('📧 This Google account is already registered. Please go to the Login page.');
                } else if (errMsg.toLowerCase().includes('role')) {
                    setApiError('⚠️ This Google account is already registered under a different role.');
                } else if (errMsg) {
                    setApiError(errMsg);
                } else {
                    setApiError('Google authentication failed. Please try again.');
                }
            } finally {
                setGoogleLoading(false);
            }
        },
        onError: (error) => {
            console.error('Google OAuth error:', error);
            setApiError('Google sign-in was cancelled or failed. Please try again.');
        },
        flow: 'implicit',
    });

    return (
        <div className="register-container">
            <div className="register-card">
                {/* Left Side - Branding */}
                <div className="register-left">
                    <div className="brand-content">
                        <div className="logo">
                            <span className="logo-icon">🛍️</span>
                            <span className="logo-text">EShoppingZone</span>
                        </div>
                        <h1>Create Account</h1>
                        <p>Join the EShoppingZone community and start your shopping journey today!</p>

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
                    </div>
                </div>

                {/* Right Side - Registration Form */}
                <div className="register-right">
                    <div className="form-header">
                        <h2>Register</h2>
                        <p>Already have an account? <Link to="/login">Sign in</Link></p>
                    </div>

                    {successMessage && (
                        <div className="alert alert-success">
                            {successMessage}
                        </div>
                    )}

                    {apiError && (
                        <div className="alert alert-error">
                            {apiError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="register-form">
                        {/* Full Name */}
                        <div className="form-group">
                            <label htmlFor="fullName">
                                Full Name <span className="required">*</span>
                            </label>
                            <div className="input-wrapper">
                                <span className="input-icon">👤</span>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    className={errors.fullName ? 'error' : ''}
                                />
                            </div>
                            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label htmlFor="email">
                                Email Address <span className="required">*</span>
                            </label>
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
                                />
                            </div>
                            {errors.email && <span className="error-text">{errors.email}</span>}
                        </div>

                        {/* Mobile Number */}
                        <div className="form-group">
                            <label htmlFor="mobileNumber">
                                Mobile Number <span className="required">*</span>
                            </label>
                            <div className="input-wrapper">
                                <span className="input-icon">📱</span>
                                <input
                                    type="tel"
                                    id="mobileNumber"
                                    name="mobileNumber"
                                    value={formData.mobileNumber}
                                    onChange={handleChange}
                                    placeholder="10-digit mobile number"
                                    maxLength="10"
                                    className={errors.mobileNumber ? 'error' : ''}
                                />
                            </div>
                            {errors.mobileNumber && <span className="error-text">{errors.mobileNumber}</span>}
                        </div>

                        {/* Role Selection - Now required with placeholder */}
                        <div className="form-group">
                            <label htmlFor="role">
                                I want to <span className="required">*</span>
                            </label>
                            <div className="input-wrapper">
                                <span className="input-icon">👔</span>
                                <select
                                    id="role"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className={roleError || errors.role ? 'error' : ''}
                                >
                                    <option value="" disabled>Select your role</option>
                                    {roles.map(role => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {(roleError || errors.role) && (
                                <span className="error-text">{roleError || errors.role}</span>
                            )}
                        </div>

                        {/* Password */}
                        <div className="form-group">
                            <label htmlFor="password">
                                Password <span className="required">*</span>
                            </label>
                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create a password"
                                    className={errors.password ? 'error' : ''}
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
                            <div className="password-hint">
                                Password must be at least 6 characters long
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="form-group">
                            <label htmlFor="confirmPassword">
                                Confirm Password <span className="required">*</span>
                            </label>
                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                    className={errors.confirmPassword ? 'error' : ''}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                        </div>

                        {/* Gender and Date of Birth - Required Fields */}
                        <div className="required-section">
                            <div className="section-label">
                                <span>Additional Information</span>
                                <span className="required-badge">Required</span>
                            </div>
                            <div className="row-2cols">
                                <div className="form-group">
                                    <label htmlFor="gender">
                                        Gender <span className="required">*</span>
                                    </label>
                                    <div className="input-wrapper">
                                        <span className="input-icon">👥</span>
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className={errors.gender ? 'error' : ''}
                                        >
                                            {genders.map(gender => (
                                                <option key={gender.value} value={gender.value}>
                                                    {gender.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {errors.gender && <span className="error-text">{errors.gender}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="dateOfBirth">
                                        Date of Birth <span className="required">*</span>
                                    </label>
                                    <div className="input-wrapper">
                                        <span className="input-icon">🎂</span>
                                        <input
                                            type="date"
                                            id="dateOfBirth"
                                            name="dateOfBirth"
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                            className={errors.dateOfBirth ? 'error' : ''}
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
                                    <div className="password-hint">
                                        You must be at least {formData.role === 'Merchant' || formData.role === 'DeliveryAgent' ? 18 : 13} years old
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Terms & Conditions */}
                        <div className="terms-checkbox">
                            <label className="checkbox-container">
                                <input type="checkbox" required />
                                <span className="checkmark"></span>
                                I agree to the <a href="/terms">Terms of Service</a> and
                                <a href="/privacy"> Privacy Policy</a>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="register-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                'Create Account'
                            )}
                        </button>

                        {/* Alternative Registration */}
                        <div className="alternative-register">
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

                    {/* Mobile Footer Features */}
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

            {/* Role Selection Modal */}
            {showRoleModal && (
                <div className="modal-overlay">
                    <div className="role-modal">
                        <div className="modal-header">
                            <h3>Welcome {googleAuthData?.name}!</h3>
                            <p>To complete your registration, please select your role:</p>
                        </div>

                        {/* Error alert INSIDE the modal — always visible to the user */}
                        {modalError && (
                            <div className="alert alert-error modal-alert">{modalError}</div>
                        )}

                        <div className="role-options">
                            {roles.map(role => (
                                <div 
                                    key={role.value} 
                                    className={`role-option ${formData.role === role.value ? 'selected' : ''}`}
                                    onClick={() => { setFormData(prev => ({ ...prev, role: role.value })); setModalError(''); }}
                                >
                                    <div className="role-option-icon">
                                        {role.value === 'Customer' ? '🛍️' : role.value === 'Merchant' ? '🏪' : '🚴'}
                                    </div>
                                    <div className="role-option-content">
                                        <span className="role-label">{role.value}</span>
                                        <span className="role-desc">
                                            {role.value === 'Customer' ? 'Shop products' : 
                                             role.value === 'Merchant' ? 'Sell products' : 'Deliver orders'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="cancel-btn" 
                                onClick={() => { setShowRoleModal(false); setModalError(''); }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="confirm-btn" 
                                onClick={() => completeGoogleRegistration(formData.role)}
                                disabled={googleLoading}
                            >
                                {googleLoading ? <span className="spinner"></span> : 'Complete Registration'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Register;