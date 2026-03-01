import React, { useState } from 'react';
import LiveRequestsTable from '../../components/LiveRequestsTable';
import RequestDetailModal from '../../components/RequestDetailModal';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function Requests() {
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-white">Live Requests</h1>
                    <p className="text-slate-400 mt-2">Manage citizen service applications queue</p>
                </div>
                <button
                    onClick={triggerRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1e293b] hover:bg-[#334155] border border-slate-700 text-white rounded-xl transition-colors text-sm font-bold shadow-sm"
                >
                    <ArrowPathIcon className="w-4 h-4" /> Refresh
                </button>
            </div>

            <LiveRequestsTable
                refreshTrigger={refreshTrigger}
                onRowClick={(req) => setSelectedRequest(req)}
            />

            {selectedRequest && (
                <RequestDetailModal
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onUpdate={triggerRefresh}
                />
            )}
        </div>
    );
}
