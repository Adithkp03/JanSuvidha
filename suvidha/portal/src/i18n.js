import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import ml from './locales/ml.json';
import mr from './locales/mr.json';
import te from './locales/te.json';
import ta from './locales/ta.json';
import kn from './locales/kn.json';

const resources = {
    en: { translation: en },
    hi: { translation: hi },
    ml: { translation: ml },
    mr: { translation: mr },
    te: { translation: te },
    ta: { translation: ta },
    kn: { translation: kn }
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: "en",
        fallbackLng: "en",
        keySeparator: false,
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
        if (lang && resources[lang]) {
            i18n.changeLanguage(lang);
        }
    }
} catch (_) { }

export default i18n;
