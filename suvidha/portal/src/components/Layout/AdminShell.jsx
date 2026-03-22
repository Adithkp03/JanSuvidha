import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../Admin/AdminSidebar';

export default function AdminShell({ role, department }) {
    return (
        <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="relative z-20 shrink-0 shadow-2xl">
                <AdminSidebar role={role} department={department} />
            </div>

            {/* Main Content Area */}
            <main className="flex-1 w-full relative z-10 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 animate-in fade-in duration-500">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
