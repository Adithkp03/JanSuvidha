import React, { useState } from 'react';
import api from '../services/api';
import { ArrowUpTrayIcon, DocumentCheckIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// Uploader Handles Single Doc Requirement
export default function DocumentUploader({ requirement, onUploaded, existingDoc }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);

    const [docModel, setDocModel] = useState(existingDoc); // { id, object_key, bucket, filename }

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
            // Assuming POST /documents/upload handles the multipart logic directly and returns MinIO key
            const res = await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (ev) => {
                    if (ev.total) {
                        setProgress(Math.round((ev.loaded * 100) / ev.total));
                    }
                }
            });

            const doc = {
                id: res.data.id || Math.random().toString(36).substr(2, 9),
                object_key: res.data.object_key,
                filename: file.name,
                doc_type: requirement
            };
            setDocModel(doc);
            onUploaded(requirement, doc);
        } catch (err) {
            console.error(err);
            if (err.offline) {
                // OFFLINE QUEUE PREP
                const doc = {
                    id: 'temp-' + Date.now(),
                    localFile: file,
                    filename: file.name,
                    doc_type: requirement,
                    pendingSync: true
                };
                setDocModel(doc);
                onUploaded(requirement, doc);
                setError('Offline. Document queued for sync.');
            } else {
                setError(err.response?.data?.error || 'Upload failed');
            }
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const humanReadableReq = requirement.replace(/_/g, ' ').toUpperCase();

    // State 1: Uploaded Successfully
    if (docModel) {
        return (
            <div className="group flex items-center justify-between p-5 md:p-6 border-2 border-emerald-500 bg-emerald-50 rounded-2xl shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <DocumentCheckIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="font-extrabold text-slate-800 text-sm md:text-base truncate">{humanReadableReq}</p>
                        <p className="text-sm font-medium text-emerald-700 truncate mt-0.5">
                            {docModel.filename} {docModel.pendingSync && <span className="italic opacity-80">(Queued)</span>}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => { setDocModel(null); setFile(null); onUploaded(requirement, null); }}
                    className="shrink-0 ml-4 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500 bg-white shadow-sm border border-slate-200 transition-all rounded-full"
                    title="Remove Document"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
        );
    }

    // State 2: Ready to Upload / Selecting File
    return (
        <div className={`relative flex flex-col items-center justify-center text-center p-6 md:p-8 rounded-3xl border-2 border-dashed transition-all duration-300 ${file ? 'border-primary-400 bg-primary-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-primary-300'}`}>

            <p className="font-black text-slate-800 text-lg mb-2 z-10">{humanReadableReq}</p>

            {!file ? (
                <div className="flex flex-col items-center z-10 w-full mt-2">
                    <label className="cursor-pointer group flex flex-col items-center">
                        <div className="w-16 h-16 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                            <ArrowUpTrayIcon className="w-7 h-7 text-primary-600" />
                        </div>
                        <span className="text-base font-bold text-primary-600 group-hover:text-primary-800 transition-colors">Click to browse</span>
                        <span className="text-sm font-medium text-slate-400 mt-2 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">PDF, JPG, PNG up to 5MB</span>
                        <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                    </label>
                </div>
            ) : (
                <div className="w-full z-10 animate-in fade-in zoom-in duration-300 mt-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                            <DocumentCheckIcon className="w-5 h-5 text-primary-600" />
                        </div>
                        <p className="text-sm font-bold text-slate-700 truncate text-left">{file.name}</p>
                    </div>

                    {uploading ? (
                        <div className="w-full mt-2">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">Uploading</span>
                                <span className="text-xs font-bold text-primary-600">{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                                <div className="bg-primary-600 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3 justify-between items-center mt-2">
                            <button onClick={() => setFile(null)} className="flex-1 py-2.5 px-4 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                                Replace
                            </button>
                            <button onClick={uploadFile} className="flex-1 py-2.5 px-4 text-sm font-bold text-white bg-slate-900 rounded-xl shadow-[0_4px_14px_0_rgba(15,23,42,0.39)] hover:shadow-[0_6px_20px_0_rgba(15,23,42,0.23)] hover:bg-primary-600 transition-all flex items-center justify-center gap-2 group">
                                Upload
                                <ArrowUpTrayIcon className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                            </button>
                        </div>
                    )}
                    {error && <p className="text-sm font-bold text-red-500 mt-3 bg-red-50 p-2 rounded-lg">{error}</p>}
                </div>
            )}
        </div>
    );
}
