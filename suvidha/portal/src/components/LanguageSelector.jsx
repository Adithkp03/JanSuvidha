import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '../store/useStore';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

export default function LanguageSelector() {
    const { i18n } = useTranslation();
    const lang = useStore(state => state.language);
    const setLang = useStore(state => state.setLanguage);

    // Sync i18n with store on mount (restore persisted language)
    useEffect(() => {
        if (lang && lang !== i18n.language) {
            i18n.changeLanguage(lang);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount to restore persisted lang
    }, []);

    const handleToggle = () => {
        const next = (i18n.language || 'en') === 'en' ? 'hi' : 'en';
        i18n.changeLanguage(next).then(() => {
            setLang(next);
        });
    };

    const currentLang = i18n.language || lang || 'en';

    return (
        <button
            type="button"
            onClick={handleToggle}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
            aria-label="Toggle Language"
        >
            <GlobeAltIcon className="w-4 h-4" />
            <span>{currentLang === 'en' ? 'हिन्दी' : 'English'}</span>
        </button>
    );
}
