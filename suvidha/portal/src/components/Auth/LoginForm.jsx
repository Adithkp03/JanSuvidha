import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import api from '../../services/api';
import LanguageSelector from '../LanguageSelector';
import { ShieldCheckIcon, UserIcon, IdentificationIcon, SparklesIcon, DevicePhoneMobileIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { auth } from '../../services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export default function LoginForm() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const setAuth = useStore(state => state.setAuth);
    const setRole = useStore(state => state.setRole);

    const [authMethod, setAuthMethod] = useState('email'); // 'email' or 'phone'
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [roleSelected, setRoleSelected] = useState('citizen');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [demoMode, setDemoMode] = useState(false);

    // To store Firebase verification result
    const [confirmationResult, setConfirmationResult] = useState(null);

    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                    // reCAPTCHA solved
                }
            });
        }
    }, []);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');

        if (demoMode && authMethod === 'email') {
            setOtp('123456');
            setStep(2);
            return;
        }

        if (authMethod === 'email' && !email) {
            setError(t('auth.enter_valid_email', 'Please enter a valid email'));
            return;
        }
        if (authMethod === 'phone' && (!phone || phone.length < 10)) {
            setError(t('auth.enter_valid_phone', 'Please enter a valid phone number with country code (e.g., +919876543210)'));
            return;
        }

        setLoading(true);
        try {
            if (authMethod === 'email') {
                const resp = await api.post('/auth/otp', { email });
                if (process.env.NODE_ENV === 'development') {
                    console.log('OTP Hint:', resp.data.otp_hint);
                }
                setStep(2);
            } else {
                // Firebase Phone Auth
                const appVerifier = window.recaptchaVerifier;
                const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`; // Auto-add India code if missing
                const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
                setConfirmationResult(result);
                setStep(2);
            }
        } catch (err) {
            console.error(err);
            if (authMethod === 'phone' && err.code === 'auth/invalid-phone-number') {
                setError('Invalid Phone Number. Make sure to include the country code (e.g. +91).');
            } else {
                setError(err.response?.data?.error || err.response?.data?.message || err.message || t('auth.error', 'Error sending OTP'));
            }

            // Reset recaptcha if phone auth failed so user can try again
            if (authMethod === 'phone' && window.recaptchaVerifier) {
                window.recaptchaVerifier.render().then(function (widgetId) {
                    window.grecaptcha.reset(widgetId);
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (authMethod === 'email') {
                if (demoMode && otp === '123456') {
                    setAuth('demo-jwt-token-123', { id: 'demo', email, name, role: roleSelected });
                    setRole(roleSelected);
                    navigate(roleSelected === 'admin' ? '/admin' : '/citizen');
                    setLoading(false);
                    return;
                }

                const resp = await api.post('/auth/verify', { email, otp });
                const userData = resp.data.user || { email, role: roleSelected };
                if (name) userData.name = name;

                setAuth(resp.data.token, userData);
                setRole(roleSelected);
                navigate(roleSelected === 'admin' ? '/admin' : '/citizen');
            } else {
                // Firebase Verify
                const result = await confirmationResult.confirm(otp);
                const user = result.user;
                const idToken = await user.getIdToken();

                // Exchange Firebase token for our native JWT via new backend endpoint
                const resp = await api.post('/auth/firebase-login', { token: idToken });
                const userData = resp.data.user || { phone: user.phoneNumber, role: roleSelected };
                if (name) userData.name = name;

                setAuth(resp.data.token, userData);
                setRole(roleSelected);
                navigate(roleSelected === 'admin' ? '/admin' : '/citizen');
            }
        } catch (err) {
            console.error(err);
            if (authMethod === 'phone' && err.code === 'auth/invalid-verification-code') {
                setError('Invalid OTP code');
            } else {
                setError(err.response?.data?.error || err.response?.data?.message || err.message || t('auth.invalid_otp', 'Invalid OTP'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-civic-light flex items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-5xl glass-card overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in fade-in zoom-in-95 duration-700">

                {/* Left Side - Brand Visuals */}
                <div className="md:w-5/12 gradient-surface p-10 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjI1KSIvPjwvc3ZnPg==')] opacity-30"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-10">
                            <ShieldCheckIcon className="w-10 h-10 text-white/90" />
                            <span className="text-2xl font-black tracking-tight text-white drop-shadow-md">JanSuvidha</span>
                        </div>

                        <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
                            {t('DigitalCivic')} <br />{t('ServicesPortal')}
                        </h2>
                        <p className="text-primary-100 text-lg font-medium max-w-sm">
                            {t('PortalDesc')}
                        </p>
                    </div>

                    <div className="relative z-10 mt-12 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center gap-4 mb-3">
                            <SparklesIcon className="w-6 h-6 text-accent-400" />
                            <span className="font-bold text-white tracking-wide">{t('PoweredByAI')}</span>
                        </div>
                        <p className="text-sm text-primary-100">{t('AIDesc')}</p>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="md:w-7/12 bg-white p-8 sm:p-12 lg:p-16 relative flex flex-col justify-center">
                    <div className="absolute top-6 right-6">
                        <LanguageSelector />
                    </div>

                    <div className="mb-10">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                            {t('Welcome')} 👋
                        </h1>
                        <p className="text-slate-500 font-medium text-lg">
                            {t('LoginDesc')}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-100 flex items-start gap-3 animate-in slide-in-from-top-2">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleSendOtp} className="space-y-6 animate-in slide-in-from-right-4 duration-500">

                            {/* Firebase Invisible Recaptcha */}
                            <div id="recaptcha-container"></div>

                            {/* Role Selectors */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${roleSelected === 'citizen' ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-md transform -translate-y-1' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500'}`}>
                                    <input type="radio" value="citizen" checked={roleSelected === 'citizen'} onChange={() => setRoleSelected('citizen')} className="sr-only" />
                                    <UserIcon className={`w-8 h-8 mb-2 ${roleSelected === 'citizen' ? 'text-primary-600' : 'text-slate-400'}`} />
                                    <span className="font-bold">{t('Citizen')}</span>
                                </label>
                                <label className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${roleSelected === 'admin' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md transform -translate-y-1' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500'}`}>
                                    <input type="radio" value="admin" checked={roleSelected === 'admin'} onChange={() => setRoleSelected('admin')} className="sr-only" />
                                    <IdentificationIcon className={`w-8 h-8 mb-2 ${roleSelected === 'admin' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                    <span className="font-bold">{t('Admin')}</span>
                                </label>
                            </div>

                            {/* Auth Method Toggle */}
                            <div className="flex p-1 bg-slate-100 rounded-lg mb-6">
                                <button
                                    type="button"
                                    onClick={() => setAuthMethod('email')}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${authMethod === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <EnvelopeIcon className="w-4 h-4" />
                                    Email Code
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAuthMethod('phone')}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all flex items-center justify-center gap-2 ${authMethod === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <DevicePhoneMobileIcon className="w-4 h-4" />
                                    Phone SMS
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-bold text-slate-700">{t('FullNameLabel')}</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus-ring text-lg transition-colors placeholder:text-slate-400"
                                        placeholder={t('FullNamePlaceholder')}
                                    />
                                </div>

                                {authMethod === 'email' ? (
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">{t('EnterEmail')}</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus-ring text-lg transition-colors placeholder:text-slate-400"
                                            placeholder={t('EmailPlaceholder')}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-bold text-slate-700">{t('EnterPhone', 'Enter Phone Number')}</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus-ring text-lg transition-colors placeholder:text-slate-400"
                                                placeholder="+919876543210"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {authMethod === 'email' && (
                                <div className="flex items-center gap-3 pt-2">
                                    <input
                                        type="checkbox"
                                        id="demoMode"
                                        checked={demoMode}
                                        onChange={e => setDemoMode(e.target.checked)}
                                        className="w-5 h-5 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                                    />
                                    <label htmlFor="demoMode" className="text-sm font-semibold text-slate-500 select-none cursor-pointer hover:text-slate-800 transition-colors">
                                        {t('EnableDemoMode')}
                                    </label>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-6 bg-slate-900 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:shadow-primary-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2 mt-4"
                            >
                                {loading ? (
                                    <span className="animate-pulse">{t('Processing')}...</span>
                                ) : (
                                    <>
                                        {t('SendOTP')}
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify} className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex items-start gap-4">
                                <div className="p-2 bg-white rounded-full shrink-0 shadow-sm text-primary-600">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-primary-900 mb-1">{t('PasscodeSentTitle')}</p>
                                    <p className="text-sm text-primary-700">
                                        {t('PasscodeSentDesc')} <strong className="font-extrabold">{authMethod === 'email' ? email : phone}</strong>.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 uppercase tracking-widest">{t('OTP')}</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus-ring text-3xl tracking-[0.5em] text-center font-black font-mono transition-colors"
                                    placeholder={t('OTPPlaceholder')}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || otp.length < 6}
                                    className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                >
                                    {loading ? t('Verifying') : t('SecureLogin')}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setOtp(''); }}
                                    className="w-full text-center py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    {t('CancelAnd')} {authMethod === 'email' ? t('ChangeEmail') : 'Change Phone'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
