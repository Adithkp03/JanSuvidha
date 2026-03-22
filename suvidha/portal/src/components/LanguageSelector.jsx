import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '../store/useStore';
import { Languages, ChevronDown } from 'lucide-react';

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
                className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-gray-100 hover:border-gray-200 bg-gray-50 text-gray-700 font-black text-sm transition-all uppercase tracking-tight"
                aria-label="Select Language"
            >
                <Languages size={18} className="text-gray-500" />
                <span>{activeLabel}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-44 origin-top-right rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none z-50 overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1">
                        {LANGUAGES.map((language) => (
                            <button
                                key={language.code}
                                onClick={() => handleSelect(language.code)}
                                className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${currentLang === language.code
                                    ? 'bg-[#0B3D2E]/5 text-[#0B3D2E]'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
