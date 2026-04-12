// frontend/web-app/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser, isAuthenticated as isAuthenticatedCheck, logout } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const authenticated = isAuthenticatedCheck();
            const currentUser = getCurrentUser();
            setIsAuthenticated(authenticated);
            setUser(currentUser);
            setLoading(false);
        };
        checkAuth();
    }, []);

    // Call this after any successful login (email or Google)
    const handleLogin = (userData, token, refreshToken) => {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
    };

    const handleLogout = async () => {
        try {
            const storedRefreshToken = localStorage.getItem('refreshToken');
            await logout(storedRefreshToken);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.clear();
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        login: handleLogin,
        logout: handleLogout,
        updateUser,
        userRole: user?.role?.toLowerCase(),
        isAdmin: user?.role === 'Admin',
        isMerchant: user?.role === 'Merchant',
        isCustomer: user?.role === 'Customer',
        isDeliveryAgent: user?.role === 'DeliveryAgent'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};