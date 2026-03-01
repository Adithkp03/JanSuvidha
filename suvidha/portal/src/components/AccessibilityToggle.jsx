import React from 'react';
import useStore from '../store/useStore';
import { EyeIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

export default function AccessibilityToggle() {
    const { theme, setTheme, largeFont, toggleLargeFont } = useStore();
    const { t } = useTranslation();

    const toggleHighContrast = () => {
        setTheme(theme === 'high-contrast' ? 'light' : 'high-contrast');
    };

    const speakScreen = () => {
        if ('speechSynthesis' in window) {
            const text = document.body.innerText;
            const utterance = new SpeechSynthesisUtterance(text.substring(0, 500) + '...');
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={toggleLargeFont}
                className={`p-2 rounded-xl border ${largeFont ? 'bg-primary-100 border-primary-300 text-primary-800' : 'bg-white border-slate-200 text-slate-600'} hover:bg-slate-50 transition-colors tooltip`}
                title="Toggle Large Text"
            >
                <span className="font-bold text-lg leading-none">A+</span>
            </button>
            <button
                onClick={toggleHighContrast}
                className={`p-2 rounded-xl border ${theme === 'high-contrast' ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-white border-slate-200 text-slate-600'} hover:bg-slate-50 transition-colors`}
                title="High Contrast Mode"
            >
                <EyeIcon className="w-5 h-5" />
            </button>
            <button
                onClick={speakScreen}
                className="p-2 rounded-xl border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Read aloud"
            >
                <SpeakerWaveIcon className="w-5 h-5" />
            </button>
        </div>
    );
}
