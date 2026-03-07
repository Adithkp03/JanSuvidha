import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '../store/useStore';
import { GlobeAltIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' },
    { code: 'ml', label: 'മലയാളം' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'kn', label: 'ಕನ್ನಡ' }
];

export default function LanguageSelector() {
    const { i18n } = useTranslation();
    const lang = useStore(state => state.language);
    const setLang = useStore(state => state.setLanguage);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Sync i18n with store on mount 
    useEffect(() => {
        if (lang && lang !== i18n.language) {
            i18n.changeLanguage(lang);
        }
    }, [lang, i18n]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLang = i18n.language || lang || 'en';
    const activeLabel = LANGUAGES.find(l => l.code === currentLang)?.label || 'English';

    const handleSelect = (code) => {
        i18n.changeLanguage(code).then(() => {
            setLang(code);
            setIsOpen(false);
        });
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-colors shadow-sm border border-slate-200"
                aria-label="Select Language"
            >
                <GlobeAltIcon className="w-4 h-4 text-primary-600" />
                <span>{activeLabel}</span>
                <ChevronDownIcon className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1">
                        {LANGUAGES.map((language) => (
                            <button
                                key={language.code}
                                onClick={() => handleSelect(language.code)}
                                className={`w-full text-left px-4 py-2 text-sm font-semibold transition-colors ${currentLang === language.code
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                {language.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
