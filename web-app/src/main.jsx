// main.jsx or index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AppRoutes from './routes/AppRoutes';
import { AlertProvider } from './context/AlertContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId="1073202736277-us5f912u4unhop8t2o91d6d59d2kvrmv.apps.googleusercontent.com">
            <AlertProvider>
                <AppRoutes />
            </AlertProvider>
        </GoogleOAuthProvider>
    </React.StrictMode>
);