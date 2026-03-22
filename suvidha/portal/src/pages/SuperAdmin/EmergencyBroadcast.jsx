import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BroadcastForm from '../../components/Admin/BroadcastForm';
import ToastNotification from '../../components/Admin/ToastNotification';
import { AdminServices } from '../../services/adminApi';
import { notifyActiveAlertsChanged } from '../../utils/activeAlertsSync';
import { readAndPruneActiveAlerts } from '../../utils/activeAlertsStore';

export default function EmergencyBroadcast() {
    const queryClient = useQueryClient();
    const [toast, setToast] = useState(null);

    // Fetch active alerts
    const { data: activeAlerts, isLoading } = useQuery({
        queryKey: ['activeAlerts'],
        // Same source as citizen kiosks (local prune rules); avoids stale unpruned JSON.parse fallback
        queryFn: () => readAndPruneActiveAlerts(),
        refetchInterval: 10000 // poll every 10s to see if others cleared it
    });

    const clearMutation = useMutation({
        mutationFn: async (id) => {
            try {
                return await AdminServices.clearAlert(id);
            } catch {
                const existing = readAndPruneActiveAlerts();
                const updated = existing.filter(a => a.id !== id);
                localStorage.setItem('jan_active_alerts', JSON.stringify(updated));
                notifyActiveAlertsChanged();
                return { success: true };
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['activeAlerts']);
            setToast({ message: 'Alert cleared successfully', type: 'success' });
        }
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Emergency Broadcast System</h1>
                <p className="text-sm font-semibold text-slate-500 mt-1">Push rapid notifications to all citizen kiosks</p>
            </div>

            <BroadcastForm 
                onBroadcastSuccess={() => queryClient.invalidateQueries(['activeAlerts'])} 
                setAppToast={setToast}
            />

            <div className="mt-12">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    Active Transmissions
                    {activeAlerts?.length > 0 && (
                        <span className="bg-rose-100 text-rose-600 px-2.5 py-0.5 rounded-full text-sm">{activeAlerts.length}</span>
                    )}
                </h3>

                {isLoading ? (
                    <div className="text-slate-400 font-semibold text-sm">Loading active transmissions...</div>
                ) : activeAlerts?.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center text-slate-500 font-bold">
                        No active emergency broadcasts at this time.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeAlerts?.map(alert => (
                            <div key={alert.id} className="bg-white border text-left border-rose-200 shadow-sm rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1 md:max-w-[70%]">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-md ${
                                            alert.type === 'Emergency' ? 'bg-rose-100 text-rose-700' :
                                            alert.type === 'Warning' ? 'bg-amber-100 text-amber-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>{alert.type}</span>
                                        <span className="text-xs font-bold text-slate-400">{alert.department}</span>
                                    </div>
                                    <p className="text-slate-800 font-semibold">{alert.message}</p>
                                    <p className="text-xs text-slate-400 font-medium pt-1">
                                        Transmitted: {new Date(alert.created_at).toLocaleString()} • Duration: {alert.duration}
                                    </p>
                                </div>
                                <button
                                    onClick={() => clearMutation.mutate(alert.id)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 font-bold text-sm rounded-xl transition-colors whitespace-nowrap border border-transparent hover:border-rose-200"
                                >
                                    Clear Alert
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {toast && <ToastNotification message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
