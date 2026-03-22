import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useStore from '../../store/useStore';
import { 
    Squares2X2Icon, ServerStackIcon, SpeakerWaveIcon, 
    ListBulletIcon, BuildingOffice2Icon, ChartBarIcon, 
    ClockIcon, ArrowRightOnRectangleIcon, ShieldCheckIcon 
} from '@heroicons/react/24/outline';

const DEPARTMENTS = {
    electricity: 'Electricity',
    gas: 'Gas',
    water: 'Water & Sewage',
    mc: 'Municipal Corporation',
    waste: 'Waste Management',
    public_works: 'Public Works'
};

export default function AdminSidebar({ role, department }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { adminName, adminLogout } = useStore();

    const handleLogout = () => {
        adminLogout();
        navigate('/admin/login');
    };

    const isSuper = role === 'super_admin';

    const superLinks = [
        { name: 'Overview', to: '/superadmin', icon: Squares2X2Icon },
        { name: 'Kiosk Management', to: '/superadmin/kiosks', icon: ServerStackIcon },
        { name: 'Emergency Broadcast', to: '/superadmin/broadcast', icon: SpeakerWaveIcon },
        { name: 'All Requests', to: '/superadmin/requests', icon: ListBulletIcon },
        { name: 'Departments', to: '/superadmin/departments', icon: BuildingOffice2Icon }
    ];

    const deptLinks = [
        { name: 'Overview', to: '/admin', icon: Squares2X2Icon },
        { name: 'Requests', to: '/admin/requests', icon: ListBulletIcon },
        { name: 'SLA Breaches', to: '/admin/sla', icon: ClockIcon },
        { name: 'Reports', to: '/admin/reports', icon: ChartBarIcon }
    ];

    const links = isSuper ? superLinks : deptLinks;

    return (
        <div className="w-[260px] bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-300">
            {/* Header / Brand */}
            <div className="p-6 pb-2 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="w-8 h-8 text-indigo-400" />
                    <span className="text-xl font-black text-white tracking-tight">JanSuvidha</span>
                </div>
                
                <div className="mt-6 flex flex-col gap-1.5">
                    {isSuper ? (
                        <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 py-1.5 px-3 rounded-lg border border-indigo-500/20 inline-block text-center w-full">
                            SUPER ADMIN
                        </div>
                    ) : (
                        <>
                            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 py-1.5 px-3 rounded-lg border border-emerald-500/20 inline-block text-center w-full">
                                DEPARTMENTAL
                            </div>
                            <div className="text-xs font-semibold text-white truncate text-center mt-1">
                                {DEPARTMENTS[department] || 'Unknown Dept'}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === '/superadmin' || link.to === '/admin'}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                            ${isActive 
                                ? 'bg-indigo-600/10 text-indigo-400 font-bold border border-indigo-500/20' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800 font-medium'}
                        `}
                    >
                        <link.icon className="w-5 h-5 shrink-0" />
                        <span className="text-sm">{link.name}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Sticky Bottom Actions */}
            <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
                <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                    <div className="flex flex-col truncate pr-2">
                        <span className="text-sm font-bold text-white truncate">{adminName || 'Admin'}</span>
                        <span className="text-xs text-slate-500 truncate">{isSuper ? 'System Root' : 'Authorized Personnel'}</span>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="p-2 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/30 rounded-lg transition-colors border border-transparent"
                        title="Log out"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
