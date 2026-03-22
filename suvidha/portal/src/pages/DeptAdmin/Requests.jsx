import React from 'react';
import useStore from '../../store/useStore';
import RequestsTable from '../../components/Admin/RequestsTable';

export default function Requests() {
    const { adminDepartment } = useStore();

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Service Requests Queue</h1>
                <p className="text-sm font-semibold text-slate-500 mt-1">Adjudicate incoming citizen applications for your department</p>
            </div>

            <div className="flex-1">
                <RequestsTable 
                    departmentFilter={adminDepartment} 
                    isSuperAdmin={false} 
                />
            </div>
        </div>
    );
}
