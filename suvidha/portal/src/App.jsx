import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useStore from './store/useStore';
import { syncQueue } from './utils/offlineSync';

// Layouts
import Shell from './components/Layout/Shell';

// Auth
import LoginForm from './components/Auth/LoginForm';
import AdminLoginForm from './components/Auth/AdminLoginForm';

// Citizen Pages
import StartFlow from './pages/Citizen/StartFlow';
import DynamicForm from './pages/Citizen/DynamicForm';
import ReceiptPage from './pages/Citizen/ReceiptPage';
import PaymentPage from './pages/Citizen/PaymentPage';
import TrackStatus from './pages/Citizen/TrackStatus';

// Admin Pages
import Dashboard from './pages/Admin/Dashboard';
import Requests from './pages/Admin/Requests';

import MobileUpload from './pages/MobileUpload';

const queryClient = new QueryClient();

export default function App() {
    const { theme, largeFont, token, role, language } = useStore();
    const navigate = useNavigate();

    // Apply theme classes to body
    useEffect(() => {
        let baseClass = theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-civic-light text-slate-800';

        if (language === 'ml') {
            baseClass += ' lang-ml';
        } else {
            baseClass += ' font-sans';
        }

        document.body.className = baseClass;

        if (largeFont) {
            document.body.classList.add('text-lg');
        } else {
            document.body.classList.remove('text-lg');
        }
    }, [theme, largeFont, language]);

    // Offline Sync heartbeat
    useEffect(() => {
        const handleOnline = () => {
            console.log('Back online. Syncing queue...');
            syncQueue();
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <Routes>
                <Route path="/" element={
                    !token ? <LoginForm /> :
                        role === 'admin' ? <Navigate to="/admin" replace /> :
                            <Navigate to="/citizen" replace />
                } />

                {/* Admin Auth */}
                <Route path="/admin/login" element={
                    !token ? <AdminLoginForm /> : <Navigate to="/admin" replace />
                } />

                {/* Public Mobile Upload */}
                <Route path="/upload" element={<MobileUpload />} />

                {/* Citizen Workspace */}
                <Route path="/citizen" element={
                    token && role === 'citizen' ? <Shell workspace="citizen" /> : <Navigate to="/" replace />
                }>
                    <Route index element={<StartFlow />} />
                    <Route path="apply" element={<DynamicForm />} />
                    <Route path="payment/:id" element={<PaymentPage />} />
                    <Route path="receipt/:id" element={<ReceiptPage />} />
                    <Route path="track" element={<TrackStatus />} />
                </Route>

                {/* Admin Workspace */}
                <Route path="/admin" element={
                    token && role === 'admin' ? <Shell workspace="admin" /> : <Navigate to="/admin/login" replace />
                }>
                    <Route index element={<Dashboard />} />
                    <Route path="requests" element={<Requests />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </QueryClientProvider>
    );
}
