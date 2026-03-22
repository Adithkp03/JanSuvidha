import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatDate, daysAgo } from '../utils/date';
import { MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const PRIORITY_BADGES = {
    NORMAL: 'bg-slate-700 text-slate-300',
    HIGH: 'bg-amber-500 text-amber-950 font-bold',
    URGENT: 'bg-red-500 text-white font-extrabold animate-pulse'
};

const STATUS_MAP = {
    draft: "Draft",
    submitted: "Submitted",
    pending: "Pending",
    under_review: "Under Review",
    doc_required: "Docs Needed",
    payment_pending: "Payment Pending",
    completed: "Completed",
    approved: "Approved",
    rejected: "Rejected"
};

// Read citizen submissions from the cross-session localStorage bridge
const getLocalSubmissions = () => {
    try {
        return JSON.parse(localStorage.getItem('jan-citizen-submissions') || '[]');
    } catch { return []; }
};

export default function LiveRequestsTable({ onRowClick, refreshTrigger }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const computePriority = (req) => {
        let priority = req.priority || 'NORMAL';
        const age = daysAgo(req.created_at);
        if (age > 7 && req.status !== 'completed' && req.status !== 'approved') priority = 'URGENT';
        else if (age > 3 && req.status !== 'completed' && req.status !== 'approved') priority = 'HIGH';
        return priority;
    };

    const sortByPriority = (data) => {
        return data.sort((a, b) => {
            const pVal = p => p === 'URGENT' ? 3 : p === 'HIGH' ? 2 : 1;
            return pVal(b.computed_priority) - pVal(a.computed_priority);
        });
    };

    const fetchRequests = async () => {
        try {
            const resp = await api.get('/admin/requests');
            let data = resp.data.requests || [];
            data = data.map(req => ({ ...req, computed_priority: computePriority(req) }));

            // Also merge in local submissions that might not have reached the backend yet
            const localSubs = getLocalSubmissions().map(s => ({
                ...s,
                computed_priority: computePriority(s),
            }));
            // Deduplicate by id
            const ids = new Set(data.map(r => r.id));
            const merged = [...data, ...localSubs.filter(s => !ids.has(s.id))];

            setRequests(sortByPriority(merged));
        } catch (err) {
            console.error("Failed fetching live requests from API, falling back to local data", err);
            // Fallback: show locally-bridged citizen submissions
            const localSubs = getLocalSubmissions().map(s => ({
                ...s,
                computed_priority: computePriority(s),
            }));
            setRequests(sortByPriority(localSubs));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;
        setLoading(true);
        fetchRequests();

        // Polling
        const interval = setInterval(() => {
            if (active) fetchRequests();
        }, 5000);

        // Listen for cross-tab storage events (real-time updates when citizen submits in another tab)
        const handleStorage = (e) => {
            if (e.key === 'jan-citizen-submissions') fetchRequests();
        };
        window.addEventListener('storage', handleStorage);

        return () => { active = false; clearInterval(interval); window.removeEventListener('storage', handleStorage); };
    }, [refreshTrigger]);

    if (loading && requests.length === 0) return <div className="py-20 text-center text-slate-500">Loading live data...</div>;

    return (
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden mt-6">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#0f172a] text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-700/50">
                            <th className="px-6 py-4">Request ID</th>
                            <th className="px-6 py-4">Applicant</th>
                            <th className="px-6 py-4">Service</th>
                            <th className="px-6 py-4">Priority</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Submitted</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {requests.map(req => (
                            <tr
                                key={req.id}
                                onClick={() => onRowClick(req)}
                                className="hover:bg-[#334155]/50 transition-colors cursor-pointer text-slate-300"
                            >
                                <td className="px-6 py-4 font-mono text-xs">{(req.id || '').substring(0, 12)}...</td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-white block">{req.applicant_name || 'Citizen'}</span>
                                    <span className="text-xs text-slate-500">{req.user_email || req.phone || ''}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-white block">{req.service_name || req.service?.name || req.service_type || 'Unknown Service'}</span>
                                    <span className="text-xs text-slate-500">{req.department || ''}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] px-2 py-1 rounded uppercase tracking-wider ${PRIORITY_BADGES[req.computed_priority]}`}>
                                        {req.computed_priority === 'URGENT' && <ExclamationTriangleIcon className="w-3 h-3 inline mr-1 -mt-0.5" />}
                                        {req.computed_priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                     ${req.status === 'completed' || req.status === 'approved' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' :
                                            req.status === 'rejected' ? 'bg-red-900/50 text-red-400 border border-red-800' :
                                                req.status === 'payment_pending' || req.status === 'doc_required' ? 'bg-amber-900/50 text-amber-400 border border-amber-800' :
                                                    'bg-slate-800 text-slate-300 border border-slate-600'
                                        }`}>
                                        {STATUS_MAP[req.status] || req.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-400">
                                    {formatDate(req.created_at)}
                                </td>
                            </tr>
                        ))}
                        {requests.length === 0 && (
                            <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No active requests found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
