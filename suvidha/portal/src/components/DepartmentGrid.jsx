import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import useStore from '../store/useStore';
import { saveOfflineItem, getOfflineItem } from '../utils/offlineSync';
import { Zap, Flame, Droplets, Building2, Recycle, Wrench, AlertTriangle, LibraryBig } from 'lucide-react';

const FALLBACK_DEPARTMENTS = [
    { id: 'dept_elec', code: 'electricity', name: 'Electricity', icon: 'Zap', description: 'desc_electricity', accentColor: 'from-amber-500 to-amber-600 bg-amber-500', tag: 'tag_energy' },
    { id: 'dept_gas', code: 'gas', name: 'Gas Utility', icon: 'Flame', description: 'desc_gas', accentColor: 'from-orange-500 to-orange-600 bg-orange-500', tag: 'tag_energy' },
    { id: 'dept_water', code: 'water', name: 'Water Supply', icon: 'Droplets', description: 'desc_water', accentColor: 'from-sky-500 to-sky-600 bg-sky-500', tag: 'tag_utilities' },
    { id: 'dept_mc', code: 'mc', name: 'Municipal', icon: 'Building2', description: 'desc_municipal', accentColor: 'from-indigo-500 to-indigo-600 bg-indigo-500', tag: 'tag_civic' },
    { id: 'dept_waste', code: 'waste', name: 'Waste Mgmt', icon: 'Recycle', description: 'desc_waste', accentColor: 'from-emerald-500 to-emerald-600 bg-emerald-500', tag: 'tag_sanitation' },
    { id: 'dept_pw', code: 'public_works', name: 'Public Works', icon: 'Wrench', description: 'desc_public_works', accentColor: 'from-slate-500 to-slate-600 bg-slate-500', tag: 'tag_infrastructure' },
    { id: 'dept_emergency', code: 'emergency', name: 'Emergency', icon: 'AlertTriangle', description: 'desc_emergency', accentColor: 'from-rose-500 to-rose-600 bg-rose-500', tag: 'tag_priority' },
];

export default function DepartmentGrid({ onSelect }) {
    const { t } = useTranslation();
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const fetchDepts = async () => {
            try {
                const resp = await api.get('/departments');
                if (active) {
                    // Merge fallback visual metadata (tag, color, description key) with API data
                    const enrichedDepts = (resp.data.departments || []).map(apiDept => {
                        const fallback = FALLBACK_DEPARTMENTS.find(f => f.code === apiDept.code) || FALLBACK_DEPARTMENTS[3];
                        return {
                            ...apiDept,
                            description: fallback.description,
                            accentColor: fallback.accentColor,
                            tag: fallback.tag
                        };
                    });
                    setDepartments(enrichedDepts);
                    saveOfflineItem('catalog_depts', enrichedDepts);
                    setLoading(false);
                }
            } catch (err) {
                const cached = await getOfflineItem('catalog_depts');
                if (active && cached) {
                    setDepartments(cached);
                } else if (active) {
                    setDepartments(FALLBACK_DEPARTMENTS);
                }
                if (active) setLoading(false);
            }
        };
        fetchDepts();
        return () => active = false;
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-12 mb-20 px-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex flex-col items-center p-8 bg-white rounded-[2rem] animate-pulse h-64 border border-slate-100 shadow-xl relative pt-16">
                    <div className="absolute -top-10 w-24 h-24 bg-slate-200" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}></div>
                    <div className="h-3 w-16 bg-slate-200 rounded mb-4 mt-2"></div>
                    <div className="h-6 w-32 bg-slate-300 rounded mb-4"></div>
                    <div className="h-4 w-48 bg-slate-200 rounded"></div>
                    <div className="h-4 w-40 bg-slate-200 rounded mt-2"></div>
                </div>
            ))}
        </div>
    );

    const getDeptIcon = (iconName) => {
        const baseProps = { size: 32, strokeWidth: 2, className: "text-white fill-white/20 relative z-20" };
        switch (iconName) {
            case 'Zap': return <Zap {...baseProps} />;
            case 'Flame': return <Flame {...baseProps} />;
            case 'Droplets': return <Droplets {...baseProps} />;
            case 'Building2': return <Building2 {...baseProps} />;
            case 'Recycle': return <Recycle {...baseProps} />;
            case 'Wrench': return <Wrench {...baseProps} />;
            case 'AlertTriangle': return <AlertTriangle {...baseProps} />;
            default: return <LibraryBig {...baseProps} />;
        }
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-x-8 gap-x-6 gap-y-20 mt-16 pb-20 px-2 lg:px-4">
            {departments.map((dept) => {
                let displayName = t(dept.name).replace(/\s+Department$/i, '').replace(/\s+विभाग$/i, '');

                return (
                    <button
                        key={dept.code}
                        onClick={() => onSelect(dept)}
                        className="group relative flex flex-col items-center bg-white rounded-[2.5rem] p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] focus:outline-none active:scale-95 border-b shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] border border-slate-50 pt-14 h-full"
                    >
                        {/* Hexagon Icon - Breaks out of the top of the card */}
                        <div className="absolute -top-10 z-10 transition-transform duration-500 group-hover:scale-110 drop-shadow-lg">
                            <div
                                className={`w-20 h-20 flex items-center justify-center bg-gradient-to-br ${dept.accentColor} relative overflow-hidden`}
                                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                            >
                                {/* Geometric overlays to give it that 3D faceted gem look from the mockup */}
                                <div className="absolute inset-0 bg-white/20" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)' }}></div>
                                <div className="absolute inset-0 bg-black/10" style={{ clipPath: 'polygon(0% 50%, 50% 50%, 50% 100%, 0% 100%)' }}></div>
                                {getDeptIcon(dept.icon)}
                            </div>
                        </div>

                        {/* Card Content */}
                        <div className="mt-4 flex-1 flex flex-col items-center w-full">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4 transition-colors group-hover:text-slate-500">
                                {t(dept.tag)}
                            </span>
                            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                                {displayName}
                            </h3>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[90%]">
                                {t(dept.description)}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}