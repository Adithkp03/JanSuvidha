import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import useStore from '../../store/useStore';
import LanguageSelector from '../LanguageSelector';
import { ShieldCheckIcon, SparklesIcon, BuildingLibraryIcon, BuildingOffice2Icon, ArrowRightIcon } from '@heroicons/react/24/outline';

const DEPARTMENTS = [
    { id: 'electricity', label: 'Electricity' },
    { id: 'gas', label: 'Gas' },
    { id: 'water', label: 'Water & Sewage' },
    { id: 'mc', label: 'Municipal Corporation' },
    { id: 'waste', label: 'Waste Management' },
    { id: 'public_works', label: 'Public Works' }
];

export default function AdminLoginForm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { setAdminAuth } = useStore();

    const [role, setRole] = useState('super_admin'); // 'super_admin' | 'dept_admin'
    const [department, setDepartment] = useState('electricity');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        setLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            // Validate against .env configurations
            let valid = false;
            let mockName = 'Admin User';

            if (role === 'super_admin') {
                if (email === import.meta.env.VITE_SUPER_ADMIN_EMAIL && password === import.meta.env.VITE_SUPER_ADMIN_PASSWORD) {
                    valid = true;
                    mockName = 'Super Administrator';
                }
            } else if (role === 'dept_admin') {
                const keyPrefix = `VITE_DEPT_ADMIN_${department.toUpperCase()}`;
                const expectedEmail = import.meta.env[`${keyPrefix}_EMAIL`];
                const expectedPassword = import.meta.env[`${keyPrefix}_PASSWORD`];

                if (email === expectedEmail && password === expectedPassword) {
                    valid = true;
                    mockName = `${DEPARTMENTS.find(d => d.id === department)?.label} Admin`;
                }
            }

            if (!valid) {
                setError('Invalid credentials.');
                setLoading(false);
                return;
            }

            // Success. Set separate admin auth tokens
            const mockJwt = `mock-jwt-${role}-${Date.now()}`;
            setAdminAuth(mockJwt, role, role === 'super_admin' ? null : department, mockName);

            // Navigate
            if (role === 'super_admin') {
                navigate('/superadmin');
            } else {
                navigate('/admin');
            }

        } catch (err) {
            console.error('Login error:', err);
            setError('An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-civic-light flex items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-5xl glass-card overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in-95 duration-700 rounded-3xl">

                {/* Left Side - Brand Visuals */}
                <div className="md:w-5/12 bg-gradient-to-br from-indigo-900 to-slate-900 p-10 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjI1KSIvPjwvc3ZnPg==')] opacity-20"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-10">
                            <ShieldCheckIcon className="w-10 h-10 text-indigo-400" />
                            <span className="text-2xl font-black tracking-tight text-white drop-shadow-md">JanSuvidha</span>
                        </div>

                        <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
                            Government<br />Administration Portal
                        </h2>
                        <p className="text-indigo-200 text-lg font-medium max-w-sm">
                            Secure gateway for managing civic services, kiosks, and departmental requests.
                        </p>
                    </div>

                    <div className="relative z-10 mt-12 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center gap-4 mb-3">
                            <SparklesIcon className="w-6 h-6 text-indigo-300" />
                            <span className="font-bold text-white tracking-wide">Multi-Tenancy Active</span>
                        </div>
                        <p className="text-sm text-indigo-200">Scoped access for department personnel</p>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="md:w-7/12 bg-white p-8 sm:p-12 lg:p-16 relative flex flex-col justify-center">
                    <div className="absolute top-6 right-6">
                        <LanguageSelector />
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                            Admin Login
                        </h1>
                        <p className="text-slate-500 font-medium text-md">
                            Select your role and authenticate to continue
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-100 flex items-start gap-3 animate-in slide-in-from-top-2">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                        {/* Role Selector */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setRole('super_admin')}
                                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                    role === 'super_admin' 
                                    ? 'border-indigo-600 bg-indigo-50 shadow-md transform scale-[1.02]' 
                                    : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                }`}
                            >
                                <BuildingLibraryIcon className={`w-8 h-8 mb-2 ${role === 'super_admin' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <div className={`font-bold ${role === 'super_admin' ? 'text-indigo-900' : 'text-slate-700'}`}>Super Admin</div>
                                <div className="text-xs text-slate-500 mt-1">Global access</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole('dept_admin')}
                                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                    role === 'dept_admin' 
                                    ? 'border-indigo-600 bg-indigo-50 shadow-md transform scale-[1.02]' 
                                    : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                                }`}
                            >
                                <BuildingOffice2Icon className={`w-8 h-8 mb-2 ${role === 'dept_admin' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                <div className={`font-bold ${role === 'dept_admin' ? 'text-indigo-900' : 'text-slate-700'}`}>Department</div>
                                <div className="text-xs text-slate-500 mt-1">Scoped access</div>
                            </button>
                        </div>

                        {/* Department Dropdown (only if dept_admin) */}
                        {role === 'dept_admin' && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-sm font-bold text-slate-700">Select Department</label>
                                <select
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-md transition-colors font-semibold text-slate-800"
                                >
                                    {DEPARTMENTS.map(d => (
                                        <option key={d.id} value={d.id}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-slate-700">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-md transition-colors placeholder:text-slate-400"
                                    placeholder="admin@jansuvidha.in"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-bold text-slate-700">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-md transition-colors placeholder:text-slate-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-6 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? (
                                <span className="animate-pulse">Authenticating...</span>
                            ) : (
                                <>
                                    Secure Login
                                    <ArrowRightIcon className="w-5 h-5" />
                                </>
                            )}
                        </button>
                        
                        <div className="mt-8 text-center">
                            <Link to="/" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1">
                                Citizen Portal &rarr;
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
