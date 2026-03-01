import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircleIcon, PrinterIcon, CurrencyRupeeIcon, DocumentCheckIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/date';

export default function ReceiptPage({ requestData, isOffline }) {
    const navigate = useNavigate();

    if (!requestData) return <div className="text-center py-20 font-bold text-slate-500">No receipt data found.</div>;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-3xl mx-auto py-8 lg:py-12 px-4 sm:px-6 print:py-0 print:px-0 bg-slate-50/50 min-h-[80vh] flex flex-col items-center">

            {/* Confetti or Animation placeholder could go here */}

            {/* Receipt Ticket Container */}
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-indigo-500/10 border border-slate-200/60 overflow-hidden w-full relative print:shadow-none print:border-none print:w-full">

                {/* Animated Gradient Header */}
                <div className={`relative p-10 md:p-14 text-center overflow-hidden flex flex-col items-center justify-center ${isOffline ? 'bg-gradient-to-br from-amber-400 to-amber-600' : requestData.status === 'payment_pending' ? 'bg-gradient-to-br from-indigo-500 to-blue-700' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>

                    {/* Background embellishments */}
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-48 h-48 bg-black/10 rounded-full blur-2xl"></div>

                    <div className="relative z-10 animate-in zoom-in duration-500">
                        {isOffline ? (
                            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner border border-white/30">
                                <DocumentCheckIcon className="w-12 h-12 text-white drop-shadow-md" />
                            </div>
                        ) : requestData.status === 'payment_pending' ? (
                            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner border border-white/30">
                                <CurrencyRupeeIcon className="w-12 h-12 text-white drop-shadow-md" />
                            </div>
                        ) : (
                            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner border border-white/30">
                                <CheckCircleIcon className="w-14 h-14 text-white drop-shadow-md" />
                            </div>
                        )}

                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-sm mb-3">
                            {isOffline ? 'Application Queued!' : requestData.status === 'payment_pending' ? 'Payment Required' : 'Success!'}
                        </h2>

                        <p className="text-white/90 font-medium text-lg max-w-md mx-auto">
                            {isOffline
                                ? 'You are offline. It will be submitted automatically when connection restores.'
                                : requestData.status === 'payment_pending'
                                    ? 'Please complete the fee payment to process your application.'
                                    : 'Your civic request has been securely submitted and verified.'}
                        </p>
                    </div>
                </div>

                {/* Zigzag ticket separator (pure CSS visual) */}
                <div className="h-4 w-full bg-white relative -mt-2 rotate-180 print:hidden" style={{ backgroundImage: 'radial-gradient(circle at 10px 0, transparent 10px, white 11px)', backgroundSize: '20px 20px', backgroundRepeat: 'repeat-x' }}></div>

                {/* Receipt Details Body */}
                <div className="p-8 md:p-12">

                    <div className="flex flex-col md:flex-row items-center justify-between gap-10 border-b-2 border-dashed border-slate-200 pb-10 mb-10">
                        <div className="flex-1 w-full text-center md:text-left space-y-6">
                            <div>
                                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-2 drop-shadow-sm">Official Request ID</p>
                                <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter break-all bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                                    {requestData.id}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Service</p>
                                    <p className="font-extrabold text-slate-800 text-lg leading-tight">{requestData.service_code.replace(/_/g, ' ').toUpperCase()}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Timestamp</p>
                                    <p className="font-extrabold text-slate-800 text-base leading-tight">{formatDate(requestData.created_at || new Date().toISOString())}</p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive QR Box */}
                        <div className="p-6 bg-white rounded-[2rem] border-2 border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center shrink-0 w-48 h-48 transform rotate-1 hover:rotate-0 transition-transform duration-300">
                            <QRCodeSVG
                                value={JSON.stringify({ request_id: requestData.id })}
                                size={140}
                                level="Q"
                                fgColor="#0f172a"
                            />
                            <p className="text-[9px] font-black text-slate-400 mt-3 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-widest">Scan to Verify</p>
                        </div>
                    </div>

                    {/* Status Box */}
                    {requestData.status === 'payment_pending' ? (
                        <div className="bg-amber-50 rounded-2xl p-6 md:p-8 border-2 border-amber-200 flex flex-col md:flex-row items-center gap-6 justify-between transform transition-all hover:bg-amber-100/50">
                            <div className="text-center md:text-left">
                                <h4 className="font-black text-amber-800 text-xl mb-1">Pending Fee Payment</h4>
                                <p className="text-amber-700 font-medium max-w-sm">
                                    A fee is required for this service. Your request is currently awaiting payment confirmation.
                                </p>
                            </div>
                            <button onClick={() => navigate(`/citizen/payment/${requestData.id}`)} className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg hover:bg-amber-400 transition-colors shrink-0 outline-none focus:ring-4 focus:ring-amber-500/30">
                                Pay Now
                            </button>
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-3xl p-6 md:p-8 border border-slate-200 flex flex-col sm:flex-row sm:items-start gap-6">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
                                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-lg mb-2">Important Instructions</h4>
                                <ul className="text-slate-600 font-medium space-y-3">
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                                        <span>Please securely save the <strong>Request ID</strong> printed above for all future correspondence.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                                        <span>Track real-time status updates via the portal dashboard or SMS notifications.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 w-full md:w-auto px-4 print:hidden">
                <button
                    onClick={() => navigate('/citizen')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all hover:shadow-md outline-none focus:ring-4 focus:ring-slate-100"
                >
                    <HomeIcon className="w-5 h-5" /> Dashboard
                </button>
                <button
                    onClick={handlePrint}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-4 font-extrabold text-white bg-slate-900 hover:bg-slate-800 rounded-2xl transition-all shadow-xl hover:shadow-slate-900/40 outline-none focus:ring-4 focus:ring-slate-900/30"
                >
                    <PrinterIcon className="w-5 h-5" /> Print Receipt
                </button>
            </div>
        </div>
    );
}
