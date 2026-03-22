import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FormRenderer from '../../components/FormRenderer';
import DocumentUploader from '../../components/DocumentUploader';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import LanguageSelector from '../../components/LanguageSelector';
import api from '../../services/api';
import useStore from '../../store/useStore';
import useSpeakAloud from '../../hooks/useSpeakAloud';
import { CheckCircleIcon, DocumentTextIcon, UserIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Loader2, X, Accessibility, User, LogOut } from 'lucide-react';
import AppLogo from '@/assets/logo.png';

export default function DynamicForm() {
    const { t } = useTranslation();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useStore();
    const setSeniorMode = useStore((s) => s.setSeniorMode);

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({});
    const [uploadedDocs, setUploadedDocs] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [serviceData, setServiceData] = useState(state?.serviceData || null);
    const [loading, setLoading] = useState(!state?.serviceData && !!state?.serviceCode);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const seniorMode = useStore((s) => s.seniorMode);
    const { speak } = useSpeakAloud();

    // Fallback service definitions for when the backend is offline
    const FALLBACK_SERVICES = {
        elec_bill_pay: { service_type: 'elec_bill_pay', name: 'Pay Electricity Bill', description: 'Pay your current or outstanding electricity bill online.', department: 'electricity', fee_amount: 0, processing_days: 1, required_documents: [], form_schema: [{ name: 'consumer_number', label: 'ConsumerNumber', type: 'text', required: true }, { name: 'issue_description', label: 'IssueDescription', type: 'textarea', required: true }] },
        elec_new_conn: { service_type: 'elec_new_conn', name: 'New Electricity Connection', description: 'Apply for a new electricity connection.', department: 'electricity', fee_amount: 2000, processing_days: 14, required_documents: ['id_proof', 'address_proof'], form_schema: [{ name: 'full_name', label: 'FullName', type: 'text', required: true }, { name: 'address', label: 'Address', type: 'textarea', required: true }, { name: 'phone', label: 'Phone', type: 'text', required: true }] },
        water_connection: { service_type: 'water_connection', name: 'Water Connection', description: 'Apply for a new water supply connection.', department: 'water', fee_amount: 1500, processing_days: 21, required_documents: ['id_proof', 'address_proof'], form_schema: [{ name: 'full_name', label: 'FullName', type: 'text', required: true }, { name: 'address', label: 'Address', type: 'textarea', required: true }, { name: 'phone', label: 'Phone', type: 'text', required: true }] },
        birth_cert: { service_type: 'birth_cert', name: 'Birth Certificate', description: 'Apply for a birth certificate.', department: 'mc', fee_amount: 50, processing_days: 7, required_documents: ['hospital_record'], form_schema: [{ name: 'child_name', label: 'ChildName', type: 'text', required: true }, { name: 'date_of_birth', label: 'DateOfBirth', type: 'date', required: true }, { name: 'hospital_name', label: 'HospitalName', type: 'text', required: true }] },
        property_tax: { service_type: 'property_tax', name: 'Property Tax Payment', description: 'Pay your property tax online.', department: 'mc', fee_amount: 0, processing_days: 1, required_documents: [], form_schema: [{ name: 'property_id', label: 'PropertyID', type: 'text', required: true }, { name: 'owner_name', label: 'OwnerName', type: 'text', required: true }] },
        emergency_disaster_relief: { service_type: 'emergency_disaster_relief', name: 'Emergency Relief', description: 'Apply for emergency disaster relief assistance.', department: 'emergency', fee_amount: 0, processing_days: 1, required_documents: [], form_schema: [{ name: 'full_name', label: 'FullName', type: 'text', required: true }, { name: 'emergency_type', label: 'EmergencyType', type: 'select', required: true, options: ['Flood', 'Fire', 'Earthquake', 'Other'] }, { name: 'description', label: 'IssueDescription', type: 'textarea', required: true }] },
    };

    useEffect(() => {
        if (state?.serviceData) {
            setServiceData(state.serviceData);
            return;
        }
        if (state?.serviceCode && state?.department) {
            setLoading(true);
            api.get(`/services?department=${state.department}`)
                .then(resp => {
                    const svc = (resp.data.services || []).find(s => s.service_type === state.serviceCode);
                    if (svc) setServiceData(svc);
                    else {
                        // API returned but service not found — use fallback
                        const fallback = FALLBACK_SERVICES[state.serviceCode];
                        if (fallback) setServiceData(fallback);
                    }
                })
                .catch(() => {
                    // API completely failed — use fallback
                    const fallback = FALLBACK_SERVICES[state.serviceCode];
                    if (fallback) setServiceData(fallback);
                })
                .finally(() => setLoading(false));
        }
    }, [state?.serviceData, state?.serviceCode, state?.department]);

    if (!serviceData) {
        if (loading) return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-[#0B3D2E] rounded-full animate-spin"></div>
                <p className="mt-6 text-[#0B3D2E] font-black text-lg animate-pulse">{t('LoadingApp')}</p>
            </div>
        );
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <DocumentTextIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-black text-[#0B3D2E] mb-2">{t('ServiceNotFound')}</h2>
                <p className="text-gray-500 font-bold mb-6 max-w-sm">{t('ServiceNotFoundDesc')}</p>
                <button onClick={() => navigate('/citizen')} className="px-8 py-4 bg-[#0B3D2E] text-white rounded-2xl font-black hover:bg-[#0F6B4A] transition-colors shadow-lg">{t('ReturnToDashboard')}</button>
            </div>
        );
    }

    const docsRequired = (serviceData.code === 'elec_bill_pay' || serviceData.service_type === 'elec_bill_pay')
        ? []
        : (serviceData.required_documents || []);
    const formSchema = serviceData.form_schema || [];

    // Auto read-aloud on step change
    useEffect(() => {
        if (!seniorMode) return;
        const labels = { 1: t('FillDetails'), 2: t('UploadDocs'), 3: t('ReviewAndSubmit') };
        let contentToRead = `${t(serviceData?.name || '')}. Step ${step}: ${labels[step] || ''}. `;
        
        if (step === 1 && formSchema.length > 0) {
            const fields = formSchema.map(f => t(f.label)).join(", ");
            contentToRead += `Please fill in the following fields: ${fields}.`;
        } else if (step === 2 && docsRequired.length > 0) {
            const docs = docsRequired.map(d => d.replace(/_/g, ' ')).join(", ");
            contentToRead += `Please upload the following required documents: ${docs}.`;
        } else if (step === 3) {
            contentToRead += `Please review your application details below and click Submit Securely to proceed.`;
        }
        
        speak(contentToRead);
    }, [step, seniorMode, serviceData, formSchema, docsRequired, speak, t]);

    const handleFormSubmit = (data) => {
        setFormData(data);
        if (docsRequired.length > 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setStep(2);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setStep(3);
        }
    };

    const handleDocUploaded = (type, doc) => {
        setUploadedDocs(prev => {
            const next = { ...prev };
            if (doc) next[type] = doc;
            else delete next[type];
            return next;
        });
    };

    const proceedToReview = () => {
        const missing = docsRequired.filter(d => !uploadedDocs[d]);
        if (missing.length > 0) {
            setError(`${t('PleaseUploadAllRequiredDocs')}: ${missing.join(', ').replace(/_/g, ' ')}`);
            return;
        }
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setStep(3);
    };

    const handleSubmitClick = () => {
        if (seniorMode) {
            setShowConfirm(true);
        } else {
            submitApplication();
        }
    };

    const submitApplication = async () => {
        setShowConfirm(false);
        setSubmitting(true);
        setError('');

        const documentsPayload = Object.values(uploadedDocs).map(d => ({
            key: d.object_key,
            doc_type: d.doc_type,
            filename: d.filename,
            pendingSync: d.pendingSync
        }));

        const payload = {
            department: serviceData.department,
            service_type: serviceData.service_type,
            payload: {
                ...formData,
                documents: documentsPayload,
                user_email: user?.email || ''
            }
        };

        try {
            const reqPayload = { department: serviceData.department, service_type: serviceData.service_type, payload: formData };
            const resp = await api.post('/requests', reqPayload);
            const reqId = resp.data.id;

            for (const d of documentsPayload) {
                if (d.object_key && !d.pendingSync) {
                    try {
                        await api.post(`/requests/${reqId}/documents`, {
                            filename: d.filename || `${d.doc_type}.pdf`,
                            storage_path: d.object_key,
                            mime_type: 'application/pdf',
                        });
                    } catch (e) { console.warn('Doc registration failed', e); }
                }
            }
            navigate(`/citizen/payment/${reqId}`, { replace: true });
        } catch (err) {
            console.error(err);
            if (err.offline) {
                const id = 'draft-' + Date.now();
                useStore.getState().addToQueue({ id, type: 'REQUEST_SUBMIT', payload });
                navigate(`/citizen/receipt/${id}`, { replace: true, state: { offline: true } });
            } else {
                setError(err.response?.data?.error || 'A secure connection could not be established to submit the application.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Stepper Configuration
    const steps = [
        { num: 1, label: t('FillDetails'), icon: UserIcon },
        { num: 2, label: t('UploadDocs'), icon: DocumentTextIcon, hidden: docsRequired.length === 0 },
        { num: 3, label: t('ReviewAndSubmit'), icon: CheckBadgeIcon }
    ].filter(s => !s.hidden);

    const activeStepIndex = steps.findIndex(s => s.num === step);

    return (
        <div className="min-h-screen bg-[#0B3D2E] font-sans selection:bg-[#6FD6A6]/30 overflow-x-hidden flex flex-col items-center justify-center p-4 md:p-8 relative">
            
            {/* Ambient Background Blobs */}
            <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0F6B4A] rounded-full blur-[120px] opacity-40 animate-pulse"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#6FD6A6] rounded-full blur-[150px] opacity-10"></div>

            {showConfirm && (
                <ConfirmationDialog
                    onConfirm={submitApplication}
                    onCancel={() => setShowConfirm(false)}
                />
            )}
            
            <div className="relative w-full max-w-[1200px] bg-white/95 backdrop-blur-xl rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/20 flex flex-col transition-all duration-500 overflow-hidden flex-1">
                
                <header className="px-6 sm:px-12 py-6 sm:py-8 flex items-center justify-between border-b border-gray-100 relative">
                    <div className="flex items-center gap-3 sm:gap-5">
                        <button 
                            onClick={() => navigate('/citizen')}
                            className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-[#0B3D2E] transition-all"
                        >
                            <ArrowLeftIcon className="w-6 h-6" strokeWidth={3} />
                        </button>
                        <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden">
                            <img src={AppLogo} alt="JanSuvidha Logo" className="w-full h-full object-contain" />
                        </div>
                        <div className="hidden xs:block">
                            <h1 className="text-lg sm:text-xl font-black text-[#0B3D2E] tracking-tight leading-none uppercase">JanSuvidha</h1>
                            <p className="text-[8px] sm:text-[10px] font-black text-[#0F6B4A]/60 tracking-[0.3em] uppercase mt-1">{t('Title')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setSeniorMode(!seniorMode)}
                            className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all duration-300 ${seniorMode ? 'bg-[#0B3D2E] text-white border-[#0B3D2E]' : 'bg-gray-50 border-transparent hover:border-emerald-200 text-gray-700'}`}
                        >
                            <Accessibility className={`${seniorMode ? 'animate-bounce' : ''}`} size={22} />
                            <span className={`font-black uppercase tracking-tight ${seniorMode ? 'text-lg' : 'text-sm'}`}>{t('SeniorMode')}</span>
                        </button>

                        <div className="relative">
                            <LanguageSelector />
                        </div>

                        <div className="pl-2 sm:pl-4 border-l border-gray-200 flex items-center gap-2 sm:gap-3 relative">
                            <div className="hidden sm:flex flex-col items-end mr-1 text-right">
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Verified</span>
                                <span className="text-sm font-bold text-[#0B3D2E]">{user?.name || t('Citizen')}</span>
                            </div>
                            <button 
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#0F6B4A]/10 flex items-center justify-center border-2 border-white shadow-md overflow-hidden hover:bg-[#0F6B4A]/20 transition-all active:scale-95"
                            >
                                <User className="text-[#0B3D2E]" />
                            </button>

                            {showProfileMenu && (
                                <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100] animate-in fade-in slide-in-from-top-2">
                                    <div className="px-4 py-3 border-b border-gray-50 sm:hidden">
                                        <p className="text-xs font-black text-emerald-600 uppercase">Verified</p>
                                        <p className="font-bold text-[#0B3D2E]">{user?.name || t('Citizen')}</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const { logout } = useStore.getState();
                                            logout();
                                            navigate('/');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 font-bold transition-colors"
                                    >
                                        <LogOut size={18} />
                                        <span>{t('SignOut')}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-6 sm:px-12 py-10 overflow-y-auto custom-scrollbar">
                    
                    {/* Premium Stepper */}
                    <div className="mb-16 relative w-full max-w-2xl mx-auto hidden sm:block">
                        <div className="absolute top-1/2 left-0 w-full h-1.5 bg-gray-100 -translate-y-1/2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#0B3D2E] to-[#6FD6A6] transition-all duration-700 ease-in-out"
                                style={{ width: `${(activeStepIndex / (steps.length - 1)) * 100}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-between relative z-10 w-full">
                            {steps.map((s, idx) => {
                                const isCompleted = idx < activeStepIndex;
                                const isActive = idx === activeStepIndex;
                                const Icon = s.icon;

                                return (
                                    <div key={s.num} className="flex flex-col items-center group">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 border-4 border-white ${isActive ? 'bg-[#0B3D2E] text-white scale-110 shadow-[#0B3D2E]/20' :
                                            isCompleted ? 'bg-[#0F6B4A] text-white cursor-pointer hover:scale-105' :
                                                'bg-gray-100 text-gray-400'
                                            }`}
                                            onClick={() => { if (isCompleted) setStep(s.num); }}
                                        >
                                            {isCompleted ? <CheckCircleIcon className="w-7 h-7" /> : <Icon className="w-6 h-6" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        {step === 1 && (
                            <FormRenderer
                                schema={formSchema}
                                onSubmit={handleFormSubmit}
                                onBack={() => navigate('/citizen')}
                                defaultValues={formData}
                            />
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="border-b border-gray-100 pb-6 mb-8">
                                    <h3 className="text-3xl font-black text-[#0B3D2E] mb-2">{t('ProvideDocs')}</h3>
                                    <p className="text-gray-500 font-bold">{t('UploadDocsDesc')}</p>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-3 bg-red-50 text-red-700 p-5 rounded-3xl border border-red-100 font-bold shadow-sm mb-8">
                                        <X className="w-6 h-6 shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {docsRequired.map(req => (
                                        <DocumentUploader
                                            key={req}
                                            requirement={req}
                                            existingDoc={uploadedDocs[req]}
                                            onUploaded={handleDocUploaded}
                                        />
                                    ))}
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-4 pt-10 mt-10 border-t border-gray-100">
                                    <button onClick={() => setStep(1)} className="w-full sm:w-auto px-8 py-4 font-black text-[#0B3D2E] hover:bg-gray-50 rounded-2xl transition-all uppercase tracking-widest text-xs">
                                        &larr; {t('Back')}
                                    </button>
                                    <button onClick={proceedToReview} className="w-full sm:w-auto px-10 py-5 bg-[#0B3D2E] text-white font-black text-lg rounded-2xl shadow-xl hover:bg-[#0F6B4A] transition-all active:scale-95 uppercase tracking-tighter">
                                        {t('ReviewApplication')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500 text-left">
                                <div className="border-b border-gray-100 pb-6 mb-8">
                                    <h3 className="text-3xl font-black text-[#0B3D2E] mb-2">{t('ApplicationSummary')}</h3>
                                    <p className="text-gray-500 font-bold">{t('VerifyInfoDesc')}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <h4 className="font-black text-[#0B3D2E] flex items-center gap-3 text-xl uppercase tracking-tight">
                                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                                <UserIcon className="w-6 h-6" />
                                            </div>
                                            {t('ApplicantDetails')}
                                        </h4>
                                        <div className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100">
                                            <dl className="space-y-6">
                                                {Object.keys(formData).map(key => (
                                                    <div key={key}>
                                                        <dt className="text-[10px] font-black text-[#0F6B4A]/60 uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</dt>
                                                        <dd className="text-lg font-black text-[#0B3D2E]">{formData[key]?.toString() || '—'}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        </div>
                                    </div>

                                    {docsRequired.length > 0 && (
                                        <div className="space-y-6">
                                            <h4 className="font-black text-[#0B3D2E] flex items-center gap-3 text-xl uppercase tracking-tight">
                                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                                    <DocumentTextIcon className="w-6 h-6" />
                                                </div>
                                                {t('AttachedFiles')}
                                            </h4>
                                            <div className="space-y-4">
                                                {docsRequired.map(req => (
                                                    <div key={req} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                                        <CheckCircleIcon className="w-6 h-6 text-[#6FD6A6]" />
                                                        <div>
                                                            <p className="text-[10px] font-black text-[#0F6B4A]/60 uppercase tracking-widest">{req.replace(/_/g, ' ')}</p>
                                                            <p className="text-sm font-bold text-[#0B3D2E] truncate">{uploadedDocs[req]?.filename}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-[#0B3D2E] rounded-[40px] p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden mt-12">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#6FD6A6]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                    <div className="relative z-10 flex-1">
                                        <h4 className="text-white font-black text-xl mb-2">{t('ReadyToSubmit')}</h4>
                                        <p className="text-white/60 font-bold text-sm tracking-tight">{t('TermsAndConditions')}</p>
                                    </div>
                                    <button
                                        disabled={submitting}
                                        onClick={handleSubmitClick}
                                        className="relative z-10 w-full md:w-auto px-12 py-5 bg-[#6FD6A6] text-[#0B3D2E] font-black text-xl rounded-2xl shadow-xl hover:bg-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {submitting ? <Loader2 className="animate-spin" /> : t('SubmitSecurely')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 20px; }
            `}</style>
        </div>
    );
}
