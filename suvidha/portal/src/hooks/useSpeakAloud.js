import { useCallback, useEffect, useRef } from 'react';
import useStore from '../store/useStore';

/**
 * BCP-47 language tag mapping for Web Speech API.
 * Maps the app's 7 language codes to speech synthesis language codes.
 */
const LANG_MAP = {
    en: 'en-IN',
    hi: 'hi-IN',
    ml: 'ml-IN',
    mr: 'mr-IN',
    te: 'te-IN',
    ta: 'ta-IN',
    kn: 'kn-IN',
};

/**
 * Custom hook for auto read-aloud using the Web Speech API.
 * Only speaks when Senior Citizen Mode is active.
 *
 * @returns {{ speak: (text: string) => void, stop: () => void }}
 */
export default function useSpeakAloud() {
    const seniorMode = useStore((s) => s.seniorMode);
    const language = useStore((s) => s.language);
    const utteranceRef = useRef(null);

    const stop = useCallback(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, []);

    const speak = useCallback(
        (text) => {
            if (!seniorMode) return;
            if (!text || typeof text !== 'string' || !text.trim()) return;
            if (typeof window === 'undefined' || !window.speechSynthesis) return;

            // Cancel any in-progress speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = LANG_MAP[language] || 'en-IN';
            utterance.rate = 0.85; // Slightly slower for senior citizens
            utterance.pitch = 1;
            utterance.volume = 1;

            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        },
        [seniorMode, language]
    );

    // Clean up speech on unmount
    useEffect(() => {
        return () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    return { speak, stop };
}
