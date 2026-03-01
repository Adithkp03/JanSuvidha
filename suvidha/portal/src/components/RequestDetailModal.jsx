import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatDate } from '../utils/date';
import DocumentPreview from './DocumentPreview';
import { XMarkIcon, CheckCircleIcon, XCircleIcon, CurrencyRupeeIcon, DocumentMagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const STATUS_MAP = {
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    doc_required: "Docs Needed",
    payment_pending: "Payment Pending",
    completed: "Completed",
    approved: "Approved",
    rejected: "Rejected"
};

export default function RequestDetailModal({ request, onClose, onUpdate }) {
    const [loadingAction, setLoadingAction] = useState(false);
    const [localFraudFlag, setLocalFraudFlag] = useState(request?.fraud_flag ?? false);
    const [actionError, setActionError] = useState('');
    const [showDocs, setShowDocs] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [auditLogs, setAuditLogs] = useState([]);

    const [paymentAmount, setPaymentAmount] = useState(request?.service?.fee_amount || 0);
    const [paymentSession, setPaymentSession] = useState(null);

    useEffect(() => {
        if (request) setLocalFraudFlag(request.fraud_flag ?? false);
    }, [request?.id]);

    useEffect(() => {
        if (!request) return;
        let active = true;
        api.get(`/audit?request_id=${request.id}`).then(res => {
            if (active) setAuditLogs(res.data.logs || []);
        }).catch(err => console.log('Audit fallback due to endpoint absence in demo'));
        return () => active = false;
    }, [request]);

    if (!request) return null;
    const fraudFlag = localFraudFlag !== undefined ? localFraudFlag : request.fraud_flag;

    const docs = request.documents || [];

    const updateStatus = async (status, extras = {}) => {
        setLoadingAction(true);
        setActionError('');
        try {
            await api.patch(`/admin/requests/${request.id}`, { status, ...extras });
            onUpdate();
            if (status !== 'rejected') onClose();
        } catch (err) {
            setActionError(err.response?.data?.error || `Failed to update to ${status}`);
        } finally {
            setLoadingAction(false);
        }
    };

    const triggerPayment = async () => {
        if (paymentAmount <= 0) return setActionError('Amount must be > 0');
        setLoadingAction(true);
        setActionError('');
        try {
            const resp = await api.post('/payments', { request_id: request.id, amount: paymentAmount });
            setPaymentSession({ id: resp.data.payment_id, url: resp.data.checkout_url });
            // Also update status to payment_pending
            await api.patch(`/admin/requests/${request.id}`, { status: 'payment_pending' });
            onUpdate();
        } catch (err) {
            setActionError(err.response?.data?.error || 'Failed to trigger payment');
        } finally {
            setLoadingAction(false);
        }
    };

    const simulatePaymentSuccess = async () => {
        if (!paymentSession) return;
        setLoadingAction(true);
        try {
            await api.post('/payments/webhook', { payment_id: paymentSession.id, status: 'success' });
            await api.patch(`/admin/requests/${request.id}`, { status: 'completed' }); // Auto-complete
            onUpdate();
            onClose();
        } catch (err) {
            setActionError('Webhook simulation failed');
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-black/60 shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Request {request.id.substring(0, 8)}</h2>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${request.status === 'completed' || request.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                                {STATUS_MAP[request.status] || request.status}
                            </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-500">{request.service?.name || request.service_type || request.service_code}</p>
                        {fraudFlag && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800 mt-1">
                                <ExclamationTriangleIcon className="w-4 h-4" /> Fraud Flagged
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-800">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide flex flex-col md:flex-row gap-8">
                    {/* Left Col: Details */}
                    <div className="flex-1 space-y-8">

                        <div>
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Payload Data</h4>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {request.payload ? Object.keys(request.payload).map(key => (
                                    <div key={key}>
                                        <dt className="text-xs font-bold text-slate-400 uppercase">{key.replace(/_/g, ' ')}</dt>
                                        <dd className="font-medium text-slate-800 mt-0.5 break-words">{request.payload[key]?.toString() || '-'}</dd>
                                    </div>
                                )) : <p className="text-slate-500 italic text-sm">No payload data provided.</p>}
                            </dl>
                        </div>

                        <div>
                            <div className="flex justify-between items-end border-b border-slate-100 pb-2 mb-4">
                                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Documents ({docs.length})</h4>
                                {docs.length > 0 && (
                                    <button onClick={() => setShowDocs(true)} className="text-primary-600 text-sm font-bold hover:underline">Preview All Docs</button>
                                )}
                            </div>
                            {docs.length > 0 ? (
                                <ul className="space-y-3">
                                    {docs.map(doc => (
                                        <li key={doc.object_key} className="flex justify-between items-center p-3 rounded-xl border border-slate-200 bg-slate-50">
                                            <div>
                                                <p className="text-xs font-bold uppercase text-primary-600 mb-0.5">{doc.doc_type}</p>
                                                <p className="text-sm font-medium text-slate-700">{doc.filename || doc.object_key}</p>
                                            </div>
                                            <button onClick={() => setShowDocs(true)} className="p-2 hover:bg-white rounded border border-transparent shadow-sm hover:border-slate-300 text-slate-500 hover:text-primary-600 transition-all"><DocumentMagnifyingGlassIcon className="w-5 h-5" /></button>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="text-slate-400 italic text-sm">No documents attached.</p>}
                        </div>

                        {/* Audit Log / Timeline Mock */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Audit Timeline</h4>
                            <div className="space-y-4 border-l-2 border-slate-100 pl-4 py-2">
                                <div className="relative">
                                    <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white"></div>
                                    <p className="text-xs font-bold text-slate-700">Submitted via Kiosk</p>
                                    <p className="text-[10px] text-slate-400">{formatDate(request.created_at)}</p>
                                </div>
                                {auditLogs.length > 0 ? auditLogs.map((log, i) => (
                                    <div key={i} className="relative">
                                        <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-primary-400 border-2 border-white"></div>
                                        <p className="text-xs font-bold text-slate-700">{log.action}</p>
                                        <p className="text-[10px] text-slate-400">{formatDate(log.timestamp)}</p>
                                    </div>
                                )) : (
                                    <div className="relative">
                                        <div className="absolute -left-[21px] w-2.5 h-2.5 rounded-full bg-primary-400 border-2 border-white"></div>
                                        <p className="text-xs font-bold text-slate-700">Status updated to {STATUS_MAP[request.status]}</p>
                                        <p className="text-[10px] text-slate-400">Latest recorded action</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Right Col: Actions */}
                    <div className="md:w-72 flex-shrink-0 bg-slate-50 rounded-2xl p-6 border border-slate-200 h-fit space-y-6">
                        <h3 className="font-bold text-slate-800">Workflow Actions</h3>

                        {actionError && <p className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">{actionError}</p>}

                        <div className="space-y-3">
                            <button
                                disabled={loadingAction || request.status === 'approved' || request.status === 'completed'}
                                onClick={() => updateStatus('approved')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
                            >
                                <CheckCircleIcon className="w-5 h-5" /> Approve Request
                            </button>

                            <div className="border border-red-200 bg-white rounded-xl overflow-hidden focus-within:ring-2 ring-red-500">
                                <button
                                    disabled={loadingAction || request.status === 'rejected'}
                                    onClick={() => rejectReason ? updateStatus('rejected', { reason: rejectReason }) : setActionError('Provide a rejection reason')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 font-bold transition-colors disabled:opacity-50 border-b border-red-100"
                                >
                                    <XCircleIcon className="w-5 h-5" /> Reject Request
                                </button>
                                <input
                                    type="text"
                                    placeholder="Rejection reason..."
                                    value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                    className="w-full text-sm px-3 py-2 outline-none text-slate-700"
                                />
                            </div>

                            <button
                                disabled={loadingAction || request.status === 'doc_required'}
                                onClick={() => updateStatus('doc_required')}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 shadow-sm"
                            >
                                <DocumentMagnifyingGlassIcon className="w-5 h-5" /> Request More Docs
                            </button>

                            {/* Payment Segment */}
                            <div className="pt-4 border-t border-slate-200 mt-4 space-y-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Payment Handling</p>
                                {paymentSession ? (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                        <p className="text-xs font-bold text-blue-800 mb-2">Payment link generated.</p>
                                        <a href={paymentSession.url} target="_blank" rel="noreferrer" className="block w-full text-center px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded mb-2 hover:bg-blue-700">Open Gateway</a>
                                        <button onClick={simulatePaymentSuccess} className="w-full px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold rounded border border-blue-300">Simulate Success Webhook</button>
                                    </div>
                                ) : (
                                    <div className="flex bg-white border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 ring-primary-500">
                                        <span className="flex items-center justify-center px-3 text-slate-400 bg-slate-50 border-r border-slate-200 font-bold">₹</span>
                                        <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full px-3 py-2 outline-none text-sm font-semibold text-slate-800" />
                                        <button disabled={loadingAction || request.status === 'payment_pending'} onClick={triggerPayment} className="px-3 bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 disabled:opacity-50">Charge</button>
                                    </div>
                                )}
                            </div>

                            <button
                                disabled={loadingAction || request.status === 'completed'}
                                onClick={() => updateStatus('completed')}
                                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 text-slate-800 font-bold rounded-xl hover:bg-slate-300 transition-colors disabled:opacity-50"
                            >
                                Mark Completed
                            </button>

                            <div className="pt-4 border-t border-slate-200 mt-4">
                                <button
                                    disabled={loadingAction}
                                    onClick={async () => {
                                        setLoadingAction(true);
                                        const newVal = !fraudFlag;
                                        setLocalFraudFlag(newVal);
                                        try {
                                            await api.patch(`/admin/requests/${request.id}`, { fraud_flag: newVal });
                                            onUpdate();
                                        } catch (e) {
                                            setLocalFraudFlag(!newVal);
                                            setActionError(e.response?.data?.error || 'Failed');
                                        } finally { setLoadingAction(false); }
                                    }}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 font-bold rounded-xl transition-colors disabled:opacity-50 ${fraudFlag ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <ExclamationTriangleIcon className="w-5 h-5" />
                                    {fraudFlag ? 'Remove Fraud Flag' : 'Flag as Fraud / Misuse'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showDocs && <DocumentPreview docKeys={docs} onClose={() => setShowDocs(false)} />}
        </div>
    );
}
