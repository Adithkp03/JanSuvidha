import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationCircleIcon, ClipboardDocumentCheckIcon, ShieldCheckIcon, DocumentTextIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import DocumentPreview from './DocumentPreview';

export default function RequestDetailModal({ isOpen, onClose, request, onApprove, onReject, onTriggerPayment }) {
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    if (!request) return null;

    const handleReject = () => {
        if (!rejectReason.trim()) return;
        onReject(request.id, rejectReason);
        setIsRejecting(false);
        setRejectReason('');
    };

    const statusColors = {
        pending: 'bg-amber-100 text-amber-800 border-amber-200',
        in_review: 'bg-blue-100 text-blue-800 border-blue-200',
        approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        rejected: 'bg-rose-100 text-rose-800 border-rose-200',
        doc_required: 'bg-purple-100 text-purple-800 border-purple-200'
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto custom-scrollbar">
                    <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-8"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-8"
                        >
                            <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-2xl transition-all border border-slate-200 flex flex-col max-h-[90vh]">

                                {/* Header */}
                                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                            Application #{request.id || request.receipt_number}
                                        </h3>
                                        <span className={clsx("px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded border shadow-sm", statusColors[request.status] || "bg-slate-100 text-slate-600 border-slate-200")}>
                                            {request.status?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                                            <XMarkIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Scrollable content body */}
                                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar">

                                    {request.fraud_flags?.length > 0 && (
                                        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 shadow-sm">
                                            <ExclamationCircleIcon className="w-6 h-6 text-rose-600 flex-shrink-0" />
                                            <div>
                                                <h4 className="text-sm font-bold text-rose-900">Fraud Prevention System Warning</h4>
                                                <ul className="mt-2 space-y-1">
                                                    {request.fraud_flags.map((f, i) => (
                                                        <li key={i} className="text-xs text-rose-700 list-disc list-inside">{f.reason}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                        {/* Left Col: Metadata & Toggles */}
                                        <div className="lg:col-span-1 space-y-6">
                                            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Applicant Data</h4>
                                                <dl className="space-y-3 text-sm">
                                                    <div><dt className="text-slate-500 font-medium">Name</dt><dd className="font-bold text-slate-800">{request.applicant_name}</dd></div>
                                                    <div><dt className="text-slate-500 font-medium">Phone</dt><dd className="font-bold text-slate-800">{request.phone}</dd></div>
                                                    <div><dt className="text-slate-500 font-medium">Department</dt><dd className="font-bold text-slate-800">{request.department}</dd></div>
                                                    <div><dt className="text-slate-500 font-medium">Service</dt><dd className="font-bold text-slate-800">{request.service_name || request.service_type}</dd></div>
                                                    <div><dt className="text-slate-500 font-medium">Submitted</dt><dd className="font-bold text-slate-800">{new Date(request.created_at).toLocaleString()}</dd></div>
                                                </dl>
                                            </div>

                                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Raw JSON Payload</h4>
                                                </div>
                                                <div className="p-4 bg-slate-900 text-emerald-400 max-h-64 overflow-y-auto text-xs font-mono custom-scrollbar">
                                                    <pre>{JSON.stringify(request.payload || request, null, 2)}</pre>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Col: Documents Viewer */}
                                        <div className="lg:col-span-2 flex flex-col gap-6">
                                            {request.documents?.map((doc, idx) => (
                                                <div key={idx} className="bg-white rounded-2xl outline outline-1 outline-slate-200 shadow-sm overflow-hidden flex flex-col">
                                                    <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                                                        <DocumentTextIcon className="w-5 h-5 text-indigo-500" />
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-800">{doc.doc_type || doc.name || `Attachment ${idx + 1}`}</h4>
                                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">File verification required</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4">
                                                        <DocumentPreview
                                                            url={doc.signed_url || doc.url}
                                                            fileType={doc.file_type || 'application/pdf'}
                                                            ocrText={doc.ocr_text}
                                                            validationResult={doc.validation_status}
                                                        />
                                                    </div>
                                                </div>
                                            ))}

                                            {(!request.documents || request.documents.length === 0) && (
                                                <div className="bg-white rounded-2xl outline outline-1 outline-slate-200 p-12 text-center shadow-sm">
                                                    <DocumentTextIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                                    <p className="text-slate-500 font-bold">No documents attached to this request.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="px-6 py-4 bg-white border-t border-slate-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] flex items-center justify-between">

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onTriggerPayment(request.id, 500)} // Example fee
                                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors border border-slate-200 shadow-sm"
                                        >
                                            <CreditCardIcon className="w-4 h-4" /> Issue Payment Link
                                        </button>
                                        <button className="hidden sm:flex flex-row items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors border border-slate-200 shadow-sm">
                                            <ShieldCheckIcon className="w-4 h-4" /> Toggle Fraud Flag
                                        </button>
                                    </div>

                                    <div className="flex gap-3 w-full sm:w-auto">
                                        {isRejecting ? (
                                            <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                                                <input
                                                    type="text"
                                                    placeholder="Reason for rejection..."
                                                    value={rejectReason}
                                                    onChange={e => setRejectReason(e.target.value)}
                                                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-[200px]"
                                                    autoFocus
                                                />
                                                <button onClick={handleReject} disabled={!rejectReason.trim()} className="px-4 py-2 bg-rose-600 text-white hover:bg-rose-700 font-bold text-sm rounded-xl shadow-md disabled:opacity-50 transition-colors">Confirm Reject</button>
                                                <button onClick={() => setIsRejecting(false)} className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 font-bold text-sm rounded-xl transition-colors">Cancel</button>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setIsRejecting(true)}
                                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-sm rounded-xl transition-colors border border-rose-200 shadow-sm"
                                                >
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => onApprove(request.id)}
                                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-sm rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all border border-indigo-500"
                                                >
                                                    <ClipboardDocumentCheckIcon className="w-5 h-5" />
                                                    Approve Application
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
