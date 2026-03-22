import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useStore from '../../store/useStore';
import LanguageSelector from '../LanguageSelector';
import { UserCircleIcon, ArrowRightOnRectangleIcon, ArrowPathIcon, BellIcon, HeartIcon } from '@heroicons/react/24/outline';
import { syncQueue } from '../../utils/offlineSync';
import useIdleTimer from '../../hooks/useIdleTimer';
import IdleOverlay from '../IdleOverlay';
import { useQuery } from '@tanstack/react-query';
import { AdminServices } from '../../services/adminApi';
import { ExclamationTriangleIcon as SolidExclamation } from '@heroicons/react/24/solid';

export default function Shell({ workspace }) {
    const { t } = useTranslation();
    const { user, logout, offlineQueue, seniorMode, setSeniorMode } = useStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncing, setSyncing] = useState(false);
    const [showIdleWarning, setShowIdleWarning] = useState(false);

    // Alert Polling (every 5s) + instant cross-tab updates
    const { data: activeAlerts, refetch: refetchAlerts } = useQuery({
        queryKey: ['citizenActiveAlerts'],
        queryFn: async () => {
            try {
                return await AdminServices.getActiveAlerts();
            } catch {
                return JSON.parse(localStorage.getItem('jan_active_alerts') || '[]');
            }
        },
        refetchInterval: 5000,
        enabled: workspace === 'citizen'
    });

    // Instant cross-tab alert updates via storage event
    useEffect(() => {
        if (workspace !== 'citizen') return;
        const handleStorage = (e) => {
            if (e.key === 'jan_active_alerts') refetchAlerts();
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [workspace, refetchAlerts]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleLogout = useCallback(() => {
        logout();
        if (workspace === 'admin') {
            navigate('/admin/login');
        } else {
            navigate('/');
        }
    }, [logout, navigate, workspace]);

    // --- Kiosk Idle Timer (citizen workspace only) ---
    const handleIdleWarning = useCallback(() => {
        setShowIdleWarning(true);
    }, []);

    const handleIdleTimeout = useCallback(() => {
        setShowIdleWarning(false);
        handleLogout();
    }, [handleLogout]);

    const { resetTimer } = useIdleTimer({
        warningSeconds: 45,
        idleSeconds: 60,
        onWarning: handleIdleWarning,
        onIdle: handleIdleTimeout,
        enabled: workspace === 'citizen',
    });

    const handleIdleDismiss = useCallback(() => {
        setShowIdleWarning(false);
        resetTimer();
    }, [resetTimer]);

    const manualSync = async () => {
        setSyncing(true);
        await syncQueue();
        setSyncing(false);
    };

    // Simple breadcrumb logic
    const getBreadcrumbs = () => {
        const path = location.pathname;
        if (path === '/citizen') return [{ name: t('Home'), href: '/citizen' }];
        const segments = path.split('/').filter(Boolean);
        const crumbs = [{ name: t('Home'), href: '/citizen' }];
        if (segments[1] === 'apply') crumbs.push({ name: t('ApplyService'), href: '#' });
        if (segments[1] === 'receipt') crumbs.push({ name: t('Receipt'), href: '#' });
        if (segments[1] === 'track') crumbs.push({ name: t('TrackRequest'), href: '#' });
        if (segments[1] === 'payment') crumbs.push({ name: t('Payment'), href: '#' });
        return crumbs;
    };

    const isHomePage = location.pathname === '/citizen';
    const isFullPage = isHomePage
        || location.pathname === '/citizen/apply'
        || location.pathname.startsWith('/citizen/receipt')
        || location.pathname.startsWith('/citizen/payment');

    return (
        <div className="min-h-screen flex flex-col bg-civic-light transition-all duration-300">

            {/* Kiosk Idle Warning Overlay */}
            {showIdleWarning && (
                <IdleOverlay
                    onDismiss={handleIdleDismiss}
                    onTimeout={handleIdleTimeout}
                />
            )}

            {/* Offline Bar */}
            {!isOnline && (
                <div className="bg-amber-500 text-white px-4 py-2 text-sm font-semibold text-center flex justify-center items-center gap-2 shadow-inner z-50">
                    <span className="animate-pulse">You are offline. Actions are queued securely.</span>
                    {offlineQueue.length > 0 && <span className="bg-white/20 rounded-full px-2 py-0.5">{offlineQueue.length} pending</span>}
                </div>
            )}

            {/* Emergency Broadcast Banner */}
            {workspace === 'citizen' && activeAlerts?.length > 0 && (
                <div className="bg-rose-600 text-white shadow-md z-50 relative animate-in slide-in-from-top-4">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        {activeAlerts.map(alert => (
                            <div key={alert.id} className="flex items-start sm:items-center gap-3 py-1">
                                <SolidExclamation className="w-5 h-5 text-rose-200 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
                                <div className="flex-1">
                                    <span className="font-black tracking-tight text-white uppercase mr-2 border-r border-rose-400/50 pr-2">
                                        {alert.type}
                                    </span>
                                    <span className="text-sm font-semibold text-rose-50">{alert.message}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Premium Sticky Header - Hidden on full-page routes that have their own header */}
            {!isFullPage && (
                <header className={`sticky top-0 z-40 border-b shadow-sm backdrop-blur-xl ${workspace === 'admin' ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white/80 border-slate-200/60 text-slate-800'}`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-20">

                            {/* Logo & Brand */}
                            <div className="flex items-center gap-3">
                                <Link to={workspace === 'admin' ? '/admin' : '/citizen'} className="flex items-center gap-3 group">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${workspace === 'admin' ? 'bg-indigo-500 shadow-indigo-500/20' : 'bg-gradient-to-br from-primary-600 to-primary-700 shadow-primary-500/20'}`}>
                                        <span className="text-white font-black text-xl tracking-tighter">JS</span>
                                    </div>
                                    <div className="hidden sm:block">
                                        <h1 className="font-extrabold text-xl tracking-tight leading-none">
                                            JanSuvidha
                                        </h1>
                                        <p className={`text-xs font-semibold tracking-wider uppercase mt-1 ${workspace === 'admin' ? 'text-indigo-300' : 'text-primary-600'}`}>
                                            {workspace === 'admin' ? 'Digital Dashboard' : t('Title')}
                                        </p>
                                    </div>
                                </Link>

                                {/* Desktop Breadcrumbs */}
                                {workspace !== 'admin' && (
                                    <nav className="hidden md:ml-8 md:flex items-center space-x-2 text-sm font-medium">
                                        {getBreadcrumbs().map((crumb, idx) => (
                                            <React.Fragment key={crumb.name}>
                                                {idx > 0 && <span className="text-slate-400">/</span>}
                                                <Link to={crumb.href} className={idx === getBreadcrumbs().length - 1 ? "text-slate-900 font-bold" : "text-slate-500 hover:text-primary-600 transition-colors"}>
                                                    {crumb.name}
                                                </Link>
                                            </React.Fragment>
                                        ))}
                                    </nav>
                                )}
                            </div>

                            {/* Top Right Actions */}
                            <div className="flex items-center gap-2 sm:gap-4">
                                {isOnline && offlineQueue.length > 0 && (
                                    <button onClick={manualSync} disabled={syncing} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 font-bold rounded-xl text-xs hover:bg-amber-200 transition-colors border border-amber-200 shadow-sm">
                                        <ArrowPathIcon className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} /> {t('SyncNow')} ({offlineQueue.length})
                                    </button>
                                )}

                                <div className="hidden sm:flex items-center gap-1">
                                    {/* Accessibility removed per request */}
                                </div>

                                {workspace !== 'admin' && (
                                    <button
                                        onClick={() => setSeniorMode(!seniorMode)}
                                        className={`senior-toggle-btn ${seniorMode ? 'active' : ''}`}
                                        title={seniorMode ? t('SeniorModeOff') : t('SeniorModeOn')}
                                    >
                                        <HeartIcon className="senior-toggle-icon" />
                                        <span className="hidden sm:inline">{t('SeniorMode')}</span>
                                    </button>
                                )}

                                <div className="block">
                                    <LanguageSelector />
                                </div>

                                {workspace !== 'admin' && (
                                    <button className={`p-2 rounded-full transition-colors hidden sm:block ${workspace === 'admin' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-500'}`}>
                                        <BellIcon className="w-5 h-5" />
                                    </button>
                                )}

                                <div className={`h-8 w-px mx-2 hidden sm:block ${workspace === 'admin' ? 'bg-slate-700' : 'bg-slate-200'}`}></div>

                                {/* Profile Dropdown (Simplified) */}
                                <div className={`flex items-center gap-3 p-1.5 rounded-full pr-4 transition-colors ${workspace === 'admin' ? 'hover:bg-slate-800' : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}>
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold shadow-sm ${workspace === 'admin' ? 'bg-slate-800 text-indigo-400' : 'bg-primary-50 text-primary-700'}`}>
                                        {user?.name?.charAt(0) || user?.email?.charAt(0) || 'C'}
                                    </div>
                                    <div className="flex flex-col items-start bg-transparent">
                                        <span className="text-sm font-bold leading-tight max-w-[100px] truncate">{user?.name || user?.email || t('Citizen')}</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest hidden sm:block ${workspace === 'admin' ? 'text-indigo-400' : 'text-slate-500'}`}>
                                            {user?.roles?.includes('admin') ? t('Admin') : 'VERIFIED'}
                                        </span>
                                    </div>
                                    <button onClick={handleLogout} className={`ml-2 p-1.5 rounded-full transition-colors ${workspace === 'admin' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'}`} title="Log out safely">
                                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>
            )}

            {/* Mobile Breadcrumbs placeholder if needed */}
            {workspace !== 'admin' && !isFullPage && (
                <div className="md:hidden px-4 py-3 bg-white border-b border-slate-100 flex items-center space-x-2 text-xs font-semibold overflow-x-auto">
                    {getBreadcrumbs().map((crumb, idx) => (
                        <React.Fragment key={crumb.name}>
                            {idx > 0 && <span className="text-slate-300">/</span>}
                            <span className={idx === getBreadcrumbs().length - 1 ? "text-primary-600 truncate" : "text-slate-500 whitespace-nowrap"}>
                                {crumb.name}
                            </span>
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* Page Content */}
            <main className={`flex-1 w-full ${isFullPage ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12'} flex flex-col items-stretch`}>
                <div className="flex-1 animate-in fade-in duration-500">
                    <Outlet />
                </div>
            </main>

            {/* Simple footer - Hidden on full-page routes */}
            {!isFullPage && (
                <footer className="w-full border-t border-slate-200 bg-white/50 backdrop-blur-sm mt-auto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
                        <p>© 2026 JanSuvidha Portal. Secure Government Services.</p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-primary-600 transition-colors">Terms of Service</a>
                            <a href="#" className="hover:text-primary-600 transition-colors">Help Center</a>
                        </div>
                    </div>
                </footer>
            )}

        </div>
    );
}
