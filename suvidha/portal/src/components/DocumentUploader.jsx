import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { DocumentCheckIcon, XMarkIcon, QrCodeIcon, ArrowUpTrayIcon, ComputerDesktopIcon, BoltIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { QRCodeSVG } from 'qrcode.react';

export default function DocumentUploader({ requirement, onUploaded, existingDoc, label }) {
    const { t } = useTranslation();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    // QR / Mobile State
    const [docModel, setDocModel] = useState(existingDoc); // { id, object_key, bucket, filename }
    const [uploadToken, setUploadToken] = useState('');
    const [qrExpiresAt, setQrExpiresAt] = useState(0);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
    const [mode, setMode] = useState('qr'); // 'qr' or 'local'
    /** Runtime URL for QR (from public/jansuvidha-qr-base.json — update when ngrok URL changes; no rebuild). */
    const [qrPublicBaseOverride, setQrPublicBaseOverride] = useState(null);

    useEffect(() => {
        const path = `${import.meta.env.BASE_URL || '/'}jansuvidha-qr-base.json`.replace(/\/{2,}/g, '/');
        fetch(path, { cache: 'no-store' })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                const u = data?.publicBaseUrl?.trim?.();
                if (u && /^https?:\/\//i.test(u)) {
                    setQrPublicBaseOverride(u.replace(/\/$/, ''));
                }
            })
            .catch(() => {});
    }, []);

    // Broadcast channel for local testing (mocking cross-device communication via backend)
    useEffect(() => {
        const channel = new BroadcastChannel('mobile_upload');
        channel.onmessage = (event) => {
            if (event.data && event.data.type === 'UPLOAD_SUCCESS' && event.data.token === uploadToken) {
                handleSuccessResult({
                    filename: event.data.filename,
                    size: event.data.size,
                    mock: event.data.mock
                });
            }
        };
        return () => channel.close();
    }, [uploadToken]);

    const generateNewToken = () => {
        const newToken = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        setUploadToken(newToken);
        setQrExpiresAt(Date.now() + 5 * 60 * 1000); // 5 minutes
        setTimeLeft(300);
    };

    useEffect(() => {
        if (!docModel && mode === 'qr' && !uploadToken) {
            generateNewToken();
        }
    }, [docModel, mode, uploadToken]);

    // Timer countdown
    useEffect(() => {
        if (!docModel && mode === 'qr') {
            const interval = setInterval(() => {
                const remaining = Math.max(0, Math.floor((qrExpiresAt - Date.now()) / 1000));
                setTimeLeft(remaining);
                if (remaining === 0) {
                    generateNewToken();
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [qrExpiresAt, docModel, mode]);

    // Polling API for status - Fallback if BroadcastChannel doesn't fire (simulating real backend flow)
    useEffect(() => {
        if (!docModel && mode === 'qr' && uploadToken) {
            const pollInterval = setInterval(async () => {
                try {
                    const response = await api.get(`/documents/upload-status?token=${uploadToken}`);
                    if (response.data && response.data.completed) {
                        handleSuccessResult(response.data);
                        clearInterval(pollInterval);
                    }
                } catch (e) {
                    // Ignore, polling until found
                }
            }, 3000);
            return () => clearInterval(pollInterval);
        }
    }, [uploadToken, docModel, mode]);

    const handleSuccessResult = (data) => {
        const doc = {
            id: data.id || Math.random().toString(36).substr(2, 9),
            object_key: data.object_key || 'mock-key',
            filename: data.filename || 'uploaded_document.jpg',
            doc_type: requirement,
            mock: data.mock
        };
        setDocModel(doc);
        onUploaded(requirement, doc);
    };

    // Original Local Upload Mode functions
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const uploadFile = async () => {
        if (!file) return;
        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', requirement);

        try {
            const res = await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            handleSuccessResult(res.data);
        } catch (err) {
            console.error(err);
            if (err.offline) {
                const doc = {
                    id: 'temp-' + Date.now(),
                    localFile: file,
                    filename: file.name,
                    doc_type: requirement,
                    pendingSync: true
                };
                setDocModel(doc);
                onUploaded(requirement, doc);
                setError(t('OfflineDocQueued'));
            } else {
                setError(err.response?.data?.error || 'Upload failed');
            }
        } finally {
            setUploading(false);
        }
    };

    // Format timer
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleSimulateUpload = () => {
        // Mock instant success for judging
        handleSuccessResult({
            filename: 'demo_document_scan.jpg',
            size: 2048576,
            mock: true
        });
    };

    const humanReadableReq = label || requirement.replace(/_/g, ' ').toUpperCase();

    // State 1: Uploaded Successfully
    if (docModel) {
        return (
            <div className="group flex items-center justify-between p-3 sm:p-4 md:p-5 border-2 border-emerald-500 bg-emerald-50 rounded-[2rem] shadow-sm hover:shadow-md transition-all gap-2 sm:gap-4 overflow-hidden">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-default">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200 shadow-inner">
                        <DocumentCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 drop-shadow-sm" />
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                        <p className="font-black text-slate-800 text-xs sm:text-sm md:text-base truncate flex items-center gap-2">
                            {t(humanReadableReq)}
                        </p>
                        <p className="text-[10px] sm:text-xs font-bold text-emerald-700 truncate mt-0.5 flex items-center gap-1.5">
                            <span className="truncate">{docModel.filename}</span>
                            {docModel.mock && <span className="bg-emerald-200 text-emerald-800 text-[8px] sm:text-[9px] uppercase font-black px-1.5 py-0.5 rounded shrink-0 tracking-wider">Demo</span>}
                        </p>
                    </div>
                </div>
                <div className="flex justify-end shrink-0">
                    <button
                        onClick={() => { setDocModel(null); setFile(null); onUploaded(requirement, null); }}
                        className="py-2 px-3 sm:py-2.5 sm:px-4 text-[10px] sm:text-xs md:text-sm font-bold text-slate-500 rounded-xl hover:text-rose-600 hover:bg-rose-50 border border-slate-200 bg-white shadow-sm transition-all whitespace-nowrap active:scale-95 flex items-center justify-center gap-1.5"
                    >
                        <ArrowPathIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Replace
                    </button>
                </div>
            </div>
        );
    }

    // Priority: public/jansuvidha-qr-base.json (runtime) > VITE_PUBLIC_BASE_URL > page origin when not localhost
    const getBaseUrl = () => {
        if (qrPublicBaseOverride) return qrPublicBaseOverride;
        const raw = (import.meta.env.VITE_PUBLIC_BASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
        if (/^https?:\/\//i.test(raw)) {
            return raw.replace(/\/$/, '');
        }
        const host = window.location.hostname;
        const isLoopback = host === 'localhost' || host === '127.0.0.1';
        if (!isLoopback) {
            return window.location.origin;
        }
        return `http://${window.location.host}`;
    };

    const baseUrl = getBaseUrl();
    const qrUrl = `${baseUrl}/upload?token=${uploadToken}&doc=${requirement}&expires=${qrExpiresAt}`;

    // State 2: QR Code Mode
    if (mode === 'qr') {
        return (
            <div className="relative flex flex-col items-center justify-center text-center p-6 md:p-8 rounded-[2.5rem] border border-slate-200 bg-white shadow-lg overflow-hidden">
                <div className="w-full flex justify-between items-center mb-6">
                    <div className="flex flex-col items-start text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">{t('UploadRequired')}</span>
                        <h3 className="font-black text-slate-900 text-2xl leading-none">{t(humanReadableReq)}</h3>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 px-3 md:px-4 py-2 rounded-xl flex flex-col items-center min-w-[70px] md:min-w-[80px]">
                        <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">{t('Expires')}</span>
                        <span className="text-lg font-black text-indigo-600 font-mono leading-none tracking-tight">{formatTime(timeLeft)}</span>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-8 w-full bg-slate-50 p-6 sm:p-8 rounded-[2rem] border border-slate-100">
                    <div className="relative group mx-auto">
                        {/* Pulsing rings for attention */}
                        <div className="absolute inset-0 bg-indigo-400 rounded-3xl blur opacity-20 animate-pulse scale-110"></div>
                        <div className="absolute inset-0 rounded-3xl border border-indigo-200 scale-[1.05] animate-ping opacity-10" style={{ animationDuration: '3s' }}></div>

                        <div className="bg-white p-4 rounded-3xl shadow-xl relative z-10 border border-slate-100 transform transition-transform group-hover:scale-[1.02]">
                            {uploadToken ? (
                                <QRCodeSVG key={qrUrl} value={qrUrl} size={180} level="M" fgColor="#0f172a" />
                            ) : (
                                <div className="w-[180px] h-[180px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center">
                                    <ArrowPathIcon className="w-8 h-8 text-slate-300 animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-start text-center md:text-left w-full max-w-sm pt-2">
                        <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
                            <QrCodeIcon className="w-8 h-8 text-slate-400" />
                            <h4 className="font-black text-slate-700 text-lg leading-tight">{t('SecureMobileTransfer')}</h4>
                        </div>

                        <ul className="flex flex-col gap-4 font-bold text-sm text-slate-500 w-full text-left">
                            <li className="flex gap-4 items-start">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs shrink-0 mt-0.5">1</span>
                                {t('UploadStep1')}
                            </li>
                            <li className="flex gap-4 items-start">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs shrink-0 mt-0.5">2</span>
                                {t('UploadStep2')}
                            </li>
                            <li className="flex gap-4 items-start">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs shrink-0 mt-0.5">3</span>
                                {t('UploadStep3')}
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="w-full flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-slate-100 gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
                        <ArrowPathIcon className="w-5 h-5 text-indigo-500 animate-spin opacity-50" />
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">{t('AwaitingUpload')}</span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
                        {/* Demo bypass button */}
                        <button
                            onClick={handleSimulateUpload}
                            className="text-[10px] font-black tracking-widest uppercase py-2.5 px-4 bg-slate-50 text-slate-400 border border-dashed border-slate-300 rounded-xl hover:text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <BoltIcon className="w-3 h-3" /> {t('SimulateUpload')}
                        </button>

                        <button
                            onClick={() => setMode('local')}
                            className="bg-slate-100 p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
                            title={t('UploadFromDevice')}
                        >
                            <ComputerDesktopIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // State 3: Local Upload Mode (Fallback)
    return (
        <div className={`relative flex flex-col items-center justify-center text-center p-8 rounded-[2.5rem] border-2 border-dashed transition-all duration-300 ${file ? 'border-primary-400 bg-primary-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-primary-300'} shadow-sm`}>

            <button
                onClick={() => setMode('qr')}
                className="absolute top-6 right-6 p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                title="Switch back to QR scan"
            >
                <QrCodeIcon className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-black uppercase tracking-widest text-primary-500 mb-1 z-10 mt-2">Local File Upload</span>
            <p className="font-black text-slate-800 text-2xl mb-8 z-10">{t(humanReadableReq)}</p>

            {!file ? (
                <div className="flex flex-col items-center z-10 w-full">
                    <label className="cursor-pointer group flex flex-col items-center">
                        <div className="w-20 h-20 bg-white rounded-[2rem] shadow-md border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:shadow-xl group-hover:border-primary-200 transition-all duration-300">
                            <ArrowUpTrayIcon className="w-8 h-8 text-primary-600" />
                        </div>
                        <span className="text-lg font-black text-primary-600 group-hover:text-primary-800 transition-colors">{t('ClickToBrowse')}</span>
                        <span className="text-sm font-bold text-slate-400 mt-2 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">{t('UploadFormatDesc')}</span>
                        <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                    </label>
                </div>
            ) : (
                <div className="w-full z-10 animate-in fade-in zoom-in duration-300 bg-white p-6 rounded-3xl shadow-md border border-slate-200">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center shrink-0 border border-primary-100">
                            <DocumentCheckIcon className="w-6 h-6 text-primary-600" />
                        </div>
                        <p className="font-bold text-slate-700 truncate text-left text-lg">{file.name}</p>
                    </div>

                    {uploading ? (
                        <div className="w-full flex items-center justify-center py-4">
                            <ArrowPathIcon className="w-6 h-6 text-primary-600 animate-spin" />
                            <span className="ml-3 font-bold text-primary-600">Uploading file...</span>
                        </div>
                    ) : (
                        <div className="flex gap-4 justify-between items-center">
                            <button onClick={() => setFile(null)} className="flex-1 py-3.5 px-4 text-sm font-bold text-slate-500 bg-slate-100 rounded-2xl hover:bg-slate-200 hover:text-slate-700 transition-colors">
                                Choose another file
                            </button>
                            <button onClick={uploadFile} className="flex-1 py-3.5 px-4 text-sm font-black text-white bg-primary-600 rounded-2xl shadow-[0_8px_20px_-8px_rgba(var(--color-primary-600),0.7)] hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                                Upload Now
                                <ArrowUpTrayIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    {error && <p className="text-sm font-bold text-red-500 mt-4 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
                </div>
            )}
        </div>
    );
}
