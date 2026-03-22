import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminServices } from '../../services/adminApi';

export default function DeptKPICards({ department }) {
    const { data: metrics } = useQuery({
        queryKey: ['deptMetrics', department],
        queryFn: async () => {
            const res = await AdminServices.getMetrics();
            let pending = 0;
            let resolved = 0;
            
            res.by_department_status?.forEach(r => {
                if (r.department === department) {
                    if (r.status === 'pending' || r.status === 'in_review') pending += parseInt(r.count, 10);
                    if (r.status === 'approved') resolved += parseInt(r.count, 10);
                }
            });

            return {
                pending,
                resolved_week: resolved,
                sla_breaches: 0,
                fees_collected: resolved * 150
            };
        },
        refetchInterval: 30000 // Poll every 30s
    });

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Pending Requests</div>
                <div className="text-3xl font-black text-slate-800">{metrics?.pending || 0}</div>
                <div className="text-xs font-semibold text-slate-400 mt-2 flex items-center gap-1">
                    <span className="text-amber-500">Requires attention</span>
                </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Resolved This Week</div>
                <div className="text-3xl font-black text-slate-800">{metrics?.resolved_week || 0}</div>
                <div className="text-xs font-semibold text-slate-400 mt-2 flex items-center gap-1">
                    <span className="text-emerald-500 hover:underline cursor-pointer">View breakdown &rarr;</span>
                </div>
            </div>

            <div className={`border shadow-sm rounded-2xl p-5 transition-shadow ${metrics?.sla_breaches > 0 ? 'bg-rose-50 border-rose-200 hover:shadow-rose-100' : 'bg-white border-slate-200 hover:shadow-md'}`}>
                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${metrics?.sla_breaches > 0 ? 'text-rose-500' : 'text-slate-400'}`}>SLA Breaches</div>
                <div className={`text-3xl font-black ${metrics?.sla_breaches > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{metrics?.sla_breaches || 0}</div>
                <div className="text-xs font-semibold mt-2">
                    {metrics?.sla_breaches > 0 ? (
                        <span className="text-rose-600 font-bold">Action mandated immediately</span>
                    ) : (
                        <span className="text-slate-400">All targets met</span>
                    )}
                </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Fees Collected</div>
                <div className="text-3xl font-black text-slate-800">₹{(metrics?.fees_collected || 0).toLocaleString()}</div>
                <div className="text-xs font-semibold text-slate-400 mt-2">
                    Period: Past 7 days
                </div>
            </div>
        </div>
    );
}
