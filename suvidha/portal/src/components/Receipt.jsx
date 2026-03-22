import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircleIcon, PrinterIcon, CurrencyRupeeIcon, DocumentCheckIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/date';
import { downloadBridgeExport } from '../utils/citizenBridge';
import logoSrc from '@/assets/logo.png';

/** Citizen flow theme: #0B3D2E page, white rounded card (same as DynamicForm) */
export default function ReceiptPage({ requestData, isOffline }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    if (!requestData) return <div className="text-center py-20 font-bold text-white/80">No receipt data found.</div>;

    const handlePrint = () => {
        window.print();
    };

    const isPaymentPending = requestData.status === 'payment_pending';

    return (
        <div className="min-h-screen bg-[#0B3D2E] font-sans selection:bg-[#6FD6A6]/30 overflow-x-hidden flex flex-col items-center justify-center p-4 md:p-8 relative print:bg-white">
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0F6B4A] rounded-full blur-[120px] opacity-40 pointer-events-none print:hidden" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#6FD6A6] rounded-full blur-[150px] opacity-10 pointer-events-none print:hidden" />

            <div className="relative w-full max-w-[900px] print:max-w-none">
                <div className="bg-white/95 backdrop-blur-xl rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden print:shadow-none print:rounded-none print:border print:border-gray-200">
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-8 sm:px-12 py-6 sm:py-8 border-b border-gray-100 bg-white">
                        <img src={logoSrc} alt="JanSuvidha" className="h-10 sm:h-12 w-auto object-contain" />
                        <span className="text-[10px] sm:text-xs font-black text-[#0F6B4A]/60 uppercase tracking-[0.25em]">{t('DigitalReceiptLabel')}</span>
                    </div>

                    {/* Status — green gradient only (no blue/slate) */}
                    <div
                        className={`relative px-8 sm:px-12 pt-10 pb-10 text-center overflow-hidden ${
                            isOffline || isPaymentPending
                                ? 'bg-gradient-to-br from-amber-500 to-amber-800 text-white'
                                : 'bg-gradient-to-br from-[#0B3D2E] via-[#0B3D2E] to-[#0F6B4A] text-white'
                        }`}
                    >
                        <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(circle_at_30%_20%,rgba(111,214,166,0.5),transparent_50%)]" />
                        <div className="relative z-10">
                            {isOffline ? (
                                <div className="w-20 h-20 bg-white/15 rounded-full flex items-center justify-center mb-5 mx-auto border border-white/25">
                                    <DocumentCheckIcon className="w-10 h-10 text-amber-50" />
                                </div>
                            ) : isPaymentPending ? (
                                <div className="w-20 h-20 bg-white/15 rounded-full flex items-center justify-center mb-5 mx-auto border border-white/25">
                                    <CurrencyRupeeIcon className="w-10 h-10 text-amber-50" />
                                </div>
                            ) : (
                                <div className="w-20 h-20 bg-[#6FD6A6]/25 rounded-full flex items-center justify-center mb-5 mx-auto border border-[#6FD6A6]/40">
                                    <CheckCircleIcon className="w-12 h-12 text-[#6FD6A6]" />
                                </div>
                            )}
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                                {isOffline ? 'Application Queued!' : isPaymentPending ? 'Payment Required' : 'Success!'}
                            </h2>
                            <p className="text-white/90 font-bold text-sm md:text-base max-w-md mx-auto">
                                {isOffline
                                    ? 'You are offline. It will be submitted automatically when connection restores.'
                                    : isPaymentPending
                                      ? 'Please complete the fee payment to process your application.'
                                      : 'Your civic request has been securely submitted and verified.'}
                            </p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-8 sm:px-12 py-8 md:py-10 bg-white">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-10 border-b-2 border-dashed border-gray-200 pb-10 mb-10">
                            <div className="flex-1 w-full text-center md:text-left space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-[#0F6B4A]/60 uppercase tracking-[0.2em] mb-2">Official Request ID</p>
                                    <p className="text-2xl md:text-3xl font-black text-[#0B3D2E] tracking-tight break-all">{requestData.id}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <div className="bg-gray-50/80 rounded-[24px] p-4 border border-gray-100">
                                        <p className="text-[10px] font-black text-[#0F6B4A]/60 uppercase tracking-widest mb-1">Service</p>
                                        <p className="font-black text-[#0B3D2E] text-sm leading-tight">
                                            {(requestData.service_code || requestData.service_type || 'Service').replace(/_/g, ' ').toUpperCase()}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50/80 rounded-[24px] p-4 border border-gray-100">
                                        <p className="text-[10px] font-black text-[#0F6B4A]/60 uppercase tracking-widest mb-1">Timestamp</p>
                                        <p className="font-black text-[#0B3D2E] text-sm leading-tight">
                                            {formatDate(requestData.created_at || new Date().toISOString())}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 bg-white rounded-[28px] border-2 border-[#0F6B4A]/20 shadow-lg flex flex-col items-center justify-center shrink-0 w-52 h-52">
                                <QRCodeSVG value={JSON.stringify({ request_id: requestData.id })} size={120} level="Q" fgColor="#0B3D2E" />
                                <p className="text-[9px] font-black text-[#0B3D2E] mt-3 border border-[#0F6B4A]/25 px-3 py-1 rounded-full uppercase tracking-widest bg-[#6FD6A6]/10">
                                    Scan to Verify
                                </p>
                            </div>
                        </div>

                        {isPaymentPending ? (
                            <div className="bg-amber-50 rounded-[28px] p-6 md:p-8 border border-amber-200 flex flex-col md:flex-row items-center gap-6 justify-between">
                                <div className="text-center md:text-left">
                                    <h4 className="font-black text-amber-900 text-lg mb-1">Pending Fee Payment</h4>
                                    <p className="text-amber-900/80 font-bold max-w-sm text-sm">
                                        A fee is required for this service. Your request is currently awaiting payment confirmation.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigate(`/citizen/payment/${requestData.id}`)}
                                    className="px-8 py-4 bg-amber-600 text-white font-black rounded-2xl shadow-lg hover:bg-amber-500 transition-colors shrink-0"
                                >
                                    Pay Now
                                </button>
                            </div>
                        ) : (
                            <div className="rounded-[28px] p-6 md:p-8 border border-gray-100 bg-[#e8f0fe]/60 flex flex-col sm:flex-row sm:items-start gap-5">
                                <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100">
                                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-black text-[#0B3D2E] text-base mb-2">Important Instructions</h4>
                                    <ul className="text-gray-600 font-bold space-y-2 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#0F6B4A] mt-2 shrink-0" />
                                            <span>
                                                Please securely save the <strong className="text-[#0B3D2E]">Request ID</strong> above for all future correspondence.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#0F6B4A] mt-2 shrink-0" />
                                            <span>Track real-time status updates via the portal dashboard or SMS notifications.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row flex-wrap justify-center gap-4 w-full print:hidden">
                    <button
                        type="button"
                        onClick={() => navigate('/citizen')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 font-black text-white bg-white/10 hover:bg-white/20 border border-white/30 rounded-2xl backdrop-blur-sm transition-all"
                    >
                        <HomeIcon className="w-5 h-5" /> Dashboard
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-10 py-4 font-black text-[#0B3D2E] bg-[#6FD6A6] hover:bg-white rounded-2xl shadow-xl transition-all"
                    >
                        <PrinterIcon className="w-5 h-5" /> Print Receipt
                    </button>
                    <button
                        type="button"
                        onClick={downloadBridgeExport}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 font-black text-[#0B3D2E] bg-white/90 hover:bg-white border border-[#0F6B4A]/30 rounded-2xl shadow-lg transition-all text-sm"
                        title="Download submissions JSON for import on the admin device when the API is offline"
                    >
                        Export for admin (JSON)
                    </button>
                </div>
            </div>
        </div>
    );
}
