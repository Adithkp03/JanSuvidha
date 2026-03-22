import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import useStore from '../store/useStore';
import { Mic, Sparkles, Search, X, Loader2 } from 'lucide-react';

export default function AIHelper({ onIntentResolved }) {
    const { t } = useTranslation();
    const seniorMode = useStore((s) => s.seniorMode);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hints, setHints] = useState([]);

    // Local keyword-to-service mapping for offline fallback
    const SERVICE_MAP = [
        { keywords: ['electricity', 'electric', 'bill', 'power', 'light', 'current', 'bijli'], department: 'electricity', service_type: 'elec_bill_pay', label: 'Pay Electricity Bill' },
        { keywords: ['new connection', 'new line', 'meter'], department: 'electricity', service_type: 'elec_new_conn', label: 'New Connection' },
        { keywords: ['water', 'supply', 'tap', 'paani', 'jal'], department: 'water', service_type: 'water_connection', label: 'Water Connection' },
        { keywords: ['birth', 'certificate', 'born', 'janam'], department: 'mc', service_type: 'birth_cert', label: 'Birth Certificate' },
        { keywords: ['property', 'tax', 'house tax', 'ghar'], department: 'mc', service_type: 'property_tax', label: 'Property Tax' },
        { keywords: ['gas', 'lpg', 'cylinder', 'cooking'], department: 'gas', service_type: 'gas_new_connection', label: 'Gas Connection' },
        { keywords: ['waste', 'garbage', 'trash', 'kachra'], department: 'waste', service_type: 'waste_pickup', label: 'Waste Pickup' },
        { keywords: ['road', 'pothole', 'street', 'sadak'], department: 'public_works', service_type: 'road_repair', label: 'Road Repair' },
        { keywords: ['emergency', 'disaster', 'flood', 'fire'], department: 'emergency', service_type: 'emergency_disaster_relief', label: 'Emergency Relief' },
    ];

    const findLocalMatch = (query) => {
        const q = query.toLowerCase();
        return SERVICE_MAP.filter(s => s.keywords.some(k => q.includes(k)));
    };

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

            if (department && service_type && confidence >= 0.4) {
                onIntentResolved({ department, service_type });
                setHints([]);
                setText('');
            } else {
                // Try local matching as fallback
                const localMatches = findLocalMatch(text);
                if (localMatches.length > 0) {
                    onIntentResolved({ department: localMatches[0].department, service_type: localMatches[0].service_type });
                    setHints([]);
                    setText('');
                } else {
                    setHints(SERVICE_MAP.slice(0, 3));
                }
            }
        } catch (err) {
            console.error(err);
            // Try local matching even when API is down
            const localMatches = findLocalMatch(text);
            if (localMatches.length > 0) {
                onIntentResolved({ department: localMatches[0].department, service_type: localMatches[0].service_type });
                setHints([]);
                setText('');
            } else {
                setError('Intent AI Service is currently offline. Try these suggestions:');
                setHints(SERVICE_MAP.slice(0, 3));
            }
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
        <div className="relative w-full max-w-4xl mx-auto text-center px-4">
            {/* AI Chip */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 mb-8 shadow-sm">
                <Sparkles size={16} className="animate-pulse" />
                <span className="text-xs font-black tracking-widest uppercase text-emerald-800">{t('AIPoweredRouting')}</span>
            </div>

            {/* Title */}
            <h2 className={`font-black text-[#0B3D2E] tracking-tighter leading-[1.1] mb-10 transition-all duration-500 ${seniorMode ? 'text-5xl sm:text-7xl lg:text-9xl' : 'text-4xl sm:text-6xl lg:text-7xl'}`}>
                {t('HowCanWeHelpYou').split('?')[0]} <br/>
                <span className="text-[#093E2C] font-black">{t('HowCanWeHelpYou').includes('?') ? '?' : ''}</span>
            </h2>

            {/* Search Bar Container */}
            <div className="relative group max-w-3xl mx-auto mt-2">
                <div className="absolute -inset-2 bg-gradient-to-r from-[#6FD6A6] to-transparent rounded-[40px] blur-xl opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
                
                <form 
                    onSubmit={handleAsk}
                    className="relative flex items-center h-[70px] sm:h-[82px] bg-white border-2 border-gray-100 rounded-3xl sm:rounded-[40px] px-3 sm:px-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] transition-all group-focus-within:border-[#6FD6A6]/50 group-focus-within:shadow-xl"
                >
                    <Search className="ml-2 sm:ml-4 mr-2 sm:mr-3 text-gray-400 group-focus-within:text-[#0B3D2E]" size={24} />
                    <input 
                        type="text" 
                        placeholder={t('AISearchPlaceholder')}
                        className={`flex-1 bg-transparent outline-none text-[#0B3D2E] font-bold placeholder:text-gray-400 ${seniorMode ? 'text-xl sm:text-3xl placeholder:text-lg sm:placeholder:text-2xl' : 'text-lg sm:text-xl'}`}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    
                    <button 
                        type="button"
                        onClick={startListening}
                        className="p-2 sm:p-4 text-gray-400 hover:text-[#0B3D2E] transition-colors"
                        title="Use Voice Input"
                    >
                        <Mic size={22} />
                    </button>
                    
                    <button 
                        type="submit"
                        disabled={loading || !text.trim()}
                        className="h-[50px] sm:h-[58px] px-6 sm:px-10 bg-[#0B3D2E] text-white rounded-xl sm:rounded-2xl font-black text-base sm:text-lg hover:bg-[#0F6B4A] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px] sm:min-w-[140px]"
                    >
                        {loading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : t('SearchAI')}
                    </button>
                </form>
            </div>

            {error && (
                <div className="mt-6 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 font-bold shadow-sm animate-in fade-in">
                    {error}
                </div>
            )}

            {/* Hints / Did You Mean */}
            <div className="mt-10 flex flex-col items-center min-h-[40px]">
                {hints.length > 0 && (
                    <div className="flex flex-wrap justify-center items-center gap-3 animate-in slide-in-from-bottom-4">
                        <span className="text-sm font-black bg-[#0B3D2E] text-white px-5 py-2 rounded-full shadow-lg">{t('DidYouMean')}</span>
                        {hints.map(h => (
                            <button 
                                key={h.service_type} 
                                onClick={() => onIntentResolved({ service_type: h.service_type, department: h.department })} 
                                className="px-6 py-2.5 bg-white hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 rounded-full text-sm font-bold text-[#0B3D2E] shadow-sm transition-all hover:-translate-y-0.5"
                            >
                                {h.label}
                            </button>
                        ))}
                        <button 
                            onClick={() => setHints([])} 
                            className="p-2.5 bg-gray-100 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-colors border border-transparent hover:border-red-100" 
                            title="Clear suggestions"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
