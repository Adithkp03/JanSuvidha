import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    en: {
        translation: {
            "Welcome": "Welcome to JanSuvidha",
            "Title": "Citizen Services Portal",
            "LoginDesc": "Use your email address to access your workspace.",
            "EnterEmail": "Enter Email",
            "EnterPhone": "Enter Phone Number",
            "SendOTP": "Send OTP",
            "EnterOTP": "Enter OTP Code",
            "OTP": "OTP",
            "OTPSentTo": "We've sent a 6-digit OTP to",
            "Verify": "Verify",
            "VerifyLogin": "Verify & Login",
            "RoleSelect": "Select Workspace",
            "SelectRole": "Select Role",
            "Citizen": "Citizen",
            "Admin": "Administrator",
            "ChangeEmail": "Change Email",
            "DemoMode": "Demo Mode (auto-fill OTP or token)",
            "Processing": "Processing...",
            "Verifying": "Verifying...",
            "SelectService": "Select Service",
            "Submit": "Submit",
            "SyncNow": "Sync Now",
            "StaffAssist": "Staff Assist",
            "TrackRequest": "Track Request",
            "Loading": "Loading..."
        }
    },
    hi: {
        translation: {
            "Welcome": "जनसुविधा में आपका स्वागत है",
            "Title": "नागरिक सेवा पोर्टल",
            "LoginDesc": "अपने कार्यक्षेत्र तक पहुंचने के लिए अपने ईमेल का उपयोग करें।",
            "EnterEmail": "ईमेल दर्ज करें",
            "EnterPhone": "फोन नंबर दर्ज करें",
            "SendOTP": "ओटीपी भेजें",
            "EnterOTP": "ओटीपी कोड दर्ज करें",
            "OTP": "ओटीपी",
            "OTPSentTo": "6 अंक का ओटीपी भेज दिया गया है",
            "Verify": "सत्यापित करें",
            "VerifyLogin": "सत्यापित करें और लॉगिन करें",
            "RoleSelect": "कार्यक्षेत्र चुनें",
            "SelectRole": "भूमिका चुनें",
            "Citizen": "नागरिक",
            "Admin": "प्रशासक",
            "ChangeEmail": "ईमेल बदलें",
            "DemoMode": "डेमो मोड (ओटीपी या टोकन स्वतः भरें)",
            "Processing": "प्रोसेस हो रहा है...",
            "Verifying": "सत्यापित हो रहा है...",
            "SelectService": "सेवा चुनें",
            "Submit": "जमा करें",
            "SyncNow": "अभी सिंक करें",
            "StaffAssist": "स्टाफ सहायता",
            "TrackRequest": "अनुरोध ट्रैक करें",
            "Loading": "लोड हो रहा है..."
        }
    }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "en",
        fallbackLng: "en",
        interpolation: {
            escapeValue: false
        },
        react: { useSuspense: false }
    });

// Sync i18n with persisted store language on init (Zustand persist key)
try {
    const stored = localStorage.getItem("jan-portal-storage");
    if (stored) {
        const parsed = JSON.parse(stored);
        const lang = parsed?.state?.language;
        if (lang && (lang === "en" || lang === "hi")) {
            i18n.changeLanguage(lang);
        }
    }
} catch (_) {}

export default i18n;
