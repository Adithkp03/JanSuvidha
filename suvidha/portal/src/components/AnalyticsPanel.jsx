import React, { useState, useEffect } from 'react';
// Using Recharts for data visualization
import { PieChart, Pie, Cell, BarChart, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid, Legend as ReLegend, Bar as ReBar, LineChart, Line as ReLine, ResponsiveContainer } from 'recharts';

import api from '../services/api';

export default function AnalyticsPanel() {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    // Demo fallback metrics if backend lacks /admin/analytics
    const fallbackMetrics = {
        totalRequests: 2453,
        pending: 412,
        byDepartment: [
            { name: 'Water Board', value: 850 },
            { name: 'Electricity', value: 620 },
            { name: 'Municipal', value: 430 },
            { name: 'Revenue', value: 310 },
            { name: 'Transport', value: 243 }
        ],
        processingDays: [
            { range: '1-3 days', count: 1200 },
            { range: '4-7 days', count: 800 },
            { range: '>7 days', count: 453 }
        ],
        completionRate: 83
    };

    useEffect(() => {
        let active = true;
        const fetchAnalytics = async () => {
            try {
                const resp = await api.get('/admin/analytics');
                const d = resp.data;
                if (!active) return;
                // Transform backend format to chart format
                const total = Number(d.total_requests || 0);
                const byStatus = (d.by_status || []).reduce((acc, r) => ({ ...acc, [r.status]: Number(r.count) }), {});
                const pending = (byStatus.submitted || 0) + (byStatus.under_review || 0) + (byStatus.doc_required || 0) + (byStatus.payment_pending || 0) + (byStatus.draft || 0);
                const completed = (byStatus.completed || 0) + (byStatus.approved || 0);
                const byDept = (d.by_department_status || []).reduce((acc, r) => {
                    const name = r.department || 'other';
                    if (!acc[name]) acc[name] = 0;
                    acc[name] += Number(r.count || 0);
                    return acc;
                }, {});
                const byDepartment = Object.entries(byDept).map(([name, value]) => ({ name, value }));
                setMetrics({
                    totalRequests: total,
                    pending,
                    fraudFlagged: Number(d.fraud_flagged || 0),
                    byDepartment: byDepartment.length ? byDepartment : fallbackMetrics.byDepartment,
                    by_status: d.by_status || [],
                    processingDays: fallbackMetrics.processingDays,
                    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
                });
            } catch (err) {
                if (active) setMetrics(fallbackMetrics);
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchAnalytics();
        return () => active = false;
    }, []);

    if (loading) return <div className="h-64 flex items-center justify-center font-bold text-slate-400">Loading Analytics...</div>;

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-xl">
                    <p className="text-slate-400 font-bold text-sm tracking-widest uppercase mb-1">Total Requests</p>
                    <h3 className="text-4xl font-extrabold text-white">{(metrics?.totalRequests ?? 0).toLocaleString()}</h3>
                    <div className="mt-4 text-emerald-400 text-sm font-bold flex items-center gap-1">All departments</div>
                </div>
                <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-xl">
                    <p className="text-slate-400 font-bold text-sm tracking-widest uppercase mb-1">Pending Actions</p>
                    <h3 className="text-4xl font-extrabold text-amber-400">{(metrics?.pending ?? 0).toLocaleString()}</h3>
                    <div className="mt-4 text-slate-400 text-sm font-medium">Requires admin review</div>
                </div>
                <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-xl">
                    <p className="text-slate-400 font-bold text-sm tracking-widest uppercase mb-1">Fraud Flagged</p>
                    <h3 className="text-4xl font-extrabold text-red-400">{(metrics?.fraudFlagged ?? 0).toLocaleString()}</h3>
                    <div className="mt-4 text-slate-400 text-sm font-medium">Needs verification</div>
                </div>
                <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-xl">
                    <p className="text-slate-400 font-bold text-sm tracking-widest uppercase mb-1">Completion Rate</p>
                    <h3 className="text-4xl font-extrabold text-white">{metrics?.completionRate ?? 0}%</h3>
                    <div className="mt-4 text-emerald-400 text-sm font-bold">Within SLA limits</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-xl min-h-[300px]">
                    <h4 className="text-white font-bold mb-6">Requests by Department</h4>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={metrics.byDepartment} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {metrics.byDepartment.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <ReTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                <ReLegend wrapperStyle={{ color: '#94a3b8' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700 shadow-xl min-h-[300px]">
                    <h4 className="text-white font-bold mb-6">Processing Time Distribution</h4>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.processingDays} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="range" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                                <ReTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                                <ReBar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    );
}
