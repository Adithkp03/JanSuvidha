import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line, CartesianGrid } from 'recharts';

export default function AnalyticsPanel({ data }) {
    // If exact API data isn't ready in demo, we map what exists or fail gracefully
    const deptData = data?.departmentDistribution || [];
    const statusData = data?.statusOverTime || [];
    const slaData = data?.slaBreachTrend || [];
    const fraudData = data?.fraudIncidents || [];

    if (!data) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-200 shadow-inner">
            {/* Requests by Department */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight mb-4 uppercase">Requests by Department</h3>
                <div className="flex-1 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748B' }} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748B' }} />
                            <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} maxBarSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Status Over Time */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight mb-4 uppercase">Status Over Time</h3>
                <div className="flex-1 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748B' }} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748B' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="approved" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} />
                            <Area type="monotone" dataKey="pending" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} strokeWidth={2} />
                            <Area type="monotone" dataKey="rejected" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* SLA Breach Trend */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight mb-4 uppercase">SLA Breach Trend</h3>
                <div className="flex-1 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={slaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748B' }} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748B' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="breaches" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#EF4444' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Fraud Incidents */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight mb-4 uppercase">Fraud Incidents Flagged</h3>
                <div className="flex-1 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={fraudData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748B' }} />
                            <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#64748B' }} />
                            <Tooltip cursor={{ fill: '#FEF2F2' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="incidents" fill="#DC2626" radius={[6, 6, 0, 0]} maxBarSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
