import React from 'react';
import { Truck, ShoppingCart, Wallet } from 'lucide-react';
import './DashboardHero.css';

const DashboardHero = ({ title = "Experience", subtitle = "Excellence", description = "Curating the world's most sophisticated tech and lifestyle essentials. Designed for those who demand nothing but the absolute best.", onExplore, onStory }) => {
    return (
        <div className="dashboard-hero-wrapper">
            <header className="hero-section">
                <div className="hero-content">
                    <h1>{title} <br /> {subtitle}</h1>
                    <p>{description}</p>
                    <div className="hero-actions">
                        <button className="btn-add-to-cart hero-btn" onClick={onExplore}>Explore Collection</button>
                        <button className="btn-view-details hero-btn" onClick={onStory}>Our Story</button>
                    </div>
                </div>
            </header>

            <section className="features-grid">
                <div className="feature-card">
                    <div className="feature-icon-box"><Truck size={24} /></div>
                    <h3>Global Logistics</h3>
                    <p>Priority worldwide shipping with real-time tracking from our precision hubs.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon-box"><ShoppingCart size={24} /></div>
                    <h3>Concierge Service</h3>
                    <p>Our dedicated support team is available 24/7 to assist with your premium experience.</p>
                </div>
                <div className="feature-card">
                    <div className="feature-icon-box"><Wallet size={24} /></div>
                    <h3>Secure Payments</h3>
                    <p>Military-grade encryption for all transactions, supporting all major global networks.</p>
                </div>
            </section>
        </div>
    );
};

export default DashboardHero;
