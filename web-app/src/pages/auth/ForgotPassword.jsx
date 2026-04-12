import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import './ForgotPassword.css';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const navigate = useNavigate();

    // Auto-dismiss alerts after 5 seconds or upon any screen click
    useEffect(() => {
        if (error || message) {
            const timer = setTimeout(() => {
                setError('');
                setMessage('');
            }, 5000);

            const handleGlobalClick = () => {
                setError('');
                setMessage('');
            };

            window.addEventListener('click', handleGlobalClick);

            return () => {
                clearTimeout(timer);
                window.removeEventListener('click', handleGlobalClick);
            };
        }
    }, [error, message]);

    const generateOTP = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    const startResendTimer = () => {
        setResendTimer(60);
        const timer = setInterval(() => {
            setResendTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            // Check if user exists
            const checkResponse = await apiClient.post('/api/auth/check-email', { email });

            if (!checkResponse.data.success) {
                setError('Email address not found. Please register first.');
                setLoading(false);
                navigate('/login', {
                    state: { message: 'Email not found. Please register to create an account.' },
                    replace: true
                });
                return;
            }

            // Generate OTP
            const otpCode = generateOTP();
            setGeneratedOtp(otpCode);

            // Send OTP via email (no API key needed anymore)
            const emailResponse = await apiClient.post('/api/email/send-otp', {
                email: email,
                otp: otpCode
                // API key removed - using server-side SMTP configuration
            });

            if (emailResponse.data.success) {
                setMessage('✓ OTP sent to your email! Please check your inbox.');
                setStep(2);
                startResendTimer();
            } else {
                setError('✗ Failed to send OTP. Please try again.');
            }
        } catch (err) {
            console.error('Error:', err);
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendTimer > 0) return;

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const otpCode = generateOTP();
            setGeneratedOtp(otpCode);

            const emailResponse = await apiClient.post('/api/email/send-otp', {
                email: email,
                otp: otpCode
            });

            if (emailResponse.data.success) {
                setMessage('✓ New OTP sent to your email!');
                startResendTimer();
            } else {
                setError('✗ Failed to resend OTP. Please try again.');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (otp !== generatedOtp) {
            setError('✗ Invalid OTP. Please check and try again.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('✗ Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('✗ Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await apiClient.post('/api/auth/reset-password', {
                email,
                newPassword
            });

            if (response.data.success) {
                setMessage('✓ Password reset successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login', {
                        state: {
                            message: 'Password reset successful! Please login with your new password.'
                        },
                        replace: true
                    });
                }, 500);
            } else {
                setError('✗ ' + (response.data.message || 'Failed to reset password'));
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-container">
            <div className="forgot-card">
                <div className="forgot-left">
                    <div className="brand-content">
                        <div className="logo">
                            <span className="logo-icon">🛍️</span>
                            <span className="logo-text">EShoppingZone</span>
                        </div>
                        <h1>Reset Password</h1>
                        <p>Don't worry, we'll help you get back into your account.</p>
                        <div className="features">
                            <div className="feature">
                                <span className="feature-icon">✓</span>
                                <span>Secure OTP verification</span>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">✓</span>
                                <span>Instant email delivery</span>
                            </div>
                            <div className="feature">
                                <span className="feature-icon">✓</span>
                                <span>Create a strong new password</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="forgot-right">
                    <div className="form-header">
                        <h2>{step === 1 ? 'Forgot Password?' : 'Reset Password'}</h2>
                        <p>
                            {step === 1
                                ? 'Enter your email address and we\'ll send you an OTP to reset your password'
                                : 'Enter the OTP sent to your email and create a new password'
                            }
                        </p>
                        <p><Link to="/login">← Back to Login</Link></p>
                    </div>

                    {message && <div className="alert alert-success">{message}</div>}
                    {error && <div className="alert alert-error">{error}</div>}

                    {step === 1 ? (
                        <form onSubmit={handleSendOTP}>
                            <div className="form-group">
                                <label>Email Address <span className="required">*</span></label>
                                <div className="input-wrapper">
                                    <span className="input-icon">📧</span>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button type="submit" className="forgot-btn" disabled={loading}>
                                {loading ? <span className="loading-spinner"></span> : 'Send OTP'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">📧</span>
                                    <input
                                        type="email"
                                        value={email}
                                        disabled
                                        className="disabled-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>OTP Code <span className="required">*</span></label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🔐</span>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter 6-digit OTP"
                                        maxLength="6"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>New Password <span className="required">*</span></label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🔒</span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Create new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                                <div className="password-hint">Password must be at least 6 characters</div>
                            </div>

                            <div className="form-group">
                                <label>Confirm Password <span className="required">*</span></label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🔒</span>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="forgot-btn" disabled={loading}>
                                {loading ? <span className="loading-spinner"></span> : 'Reset Password'}
                            </button>

                            <button
                                type="button"
                                className="resend-otp"
                                onClick={handleResendOTP}
                                disabled={loading || resendTimer > 0}
                            >
                                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;