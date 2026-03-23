import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAdminStore from '../../store/adminStore';
import useStore from '../../store/useStore';
import { AdminServices } from '../../services/adminApi';
import { calculatePriority } from '../../utils/priority';
import { detectFraudFlags } from '../../utils/fraud';

import AnalyticsPanel from '../../components/Admin/AnalyticsPanel';
import LiveRequestsTable from '../../components/Admin/LiveRequestsTable';
import RequestDetailModal from '../../components/Admin/RequestDetailModal';
import seedData from '../../../seed/admin-seed.json'; // Fallback demo data
import { normalizeRequestRow } from '../../utils/normalizeRequestRow';

export default function AdminDashboard() {
    const queryClient = useQueryClient();
    const { isPolling, pollingInterval, filters, setFilter, clearFilters, setPolling } = useAdminStore();
    const { offlineQueue } = useStore();

    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [page, setPage] = useState(1);
    const limit = 20;

    // 1. Fetch KPI / Analytics Data
    const { data: metricsData } = useQuery({
        queryKey: ['adminMetrics'],
        queryFn: async () => {
            try { return await AdminServices.getMetrics(); }
            catch { return seedData.metrics; } // Fallback for pure demo
        },
        refetchInterval: isPolling ? 30000 : false
    });

    // 2. Fetch Live Requests safely
    const { data: requestsData, isLoading, isFetching } = useQuery({
        queryKey: ['adminRequests', page, filters, offlineQueue.length],
        queryFn: async () => {
            try {
                const res = await AdminServices.getRequests({ page, limit, ...filters });
                // API gateway returns { requests: [...] }
                let docs = Array.isArray(res) ? res : (res?.requests || res?.data || []);

                // Enhance live data with priority engine on the fly
                docs = docs.map(r => {
                    const prio = calculatePriority(r);
                    return { ...r, priority: prio.priority, slaRemainingMs: prio.slaRemainingMs, score: prio.score, fraud_flags: detectFraudFlags(r, seedData.historicalContext) };
                }).sort((a, b) => b.score - a.score);

                return { data: docs, total: docs.length };
            } catch {
                // FALLBACK: Client-side filter on seed data for demo purposes + Local Offline Queue + Cross-session submissions
                const localSubmissions = offlineQueue
                    .filter(item => item.type === 'REQUEST_SUBMIT')
                    .map(item => ({
                        id: item.id,
                        department: item.payload?.department || 'unknown',
                        service_name: item.payload?.service_type || item.payload?.service_name || 'General Request',
                        applicant_name: item.payload?.payload?.applicant_name || item.payload?.payload?.name || 'Local User',
                        phone: item.payload?.payload?.phone || item.payload?.payload?.mobile_number || 'N/A',
                        submission_token: item.payload?.payload?.submission_token,
                        status: 'pending',
                        created_at: new Date().toISOString(),
                        intent_confidence: 0.99,
                        payload: item.payload?.payload,
                        documents: item.payload?.payload?.documents || item.payload?.documents,
                    }));

                // Read cross-session citizen submissions from localStorage
                let crossSessionSubs = [];
                try {
                    crossSessionSubs = JSON.parse(localStorage.getItem('jan-citizen-submissions') || '[]');
                } catch { /* ignore */ }

                crossSessionSubs = crossSessionSubs.map((r) => normalizeRequestRow(r));
                let docs = [...crossSessionSubs, ...localSubmissions.map((r) => normalizeRequestRow(r)), ...seedData.requests.map((r) => normalizeRequestRow(r))];
                // Deduplicate by id
                const seen = new Set();
                docs = docs.filter(d => { if (seen.has(d.id)) return false; seen.add(d.id); return true; });

                if (filters.department) docs = docs.filter(r => r.department.toLowerCase().includes(filters.department.toLowerCase()));
                if (filters.status) docs = docs.filter(r => r.status === filters.status);
                if (filters.priority) docs = docs.filter(r => calculatePriority(r).priority === filters.priority);
                if (filters.search) {
                    const q = filters.search.toLowerCase();
                    docs = docs.filter((r) =>
                        `${r.id || ''} ${r.applicant_name || ''} ${r.phone || ''} ${r.submission_token || ''}`
                            .toLowerCase()
                            .includes(q)
                    );
                }

                // Enhance seed data with dynamic priority/flags immediately
                docs = docs.map(r => {
                    const prio = calculatePriority(r);
                    return { ...r, priority: prio.priority, slaRemainingMs: prio.slaRemainingMs, score: prio.score, fraud_flags: detectFraudFlags(r, seedData.historicalContext) };
                }).sort((a, b) => b.score - a.score);

                return { data: docs, total: docs.length };
            }
        },
        refetchInterval: isPolling ? pollingInterval : false,
        keepPreviousData: true
    });

    // 3. Status Mutation Action
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status, reason }) => AdminServices.updateRequestStatus(id, { status, reason }),
        onSettled: () => {
            queryClient.invalidateQueries(['adminRequests']);
            queryClient.invalidateQueries(['adminMetrics']);
        }
    });

    // Handlers
    const handleAction = (action, id, reason = '') => {
        if (action === 'approve') updateStatusMutation.mutate({ id, status: 'approved' });
        if (action === 'in_review') updateStatusMutation.mutate({ id, status: 'in_review', reason });
        if (action === 'reject') updateStatusMutation.mutate({ id, status: 'rejected', reason });
    };

    const handleManualSync = () => {
        queryClient.invalidateQueries(['adminRequests']);
        queryClient.invalidateQueries(['adminMetrics']);
    };

    const selectedRequest = requestsData?.data?.find(r => r.id === selectedRequestId);
    const selectedRequestNormalized = selectedRequest ? normalizeRequestRow(selectedRequest) : null;

    return (
        <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* Header / Control Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                <div className="relative z-10 w-full lg:w-auto">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        Operational Dashboard
                        {isPolling ? (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-bold tracking-wider shadow-sm">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> LIVE
                            </span>
                        ) : (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 text-xs font-bold tracking-wider shadow-sm">
                                PAUSED
                            </span>
                        )}
                    </h1>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <input
                            type="text"
                            placeholder="Search ID, Name, Phone..."
                            value={filters.search}
                            onChange={e => setFilter('search', e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-sm font-semibold px-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow shadow-sm w-full sm:w-64"
                        />
                        <select
                            value={filters.status}
                            onChange={e => setFilter('status', e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-sm font-semibold px-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow shadow-sm cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="in_review">In Review</option>
                            <option value="doc_required">Docs Required</option>
                        </select>
                        <select
                            value={filters.priority}
                            onChange={e => setFilter('priority', e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-sm font-semibold px-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow shadow-sm cursor-pointer"
                        >
                            <option value="">All Priorities</option>
                            <option value="URGENT">Urgent SLA</option>
                            <option value="HIGH">High Priority</option>
                        </select>
                        {(filters.search || filters.status || filters.priority) && (
                            <button onClick={clearFilters} className="text-xs font-bold text-slate-500 hover:text-rose-600 px-2 underline transition-colors">Clear</button>
                        )}
                    </div>
                </div>

                {/* KPI Top-line boxes */}
                <div className="relative z-10 flex gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
                    <div className="bg-white border border-slate-200 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] rounded-2xl p-4 min-w-[140px] flex-1 lg:flex-none">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Requests</div>
                        <div className="text-2xl font-black text-slate-800">{metricsData?.total_24h || 0}</div>
                    </div>
                    <div className="bg-white border border-slate-200 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] rounded-2xl p-4 min-w-[140px] flex-1 lg:flex-none">
                        <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Pending Review</div>
                        <div className="text-2xl font-black text-amber-600">{metricsData?.pending || 0}</div>
                    </div>
                    <div className="bg-white border border-rose-100 shadow-[0_4px_20px_-5px_rgba(225,29,72,0.1)] rounded-2xl p-4 min-w-[140px] flex-1 lg:flex-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50 rounded-bl-full -z-10"></div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">SLA Overdue</div>
                        <div className="text-2xl font-black text-rose-600">{metricsData?.overdue || 0}</div>
                    </div>
                </div>
            </div>

            {/* Split View: Analytics Top, Table Bottom */}
            <AnalyticsPanel data={metricsData} />

            <div className="h-[600px] w-full mt-4 pb-12">
                <LiveRequestsTable
                    data={requestsData?.data || []}
                    isLoading={isLoading}
                    isFetchingNextPage={isFetching}
                    hasNextPage={false} // Demo: disabled infinite pagination for simplicity 
                    fetchNextPage={() => { }}
                    isPolling={isPolling}
                    onManualSync={handleManualSync}
                    onRowAction={handleAction}
                    onViewDetails={setSelectedRequestId}
                />
            </div>

            {/* Detail Modal Overlay */}
            <RequestDetailModal
                isOpen={!!selectedRequestId}
                onClose={() => setSelectedRequestId(null)}
                request={selectedRequestNormalized}
                onApprove={(id) => { handleAction('approve', id); setSelectedRequestId(null); }}
                onReject={(id, reason) => { handleAction('reject', id, reason); setSelectedRequestId(null); }}
                onInProcess={(id, reason) => { handleAction('in_review', id, reason); setSelectedRequestId(null); }}
                onTriggerPayment={(id) => alert(`Triggering payment gateway for ${id}...`)}
            />

        </div>
    );
}
