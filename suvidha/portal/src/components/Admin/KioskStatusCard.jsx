import React, { useState } from 'react';
import { MapPinIcon, ClockIcon, ArrowPathRoundedSquareIcon, ShieldExclamationIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function KioskStatusCard({ kiosk, onToggleStatus }) {
    const [showLogs, setShowLogs] = useState(false);

    const isOnline = kiosk.status === 'online';
    const isMaintenance = kiosk.status === 'maintenance';
    
    const statusColors = {
        online: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        offline: 'bg-rose-100 text-rose-700 border-rose-200',
        maintenance: 'bg-amber-100 text-amber-700 border-amber-200'
    };
    
    const dotColors = {
        online: 'bg-emerald-500 shadow-[0_0_10px_2px_rgba(16,185,129,0.3)]',
        offline: 'bg-rose-500',
        maintenance: 'bg-amber-500'
    };

    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full">
            {/* Top Bar */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800 text-lg">{kiosk.id}</span>
                    <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md border flex items-center gap-1.5 ${statusColors[kiosk.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[kiosk.status]}`}></span>
                        {kiosk.status}
                    </div>
                </div>
            </div>

            {/* Local Context */}
            <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-0.5">Location</p>
                        <p className="text-sm font-semibold text-slate-700">{kiosk.location}</p>
                    </div>
                </div>
                
                <div className="flex items-start gap-3">
                    <ArrowPathRoundedSquareIcon className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-0.5">Sessions Today</p>
                        <p className="text-sm font-semibold text-slate-700">{kiosk.sessions} processed</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <ClockIcon className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-0.5">Last Seen</p>
                        <p className="text-sm font-semibold text-slate-700">{kiosk.lastSeen}</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 mt-auto">
                <button 
                    onClick={() => onToggleStatus(kiosk.id)}
                    className={`py-2 px-3 text-xs font-bold rounded-lg transition-colors border flex items-center justify-center gap-1.5 ${
                        isMaintenance 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                >
                    <ShieldExclamationIcon className="w-4 h-4" />
                    {isMaintenance ? 'Enable Kiosk' : 'Maintenance'}
                </button>
                <button 
                    onClick={() => setShowLogs(true)}
                    className="py-2 px-3 text-xs font-bold rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                >
                    <DocumentTextIcon className="w-4 h-4" />
                    View Logs
                </button>
            </div>

            {/* Mock Logs Modal Overlay */}
            {showLogs && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLogs(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <DocumentTextIcon className="w-5 h-5 text-indigo-400" />
                                Logs for {kiosk.id}
                            </h3>
                            <button onClick={() => setShowLogs(false)} className="text-slate-400 hover:text-white">&times;</button>
                        </div>
                        <div className="p-6 bg-slate-950 text-green-400 font-mono text-xs overflow-y-auto max-h-[400px]">
                            <p>[10:42:01] INFO  - Boot sequence complete.</p>
                            <p>[10:45:12] INFO  - Establishing secure WS connection...</p>
                            <p className="text-blue-400">[10:45:15] DEBUG - Connected to regional broker.</p>
                            <p>[11:02:44] INFO  - New session initiated (ID 40992).</p>
                            <p>[11:05:01] INFO  - Session completed successfully.</p>
                            {kiosk.status === 'offline' && <p className="text-rose-400">[12:15:33] ERROR - Connection lost. Retrying (1/5)...</p>}
                            <p className="animate-pulse mt-4">_</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
