import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminServices } from '../../services/adminApi';
import { subscribeToBridgeUpdates } from '../../utils/citizenBridge';

function computeDeptMetrics(items, department) {
    const dept = (department || '').toLowerCase();
    const scoped = dept
        ? items.filter((r) => (r.department || '').toLowerCase() === dept)
        : items;

    const pendingStatuses = ['pending', 'in_review', 'doc_required', 'submitted', 'payment_pending'];
    const pending = scoped.filter((r) => pendingStatuses.includes(r.status)).length;

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const resolvedWeek = scoped.filter((r) => {
        if (!['approved', 'completed'].includes(r.status)) return false;
        const t = new Date(r.updated_at || r.created_at).getTime();
        return t >= weekAgo;
    }).length;

    const slaBreaches = scoped.filter((r) => {
        if (['completed', 'approved', 'rejected'].includes(r.status)) return false;
        const created = new Date(r.created_at).getTime();
        return Date.now() - created > 7 * 24 * 60 * 60 * 1000;
    }).length;

    let feesCollected = 0;
    scoped.forEach((r) => {
        const payments = r.payments || [];
        payments.forEach((p) => {
            if (p.status === 'succeeded' || p.status === 'success' || p.status === 'completed') {
                feesCollected += (p.amount_paise || 0) / 100;
            }
        });
    });

    return {
        pending,
        resolved_week: resolvedWeek,
        sla_breaches: slaBreaches,
        fees_collected: Math.round(feesCollected),
    };
}

export default function DeptKPICards({ department }) {
    const queryClient = useQueryClient();

    const { data: metrics } = useQuery({
        queryKey: ['deptMetrics', department],
        queryFn: async () => {
            const res = await AdminServices.getRequests({ page: 1, limit: 500 });
            const items = res.requests || [];
            return computeDeptMetrics(items, department);
        },
        refetchInterval: 15000,
    });

    useEffect(() => {
        return subscribeToBridgeUpdates(() => {
            queryClient.invalidateQueries({ queryKey: ['deptMetrics', department] });
        });
    }, [department, queryClient]);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Pending Requests</div>
                <div className="text-3xl font-black text-slate-800">{metrics?.pending ?? 0}</div>
                <div className="text-xs font-semibold text-slate-400 mt-2 flex items-center gap-1">
                    <span className="text-amber-500">Requires attention</span>
                </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Resolved This Week</div>
                <div className="text-3xl font-black text-slate-800">{metrics?.resolved_week ?? 0}</div>
                <div className="text-xs font-semibold text-slate-400 mt-2 flex items-center gap-1">
                    <span className="text-emerald-500">Last 7 days</span>
                </div>
            </div>

            <div
                className={`border shadow-sm rounded-2xl p-5 transition-shadow ${
                    (metrics?.sla_breaches ?? 0) > 0 ? 'bg-rose-50 border-rose-200 hover:shadow-rose-100' : 'bg-white border-slate-200 hover:shadow-md'
                }`}
            >
                <div
                    className={`text-[10px] font-black uppercase tracking-widest mb-2 ${
                        (metrics?.sla_breaches ?? 0) > 0 ? 'text-rose-500' : 'text-slate-400'
                    }`}
                >
                    SLA Breaches
                </div>
                <div className={`text-3xl font-black ${(metrics?.sla_breaches ?? 0) > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                    {metrics?.sla_breaches ?? 0}
                </div>
                <div className="text-xs font-semibold mt-2">
                    {(metrics?.sla_breaches ?? 0) > 0 ? (
                        <span className="text-rose-600 font-bold">Open &gt; 7 days</span>
                    ) : (
                        <span className="text-slate-400">All targets met</span>
                    )}
                </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Fees Collected</div>
                <div className="text-3xl font-black text-slate-800">₹{(metrics?.fees_collected ?? 0).toLocaleString()}</div>
                <div className="text-xs font-semibold text-slate-400 mt-2">From succeeded payments on record</div>
            </div>
        </div>
    );
}
