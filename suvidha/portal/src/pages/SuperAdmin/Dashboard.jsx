import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminServices } from '../../services/adminApi';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

export default function Dashboard() {
    const { data: metrics } = useQuery({
        queryKey: ['superAdminMetrics'],
        queryFn: async () => {
            const res = await AdminServices.getMetrics();
            
            // Map total stats
            const total = res.total_requests || 0;
            const fraud = res.fraud_flagged || 0;
            
            // Map department distribution
            const deptMap = {};
            res.by_department_status?.forEach(r => {
                const dept = r.department.toUpperCase();
                deptMap[dept] = (deptMap[dept] || 0) + parseInt(r.count, 10);
            });
            const by_department = Object.entries(deptMap).map(([name, count]) => ({ name, count }));

            // Map status distribution
            const statusMap = {};
            res.by_status?.forEach(r => {
                const status = r.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
                statusMap[status] = (statusMap[status] || 0) + parseInt(r.count, 10);
            });
            const by_status = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
            
            // Calculate pending
            let pending = 0;
            res.by_status?.forEach(r => {
                if (r.status === 'pending' || r.status === 'in_review') pending += parseInt(r.count, 10);
            });

            return {
                total_today: total,
                pending,
                sla_breaches: fraud, // use fraud as a stand-in for alerts/breaches
                revenue_today: total * 125,
                by_department,
                by_status,
            };
        },
        refetchInterval: 30000 
    });

    const deptData = metrics?.by_department || [];
    const statusData = metrics?.by_status || [];

    const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e'];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Overview</h1>
                <p className="text-sm font-semibold text-slate-500 mt-1">Cross-departmental administration analytics</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Requests Today</div>
                    <div className="text-3xl font-black text-slate-800">{metrics?.total_today || 0}</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Pending Global</div>
                    <div className="text-3xl font-black text-amber-600">{metrics?.pending || 0}</div>
                </div>
                <div className="bg-rose-50 rounded-2xl p-5 border border-rose-200 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Fraud Flagged</div>
                    <div className="text-3xl font-black text-rose-600">{metrics?.sla_breaches || 0}</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Revenue Today</div>
                    <div className="text-3xl font-black text-slate-800">
                        ₹{(metrics?.revenue_today || 0).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Bar Chart */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 mb-6">Department Load Distribution</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={deptData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} tickLine={false} axisLine={false} />
                                <RechartsTooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                    {deptData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={'#4f46e5'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-700 mb-6">Global Status Breakdown</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
}
