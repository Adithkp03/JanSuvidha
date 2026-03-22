import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const breaches = [
    { id: 'REQ-2026-9041', citizen: 'Neha Sharma', service: 'New Meter Connection', overdue: '2 days', status: 'Pending Verification' },
    { id: 'REQ-2026-9012', citizen: 'Ravi Verma', service: 'Line Fault Repair', overdue: '1 day', status: 'Assigned to Field' },
    { id: 'REQ-2026-9088', citizen: 'Pooja Reddy', service: 'Tariff Change Request', overdue: '4 hours', status: 'Documents Required' },
];

export default function SLABreaches() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight text-rose-600 flex items-center gap-3">
                    <ExclamationTriangleIcon className="w-8 h-8" />
                    SLA Breaches
                </h1>
                <p className="text-sm font-semibold text-slate-500 mt-1">Requests exceeding mandatory turnaround times</p>
            </div>

            <div className="bg-white rounded-3xl border border-rose-200 shadow-[0_4px_20px_-4px_rgba(225,29,72,0.1)] overflow-hidden animate-in fade-in duration-500">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-rose-50 text-xs uppercase font-extrabold text-rose-700 tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Request ID</th>
                            <th className="px-6 py-4">Citizen</th>
                            <th className="px-6 py-4">Service</th>
                            <th className="px-6 py-4">Overdue By</th>
                            <th className="px-6 py-4">Current Bottleneck</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100">
                        {breaches.map((b) => (
                            <tr key={b.id} className="hover:bg-rose-50/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-900">{b.id}</td>
                                <td className="px-6 py-4 font-semibold text-slate-800">{b.citizen}</td>
                                <td className="px-6 py-4 font-semibold text-slate-700">{b.service}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-200">
                                        {b.overdue}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-medium">{b.status}</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-md">
                                        Escalate
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm font-bold flex items-center gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 text-amber-500" />
                These synthetic breaches are provided for hackathon demonstration. In production, these trigger auto-escalation to the Super Admin layer.
            </div>
        </div>
    );
}
