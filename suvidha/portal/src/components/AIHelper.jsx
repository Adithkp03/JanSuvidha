import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { MicrophoneIcon, SparklesIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

export default function AIHelper({ onIntentResolved }) {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hints, setHints] = useState([]);

    const handleAsk = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        setLoading(true);
        setError('');
        try {
            const resp = await api.post('/intent/predict', { text });
            const data = resp.data || {};
            const suggested = data.suggested_fields || {};
            const department = suggested.department || data.department;
            const service_type = suggested.service_type || data.service_type;
            const confidence = data.confidence ?? 0;

            if (department && service_type && confidence >= 0.6) {
                onIntentResolved({ department, service_type });
                setHints([]);
                setText('');
            } else {
                setHints(['birth_cert', 'water_connection', 'property_tax']);
            }
        } catch (err) {
            console.error(err);
            setError('Intent AI Service is currently offline. Showing local suggestions.');
            setHints(['elec_bill_pay', 'water_connection', 'birth_cert']);
        } finally {
            setLoading(false);
        }
    };

    const startListening = () => {
        if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
            alert("Speech recognition not supported in this browser.");
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            setText(event.results[0][0].transcript);
        };
        recognition.start();
    };

    return (
        <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl shadow-primary-900/10">
            {/* Rich Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-indigo-600 to-indigo-900"></div>

            {/* Animated Ambient Blobs */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-400/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary-400/40 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4"></div>

            <div className="relative z-10 p-8 sm:p-12 lg:p-16 flex flex-col items-center text-center">

                {/* Header Copy */}
                <div className="inline-flex items-center justify-center p-2 bg-white/10 backdrop-blur-md rounded-2xl mb-6 shadow-sm border border-white/20">
                    <SparklesIcon className="w-5 h-5 text-accent-300 mr-2" />
                    <span className="text-sm font-bold text-white tracking-widest uppercase">{t('AIPoweredRouting')}</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4 drop-shadow-md">
                    {t('HowCanWeHelpYou')}
                </h1>
                <p className="text-lg sm:text-xl text-primary-100 mb-10 max-w-2xl font-medium">
                    {t('AIDescription')}
                </p>

                {/* Massive Search Bar Container */}
                <form onSubmit={handleAsk} className="w-full max-w-3xl relative group mt-2">
                    {/* Outer Glow Effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 via-accent-300 to-primary-600 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>

                    <div className="relative flex flex-col sm:flex-row items-center bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-3xl sm:rounded-full shadow-2xl transition-all duration-300 focus-within:bg-white/20 focus-within:border-white/50">

                        <div className="hidden sm:flex self-stretch items-center pl-6 pr-2">
                            <MagnifyingGlassIcon className="w-6 h-6 text-white/70 group-focus-within:text-white transition-colors" />
                        </div>

                        <input
                            type="text"
                            className="flex-1 w-full min-w-0 bg-transparent text-white placeholder-white/60 px-6 sm:px-2 py-4 sm:py-5 text-lg sm:text-xl font-medium focus:outline-none"
                            placeholder={t('AISearchPlaceholder')}
                            value={text}
                            onChange={e => setText(e.target.value)}
                        />

                        <div className="flex w-full sm:w-auto mt-2 sm:mt-0 gap-2 px-2 pb-2 sm:px-0 sm:pb-0">
                            <button
                                type="button"
                                onClick={startListening}
                                className="flex-1 sm:flex-none p-4 sm:px-5 rounded-2xl sm:rounded-full bg-white/5 hover:bg-white/20 border border-white/10 hover:border-white/30 transition-all text-white flex items-center justify-center group/mic"
                                title="Use Voice Input"
                            >
                                <MicrophoneIcon className="w-6 h-6 group-hover/mic:scale-110 transition-transform" />
                            </button>

                            <button
                                disabled={loading || !text.trim()}
                                type="submit"
                                className="flex-[3] sm:flex-none px-8 py-4 bg-white text-primary-800 hover:text-primary-900 font-extrabold text-lg rounded-2xl sm:rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 flex items-center justify-center mr-1 transform active:scale-95"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                                ) : t('SearchAI')}
                            </button>
                        </div>
                    </div>
                </form>

                {error && (
                    <div className="mt-6 px-4 py-2 bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-lg text-white font-medium shadow-sm animate-in fade-in">
                        {error}
                    </div>
                )}

                {/* Suggestions / Hints Area */}
                <div className="mt-8 flex flex-col items-center min-h-[40px]">
                    {hints.length === 0 ? (
                        <div className="flex flex-wrap justify-center gap-3">
                            <span className="text-sm font-semibold text-white/60 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">{t('TrySaying')}</span>
                            {[t('PayPropertyTax'), t('ApplyTradeLicense'), t('FixStreetLight')].map((phrase, i) => (
                                <button key={i} onClick={() => setText(phrase.replace(/"/g, ''))} className="text-sm font-medium text-white hover:text-accent-300 transition-colors py-1.5 focus:outline-none focus:underline underline-offset-4 decoration-white/30 hover:decoration-accent-300">
                                    {phrase}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap justify-center items-center gap-3 animate-in slide-in-from-bottom-4">
                            <span className="text-sm font-bold bg-white text-primary-700 px-4 py-1.5 rounded-full shadow-md">{t('DidYouMean')}</span>
                            {hints.map(h => (
                                <button key={h} onClick={() => onIntentResolved({ service_type: h, department: 'mock' })} className="px-5 py-2 bg-white/10 hover:bg-white/30 border border-white/30 hover:border-white rounded-full text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5">
                                    {h.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </button>
                            ))}
                            <button onClick={() => setHints([])} className="p-2 bg-white/10 hover:bg-red-500/80 rounded-full text-white transition-colors ml-2" title="Clear suggestions">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
