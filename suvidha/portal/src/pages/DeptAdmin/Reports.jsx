import React from 'react';
import { ChartBarIcon, ArrowDownTrayIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';

export default function Reports() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Compliance Reports</h1>
                <p className="text-sm font-semibold text-slate-500 mt-1">Generate MIS and performance audits for your department</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { title: 'Weekly Throughput', desc: 'Summary of requests resolved vs received', icon: ChartBarIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { title: 'Revenue Reconciliation', desc: 'Detailed financial ledger for service fees', icon: DocumentChartBarIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { title: 'SLA Exceptions', desc: 'Audit trail of delayed processing events', icon: ArrowDownTrayIcon, color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((r, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className={`w-12 h-12 rounded-2xl ${r.bg} flex items-center justify-center mb-6`}>
                            <r.icon className={`w-6 h-6 ${r.color}`} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">{r.title}</h3>
                        <p className="text-sm text-slate-500 font-medium mb-6">{r.desc}</p>
                        
                        <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                            <ArrowDownTrayIcon className="w-4 h-4" /> Download PDF
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-8 bg-slate-900 rounded-3xl p-8 lg:p-12 text-center border border-slate-800 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50"></div>
                <div className="relative z-10 w-full max-w-lg mx-auto">
                    <ChartBarIcon className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-white mb-2">Custom Report Builder</h2>
                    <p className="text-slate-400 font-medium mb-8">Need specific data cuts? Use the query builder to construct custom cross-tabulations and visual exports.</p>
                    <button className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg transition-colors">
                        Launch Builder
                    </button>
                </div>
            </div>
        </div>
    );
}
