import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

const initialDepts = [
    { id: 'electricity', name: 'Electricity Department', admin: 'elec.admin@jansuvidha.in', active: true, reqs: 87, svcs: 12 },
    { id: 'gas', name: 'Gas Management', admin: 'gas.admin@jansuvidha.in', active: true, reqs: 34, svcs: 5 },
    { id: 'water', name: 'Water & Sewage Board', admin: 'water.admin@jansuvidha.in', active: true, reqs: 56, svcs: 8 },
    { id: 'mc', name: 'Municipal Corporation', admin: 'mc.admin@jansuvidha.in', active: true, reqs: 43, svcs: 15 },
    { id: 'waste', name: 'Waste Management', admin: 'waste.admin@jansuvidha.in', active: false, reqs: 19, svcs: 4 },
    { id: 'public_works', name: 'Public Works (PWD)', admin: 'pw.admin@jansuvidha.in', active: true, reqs: 8, svcs: 11 },
];

export default function Departments() {
    const [departments, setDepartments] = useState(initialDepts);
    const [toast, setToast] = useState('');

    const toggleDept = (id) => {
        setDepartments(prev => 
            prev.map(d => d.id === id ? { ...d, active: !d.active } : d)
        );
        setToast('Department configuration updated (Mock)');
        setTimeout(() => setToast(''), 3000);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Department Tenants</h1>
                <p className="text-sm font-semibold text-slate-500 mt-1">Manage scoped access and service catalog segments</p>
            </div>

            {toast && (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-3 rounded-xl font-bold text-sm">
                    {toast}
                </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-xs uppercase font-extrabold text-slate-500 tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Department Name</th>
                            <th className="px-6 py-4">Tenant Admin</th>
                            <th className="px-6 py-4">Stats</th>
                            <th className="px-6 py-4 text-right">Status / Access</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {departments.map((dept) => (
                            <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800 text-base">{dept.name}</div>
                                    <div className="text-xs font-mono text-slate-400 mt-0.5">tenant_id: {dept.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-indigo-600">{dept.admin}</div>
                                </td>
                                <td className="px-6 py-4 space-y-1">
                                    <div className="text-xs font-semibold"><span className="font-black text-slate-700">{dept.reqs}</span> total requests</div>
                                    <div className="text-xs font-semibold"><span className="font-black text-slate-700">{dept.svcs}</span> active services</div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            value="" 
                                            className="sr-only peer" 
                                            checked={dept.active}
                                            onChange={() => toggleDept(dept.id)}
                                        />
                                        <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        <span className="ms-3 text-xs font-bold text-slate-600 w-12 text-left">
                                            {dept.active ? 'ACTIVE' : 'PAUSED'}
                                        </span>
                                    </label>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex items-start gap-4">
                <SparklesIcon className="w-6 h-6 text-indigo-500 shrink-0" />
                <div>
                    <h4 className="font-bold text-indigo-900">Need to add a new department?</h4>
                    <p className="text-sm text-indigo-700 mt-1">Tenant provisioning is currently restricted to system updates via IaC templates. Contact infrastructure team to provision new department silos.</p>
                </div>
            </div>
        </div>
    );
}
