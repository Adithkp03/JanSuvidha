import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import useStore from '../../store/useStore';
import { saveOfflineItem, getOfflineItem } from '../../utils/offlineSync';
import AIHelper from '../../components/AIHelper';
import DepartmentGrid from '../../components/DepartmentGrid';
import ServiceCard from '../../components/ServiceCard';
import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function StartFlow() {
    const { t } = useTranslation();
    const [selectedDept, setSelectedDept] = useState(null);
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (!selectedDept) {
            setServices([]);
            return;
        }

        let active = true;
        const deptKey = selectedDept.code || selectedDept.id;
        const fetchServices = async () => {
            setLoadingServices(true);
            try {
                const resp = await api.get(`/services?department=${selectedDept.code}`);
                if (active) {
                    setServices(resp.data.services || []);
                    saveOfflineItem(`catalog_svc_${deptKey}`, resp.data.services);
                }
            } catch (err) {
                if (err.offline) {
                    const cached = await getOfflineItem(`catalog_svc_${deptKey}`);
                    if (active && cached) {
                        setServices(cached);
                    }
                }
            } finally {
                if (active) setLoadingServices(false);
            }
        };
        fetchServices();
        return () => active = false;
    }, [selectedDept]);

    const handleIntentResolved = async (resolved) => {
        if (!resolved?.department || !resolved?.service_type) return;
        try {
            const resp = await api.get(`/services?department=${resolved.department}`);
            const svc = (resp.data.services || []).find(s => s.service_type === resolved.service_type);
            if (svc) {
                navigate('/citizen/apply', { state: { serviceData: svc } });
            } else {
                navigate('/citizen/apply', { state: { serviceCode: resolved.service_type, department: resolved.department } });
            }
        } catch {
            navigate('/citizen/apply', { state: { serviceCode: resolved.service_type, department: resolved.department } });
        }
    };

    const handleServiceSelect = (service) => {
        navigate('/citizen/apply', { state: { serviceCode: service.code, serviceData: service } });
    };

    return (
        <div className="w-full flex flex-col gap-10 lg:gap-14 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">

            {/* Edge-to-Edge AI Hero Banner */}
            <section className="w-full">
                <AIHelper onIntentResolved={handleIntentResolved} />
            </section>

            {/* Main Content Area */}
            <section className="w-full">
                <div className="glass-card p-6 sm:p-10 lg:p-12 relative overflow-hidden">
                    {/* Decorative background blob */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary-100/50 rounded-full blur-3xl pointer-events-none"></div>

                    {!selectedDept ? (
                        <div className="relative z-10">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200/60 pb-6 mb-8 gap-4">
                                <div>
                                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{t('BrowseDepartments')}</h2>
                                    <p className="text-slate-500 mt-2 text-lg">{t('BrowseDepartmentsDesc')}</p>
                                </div>
                            </div>
                            <DepartmentGrid onSelect={setSelectedDept} />
                        </div>
                    ) : (
                        <div className="relative z-10 animate-in slide-in-from-right-8 duration-500">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-slate-200/60 pb-6 mb-8">
                                <button
                                    onClick={() => setSelectedDept(null)}
                                    className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all focus-ring shadow-sm"
                                    title="Back to Departments"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                    <span>{t('AllDepartments')}</span>
                                </button>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{t(selectedDept.name)}</h2>
                                        <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full border border-primary-100 shadow-sm whitespace-nowrap">
                                            {services.length} {t('Available')}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 mt-1">{t('SelectCategory')}</p>
                                </div>
                            </div>

                            {loadingServices ? (
                                <div className="py-24 flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin shadow-lg"></div>
                                    <p className="mt-6 text-slate-500 font-semibold animate-pulse">{t('FetchingServices')}</p>
                                </div>
                            ) : services.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-3xl border border-slate-100 border-dashed backdrop-blur-sm">
                                    <SparklesIcon className="w-16 h-16 text-slate-300 mb-4" />
                                    <h3 className="text-xl font-bold text-slate-700">{t('NoServicesFound')}</h3>
                                    <p className="text-slate-500 mt-2 max-w-md">{t('NoActiveServices')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                                    {services.map((svc, idx) => (
                                        <div key={svc.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
                                            <ServiceCard service={svc} onSelect={handleServiceSelect} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
