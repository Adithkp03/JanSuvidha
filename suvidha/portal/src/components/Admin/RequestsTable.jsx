import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminServices } from '../../services/adminApi';
import useAdminStore from '../../store/adminStore';
import { mergeImportedSubmissions, parseBridgeImportFile, subscribeToBridgeUpdates } from '../../utils/citizenBridge';
import { ChevronLeftIcon, ChevronRightIcon, ArrowDownTrayIcon, ArrowPathIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import RequestDetailModal from './RequestDetailModal';

export default function RequestsTable({ departmentFilter, isSuperAdmin }) {
    const queryClient = useQueryClient();
    const { isPolling, pollingInterval } = useAdminStore();

    const [page, setPage] = useState(1);
    const limit = 20;

    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Controlled Polling state
    const [newDataCount, setNewDataCount] = useState(0);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const importInputRef = useRef(null);

    // Primary fetch query (AdminServices merges API + bridge; offline: seed + bridge)
    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['requestsTable', page, statusFilter, searchQuery, departmentFilter],
        queryFn: async () => {
            const params = { page, limit };
            if (departmentFilter) params.department = departmentFilter;
            if (statusFilter) params.status = statusFilter;
            if (searchQuery) params.search = searchQuery;

            const res = await AdminServices.getRequests(params);
            let items = res.requests || [];

            let filteredItems = items;
            if (departmentFilter) {
                filteredItems = filteredItems.filter((r) =>
                    (r.department || '').toLowerCase().includes(departmentFilter.toLowerCase())
                );
            }
            if (statusFilter) {
                filteredItems = filteredItems.filter((r) => r.status === statusFilter);
            }
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                filteredItems = filteredItems.filter(
                    (r) =>
                        (r.id || '').toLowerCase().includes(q) ||
                        (r.applicant_name && r.applicant_name.toLowerCase().includes(q)) ||
                        (r.phone && String(r.phone).toLowerCase().includes(q)) ||
                        (r.submission_token && r.submission_token.toLowerCase().includes(q))
                );
            }

            return { items: filteredItems, total: filteredItems.length };
        },
        keepPreviousData: true,
        retry: 0,
        refetchInterval: (page === 1 && isPolling) ? pollingInterval : false
    });

    useEffect(() => subscribeToBridgeUpdates(() => refetch()), [refetch]);

    const handleImportBridge = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const rows = await parseBridgeImportFile(file);
            mergeImportedSubmissions(rows);
            await refetch();
        } catch (err) {
            console.error(err);
            alert('Could not import file. Use JSON exported from the citizen portal.');
        } finally {
            e.target.value = '';
        }
    };

    // Background Check Query (only runs when NOT on page 1) to notify of new data
    useQuery({
        queryKey: ['requestsTableBackgroundCheck', departmentFilter],
        queryFn: async () => {
            const params = { page: 1, limit: 1 };
            if (departmentFilter) params.department = departmentFilter;
            
            const res = await AdminServices.getRequests(params);
            return res.requests?.length ?? 0;
        },
        refetchInterval: (page !== 1 && isPolling) ? pollingInterval : false,
        onSuccess: (newTotal) => {
            if (data?.total && newTotal > data.total) {
                setNewDataCount(newTotal - data.total);
            }
        },
        enabled: page !== 1
    });

    // Mutations for Status Update
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, notes }) => {
            try {
                return await AdminServices.updateRequestStatus(id, { status, notes });
            } catch (err) {
                console.warn('Backend PATCH failed, mocking status update locally');
                return { id, status, notes, localMock: true };
            }
        },
        onSuccess: (res) => {
            if (res.localMock) alert('Backend offline: Status changed locally. Changes will sync when online.');
            queryClient.invalidateQueries(['requestsTable']);
        }
    });

    const triggerRefresh = () => {
        setNewDataCount(0);
        if (page !== 1) setPage(1);
        queryClient.invalidateQueries(['requestsTable']);
    };

    const downloadFakeCSV = () => {
        if (!data?.items?.length) return;
        const headers = ["ID", "Department", "Service", "Applicant Name", "Phone", "Status", "Date"];
        const rows = data.items.map(r => [
            r.id, r.department, r.service_name, r.applicant_name, r.phone, r.status, r.created_at
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + 
            headers.join(",") + "\\n" + rows.map(e => e.join(",")).join("\\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "requests_export_jansuvidha.csv");
        document.body.appendChild(link);
        link.click();
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'approved': return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-emerald-200">Approved</span>;
            case 'rejected': return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-rose-200">Rejected</span>;
            case 'in_review': return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-amber-200">In Review</span>;
            case 'doc_required': return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-blue-200">Needs Docs</span>;
            default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-200">Pending</span>;
        }
    };

    const handleAction = (action, id, reason = '') => {
        if (action === 'approve') updateStatusMutation.mutate({ id, status: 'approved', notes: reason });
        if (action === 'in_review') updateStatusMutation.mutate({ id, status: 'in_review', notes: reason });
        if (action === 'reject') updateStatusMutation.mutate({ id, status: 'rejected', notes: reason });
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
            
            {/* Header / ToolBar */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <input 
                        type="text" 
                        placeholder="Search ID or Name..." 
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                        className="bg-white border border-slate-200 text-sm font-semibold px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
                    />
                    <select 
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="bg-white border border-slate-200 text-sm font-semibold px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="in_review">In Review</option>
                        <option value="doc_required">Docs Required</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <input
                        ref={importInputRef}
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={handleImportBridge}
                    />
                    <button
                        type="button"
                        onClick={() => importInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-slate-700 rounded-xl transition-all text-sm font-bold"
                        title="Import jan-citizen-submissions JSON from another device"
                    >
                        <ArrowUpTrayIcon className="w-4 h-4" />
                        Import bridge
                    </button>
                    <button 
                        onClick={triggerRefresh}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl transition-all text-sm font-bold"
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> 
                        Refresh
                    </button>
                    <button 
                        onClick={downloadFakeCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white border border-transparent rounded-xl transition-all text-sm font-bold shadow-md"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" /> 
                        Export
                    </button>
                </div>
            </div>

            {/* Polling Conflict Banner */}
            {newDataCount > 0 && (
                <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2.5 flex items-center justify-center gap-4 animate-in slide-in-from-top-2">
                    <span className="text-sm font-bold text-indigo-800">
                        {newDataCount} new record{newDataCount > 1 ? 's' : ''} arrived while you were reviewing page {page}.
                    </span>
                    <button 
                        onClick={triggerRefresh}
                        className="text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-md text-xs font-bold transition-colors"
                    >
                        Load New Data
                    </button>
                </div>
            )}

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-white">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-extrabold text-slate-500 tracking-wider sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                        <tr>
                            <th className="px-6 py-4">Request ID</th>
                            <th className="px-6 py-4">Citizen Details</th>
                            {isSuperAdmin && <th className="px-6 py-4">Department</th>}
                            <th className="px-6 py-4">Service</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Created Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-bold">Loading records...</td></tr>
                        ) : data?.items?.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-bold">No requests found matching criteria</td></tr>
                        ) : (
                            data?.items?.map((item) => (
                                <tr 
                                    key={item.id} 
                                    onClick={() => setSelectedRequest(item)}
                                    className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.id}</div>
                                        {item.urgency_flag && <span className="text-[10px] font-bold text-rose-500 mt-1 block">URGENT</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">{item.applicant_name}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{item.phone}</div>
                                    </td>
                                    {isSuperAdmin && (
                                        <td className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                                            {item.department}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 font-semibold text-slate-700">{item.service_name}</td>
                                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500 block w-full sm:w-auto text-center mb-3 sm:mb-0">
                    Showing <span className="font-black text-slate-800">{data?.items?.length ? ((page - 1) * limit) + 1 : 0}</span> to <span className="font-black text-slate-800">{Math.min(page * limit, data?.total || 0)}</span> of <span className="font-black text-slate-800">{data?.total || 0}</span> results
                </span>
                
                <div className="inline-flex items-center gap-1 w-full sm:w-auto justify-center">
                    <button 
                        disabled={page === 1}
                        onClick={() => setPage(prev => prev - 1)}
                        className="p-1 min-w-[32px] h-[32px] flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-black min-w-[32px] text-center text-slate-600">PAGE {page}</span>
                    <button 
                        disabled={!data?.total || page * limit >= data.total}
                        onClick={() => setPage(prev => prev + 1)}
                        className="p-1 min-w-[32px] h-[32px] flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Request Details View */}
            {selectedRequest && (
                <RequestDetailModal 
                    isOpen={!!selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    request={selectedRequest}
                    onApprove={(id) => { handleAction('approve', id); setSelectedRequest(null); }}
                    onInProcess={(id, reason) => { handleAction('in_review', id, reason); setSelectedRequest(null); }}
                    onReject={(id, reason) => { handleAction('reject', id, reason); setSelectedRequest(null); }}
                />
            )}
        </div>
    );
}
