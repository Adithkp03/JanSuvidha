import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import useStore from '../../store/useStore';
import AIHelper from '../../components/AIHelper';
import DepartmentGrid from '../../components/DepartmentGrid';
import ServiceCard from '../../components/ServiceCard';
import useSpeakAloud from '../../hooks/useSpeakAloud';
import LanguageSelector from '../../components/LanguageSelector';
import { 
  ArrowLeftIcon,
  SparklesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { 
  PhoneCall, 
  ClipboardList, 
  Printer, 
  HelpCircle,
  Accessibility,
  Languages,
  ChevronDown,
  User,
  X,
  Loader2,
  Sparkles,
  LogOut,
  ChevronRight
} from 'lucide-react';
import AppLogo from '@/assets/logo.png';

const FALLBACK_SERVICES = {
    electricity: [
        { id: 'elec_1', code: 'elec_bill_pay', service_type: 'elec_bill_pay', name: 'Pay Electricity Bill', description: 'Pay your current or outstanding electricity bill online.', fee_amount: 0, processing_days: 1 },
        { id: 'elec_2', code: 'elec_new_conn', service_type: 'elec_new_conn', name: 'New Connection', description: 'Apply for a new electricity connection for your premises.', fee_amount: 2000, processing_days: 14 },
    ],
    // ... basic fallback for other depts omitted for brevity but keeping structure
};

export default function StartFlow() {
    const { t } = useTranslation();
    const [selectedDept, setSelectedDept] = useState(null);
    const [services, setServices] = useState([]);
    const [fetchError, setFetchError] = useState(null);
    const [loadingServices, setLoadingServices] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiResponse, setAiResponse] = useState(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const navigate = useNavigate();
    const { seniorMode, setSeniorMode, language, user } = useStore();
    const { speak } = useSpeakAloud();

    // Auto read-aloud logic
    useEffect(() => {
        if (seniorMode) {
            if (!selectedDept) {
                speak(`${t('HowCanWeHelpYou')} ${t('BrowseDepartments')}. ${t('BrowseDepartmentsDesc')}`);
            }
        }
    }, [seniorMode, selectedDept, speak, t]);

    useEffect(() => {
        if (!selectedDept) {
            setServices([]);
            return;
        }

        const fetchServices = async () => {
            setLoadingServices(true);
            try {
                setFetchError(null);
                const resp = await api.get(`/services?department=${selectedDept.code}&_t=${Date.now()}`);
                if (!resp.data.services || resp.data.services.length === 0) {
                    setFetchError(`Received 0 services for code: "${selectedDept.code}"`);
                }
                setServices(resp.data.services || []);
            } catch (err) {
                setFetchError((err.message || 'Unknown network error') + ` (code: ${selectedDept.code})`);
                setServices([]);
            } finally {
                setLoadingServices(false);
            }
        };
        fetchServices();
    }, [selectedDept]);

    const handleIntentResolved = async (resolved) => {
        if (!resolved?.department || !resolved?.service_type) return;
        navigate('/citizen/apply', { state: { serviceCode: resolved.service_type, department: resolved.department } });
    };

    const handleServiceSelect = (service) => {
        navigate('/citizen/apply', { state: { serviceCode: service.code, serviceData: service } });
    };

    const quickActions = [
        { label: t('Emergency'), icon: <PhoneCall />, color: "text-red-600", bg: "bg-red-100", action: () => handleServiceSelect({ code: 'emergency_disaster_relief' }) },
        { label: t('ApplicationHistory'), icon: <ClipboardList />, color: "text-blue-600", bg: "bg-blue-100", action: () => navigate('/citizen/track') },
        { label: t('PrintReceipt'), icon: <Printer />, color: "text-emerald-600", bg: "bg-emerald-100", action: () => navigate('/citizen/track') },
        { label: t('HelpCenter'), icon: <HelpCircle />, color: "text-amber-600", bg: "bg-amber-100", action: () => {} },
    ];

    const heroText = seniorMode ? "text-7xl" : "text-6xl";
    const bodyText = seniorMode ? "text-xl" : "text-base";

    return (
        <div className="min-h-screen bg-[#0B3D2E] font-sans selection:bg-[#6FD6A6]/30 overflow-x-hidden flex items-center justify-center p-4 md:p-8 relative w-[100vw] left-1/2 -ml-[50vw]">
            
            {/* Ambient Background Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0F6B4A] rounded-full blur-[120px] opacity-40 animate-pulse"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#6FD6A6] rounded-full blur-[150px] opacity-10"></div>

            <div className={`relative w-full max-w-[1400px] bg-white/95 backdrop-blur-xl rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/20 flex flex-col transition-all duration-500 overflow-hidden`}>
                
                <header className="px-6 sm:px-12 py-6 sm:py-8 flex items-center justify-between border-b border-gray-100 relative">
                    <div className="flex items-center gap-3 sm:gap-5">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center overflow-hidden">
                            <img src={AppLogo} alt="JanSuvidha Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="hidden xs:block">
                            <h1 className="text-xl sm:text-2xl font-black text-[#0B3D2E] tracking-tight leading-none uppercase">JanSuvidha</h1>
                            <p className="text-[8px] sm:text-[10px] font-black text-[#0F6B4A]/60 tracking-[0.3em] uppercase mt-1">{t('Title')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setSeniorMode(!seniorMode)}
                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all duration-300 ${seniorMode ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]' : 'bg-gray-50 border-transparent hover:border-emerald-200 text-gray-700'}`}
                        >
                            <Accessibility className={`${seniorMode ? 'animate-bounce' : ''}`} size={22} />
                            <span className={`font-black uppercase tracking-tight ${seniorMode ? 'text-lg' : 'text-sm'}`}>{t('SeniorMode')}</span>
                        </button>

                        <div className="relative">
                            <LanguageSelector />
                        </div>

                        <div className="pl-2 sm:pl-4 border-l border-gray-200 flex items-center gap-2 sm:gap-3 relative">
                            <div className="hidden sm:flex flex-col items-end mr-1 text-right">
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Verified</span>
                                <span className="text-sm font-bold text-[#0B3D2E]">{user?.name || t('Citizen')}</span>
                            </div>
                            <button 
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#0F6B4A]/10 flex items-center justify-center border-2 border-white shadow-md overflow-hidden hover:bg-[#0F6B4A]/20 transition-all active:scale-95"
                            >
                                <User className="text-[#0B3D2E]" />
                            </button>

                            {showProfileMenu && (
                                <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100] animate-in fade-in slide-in-from-top-2">
                                    <div className="px-4 py-3 border-b border-gray-50 sm:hidden">
                                        <p className="text-xs font-black text-emerald-600 uppercase">Verified</p>
                                        <p className="font-bold text-[#0B3D2E]">{user?.name || t('Citizen')}</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const { logout } = useStore.getState();
                                            logout();
                                            navigate('/');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 font-bold transition-colors"
                                    >
                                        <LogOut size={18} />
                                        <span>{t('SignOut')}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className={`flex-1 px-4 sm:px-12 pb-12 overflow-y-auto custom-scrollbar ${seniorMode ? 'pt-10 sm:pt-2' : 'pt-6 sm:pt-2'}`}>
                    
                    {!selectedDept ? (
                        <>
                            <section className="text-center max-w-4xl mx-auto mb-32 pt-4">
                                <AIHelper onIntentResolved={handleIntentResolved} />
                            </section>

                            <section className="mb-24 px-4">
                                <div className="flex flex-col mb-20 text-left">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-2.5 h-10 bg-[#6FD6A6] rounded-full"></div>
                                        <h3 className={`font-black text-[#0B3D2E] ${seniorMode ? 'text-5xl' : 'text-4xl'}`}>{t('BrowseDepartments')}</h3>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <p className={`text-gray-500 font-bold ml-6 ${bodyText}`}>{t('BrowseDepartmentsDesc')}</p>
                                    </div>
                                </div>

                                <DepartmentGrid onSelect={setSelectedDept} />
                            </section>

                        </>
                    ) : (
                        <div className="relative z-10 animate-in slide-in-from-right-8 duration-500 pt-10">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-slate-200/60 pb-6 mb-8">
                                <button
                                    onClick={() => setSelectedDept(null)}
                                    className="self-start sm:self-auto flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-[#0B3D2E] font-black transition-all shadow-sm"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" strokeWidth={3} />
                                    <span>{t('Back')}</span>
                                </button>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-3xl font-black text-[#0B3D2E] tracking-tight leading-none uppercase">{t(selectedDept.name)}</h2>
                                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-full border border-emerald-100 shadow-sm uppercase tracking-widest">
                                            {services.length} {t('Available')}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 font-bold mt-1 ml-1">{t('SelectCategory')}</p>
                                </div>
                            </div>

                            {loadingServices ? (
                                <div className="py-24 flex flex-col items-center justify-center">
                                    <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
                                    <p className="mt-6 text-gray-500 font-black uppercase tracking-widest animate-pulse">{t('FetchingServices')}</p>
                                </div>
                            ) : fetchError ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center bg-red-50/50 rounded-[40px] border-2 border-dashed border-red-200">
                                    <Sparkles className="w-16 h-16 text-red-300 mb-4" />
                                    <h3 className="text-2xl font-black text-red-700">Error Fetching Services</h3>
                                    <p className="text-red-500">{fetchError}</p>
                                </div>
                            ) : services.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200">
                                    <Sparkles className="w-16 h-16 text-gray-300 mb-4" />
                                    <h3 className="text-2xl font-black text-gray-700">{t('NoServicesFound')}</h3>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {services.map((svc, idx) => (
                                        <div key={svc.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
                                            <ServiceCard service={svc} onSelect={handleServiceSelect} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>

                <footer className="px-12 py-4 bg-[#0B3D2E] text-white flex flex-col md:flex-row items-center justify-between gap-4 mt-auto">
                    <div className="flex items-center gap-8">
                        <p className="text-[10px] font-black tracking-widest opacity-60 uppercase">© 2026 JanSuvidha Municipal Council</p>
                        <div className="hidden md:block w-px h-4 bg-white/10"></div>
                        <p className="text-[10px] font-black tracking-widest opacity-60 uppercase">Kiosk ID: <span className="text-emerald-400">JS-DEL-042</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-emerald-400">System Online</span>
                    </div>
                </footer>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 20px; }
            `}</style>
        </div>
    );
}