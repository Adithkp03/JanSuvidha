import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import useStore from '../../store/useStore';
import { saveOfflineItem, getOfflineItem } from '../../utils/offlineSync';
import AIHelper from '../../components/AIHelper';
import DepartmentGrid from '../../components/DepartmentGrid';
import ServiceCard from '../../components/ServiceCard';
import useSpeakAloud from '../../hooks/useSpeakAloud';
import { ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';

const FALLBACK_SERVICES = {
    electricity: [
        { id: 'elec_1', code: 'elec_bill_pay', service_type: 'elec_bill_pay', name: 'Pay Electricity Bill', description: 'Pay your current or outstanding electricity bill online.', fee_amount: 0, processing_days: 1 },
        { id: 'elec_2', code: 'elec_new_conn', service_type: 'elec_new_conn', name: 'New Connection', description: 'Apply for a new electricity connection for your premises.', fee_amount: 2000, processing_days: 14 },
        { id: 'elec_3', code: 'elec_load_change', service_type: 'elec_load_change', name: 'Load Change Request', description: 'Increase or decrease your sanctioned load.', fee_amount: 500, processing_days: 7 },
        { id: 'elec_4', code: 'elec_meter_fault', service_type: 'elec_meter_fault', name: 'Meter Fault Complaint', description: 'Report a faulty, damaged or stopped meter.', fee_amount: 0, processing_days: 3 },
        { id: 'elec_5', code: 'elec_outage', service_type: 'elec_outage', name: 'Power Outage Complaint', description: 'Report a power cut or supply disruption in your area.', fee_amount: 0, processing_days: 1 },
        { id: 'elec_6', code: 'elec_name_transfer', service_type: 'elec_name_transfer', name: 'Name Transfer', description: 'Transfer electricity connection to a new owner.', fee_amount: 300, processing_days: 10 },
        { id: 'elec_7', code: 'elec_bill_correction', service_type: 'elec_bill_correction', name: 'Bill Correction Request', description: 'Dispute or request correction for an incorrect bill.', fee_amount: 0, processing_days: 5 },
    ],
    gas: [
        { id: 'gas_1', code: 'gas_new_conn', service_type: 'gas_new_conn', name: 'New Gas Connection', description: 'Apply for a new household pipeline gas connection.', fee_amount: 1500, processing_days: 14 },
        { id: 'gas_2', code: 'gas_refill', service_type: 'gas_refill', name: 'Cylinder Refill Booking', description: 'Book a refill for your LPG cylinder.', fee_amount: 0, processing_days: 2 },
        { id: 'gas_3', code: 'gas_leakage', service_type: 'gas_leakage', name: 'Gas Leakage Complaint', description: 'Report a gas leak — emergency response dispatched.', fee_amount: 0, processing_days: 1 },
        { id: 'gas_4', code: 'gas_addr_change', service_type: 'gas_addr_change', name: 'Address Change', description: 'Update the delivery address on your gas account.', fee_amount: 100, processing_days: 5 },
        { id: 'gas_5', code: 'gas_regulator_issue', service_type: 'gas_regulator_issue', name: 'Regulator/Cylinder Issue', description: 'Report a faulty regulator or damaged cylinder.', fee_amount: 0, processing_days: 3 },
        { id: 'gas_6', code: 'gas_subsidy_kyc', service_type: 'gas_subsidy_kyc', name: 'Subsidy / KYC Update', description: 'Update KYC details to continue receiving LPG subsidy.', fee_amount: 0, processing_days: 7 },
    ],
    water: [
        { id: 'water_1', code: 'water_bill_pay', service_type: 'water_bill_pay', name: 'Pay Water Bill', description: 'Pay your water and sewage charges online.', fee_amount: 0, processing_days: 1 },
        { id: 'water_2', code: 'water_new_conn', service_type: 'water_new_conn', name: 'New Water Connection', description: 'Apply for a new tap water connection.', fee_amount: 3000, processing_days: 21 },
        { id: 'water_3', code: 'water_leakage', service_type: 'water_leakage', name: 'Leakage Complaint', description: 'Report a water pipe leak or tap leakage.', fee_amount: 0, processing_days: 2 },
        { id: 'water_4', code: 'water_low_pressure', service_type: 'water_low_pressure', name: 'Low Pressure Complaint', description: 'Report inadequate water pressure at your premises.', fee_amount: 0, processing_days: 3 },
        { id: 'water_5', code: 'water_quality', service_type: 'water_quality', name: 'Water Quality Complaint', description: 'Report dirty, contaminated or foul-smelling water.', fee_amount: 0, processing_days: 3 },
        { id: 'water_6', code: 'water_meter_issue', service_type: 'water_meter_issue', name: 'Water Meter Issue', description: 'Report a faulty or damaged water meter.', fee_amount: 0, processing_days: 5 },
    ],
    mc: [
        { id: 'mc_1', code: 'mc_birth_cert', service_type: 'mc_birth_cert', name: 'Birth Certificate', description: 'Register a birth and obtain the official certificate.', fee_amount: 50, processing_days: 5 },
        { id: 'mc_2', code: 'mc_death_cert', service_type: 'mc_death_cert', name: 'Death Certificate', description: 'Register a death and obtain the official certificate.', fee_amount: 50, processing_days: 5 },
        { id: 'mc_3', code: 'mc_marriage_cert', service_type: 'mc_marriage_cert', name: 'Marriage Certificate', description: 'Apply for an official marriage registration certificate.', fee_amount: 100, processing_days: 7 },
        { id: 'mc_4', code: 'mc_prop_tax', service_type: 'mc_prop_tax', name: 'Property Tax Payment', description: 'Pay your annual municipal property tax.', fee_amount: 0, processing_days: 1 },
        { id: 'mc_5', code: 'mc_trade_license', service_type: 'mc_trade_license', name: 'Trade License', description: 'Apply for or renew a business trade license.', fee_amount: 500, processing_days: 15 },
        { id: 'mc_6', code: 'mc_caste_income_residence', service_type: 'mc_caste_income_residence', name: 'Caste / Income / Residence Certificate', description: 'Apply for caste, income or residence certificates.', fee_amount: 30, processing_days: 7 },
        { id: 'mc_7', code: 'mc_pension', service_type: 'mc_pension', name: 'Pension Application', description: 'Apply for old age, widow or disability pension.', fee_amount: 0, processing_days: 30 },
    ],
    waste: [
        { id: 'waste_1', code: 'waste_garbage_not_collected', service_type: 'waste_garbage_not_collected', name: 'Garbage Not Collected', description: 'Report missed garbage collection in your area.', fee_amount: 0, processing_days: 1 },
        { id: 'waste_2', code: 'waste_bulk_pickup', service_type: 'waste_bulk_pickup', name: 'Bulk Waste Pickup', description: 'Schedule pickup for large or bulk waste items.', fee_amount: 200, processing_days: 3 },
        { id: 'waste_3', code: 'waste_street_cleaning', service_type: 'waste_street_cleaning', name: 'Street Cleaning Request', description: 'Request cleaning for a dirty or littered street.', fee_amount: 0, processing_days: 2 },
        { id: 'waste_4', code: 'waste_dumping', service_type: 'waste_dumping', name: 'Illegal Dumping Complaint', description: 'Report illegal waste dumping in your locality.', fee_amount: 0, processing_days: 2 },
        { id: 'waste_5', code: 'waste_toilet_maintenance', service_type: 'waste_toilet_maintenance', name: 'Public Toilet Maintenance', description: 'Report a broken or unclean public toilet.', fee_amount: 0, processing_days: 2 },
    ],
    public_works: [
        { id: 'pw_1', code: 'pw_road_damage', service_type: 'pw_road_damage', name: 'Road Damage / Pothole', description: 'Report a pothole or road damage in your area.', fee_amount: 0, processing_days: 7 },
        { id: 'pw_2', code: 'pw_streetlight', service_type: 'pw_streetlight', name: 'Streetlight Not Working', description: 'Report a non-functional or damaged streetlight.', fee_amount: 0, processing_days: 3 },
        { id: 'pw_3', code: 'pw_drainage', service_type: 'pw_drainage', name: 'Drainage Blockage', description: 'Report a blocked or overflowing drain.', fee_amount: 0, processing_days: 3 },
    ],
    emergency: [
        { id: 'em_1', code: 'emergency_hazard', service_type: 'emergency_hazard', name: 'Report Safety Hazard', description: 'Report an immediate safety hazard in a public area.', fee_amount: 0, processing_days: 1 },
        { id: 'em_2', code: 'emergency_disaster_relief', service_type: 'emergency_disaster_relief', name: 'Disaster Relief Request', description: 'Request emergency assistance or disaster relief.', fee_amount: 0, processing_days: 1 },
        { id: 'em_3', code: 'emergency_alert_info', service_type: 'emergency_alert_info', name: 'Emergency Helpline Info', description: 'Get emergency contact numbers and helpline information.', fee_amount: 0, processing_days: 1 },
    ],
};

export default function StartFlow() {
    const { t } = useTranslation();
    const [selectedDept, setSelectedDept] = useState(null);
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);

    const navigate = useNavigate();
    const seniorMode = useStore((s) => s.seniorMode);
    const { speak } = useSpeakAloud();

    // Auto read-aloud on mount
    useEffect(() => {
        if (seniorMode) {
            if (!selectedDept) {
                const depts = "Electricity, Gas Utility, Water Supply, Municipal, Waste Management, Public Works, Emergency";
                speak(`${t('HowCanWeHelpYou')} ${t('AIDescription')} ${t('BrowseDepartments')}. ${t('BrowseDepartmentsDesc')} ${depts}`);
            }
        }
    }, [seniorMode, selectedDept, speak, t]);

    // Auto read-aloud on department selection
    useEffect(() => {
        if (seniorMode && selectedDept) {
            if (services.length > 0) {
                 const serviceNames = services.map(s => t(s.name)).join(", ");
                 speak(`${t(selectedDept.name)}. ${services.length} ${t('Available')}. ${t('SelectCategory')}. ${serviceNames}`);
            } else if (!loadingServices) {
                 speak(`${t(selectedDept.name)}. ${t('NoServicesFound')}`);
            }
        }
    }, [selectedDept, seniorMode, services, loadingServices, speak, t]);

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
                // Try offline cache first
                const cached = await getOfflineItem(`catalog_svc_${deptKey}`);
                if (active && cached) {
                    setServices(cached);
                } else if (active) {
                    // Final fallback: use static services for this department
                    const deptCode = (selectedDept.code || '').toLowerCase();
                    const fallback = FALLBACK_SERVICES[deptCode] || [];
                    setServices(fallback);
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