import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';

import ProtectedRoute from '../components/auth/ProtectedRoute';

// Lazy load pages
const Register = React.lazy(() => import('../pages/auth/Register'));
const Login = React.lazy(() => import('../pages/auth/Login'));
const ForgotPassword = React.lazy(() => import('../pages/auth/ForgotPassword'));
const HomePage = React.lazy(() => import('../pages/products/HomePage'));
const ProductDetail = React.lazy(() => import('../pages/products/ProductDetail'));
const Cart = React.lazy(() => import('../pages/cart/Cart'));
const MerchantDashboard = React.lazy(() => import('../pages/merchant/MerchantDashboard'));
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const Checkout = React.lazy(() => import('../pages/checkout/Checkout'));
const Wallet = React.lazy(() => import('../pages/wallet/Wallet'));
const Orders = React.lazy(() => import('../pages/products/Orders'));
const Shop = React.lazy(() => import('../pages/products/Shop'));
const Profile = React.lazy(() => import('../pages/profile/Profile'));
const DeliveryDashboard = React.lazy(() => import('../pages/delivery/DeliveryDashboard'));
const CustomerDashboard = React.lazy(() => import('../pages/customer/CustomerDashboard'));

const AppRoutes = () => {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <CartProvider>
                    <React.Suspense fallback={
                        <div style={{
                            minHeight: '100vh',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#0a0c10',
                            color: 'white'
                        }}>
                            <div className="spinner"></div>
                        </div>
                    }>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<HomePage />} />
                            <Route path="/products/:id" element={<ProductDetail />} />
                            <Route path="/products" element={<HomePage />} />
                            <Route path="/shop" element={<Shop />} />

                            {/* Auth Routes */}
                            <Route path="/register" element={<Register />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />

                            {/* Protected Routes (Using HomePage as placeholder for now) */}
                            <Route 
                                path="/admin/dashboard" 
                                element={
                                    <ProtectedRoute allowedRoles={['Admin']}>
                                        <AdminDashboard />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/merchant/dashboard" 
                                element={
                                    <ProtectedRoute allowedRoles={['Merchant']}>
                                        <MerchantDashboard />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/delivery/dashboard" 
                                element={
                                    <ProtectedRoute allowedRoles={['DeliveryAgent']}>
                                        <DeliveryDashboard />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/customer/dashboard" 
                                element={
                                    <ProtectedRoute allowedRoles={['Customer']}>
                                        <CustomerDashboard />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/cart" 
                                element={
                                    <ProtectedRoute allowedRoles={['Customer']}>
                                        <Cart />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/checkout" 
                                element={
                                    <ProtectedRoute allowedRoles={['Customer']}>
                                        <Checkout />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/wallet" 
                                element={
                                    <ProtectedRoute allowedRoles={['Customer', 'Merchant', 'DeliveryAgent', 'Admin']}>
                                        <Wallet />
                                    </ProtectedRoute>
                                } 
                            />
                            <Route 
                                path="/customer/orders" 
                                element={
                                    <ProtectedRoute allowedRoles={['Customer']}>
                                        <Orders />
                                    </ProtectedRoute>
                                } 
                            />

                            <Route 
                                path="/profile" 
                                element={
                                    <ProtectedRoute allowedRoles={['Customer', 'Merchant', 'DeliveryAgent', 'Admin']}>
                                        <Profile />
                                    </ProtectedRoute>
                                } 
                            />

                            {/* 404 Redirect */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </React.Suspense>
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default AppRoutes;