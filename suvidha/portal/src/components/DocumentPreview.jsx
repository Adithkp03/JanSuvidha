import React, { useState } from 'react';
import { DocumentMagnifyingGlassIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function DocumentPreview({ docKeys, onClose }) {
    // Receives an array of object_keys / objects.
    // Realistically we would fetch signed URLs for these keys from the backend.
    // For demo, we mock the URLs or rendering states.

    const [activeDoc, setActiveDoc] = useState(docKeys[0] || null);
    const [numPages, setNumPages] = useState(null);

    const url = activeDoc ? `/documents/${activeDoc.object_key}/signed-url` : null;
    // Mocking visual:
    const isImage = activeDoc?.filename?.match(/\.(jpg|jpeg|png)$/i);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1e293b] border border-slate-700 rounded-3xl w-full max-w-6xl h-[85vh] flex overflow-hidden shadow-2xl">

                {/* Sidebar with doc list */}
                <div className="w-80 border-r border-slate-700 bg-[#0f172a] flex flex-col">
                    <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                        <h3 className="text-white font-bold">Attached Documents</h3>
                        <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400"><XMarkIcon className="w-6 h-6" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {docKeys.map(doc => (
                            <button
                                key={doc.object_key}
                                onClick={() => setActiveDoc(doc)}
                                className={`w-full text-left p-3 rounded-xl border ${activeDoc?.object_key === doc.object_key ? 'bg-primary-900/30 border-primary-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'} hover:bg-slate-700 transition-colors`}
                            >
                                <p className="text-xs font-bold uppercase mb-1 tracking-wider text-primary-400">{doc.doc_type}</p>
                                <p className="text-sm truncate font-medium">{doc.filename}</p>
                            </button>
                        ))}
                    </div>

                    <div className="p-4 bg-slate-800 border-t border-slate-700">
                        {/* Mock OCR Result logic */}
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                            <DocumentMagnifyingGlassIcon className="w-4 h-4" /> AI OCR Summary
                        </h4>
                        <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-700 text-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400">Confidence</span>
                                <span className="text-emerald-400 font-bold">89%</span>
                            </div>
                            <p className="text-xs text-slate-300 italic">"Name matches applicant. Address validated against civic records."</p>
                        </div>
                    </div>
                </div>

                {/* Viewer */}
                <div className="flex-1 bg-black flex items-center justify-center overflow-auto relative relative group">
                    {!activeDoc ? (
                        <p className="text-slate-500">Select a document to preview</p>
                    ) : isImage ? (
                        <div className="relative w-full h-full flex items-center justify-center p-8">
                            {/* Since we don't have actual S3 running with real docs in the demo, we show a mock visual placeholder */}
                            <div className="border border-slate-700 bg-slate-800 shadow-2xl rounded-xl p-8 flex flex-col items-center">
                                <DocumentMagnifyingGlassIcon className="w-20 h-20 text-slate-500 mb-4" />
                                <p className="text-white font-bold text-xl">{activeDoc.filename}</p>
                                <p className="text-slate-400 text-sm mt-2 font-mono">{activeDoc.object_key}</p>
                                <div className="mt-8 px-4 py-2 bg-amber-500/20 text-amber-500 border border-amber-500/50 rounded-lg text-sm flex items-center gap-2">
                                    <ExclamationTriangleIcon className="w-5 h-5" />
                                    Image placeholder. In production, this renders the Signed URL.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#1e293b] text-white p-8 border border-red-500/50 rounded flex flex-col items-center">
                            <p className="text-red-400 font-bold">PDF Rendering requires valid URL</p>
                            <p className="text-sm text-slate-400 mt-2">{activeDoc.filename}</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
