import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import './Alert.css';

const Alert = ({ message, type = 'success', onClose, duration = 5000 }) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={20} />;
            case 'error': return <XCircle size={20} />;
            case 'warning': return <AlertCircle size={20} />;
            default: return <Info size={20} />;
        }
    };

    return (
        <div className={`premium-alert alert-${type}`}>
            <div className="alert-icon">{getIcon()}</div>
            <div className="alert-message">{message}</div>
            <button className="alert-close" onClick={onClose}>
                <X size={16} />
            </button>
            <div className="alert-progress-bar"></div>
        </div>
    );
};

export default Alert;
