import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, DocumentTextIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function RequestDetailModal({ isOpen, onClose, request, onApprove, onReject }) {
    const [actionState, setActionState] = useState(null); // 'approve' | 'reject' | null
    const [notes, setNotes] = useState('');

    if (!isOpen || !request) return null;

    const isPending = ['pending', 'in_review', 'doc_required'].includes(request.status);
    
    // Safety check - if already closed, don't show action buttons
    const canTakeAction = isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black text-slate-800">{request.id}</h2>
                            {request.urgency_flag && (
                                <span className="bg-rose-100 text-rose-700 font-bold uppercase tracking-widest text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <ExclamationTriangleIcon className="w-3 h-3" />
                                    Urgent Key
                                </span>
                            )}
                        </div>
                        <p className="text-sm font-semibold text-slate-500 mt-0.5">{request.service_name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                    
                    {/* Grid Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                <InformationCircleIcon className="w-4 h-4" /> Applicant Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Name</p>
                                    <p className="font-semibold text-slate-800 text-sm">{request.applicant_name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Contact Number</p>
                                    <p className="font-semibold text-slate-800 text-sm">{request.phone}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Submission Date</p>
                                    <p className="font-semibold text-slate-800 text-sm">{new Date(request.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2 z-10 relative">
                                <DocumentTextIcon className="w-4 h-4" /> Application Data
                            </h3>
                            <div className="space-y-4 z-10 relative">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Current Status</p>
                                    <p className="font-bold text-slate-800 text-sm uppercase tracking-wide">{request.status.replace('_', ' ')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Department</p>
                                    <p className="font-semibold text-slate-800 text-sm">{request.department}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">AI Intent Score</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${request.intent_confidence > 0.8 ? 'bg-emerald-500' : request.intent_confidence > 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                style={{ width: `${request.intent_confidence * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600">{(request.intent_confidence * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Extracted Form Data (Mock) */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Extracted Fields</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {request.extracted_data ? (
                                Object.entries(request.extracted_data).map(([key, val]) => (
                                    <div key={key}>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">{key.replace(/_/g, ' ')}</p>
                                        <p className="font-medium text-slate-700 text-sm break-words">{String(val)}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 text-sm text-slate-500 font-medium p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                    Standard document package attached. Full OCR data pending extraction.
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Footer / Actions */}
                <div className="px-6 py-5 border-t border-slate-200 bg-white shrink-0">
                    {!canTakeAction && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                            <p className="text-sm font-bold text-slate-600">This request has already been processed and closed.</p>
                        </div>
                    )}

                    {canTakeAction && !actionState && (
                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-end">
                            <button 
                                onClick={() => setActionState('reject')}
                                className="w-full sm:w-auto px-6 py-3 border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 font-bold rounded-xl transition-all"
                            >
                                Reject Request
                            </button>
                            <button 
                                onClick={() => setActionState('approve')}
                                className="w-full sm:w-auto px-6 py-3 border border-transparent shadow-[0_4px_10px_rgba(16,185,129,0.3)] text-white bg-emerald-500 hover:bg-emerald-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                                <CheckCircleIcon className="w-5 h-5" /> Approve Request
                            </button>
                        </div>
                    )}

                    {canTakeAction && actionState && (
                        <div className="animate-in slide-in-from-bottom-2 space-y-4">
                            <div className={`p-4 rounded-xl border ${actionState === 'approve' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${actionState === 'approve' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                    Optional Adjudication Notes
                                </label>
                                <textarea 
                                    className="w-full border border-slate-200 bg-white rounded-lg p-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    rows={3}
                                    placeholder={actionState === 'approve' ? 'E.g., All documents verified properly...' : 'E.g., Missing address proof doc...'}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            
                            <div className="flex items-center gap-3 justify-end">
                                <button 
                                    onClick={() => { setActionState(null); setNotes(''); }}
                                    className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        if (actionState === 'approve') onApprove(request.id, notes);
                                        else onReject(request.id, notes);
                                    }}
                                    className={`px-6 py-2.5 font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 ${
                                        actionState === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    {actionState === 'approve' ? (
                                        <><CheckIcon className="w-5 h-5" /> Confirm Approval</>
                                    ) : (
                                        <><XMarkIcon className="w-5 h-5" /> Confirm Rejection</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
