import React from 'react';
import './OurStoryModal.css';

const OurStoryModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content fade-in" onClick={e => e.stopPropagation()}>
                <div className="story-logo">Obsidian</div>
                <h2 className="story-title">The Obsidian Origins</h2>
                <div className="story-body">
                    <p>
                        EShoppingZone was founded on a simple premise: everyday transactions should feel like a premium experience. 
                        We merged industrial-grade logistics with a high-fidelity interface to create the ultimate digital storefront.
                    </p>
                    <p>
                        Our curated catalog is designed for those who refuse to compromise on quality, 
                        bringing you the world's most sophisticated tech and lifestyle essentials directly to your door.
                    </p>
                    <p>
                        Beyond simple retail, we are building an ecosystem where security, speed, and elegance 
                        intersect to redefine how you interact with the digital world.
                    </p>
                </div>
                <div className="modal-actions-centered">
                    <button className="story-btn-primary" onClick={onClose}>Continue Journey</button>
                    <button className="story-btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default OurStoryModal;
