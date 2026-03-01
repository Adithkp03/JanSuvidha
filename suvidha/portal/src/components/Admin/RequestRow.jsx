import React from 'react';
import clsx from 'clsx';
import { formatSLARemaining } from '../../utils/priority';
import { ShieldExclamationIcon, DocumentTextIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

export default function RequestRow({ request, isSelected, toggleSelect, onAction, onViewDetails }) {

    // Safety check formatting
    const isUrgent = request.priority === 'URGENT';
    const isHigh = request.priority === 'HIGH';

    const rowClass = clsx(
        "cursor-pointer transition-colors border-b last:border-0 hover:shadow-md relative",
        isSelected ? "bg-indigo-50/50 border-indigo-200" : "bg-white border-slate-100 hover:bg-slate-50",
        isUrgent && !isSelected ? "bg-red-50/30 hover:bg-red-50/60" : ""
    );

    const statusColors = {
        pending: 'bg-amber-100 text-amber-800 border-amber-200',
        in_review: 'bg-blue-100 text-blue-800 border-blue-200',
        approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        rejected: 'bg-rose-100 text-rose-800 border-rose-200',
        doc_required: 'bg-purple-100 text-purple-800 border-purple-200'
    };

    const statusText = request.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN';

    return (
        <div className={rowClass} onClick={() => onViewDetails(request.id)}>
            <div className="flex items-center w-full px-4 py-3 sm:px-6">

                {/* Checkbox (Stop propagation so row click doesn't fire) */}
                <div className="pr-4" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(request.id)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600 cursor-pointer"
                    />
                </div>

                {/* ID & Dept Info */}
                <div className="w-1/4 min-w-[200px] flex flex-col pr-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900 tracking-tight font-mono whitespace-nowrap">
                            {request.id || request.receipt_number || 'REQ-UNKNOWN'}
                        </span>
                        {request.fraud_flags?.length > 0 && (
                            <ShieldExclamationIcon className="w-4 h-4 text-rose-500 animate-pulse" title="Fraud Warning" />
                        )}
                        {request.documents?.length > 0 && (
                            <DocumentTextIcon className="w-4 h-4 text-slate-400" title="Has Documents" />
                        )}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 mt-0.5 truncate uppercase tracking-widest">
                        {request.department || 'Unknown Dept'}
                    </span>
                    <span className="text-sm font-semibold text-slate-700 truncate">
                        {request.service_name || request.service_type || 'General Request'}
                    </span>
                </div>

                {/* Applicant */}
                <div className="w-1/4 hidden md:flex flex-col pr-4">
                    <span className="text-sm font-bold text-slate-800 truncate">
                        {request.applicant_name || 'Anonymous'}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                        {request.phone || request.email || 'No contact'}
                    </span>
                </div>

                {/* Priority & SLA */}
                <div className="w-1/6 hidden lg:flex flex-col pr-4 items-start">
                    <span className={clsx(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm mb-1 shadow-sm border",
                        isUrgent ? "bg-red-100 text-red-800 border-red-200" :
                            isHigh ? "bg-amber-100 text-amber-800 border-amber-200" :
                                "bg-slate-100 text-slate-700 border-slate-200"
                    )}>
                        {request.priority || 'NORMAL'}
                    </span>
                    {request.slaRemainingMs !== undefined && (
                        <span className={clsx(
                            "text-xs font-bold leading-none",
                            request.slaRemainingMs < 0 ? "text-red-600" : "text-slate-500"
                        )}>
                            {formatSLARemaining(request.slaRemainingMs)}
                        </span>
                    )}
                </div>

                {/* Status */}
                <div className="w-1/6 flex items-center pr-4">
                    <span className={clsx("px-2.5 py-1 text-xs font-bold rounded-full border shadow-sm", statusColors[request.status] || "bg-slate-100 text-slate-600 border-slate-200")}>
                        {statusText}
                    </span>
                </div>

                {/* Quick Actions */}
                <div className="flex-1 flex justify-end gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                    {request.status === 'pending' || request.status === 'in_review' ? (
                        <>
                            <button
                                onClick={() => onAction('approve', request.id)}
                                className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 font-bold text-xs rounded-lg shadow-sm transition-all focus-ring"
                                title="Quick Approve"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => onAction('reject', request.id)}
                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 font-bold text-xs rounded-lg shadow-sm transition-all focus-ring"
                                title="Quick Reject"
                            >
                                Reject
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center text-slate-400 gap-1 opacity-60">
                            <CheckBadgeIcon className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Closed</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
