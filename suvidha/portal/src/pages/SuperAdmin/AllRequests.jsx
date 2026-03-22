import React, { useState } from 'react';
import RequestsTable from '../../components/Admin/RequestsTable';

const TABS = [
    { id: '', label: 'All Global' },
    { id: 'electricity', label: 'Electricity' },
    { id: 'gas', label: 'Gas' },
    { id: 'water', label: 'Water' },
    { id: 'mc', label: 'Municipal' },
    { id: 'waste', label: 'Waste' },
    { id: 'public_works', label: 'Public Works' }
];

export default function AllRequests() {
    const [activeTab, setActiveTab] = useState('');

    return (
        <div className="space-y-6 flex flex-col h-full">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Global Requests Directory</h1>
                <p className="text-sm font-semibold text-slate-500 mt-1">Cross-departmental adjudication interface</p>
            </div>

            {/* Department Filter Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200">
                <div className="flex gap-6 px-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 relative ${
                                activeTab === tab.id 
                                ? 'border-indigo-600 text-indigo-700' 
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1">
                <RequestsTable 
                    departmentFilter={activeTab} 
                    isSuperAdmin={true} 
                />
            </div>
        </div>
    );
}
