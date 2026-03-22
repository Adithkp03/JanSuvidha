import React from 'react';
import useStore from '../../store/useStore';
import DeptKPICards from '../../components/Admin/DeptKPICards';
import RequestsTable from '../../components/Admin/RequestsTable';

const DEPARTMENTS = {
    electricity: 'Electricity Department',
    gas: 'Gas Management Board',
    water: 'Water & Sewage Board',
    mc: 'Municipal Corporation',
    waste: 'Waste Management',
    public_works: 'Public Works (PWD)'
};

export default function Dashboard() {
    const { adminDepartment } = useStore();
    const deptName = DEPARTMENTS[adminDepartment] || 'Department';

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">{deptName} Dashboard</h1>
                <p className="text-sm font-semibold text-slate-500 mt-1">Tenant-scoped operational overview</p>
            </div>

            <DeptKPICards department={adminDepartment} />

            <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Active Requests</h3>
                <div className="h-[500px]">
                    <RequestsTable 
                        departmentFilter={adminDepartment} 
                        isSuperAdmin={false} 
                    />
                </div>
            </div>
        </div>
    );
}
