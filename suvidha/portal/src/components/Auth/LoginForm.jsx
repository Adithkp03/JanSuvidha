import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import api from '../../services/api';
import {
    Mail,
    Smartphone,
    ArrowRight,
    Clock,
    Wifi,
    MapPin,
    User,
    Sparkles,
    ShieldCheck,
    CheckCircle,
    Key
} from 'lucide-react';
import { auth } from '../../services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const LoginForm = () => {
    const globalLang = useStore(state => state.language);
    const setGlobalLang = useStore(state => state.setLanguage);
    const { i18n } = useTranslation();

    const [method, setMethod] = useState('email');
    const [lang, setLangState] = useState(globalLang?.toUpperCase() || 'EN');
    const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    const navigate = useNavigate();
    const setAuth = useStore(state => state.setAuth);
    const setRole = useStore(state => state.setRole);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const roleSelected = 'citizen';
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [demoMode, setDemoMode] = useState(false);

    // To store Firebase verification result
    const [confirmationResult, setConfirmationResult] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-citizen-container', {
                'size': 'invisible',
                'callback': (response) => { }
            });
        }
    }, []);

    // Sync lang
    const setLang = (code) => {
        setLangState(code);
        const lowerCode = code.toLowerCase();
        setGlobalLang(lowerCode);
        i18n.changeLanguage(lowerCode);
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');

        if (demoMode && method === 'email') {
            setOtp('123456');
            setStep(2);
            return;
        }

        if (method === 'email' && !email) {
            setError('Please enter a valid email');
            return;
        }
        if (method === 'sms' && (!phone || phone.length < 10)) {
            setError('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            if (method === 'email') {
                const resp = await api.post('/auth/otp', { email });
                if (process.env.NODE_ENV === 'development') {
                    console.log('OTP Hint:', resp.data.otp_hint);
                }
                setStep(2);
            } else {
                // Firebase Phone Auth
                const appVerifier = window.recaptchaVerifier;
                const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
                const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
                setConfirmationResult(result);
                setStep(2);
            }
        } catch (err) {
            console.error(err);
            if (method === 'sms' && err.code === 'auth/invalid-phone-number') {
                setError('Invalid Phone Number. Make sure to include the country code (e.g. +91).');
            } else {
                setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Error sending OTP');
            }

            if (method === 'sms' && window.recaptchaVerifier) {
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
            if (method === 'email') {
                if (demoMode && otp === '123456') {
                    setAuth('demo-jwt-token-123', { id: 'demo', email, name, role: roleSelected });
                    setRole(roleSelected);
                    navigate('/citizen');
                    setLoading(false);
                    return;
                }

                const resp = await api.post('/auth/verify', { email, otp });
                const userData = resp.data.user || { email, role: roleSelected };
                if (name) userData.name = name;

                setAuth(resp.data.token, userData);
                setRole(roleSelected);
                navigate('/citizen');
            } else {
                // Firebase Verify
                const result = await confirmationResult.confirm(otp);
                const user = result.user;
                const idToken = await user.getIdToken();

                const resp = await api.post('/auth/firebase-login', { token: idToken });
                const userData = resp.data.user || { phone: user.phoneNumber, role: roleSelected };
                if (name) userData.name = name;

                setAuth(resp.data.token, userData);
                setRole(roleSelected);
                navigate('/citizen');
            }
        } catch (err) {
            console.error(err);
            if (method === 'sms' && err.code === 'auth/invalid-verification-code') {
                setError('Invalid OTP code');
            } else {
                setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Invalid OTP');
            }
        } finally {
            setLoading(false);
        }
    };


    const content = {
        EN: {
            hello: "Hello!",
            welcome: "Welcome to JanSuvidha",
            login: "Login",
            email: "EMAIL",
            phone: "PHONE",
            fullName: "Full Legal Name",
            idPlaceholder: method === 'email' ? 'Email Address' : 'Mobile Number (+91)',
            sendOtp: "Send OTP",
            govtInfo: "C-DAC: Centre for Development of Advanced Computing, India",
            secure: "Secure Terminal",
            aiFeature: "AI Powered Intelligence Active",
            goi: "Government of India",
            verifyOtp: "Verify OTP",
            otpPlaceholder: "Enter 6-digit OTP",
            verify: "Secure Login",
            cancel: "Change Method / ID"
        },
        HI: {
            hello: "नमस्ते!",
            welcome: "जनसुविधा में आपका स्वागत है",
            login: "लॉगिन",
            email: "ईमेल",
            phone: "फोन",
            fullName: "पूरा नाम",
            idPlaceholder: method === 'email' ? 'ईमेल एड्रेस' : 'मोबाइल नंबर (+91)',
            sendOtp: "ओटीपी भेजें",
            govtInfo: "सी-डैक: उन्नत संगणन विकास केंद्र, भारत",
            secure: "सुरक्षित टर्मिनल",
            aiFeature: "AI संचालित इंटेलिजेंस सक्रिय",
            goi: "भारत सरकार",
            verifyOtp: "ओटीपी सत्यापित करें",
            otpPlaceholder: "6-अंकीय ओटीपी दर्ज करें",
            verify: "सुरक्षित लॉगिन",
            cancel: "बदलें"
        },
        ML: {
            hello: "ഹലോ!",
            welcome: "ജനസുവിധയിലേക്ക് സ്വാഗതം",
            login: "ലോഗിൻ",
            email: "ഇമെയിൽ",
            phone: "ഫോൺ",
            fullName: "പൂർണ്ണമായ പേര്",
            idPlaceholder: method === 'email' ? 'ഇമെയിൽ വിലാസം' : 'മൊബൈൽ നമ്പർ (+91)',
            sendOtp: "OTP അയയ്ക്കുക",
            govtInfo: "സി-ഡാക്: സെന്റർ ഫോർ ഡെവലപ്മെന്റ് ഓഫ് അഡ്വാൻസ്ഡ് കമ്പ്യൂട്ടിംഗ്, ഇന്ത്യ",
            secure: "സുരക്ഷിത ടെർമിനൽ",
            aiFeature: "AI പവർഡ് ഇന്റലിജൻസ് സജീവം",
            goi: "ഭാരത സർക്കാർ",
            verifyOtp: "OTP പരിശോധിക്കുക",
            otpPlaceholder: "6-അക്ക OTP നൽകുക",
            verify: "സുരക്ഷിത ലോഗിൻ",
            cancel: "മാറ്റുക"
        },
        TE: {
            hello: "హలో!",
            welcome: "జనసువిధకు స్వాగతం",
            login: "లాగిన్",
            email: "ఈమెయిల్",
            phone: "ఫోన్",
            fullName: "పూర్తి పేరు",
            idPlaceholder: method === 'email' ? 'ఈమెయిల్ చిరునామా' : 'మొబైల్ నంబర్ (+91)',
            sendOtp: "OTP పంపండి",
            govtInfo: "C-DAC: సెంటర్ ఫర్ డెవలప్మెంట్ ఆఫ్ అడ్వాన్స్డ్ కంప్యూటింగ్, ఇండియా",
            secure: "సురక్షిత టెర్మినల్",
            aiFeature: "AI పవర్డ్ ఇంటెలిజెన్స్ సక్రియంగా ఉంది",
            goi: "భారత ప్రభుత్వం",
            verifyOtp: "OTP ని ధృవీకరించండి",
            otpPlaceholder: "6-అంకెల OTP ని నమోదు చేయండి",
            verify: "సురక్షిత లాగిన్",
            cancel: "మార్చండి"
        },
        TA: {
            hello: "வணக்கம்!",
            welcome: "ஜன்சுவிதாவுக்கு உங்களை வரவேற்கிறோம்",
            login: "உள்நுழை",
            email: "மின்னஞ்சல்",
            phone: "தொலைபேசி",
            fullName: "முழு பெயர்",
            idPlaceholder: method === 'email' ? 'மின்னஞ்சல் முகவரி' : 'கைபேசி எண் (+91)',
            sendOtp: "OTP-ஐ அனுப்பு",
            govtInfo: "C-DAC: சென்டர் ஃபார் டெவலப்மெண்ட் ஆஃப் அட்வான்ஸ்டு கம்ப்யூட்டிங், இந்தியா",
            secure: "பாதுகாப்பான முனையம்",
            aiFeature: "AI நுண்ணறிவு செயல்பாட்டில் உள்ளது",
            goi: "இந்திய அரசு",
            verifyOtp: "OTP ஐ சரிபார்க்கவும்",
            otpPlaceholder: "6 இலக்க OTP ஐ உள்ளிடவும்",
            verify: "பாதுகாப்பான உள்நுழைவு",
            cancel: "மாற்று"
        },
        MR: {
            hello: "नमस्कार!",
            welcome: "जनसुविधा मध्ये आपले स्वागत आहे",
            login: "लॉगिन",
            email: "ईमेल",
            phone: "फोन",
            fullName: "पूर्ण नाव",
            idPlaceholder: method === 'email' ? 'ईमेल पत्ता' : 'मोबाईल नंबर (+91)',
            sendOtp: "ओटीपी पाठवा",
            govtInfo: "सी-डॅक: सेंटर फॉर डेव्हलपमेंट ऑफ अॅडव्हान्स्ड कॉम्प्युटिंग, भारत",
            secure: "सुरक्षित टर्मिनल",
            aiFeature: "AI इंटेलिजेंस सक्रिय",
            goi: "भारत सरकार",
            verifyOtp: "ओटीपी सत्यापित करा",
            otpPlaceholder: "6-अंकी ओटीपी प्रविष्ट करा",
            verify: "सुरक्षित लॉगिन",
            cancel: "बदला"
        },
        KN: {
            hello: "ಹಲೋ!",
            welcome: "ಜನಸುವಿಧಕ್ಕೆ ಸುಸ್ವಾಗತ",
            login: "ಲಾಗಿನ್",
            email: "ಇಮೇಲ್",
            phone: "ಫೋನ್",
            fullName: "ಪೂರ್ಣ ಹೆಸರು",
            idPlaceholder: method === 'email' ? 'ಇಮೇಲ್ ವಿಳಾಸ' : 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ (+91)',
            sendOtp: "OTP ಕಳುಹಿಸಿ",
            govtInfo: "C-DAC: ಸೆಂಟರ್ ಫಾರ್ ಡೆವಲಪ್ಮೆಂಟ್ ಆಫ್ ಅಡ್ವಾನ್ಸ್ಡ್ ಕಂಪ್ಯೂಟಿಂಗ್, ಭಾರತ",
            secure: "ಸುರಕ್ಷಿತ ಟರ್ಮಿನಲ್",
            aiFeature: "AI ಚಾಲಿತ ಇಂಟೆಲಿಜೆನ್ಸ್ ಸಕ್ರಿಯವಾಗಿದೆ",
            goi: "ಭಾರತ ಸರ್ಕಾರ",
            verifyOtp: "OTP ಪರಿಶೀಲಿಸಿ",
            otpPlaceholder: "6-ಅಂಕಿಯ OTP ನಮೂದಿಸಿ",
            verify: "ಸುರಕ್ಷಿತ ಲಾಗಿನ್",
            cancel: "ಬದಲಾಯಿಸಿ"
        }
    };

    const t = content[lang] || content['EN'];

    const languages = [
        { code: 'EN', label: 'EN' },
        { code: 'HI', label: 'हिन्दी' },
        { code: 'ML', label: 'മലയാളം' },
        { code: 'TE', label: 'తెలుగు' },
        { code: 'TA', label: 'தமிழ்' },
        { code: 'MR', label: 'मराठी' },
        { code: 'KN', label: 'ಕನ್ನಡ' }
    ];

    return (
        <div className="min-h-screen bg-[#cbd5e1] text-slate-900 flex items-center justify-center font-sans p-0 md:p-6 relative overflow-hidden">

            {/* Background Layer */}
            <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-200 to-slate-400"></div>

            <div id="recaptcha-citizen-container"></div>

            {/* Main Kiosk Container */}
            <main className="z-10 w-full max-w-[750px] h-[100dvh] md:h-full md:min-h-[950px] bg-[#022c22] border-0 md:border-[12px] border-white md:rounded-[4rem] shadow-[0_80px_150px_-30px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col relative">

                {/* SECTION 1: The Organic Green Header */}
                <section className="h-[40%] md:h-[45%] bg-[#022c22] px-6 py-10 md:p-14 flex flex-col justify-start relative z-10 shrink-0">

                    {/* Top Utility Bar */}
                    <div className="relative z-30 w-full flex justify-between items-stretch mb-8 md:mb-16 opacity-95 text-white">
                        <div className="flex items-stretch gap-4 max-w-[65%]">
                            <div className="flex items-center gap-1 bg-white/10 p-1.5 rounded-full border border-white/10 backdrop-blur-md h-12 overflow-x-auto no-scrollbar">
                                {languages.map((l) => (
                                    <button
                                        key={l.code}
                                        onClick={() => setLang(l.code)}
                                        type="button"
                                        className={`px-3.5 h-full rounded-full text-[10px] font-black whitespace-nowrap transition-all flex items-center justify-center shrink-0 ${lang === l.code ? 'bg-white text-[#022c22] shadow-sm' : 'text-white/60 hover:text-white'}`}
                                    >
                                        {l.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3 bg-white/10 px-4 md:px-6 rounded-full border border-white/10 backdrop-blur-sm h-12 shrink-0">
                            <Clock className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] md:text-[11px] font-black tracking-widest uppercase tabular-nums">{time}</span>
                        </div>
                    </div>

                    {/* AI FEATURE BADGE */}
                    <div className="relative z-30 mb-6 flex justify-between items-center">
                        <div className="inline-flex items-center gap-2 md:gap-3 bg-emerald-400/10 border border-emerald-400/20 px-3 md:px-5 py-2 md:py-2.5 rounded-2xl backdrop-blur-md animate-pulse-subtle">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none">{t.aiFeature}</span>
                        </div>

                        {method === 'email' && step === 1 && (
                            <label className="flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                                <input type="checkbox" checked={demoMode} onChange={e => setDemoMode(e.target.checked)} className="rounded text-emerald-500 bg-white/10 border-white/20" />
                                <span className="text-xs font-bold text-white/80">Demo</span>
                            </label>
                        )}
                    </div>

                    <div className="relative z-30 space-y-2 md:space-y-3 mt-auto md:mt-0">
                        <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter drop-shadow-lg">
                            {step === 1 ? t.hello : 'OTP'}
                        </h1>
                        <p className="text-emerald-100/90 text-lg md:text-2xl font-bold tracking-tight pb-4 md:pb-0">
                            {step === 1 ? t.welcome : 'Verification required'}
                        </p>
                    </div>

                    {/* Organic Background Elements */}
                    <div className="absolute top-[-40px] left-[-40px] w-80 h-80 z-10 pointer-events-none opacity-20 overflow-hidden">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                            <path d="M0,0 Q100,0 120,80 Q140,160 60,180 Q0,200 0,100 Z" fill="#10b981" />
                        </svg>
                    </div>
                </section>

                {/* SECTION 2: Interaction Card */}
                <section className="flex-1 bg-white flex flex-col rounded-t-[3rem] md:rounded-t-[4.5rem] relative z-20 px-6 sm:px-8 md:px-14 pb-8 md:pb-14 pt-10 md:pt-16 -mt-8 md:-mt-12 shadow-[0_-40px_80px_rgba(0,0,0,0.06)] border-t border-white/20">

                    <div className="mb-6 md:mb-14 px-2 md:px-0">
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-2 md:mb-4 tracking-tighter">
                            {step === 1 ? t.login : t.verifyOtp}
                        </h2>
                        <div className={`h-2 ${step === 1 ? 'w-16 bg-[#10b981]' : 'w-24 bg-emerald-600'} rounded-full transition-all duration-500`}></div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-bold border border-red-100 animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <form onSubmit={handleSendOtp} className="space-y-6 md:space-y-10 flex-1 flex flex-col z-30">
                            <div className="px-2 md:px-0">
                                {/* Minimalist Tab Switcher */}
                                <div className="flex bg-[#f1f5f9] p-2 md:p-3 rounded-[3rem] mb-8 sm:mb-10 md:mb-12 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-slate-200/50">
                                    <button
                                        type="button"
                                        onClick={() => setMethod('email')}
                                        className={`flex-1 py-4 sm:py-5 md:py-6 rounded-[2.5rem] text-[10px] sm:text-[11px] md:text-xs font-black tracking-[0.2em] transition-all duration-500 uppercase ${method === 'email' ? 'bg-white text-[#0f172a] shadow-[0_4px_20px_rgba(0,0,0,0.05)] scale-[1.02]' : 'bg-transparent text-[#94a3b8] hover:text-[#64748b]'}`}
                                    >
                                        {t.email}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMethod('sms')}
                                        className={`flex-1 py-4 sm:py-5 md:py-6 rounded-[2.5rem] text-[10px] sm:text-[11px] md:text-xs font-black tracking-[0.2em] transition-all duration-500 uppercase ${method === 'sms' ? 'bg-white text-[#0f172a] shadow-[0_4px_20px_rgba(0,0,0,0.05)] scale-[1.02]' : 'bg-transparent text-[#94a3b8] hover:text-[#64748b]'}`}
                                    >
                                        {t.phone}
                                    </button>
                                </div>

                                {/* Input Fields */}
                                <div className="space-y-7">
                                    <div className="relative group">
                                        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                                            <User className="w-7 h-7" />
                                        </div>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder={t.fullName}
                                            className="w-full bg-[#f1f5f9] border border-[#cbd5e1]/40 focus:bg-white focus:border-emerald-500 pl-16 sm:pl-20 pr-8 sm:pr-10 py-5 sm:py-6 md:py-8 rounded-[2rem] md:rounded-[3rem] outline-none transition-all font-bold text-lg sm:text-xl md:text-2xl text-slate-800 placeholder:text-[#94a3b8] placeholder:font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]"
                                        />
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                                            {method === 'email' ? <Mail className="w-7 h-7" /> : <Smartphone className="w-7 h-7" />}
                                        </div>
                                        <input
                                            type={method === 'email' ? 'email' : 'tel'}
                                            value={method === 'email' ? email : phone}
                                            onChange={e => method === 'email' ? setEmail(e.target.value) : setPhone(e.target.value)}
                                            placeholder={t.idPlaceholder}
                                            className="w-full bg-[#f1f5f9] border border-[#cbd5e1]/40 focus:bg-white focus:border-emerald-500 pl-16 sm:pl-20 pr-8 sm:pr-10 py-5 sm:py-6 md:py-8 rounded-[2rem] md:rounded-[3rem] outline-none transition-all font-bold text-lg sm:text-xl md:text-2xl text-slate-800 placeholder:text-[#94a3b8] placeholder:font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 sm:pt-8 space-y-4 sm:space-y-10 px-2 lg:px-0 pb-2">
                                <button type="submit" disabled={loading} className="w-full bg-[#032e22] hover:bg-[#021f17] text-white py-5 sm:py-6 md:py-8 rounded-[2.5rem] md:rounded-[3rem] font-black text-xl sm:text-2xl md:text-3xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 sm:gap-5 shadow-[0_10px_20px_rgba(2,44,34,0.1)] group disabled:opacity-70">
                                    {loading ? '...' : t.sendOtp}
                                    <ArrowRight className="w-6 md:w-8 h-6 md:h-8 group-hover:translate-x-3 transition-transform" />
                                </button>

                                {/* CONSOLIDATED OFFICIAL FOOTER */}
                                <div className="pt-8 border-t border-slate-100">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full">
                                                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{t.goi}</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
                                                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                                                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{t.secure}</span>
                                            </div>
                                        </div>
                                        <div className="text-center max-w-sm px-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                                                {t.govtInfo}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify} className="space-y-10 flex-1 flex flex-col z-30 animate-in slide-in-from-right-8 duration-500">
                            <div>
                                <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex flex-col gap-3 mb-10">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                                        <span className="text-sm font-black text-emerald-900 tracking-widest uppercase">Code Sent</span>
                                    </div>
                                    <p className="text-emerald-800 font-bold text-lg">
                                        Please check your <span className="font-black">{method === 'email' ? email : phone}</span> for the secure code.
                                    </p>
                                </div>

                                <div className="relative group">
                                    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors">
                                        <Key className="w-7 h-7" />
                                    </div>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder={t.otpPlaceholder}
                                        autoFocus
                                        className="w-full bg-slate-50 border border-slate-100 pl-20 pr-10 py-7 rounded-[2.5rem] focus:bg-white focus:border-emerald-600 outline-none transition-all font-black text-3xl tracking-[0.5em] text-slate-900 placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-bold shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="mt-auto pt-4 space-y-6">
                                <button type="submit" disabled={loading || otp.length < 6} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-8 rounded-[2.5rem] font-black text-3xl active:scale-[0.98] transition-all flex items-center justify-center gap-5 shadow-2xl shadow-emerald-950/20 group disabled:opacity-50">
                                    {loading ? '...' : t.verify}
                                    <ArrowRight className="w-8 h-8 group-hover:translate-x-3 transition-transform" />
                                </button>

                                <button type="button" onClick={() => { setStep(1); setOtp(''); }} className="w-full text-center py-4 text-sm font-black text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-widest">
                                    {t.cancel}
                                </button>
                            </div>
                        </form>
                    )}

                </section>

                {/* The Potted Plant Visual - Anchored strictly to the 40/45% section breakpoint */}
                <div className="absolute left-0 right-0 top-[40%] md:top-[45%] h-0 z-[60] pointer-events-none">
                    <div className="absolute right-4 md:right-10 bottom-[-75px] md:bottom-[70px] w-48 md:w-64 h-auto aspect-[120/200] flex flex-col items-center">
                        <svg viewBox="0 0 120 200" className="w-full h-full drop-shadow-2xl overflow-visible">
                            <ellipse cx="60" cy="185" rx="32" ry="10" fill="black" opacity="0.1" />
                            <g className="animate-sway">
                                <path d="M60,140 Q20,100 30,40 Q40,0 60,80 Z" fill="#059669" />
                                <path d="M60,140 Q60,40 50,10 Q80,40 60,140" fill="#10b981" />
                                <path d="M60,140 Q100,100 90,40 Q80,0 60,80 Z" fill="#059669" opacity="0.8" />
                            </g>
                            <path d="M40,140 L80,140 L75,180 L45,180 Z" fill="white" />
                            <ellipse cx="60" cy="140" rx="20" ry="5" fill="#f1f5f9" />
                            <path d="M45,180 Q60,190 75,180" fill="#cbd5e1" opacity="0.5" />
                        </svg>
                    </div>
                </div>

            </main>


            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        .animate-sway {
          animation: sway 4s infinite ease-in-out;
          transform-origin: bottom center;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 3s infinite ease-in-out;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

        </div>
    );
};

export default LoginForm;
