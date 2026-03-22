import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheckIcon, CheckBadgeIcon, ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { Accessibility, User, LogOut } from 'lucide-react';
import api from '../../services/api';
import useStore from '../../store/useStore';
import useSpeakAloud from '../../hooks/useSpeakAloud';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import LanguageSelector from '../../components/LanguageSelector';
import AppLogo from '@/assets/logo.png';

/** Matches DynamicForm: #0B3D2E page, white rounded card, green CTAs, info blue panel */
export default function PaymentPage() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [requestData, setRequestData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const seniorMode = useStore((s) => s.seniorMode);
    const setSeniorMode = useStore((s) => s.setSeniorMode);
    const user = useStore((s) => s.user);
    const { speak } = useSpeakAloud();

    useEffect(() => {
        let active = true;
        const fetchRequest = async () => {
            try {
                const resp = await api.get(`/requests/${id}`);
                const data = resp.data?.request || resp.data;
                const fullData = data ? { ...data, payments: resp.data?.payments || [] } : null;
                if (active) setRequestData(fullData);
            } catch (err) {
                console.error(err);
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchRequest();
        return () => active = false;
    }, [id]);

    const pendingPayment = requestData?.payments?.find(p => p.status === 'pending') || null;
    const amountInRupees = pendingPayment?.amount_paise ? pendingPayment.amount_paise / 100 : 0;

    useEffect(() => {
        if (seniorMode && amountInRupees > 0) {
            speak(`${t('SecurePayment')}. ${t('AmountDue')}: ${amountInRupees} ${t('Rupees')}. Please scan the QR code using any UPI app like G-Pay, PhonePe, Paytm, or BHIM. Or click the Simulate Success button below to proceed.`);
        }
    }, [seniorMode, amountInRupees]);

    useEffect(() => {
        if (!loading && requestData && !pendingPayment) {
            navigate(`/citizen/receipt/${id}`, { replace: true });
        }
    }, [loading, requestData, pendingPayment, navigate, id]);

    const handlePaymentClick = () => {
        if (seniorMode) {
            setShowConfirm(true);
        } else {
            handleUPIPayment();
        }
    };

    const handleUPIPayment = async () => {
        if (!pendingPayment) return;
        setShowConfirm(false);
        setProcessingPayment(true);
        try {
            await api.post('/payments/webhook', {
                payment_id: pendingPayment.id,
                status: 'succeeded',
                gateway_ref: `UPI-${Math.floor(Math.random() * 1000000000)}`
            });
            setTimeout(() => {
                navigate(`/citizen/receipt/${id}`, { replace: true });
            }, 800);
        } catch (err) {
            console.error("Payment failed", err);
            alert("Payment simulation failed.");
            setProcessingPayment(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B3D2E] flex flex-col items-center justify-center p-8">
                <div className="w-14 h-14 border-4 border-white/20 border-t-[#6FD6A6] rounded-full animate-spin" />
                <p className="mt-6 text-white/90 font-black text-lg animate-pulse">{t('CheckoutInit')}</p>
            </div>
        );
    }

    if (!requestData) {
        return (
            <div className="min-h-screen bg-[#0B3D2E] flex flex-col items-center justify-center p-8 text-center">
                <h2 className="text-2xl font-black text-white mb-2">{t('CheckoutError')}</h2>
                <p className="text-white/70 font-bold mb-8 max-w-md">{t('InvalidPaymentReq')}</p>
                <button
                    onClick={() => navigate('/citizen')}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#6FD6A6] text-[#0B3D2E] font-black rounded-2xl shadow-xl hover:bg-white transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5" /> {t('ReturnHome')}
                </button>
            </div>
        );
    }

    if (!pendingPayment) return null;

    return (
        <div className="min-h-screen bg-[#0B3D2E] font-sans selection:bg-[#6FD6A6]/30 overflow-x-hidden flex flex-col items-center justify-center p-4 md:p-8 relative">
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0F6B4A] rounded-full blur-[120px] opacity-40 pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#6FD6A6] rounded-full blur-[150px] opacity-10 pointer-events-none" />

            {showConfirm && (
                <ConfirmationDialog
                    onConfirm={handleUPIPayment}
                    onCancel={() => setShowConfirm(false)}
                />
            )}

            <div className="relative w-full max-w-[1200px] bg-white/95 backdrop-blur-xl rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/20 flex flex-col overflow-hidden">
                <header className="px-6 sm:px-12 py-6 sm:py-8 flex items-center justify-between border-b border-gray-100 relative shrink-0">
                    <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                        <button
                            type="button"
                            onClick={() => navigate('/citizen')}
                            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-[#0B3D2E] transition-all shrink-0"
                        >
                            <ArrowLeftIcon className="w-6 h-6" strokeWidth={3} />
                        </button>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={AppLogo} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="hidden sm:block min-w-0">
                            <h1 className="text-lg sm:text-xl font-black text-[#0B3D2E] tracking-tight leading-none uppercase truncate">JanSuvidha</h1>
                            <p className="text-[8px] sm:text-[10px] font-black text-[#0F6B4A]/60 tracking-[0.3em] uppercase mt-1">{t('Title')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <button
                            type="button"
                            onClick={() => setSeniorMode(!seniorMode)}
                            className={`hidden sm:flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl border-2 transition-all duration-300 ${seniorMode ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]' : 'bg-gray-50 border-transparent hover:border-emerald-200 text-gray-700'}`}
                        >
                            <Accessibility className={seniorMode ? 'animate-bounce' : ''} size={20} />
                            <span className={`font-black uppercase tracking-tight ${seniorMode ? 'text-base' : 'text-xs'}`}>{t('SeniorMode')}</span>
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
                                type="button"
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#0F6B4A]/10 flex items-center justify-center border-2 border-white shadow-md hover:bg-[#0F6B4A]/20 transition-all"
                            >
                                <User className="text-[#0B3D2E]" size={22} />
                            </button>
                            {showProfileMenu && (
                                <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100] animate-in fade-in slide-in-from-top-2">
                                    <div className="px-4 py-3 border-b border-gray-50 sm:hidden">
                                        <p className="text-xs font-black text-emerald-600 uppercase">Verified</p>
                                        <p className="font-bold text-[#0B3D2E]">{user?.name || t('Citizen')}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            useStore.getState().logout();
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

                <div className="flex flex-col md:flex-row flex-1 min-h-0">
                    {/* Summary — info blue strip like form mandate banner tone */}
                    <div className="md:w-[42%] bg-[#e8f0fe] p-8 md:p-10 lg:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#0F6B4A]/15">
                        <div>
                            <div className="flex items-center gap-2 mb-8 text-[#0B3D2E]">
                                <ShieldCheckIcon className="w-7 h-7 shrink-0" />
                                <span className="text-sm font-black tracking-widest uppercase">JanSuvidha Pay</span>
                            </div>
                            <p className="text-[#0F6B4A] font-black text-xs uppercase tracking-wider mb-2">{t('AmountDue')}</p>
                            <h2 className="text-4xl sm:text-5xl font-black text-[#0B3D2E] tracking-tight mb-8">
                                <span className="text-2xl sm:text-3xl text-[#0F6B4A]/70 mr-1">₹</span>{amountInRupees.toFixed(2)}
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between gap-4 text-sm pb-3 border-b border-[#0B3D2E]/10">
                                    <span className="text-[#0B3D2E]/70 font-bold shrink-0">{t('Service')}</span>
                                    <span className="font-black text-[#0B3D2E] text-right">{t(requestData.service_type.replace(/_/g, ' ').toUpperCase())}</span>
                                </div>
                                <div className="flex justify-between gap-4 text-sm pb-3 border-b border-[#0B3D2E]/10">
                                    <span className="text-[#0B3D2E]/70 font-bold shrink-0">{t('AppID')}</span>
                                    <span className="font-mono font-black text-[#0B3D2E]">{requestData.id.split('-')[0]}</span>
                                </div>
                                <div className="flex justify-between gap-4 text-sm">
                                    <span className="text-[#0B3D2E]/70 font-bold shrink-0">{t('FeeTarget')}</span>
                                    <span className="font-black text-[#0B3D2E] text-right capitalize">{requestData.department?.replace(/_/g, ' ')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center justify-center gap-2 text-[#0B3D2E]/60 mt-10 pt-8 border-t border-[#0B3D2E]/10">
                            <LockClosedIcon className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-wider">{t('SecureEnc')}</span>
                        </div>
                    </div>

                    {/* UPI */}
                    <div className="flex-1 p-8 md:p-10 lg:p-12 bg-white flex flex-col items-center justify-center text-center">
                        <div className="mb-6">
                            <h3 className="text-2xl font-black text-[#0B3D2E] mb-2">{t('ScanUPI')}</h3>
                            <p className="text-gray-500 text-sm max-w-sm mx-auto font-bold">{t('ScanUPIDesc')}</p>
                        </div>

                        <div className="relative group mb-8 cursor-pointer" onClick={handlePaymentClick}>
                            <div className="absolute -inset-1 bg-gradient-to-r from-[#0B3D2E] to-[#0F6B4A] rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-300" />
                            <div className="relative bg-white p-6 rounded-[2rem] border-2 border-[#0F6B4A]/25 shadow-xl">
                                <div className="p-2 rounded-xl">
                                    <QRCodeSVG
                                        value={`upi://pay?pa=adithkp03@oksbi&pn=JanSuvidha&am=${amountInRupees}&cu=INR`}
                                        size={200}
                                        level="H"
                                        includeMargin={true}
                                        fgColor="#0B3D2E"
                                    />
                                </div>
                                {processingPayment && (
                                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center z-10">
                                        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#0B3D2E] rounded-full animate-spin mb-3" />
                                        <p className="font-black text-[#0B3D2E] animate-pulse">{t('Confirming')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-6 opacity-80">
                            <span className="text-xs font-black text-slate-500">G-Pay</span>
                            <span className="text-xs font-black text-indigo-700">PhonePe</span>
                            <span className="text-xs font-black text-sky-600">Paytm</span>
                            <span className="text-xs font-black text-[#0B3D2E]">BHIM</span>
                        </div>

                        <button
                            type="button"
                            onClick={handlePaymentClick}
                            disabled={processingPayment}
                            className="w-full max-w-md px-8 py-4 font-black text-lg text-white bg-[#0B3D2E] hover:bg-[#0F6B4A] rounded-2xl shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-tight"
                        >
                            {processingPayment ? (
                                <span>{t('VerifyingPayment')}</span>
                            ) : (
                                <>
                                    {t('SimulateSuccess')}
                                    <CheckBadgeIcon className="w-6 h-6" />
                                </>
                            )}
                        </button>

                        <div className="mt-8 pt-6 border-t border-gray-100 w-full md:hidden flex items-center justify-center gap-2 text-gray-400">
                            <LockClosedIcon className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{t('SecureEncCheckout')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
