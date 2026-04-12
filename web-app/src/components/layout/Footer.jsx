import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-grid">
                    {/* Brand Section */}
                    <div className="footer-section">
                        <div className="footer-logo">
                            <span className="logo-icon">🛍️</span>
                            <span className="logo-text">EShoppingZone</span>
                        </div>
                        <p className="footer-description">
                            Premium e-commerce platform offering the best products with secure payments and fast delivery.
                        </p>
                        <div className="social-links">
                            <span className="social-link">📘</span>
                            <span className="social-link">📷</span>
                            <span className="social-link">🐦</span>
                            <span className="social-link">💼</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-section">
                        <h3 className="footer-title">Quick Links</h3>
                        <ul className="footer-links">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/products">Shop</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div className="footer-section">
                        <h3 className="footer-title">Customer Service</h3>
                        <ul className="footer-links">
                            <li><Link to="/faq">FAQ</Link></li>
                            <li><Link to="/returns">Returns Policy</Link></li>
                            <li><Link to="/shipping">Shipping Info</Link></li>
                            <li><Link to="/terms">Terms & Conditions</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="footer-section">
                        <h3 className="footer-title">Get in Touch</h3>
                        <ul className="footer-contact">
                            <li>
                                <span className="contact-icon">📧</span>
                                <span>support@eshoppingzone.com</span>
                            </li>
                            <li>
                                <span className="contact-icon">📞</span>
                                <span>+91 706079XXXX</span>
                            </li>
                            <li>
                                <span className="contact-icon">📍</span>
                                <span>Gla University<br />Mathura, Uttar Pradesh 281002</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;