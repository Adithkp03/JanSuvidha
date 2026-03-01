import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import useStore from '../store/useStore';
import { saveOfflineItem, getOfflineItem } from '../utils/offlineSync';
import { BoltIcon, FireIcon, BeakerIcon, BuildingOffice2Icon, HomeModernIcon, TruckIcon, ShieldExclamationIcon, BuildingLibraryIcon } from '@heroicons/react/24/solid';

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
                    setDepartments(resp.data.departments || []);
                    saveOfflineItem('catalog_depts', resp.data.departments);
                    setLoading(false);
                }
            } catch (err) {
                if (err.offline) {
                    const cached = await getOfflineItem('catalog_depts');
                    if (active && cached) {
                        setDepartments(cached);
                        setLoading(false);
                    }
                }
            }
        };
        fetchDepts();
        return () => active = false;
    }, []);

    if (loading) return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 mt-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex flex-col items-center animate-pulse">
                    <div className="w-24 h-24 bg-slate-200 rounded-full mb-4"></div>
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                </div>
            ))}
        </div>
    );

    const getDeptStyle = (idx) => {
        const styles = [
            'from-blue-500 to-indigo-600 shadow-blue-500/30 text-white',
            'from-emerald-400 to-teal-600 shadow-emerald-500/30 text-white',
            'from-orange-400 to-red-500 shadow-orange-500/30 text-white',
            'from-purple-500 to-fuchsia-600 shadow-purple-500/30 text-white',
            'from-cyan-400 to-blue-500 shadow-cyan-500/30 text-white',
            'from-rose-400 to-pink-600 shadow-rose-500/30 text-white'
        ];
        return styles[idx % styles.length];
    };

    const getDeptIcon = (iconName) => {
        switch (iconName) {
            case 'Zap': return <BoltIcon className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md text-yellow-300 group-hover:scale-110 transition-transform duration-300" />;
            case 'Flame': return <FireIcon className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md text-orange-200 group-hover:scale-110 transition-transform duration-300" />;
            case 'Droplets': return <BeakerIcon className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md text-blue-200 group-hover:scale-110 transition-transform duration-300" />;
            case 'Building2': return <BuildingOffice2Icon className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md text-purple-200 group-hover:scale-110 transition-transform duration-300" />;
            case 'Recycle': return <HomeModernIcon className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md text-emerald-200 group-hover:scale-110 transition-transform duration-300" />;
            case 'Wrench': return <TruckIcon className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md text-cyan-200 group-hover:scale-110 transition-transform duration-300" />;
            case 'AlertTriangle': return <ShieldExclamationIcon className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md text-rose-200 group-hover:scale-110 transition-transform duration-300" />;
            default: return <BuildingLibraryIcon className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-md text-white/90 group-hover:scale-110 transition-transform duration-300" />;
        }
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-y-12 gap-x-6 sm:gap-8 mt-6 pb-6">
            {departments.map((dept, idx) => {
                const gradient = getDeptStyle(idx);

                return (
                    <button
                        key={dept.code}
                        onClick={() => onSelect(dept)}
                        className="group flex flex-col items-center focus:outline-none"
                    >
                        <div className="relative mb-6">
                            {/* Animated Glow Ring */}
                            <div className="absolute inset-0 rounded-full bg-primary-400 opacity-0 group-hover:opacity-30 group-hover:scale-125 transition-all duration-500 blur-xl"></div>

                            {/* Premium Circular Icon Container */}
                            <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center bg-gradient-to-br ${gradient} shadow-lg group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-300 border-4 border-white`}>
                                {getDeptIcon(dept.icon)}
                            </div>

                            {/* Status Pill Indicator */}
                            {idx < 2 && (
                                <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-white border-2 border-slate-100 rounded-full text-[10px] font-bold tracking-wider text-primary-600 shadow-sm whitespace-nowrap z-10">
                                    {t('PopularTag')}
                                </div>
                            )}
                        </div>

                        <h3 className="font-extrabold text-slate-800 text-center leading-tight sm:text-lg group-hover:text-primary-700 transition-colors line-clamp-2">
                            {t(dept.name)}
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                            {t('ApplyHere')}
                        </p>
                    </button>
                );
            })}
        </div>
    );
}
