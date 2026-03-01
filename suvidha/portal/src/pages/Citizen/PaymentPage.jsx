import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheckIcon, CurrencyRupeeIcon, CheckBadgeIcon, ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

export default function PaymentPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [requestData, setRequestData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(false);

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

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 font-bold animate-pulse">Initializing Secure Checkout...</p>
        </div>
    );

    if (!requestData) return (
        <div className="text-center py-20 min-h-[50vh] flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Checkout Error</h2>
            <p className="text-slate-500 mb-6">Invalid or expired payment request.</p>
            <button onClick={() => navigate('/citizen')} className="text-primary-600 font-bold flex items-center gap-2 hover:underline">
                <ArrowLeftIcon className="w-4 h-4" /> Return Home
            </button>
        </div>
    );

    const pendingPayment = requestData.payments?.find(p => p.status === 'pending');

    if (!pendingPayment) {
        navigate(`/citizen/receipt/${id}`, { replace: true });
        return null;
    }

    const handleUPIPayment = async () => {
        setProcessingPayment(true);
        try {
            await api.post('/payments/webhook', {
                payment_id: pendingPayment.id,
                status: 'succeeded',
                gateway_ref: `UPI-${Math.floor(Math.random() * 1000000000)}`
            });
            setTimeout(() => {
                navigate(`/citizen/receipt/${id}`, { replace: true });
            }, 800); // Small delay for UX transition
        } catch (err) {
            console.error("Payment failed", err);
            alert("Payment simulation failed.");
            setProcessingPayment(false);
        }
    };

    const amountInRupees = pendingPayment.amount_paise / 100;

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="glass-card rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-200/60 bg-white">

                {/* Left Side: Order Summary */}
                <div className="bg-slate-50 p-8 md:p-12 md:w-5/12 border-b md:border-b-0 md:border-r border-slate-200/60 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-50"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-10 text-primary-700">
                            <ShieldCheckIcon className="w-6 h-6" />
                            <span className="text-sm font-black tracking-widest uppercase">JanSuvidha Pay</span>
                        </div>

                        <p className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">Amount Due</p>
                        <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-8">
                            <span className="text-3xl text-slate-400 mr-1">₹</span>{amountInRupees.toFixed(2)}
                        </h2>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Service</span>
                                <span className="font-bold text-slate-800 text-right">{requestData.service_type.replace(/_/g, ' ').toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Application ID</span>
                                <span className="font-mono font-bold text-slate-600">{requestData.id.split('-')[0]}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Fee Target</span>
                                <span className="font-bold text-slate-800">{requestData.department}</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 hidden md:block mt-8 pt-8 border-t border-slate-200">
                        <div className="flex items-center gap-2 text-slate-500 justify-center">
                            <LockClosedIcon className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">256-bit Secure Encryption</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Payment Action */}
                <div className="p-8 md:p-12 md:w-7/12 bg-white flex flex-col items-center justify-center text-center">

                    <div className="mb-8">
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Scan with any UPI App</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto">Open Google Pay, PhonePe, Paytm, or BHIM to complete this transaction securely.</p>
                    </div>

                    <div className="relative group mb-10 cursor-pointer" onClick={handleUPIPayment}>
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-indigo-400 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500 group-hover:duration-200"></div>
                        <div className="relative bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-xl transform transition-transform duration-300 group-hover:scale-[1.02]">
                            <div className="p-2 bg-white rounded-xl">
                                <QRCodeSVG
                                    value={`upi://pay?pa=adithkp03@oksbi&pn=JanSuvidha&am=${amountInRupees}&cu=INR`}
                                    size={200}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            {processingPayment && (
                                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-10 animate-in fade-in">
                                    <div className="w-10 h-10 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin mb-3"></div>
                                    <p className="font-bold text-primary-700 animate-pulse">Confirming...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full flex flex-col items-center">
                        <div className="flex items-center gap-4 mb-6 opacity-60">
                            {/* Mock UPI app logos */}
                            <div className="text-xs font-black italic tracking-tighter">G-Pay</div>
                            <div className="text-xs font-black italic tracking-tighter text-indigo-800">PhonePe</div>
                            <div className="text-xs font-black italic tracking-tighter text-sky-600">Paytm</div>
                            <div className="text-xs font-black italic tracking-tighter text-green-700">BHIM</div>
                        </div>

                        <button
                            onClick={handleUPIPayment}
                            disabled={processingPayment}
                            className="w-full px-8 py-4 font-extrabold text-white bg-slate-900 hover:bg-primary-600 rounded-xl transition-all shadow-lg hover:shadow-primary-500/30 disabled:opacity-50 text-lg flex items-center justify-center gap-3 relative overflow-hidden group"
                        >
                            {processingPayment ? (
                                <span>Verifying Payment</span>
                            ) : (
                                <>
                                    Simulate Payment Success
                                    <CheckBadgeIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 w-full md:hidden">
                        <div className="flex items-center gap-2 text-slate-400 justify-center">
                            <LockClosedIcon className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Secure Encrypted Checkout</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
