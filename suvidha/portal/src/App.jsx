import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useStore from './store/useStore';
import { syncQueue } from './utils/offlineSync';

// Layouts
import Shell from './components/Layout/Shell';
import AdminShell from './components/Layout/AdminShell';

// Auth (admin login lazy-loaded so a bad chunk elsewhere cannot white-screen this route)
import LoginForm from './components/Auth/LoginForm';
const AdminLoginForm = lazy(() => import('./components/Auth/AdminLoginForm'));

// Citizen Pages
import StartFlow from './pages/Citizen/StartFlow';
import DynamicForm from './pages/Citizen/DynamicForm';
import ReceiptPage from './pages/Citizen/ReceiptPage';
import PaymentPage from './pages/Citizen/PaymentPage';
import TrackStatus from './pages/Citizen/TrackStatus';

// Public Pages
import MobileUpload from './pages/MobileUpload';

// We must lazy load or import the Admin pages
// Assuming these files will be created next
// Super Admin 
import SuperDashboard from './pages/SuperAdmin/Dashboard';
import KioskManagement from './pages/SuperAdmin/KioskManagement';
import EmergencyBroadcast from './pages/SuperAdmin/EmergencyBroadcast';
import AllRequests from './pages/SuperAdmin/AllRequests';
import Departments from './pages/SuperAdmin/Departments';

// Dept Admin
import DeptDashboard from './pages/DeptAdmin/Dashboard';
import DeptRequests from './pages/DeptAdmin/Requests';
import DeptSLABreaches from './pages/DeptAdmin/SLABreaches';
import DeptReports from './pages/DeptAdmin/Reports';


const queryClient = new QueryClient();

export default function App() {
    const { 
        theme, largeFont, token, role, language, seniorMode, 
        adminToken, adminRole, adminDepartment 
    } = useStore();
    
    // Apply theme classes to body
    useEffect(() => {
        let baseClass = theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-civic-light text-slate-800';

        if (language === 'ml') {
            baseClass += ' lang-ml';
        } else {
            baseClass += ' font-sans';
        }

        if (seniorMode) {
            baseClass += ' senior-mode';
        }

        document.body.className = baseClass;

        if (largeFont) {
            document.body.classList.add('text-lg');
        } else {
            document.body.classList.remove('text-lg');
        }
    }, [theme, largeFont, language, seniorMode]);

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
                {/* Citizen Auth & Root */}
                <Route path="/" element={
                    !token ? <LoginForm /> : <Navigate to="/citizen" replace />
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

                {/* Admin Auth */}
                <Route
                    path="/admin/login"
                    element={
                        <Suspense
                            fallback={
                                <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 gap-4">
                                    <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                                    <p className="text-slate-600 font-bold text-sm">Loading admin login…</p>
                                </div>
                            }
                        >
                            {!adminToken ? (
                                <AdminLoginForm />
                            ) : adminRole === 'super_admin' ? (
                                <Navigate to="/superadmin" replace />
                            ) : (
                                <Navigate to="/admin" replace />
                            )}
                        </Suspense>
                    }
                />

                {/* Super Admin Workspace */}
                <Route path="/superadmin" element={
                    adminToken && adminRole === 'super_admin' ? (
                        <AdminShell role="super_admin" />
                    ) : (
                        <Navigate to="/admin/login" replace />
                    )
                }>
                    <Route index element={<SuperDashboard />} />
                    <Route path="kiosks" element={<KioskManagement />} />
                    <Route path="broadcast" element={<EmergencyBroadcast />} />
                    <Route path="requests" element={<AllRequests />} />
                    <Route path="departments" element={<Departments />} />
                </Route>

                {/* Dept Admin Workspace */}
                <Route path="/admin" element={
                    adminToken && adminRole === 'dept_admin' ? (
                        <AdminShell role="dept_admin" department={adminDepartment} />
                    ) : (
                        <Navigate to="/admin/login" replace />
                    )
                }>
                    <Route index element={<DeptDashboard />} />
                    <Route path="requests" element={<DeptRequests />} />
                    <Route path="sla" element={<DeptSLABreaches />} />
                    <Route path="reports" element={<DeptReports />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </QueryClientProvider>
    );
}
