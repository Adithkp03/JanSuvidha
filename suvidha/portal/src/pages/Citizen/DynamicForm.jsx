import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import FormRenderer from '../../components/FormRenderer';
import DocumentUploader from '../../components/DocumentUploader';
import api from '../../services/api';
import useStore from '../../store/useStore';
import { CheckCircleIcon, DocumentTextIcon, UserIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

export default function DynamicForm() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useStore();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({});
    const [uploadedDocs, setUploadedDocs] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [serviceData, setServiceData] = useState(state?.serviceData || null);
    const [loading, setLoading] = useState(false);

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
                })
                .finally(() => setLoading(false));
        }
    }, [state?.serviceData, state?.serviceCode, state?.department]);

    if (!serviceData) {
        if (loading) return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 font-bold animate-pulse">Loading Application Details...</p>
            </div>
        );
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <DocumentTextIcon className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Service Not Found</h2>
                <p className="text-slate-500 mb-6 max-w-sm">We couldn't locate the details for this service. Please return to the dashboard and try again.</p>
                <button onClick={() => navigate('/citizen')} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">Return to Dashboard</button>
            </div>
        );
    }

    const docsRequired = serviceData.required_documents || [];
    const formSchema = serviceData.form_schema || [];

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
            setError(`Please upload all required documents: ${missing.join(', ').replace(/_/g, ' ')}`);
            return;
        }
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setStep(3);
    };

    const submitApplication = async () => {
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
        { num: 1, label: 'Fill Details', icon: UserIcon },
        { num: 2, label: 'Upload Docs', icon: DocumentTextIcon, hidden: docsRequired.length === 0 },
        { num: 3, label: 'Review & Submit', icon: CheckBadgeIcon }
    ].filter(s => !s.hidden);

    const activeStepIndex = steps.findIndex(s => s.num === step);

    return (
        <div className="max-w-5xl mx-auto py-8 lg:py-12 px-4 sm:px-6">

            {/* Context Header */}
            <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center p-1.5 bg-primary-50 rounded-full mb-4 shadow-sm border border-primary-100">
                    <span className="px-3 py-1 bg-white text-primary-700 text-xs font-black tracking-widest uppercase rounded-full shadow-sm">
                        {serviceData.department}
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-tight mb-4">{serviceData.name}</h1>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto">{serviceData.description}</p>
            </div>

            {/* Redesigned Premium Stepper */}
            <div className="mb-12 relative w-full max-w-3xl mx-auto hidden sm:block">
                {/* Connecting Lines */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 transition-all duration-700 ease-in-out"
                        style={{ width: `${(activeStepIndex / (steps.length - 1)) * 100}%` }}
                    ></div>
                </div>

                <div className="flex justify-between relative z-10 w-full">
                    {steps.map((s, idx) => {
                        const isCompleted = idx < activeStepIndex;
                        const isActive = idx === activeStepIndex;
                        const isPending = idx > activeStepIndex;
                        const Icon = s.icon;

                        return (
                            <div key={s.num} className="flex flex-col items-center group">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 border-4 border-white ${isActive ? 'bg-primary-600 text-white scale-110 shadow-primary-500/40 outline outline-4 outline-primary-50' :
                                        isCompleted ? 'bg-indigo-500 text-white hover:bg-indigo-600 cursor-pointer' :
                                            'bg-slate-100 text-slate-400'
                                    }`}
                                    onClick={() => { if (isCompleted) setStep(s.num); }}
                                >
                                    {isCompleted ? <CheckCircleIcon className="w-7 h-7" /> : <Icon className="w-6 h-6" />}
                                </div>
                                <span className={`mt-4 text-sm font-bold uppercase tracking-wider ${isActive ? 'text-primary-800' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Stepper Text */}
            <div className="sm:hidden mb-8 text-center bg-white py-3 px-4 rounded-full shadow-sm border border-slate-100 font-bold text-slate-700">
                Step {activeStepIndex + 1} of {steps.length}: <span className="text-primary-600">{steps[activeStepIndex].label}</span>
            </div>

            {/* Container for Content */}
            <div className="glass-card shadow-xl rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Step Content */}
                <div className="p-6 sm:p-10 lg:p-14">

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
                            <div className="border-b border-slate-100 pb-6 mb-8">
                                <h3 className="text-2xl font-black text-slate-800 mb-2">Provide Documentation</h3>
                                <p className="text-slate-500 text-lg">Please upload clear, legible copies of the following official documents.</p>
                            </div>

                            {error && (
                                <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 font-bold shadow-sm mb-8">
                                    <svg className="w-6 h-6 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
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

                            <div className="flex flex-col-reverse sm:flex-row justify-between items-center sm:gap-4 pt-10 mt-10 border-t border-slate-100">
                                <button onClick={() => setStep(1)} className="w-full sm:w-auto mt-4 sm:mt-0 px-8 py-4 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                                    &larr; Back to Details
                                </button>
                                <button onClick={proceedToReview} className="w-full sm:w-auto px-10 py-4 bg-slate-900 text-white font-extrabold text-lg rounded-xl shadow-xl hover:bg-primary-600 hover:shadow-primary-500/30 transition-all duration-300">
                                    Review Application
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">

                            <div className="text-center sm:text-left border-b border-slate-100 pb-6">
                                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">Application Summary</h3>
                                <p className="text-slate-500 text-lg">Verify your information before finalizing the submission.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                                {/* Left Col - Form Data */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-black text-slate-800 flex items-center gap-2 text-xl">
                                            <UserIcon className="w-6 h-6 text-primary-500" />
                                            Applicant Details
                                        </h4>
                                        <button onClick={() => setStep(1)} className="text-sm font-bold text-primary-600 hover:underline">Edit</button>
                                    </div>
                                    <div className="bg-slate-50/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-slate-200">
                                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                                            {Object.keys(formData).map(key => (
                                                <div key={key} className="break-words">
                                                    <dt className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
                                                        {key.replace(/_/g, ' ')}
                                                    </dt>
                                                    <dd className="text-base font-bold text-slate-800">
                                                        {formData[key]?.toString() || <span className="text-slate-400 italic">Not Provided</span>}
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </div>
                                </div>

                                {/* Right Col - Documents Data */}
                                {docsRequired.length > 0 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-black text-slate-800 flex items-center gap-2 text-xl">
                                                <DocumentTextIcon className="w-6 h-6 text-amber-500" />
                                                Attached Files
                                            </h4>
                                            <button onClick={() => setStep(2)} className="text-sm font-bold text-primary-600 hover:underline">Edit</button>
                                        </div>
                                        <div className="bg-emerald-50/50 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-emerald-100/50">
                                            <ul className="space-y-4">
                                                {docsRequired.map(req => (
                                                    <li key={req} className="flex gap-4 items-start bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
                                                        <CheckCircleIcon className="w-7 h-7 text-emerald-500 shrink-0" />
                                                        <div className="overflow-hidden">
                                                            <p className="font-bold text-slate-800 uppercase text-sm tracking-wide">
                                                                {req.replace(/_/g, ' ')}
                                                            </p>
                                                            <p className="text-slate-500 text-sm font-medium mt-1 truncate" title={uploadedDocs[req]?.filename}>
                                                                {uploadedDocs[req]?.filename}
                                                            </p>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-center gap-3 bg-red-50 text-red-700 p-5 rounded-2xl border border-red-100 font-bold shadow-sm">
                                    <svg className="w-6 h-6 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                    {error}
                                </div>
                            )}

                            {/* Sticky-like Submission Footer */}
                            <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-transparent pointer-events-none"></div>
                                <p className="text-primary-100 font-medium relative z-10 text-center sm:text-left">
                                    By submitting, you agree to the <a href="#" className="underline hover:text-white transition-colors">terms and conditions</a>.
                                </p>
                                <button
                                    disabled={submitting}
                                    onClick={submitApplication}
                                    className="w-full sm:w-auto px-10 py-5 bg-emerald-500 text-white font-black text-xl rounded-2xl shadow-lg hover:bg-emerald-400 hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative z-10"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Submitting Protocol...
                                        </>
                                    ) : (
                                        <>
                                            Submit Securely
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
