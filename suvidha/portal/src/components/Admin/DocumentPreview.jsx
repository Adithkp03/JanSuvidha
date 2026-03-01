import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { DocumentMagnifyingGlassIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function DocumentPreview({ url, fileType, ocrText, validationResult }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const isPdf = fileType === 'application/pdf' || (url && url.toLowerCase().includes('.pdf'));

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setLoading(false);
    };

    const onDocumentLoadError = (err) => {
        setError("Failed to load document preview securely.");
        setLoading(false);
        console.error(err);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 lg:p-6 shadow-inner">
            {/* Visualizer Frame */}
            <div className="flex-1 bg-slate-200/50 rounded-xl overflow-hidden shadow-sm relative border border-slate-300 min-h-[400px] flex items-center justify-center">
                {loading && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-100/80 backdrop-blur-sm">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <span className="text-sm font-bold text-slate-500 animate-pulse">Decrypting & Loading...</span>
                    </div>
                )}

                {error ? (
                    <div className="text-center p-8">
                        <DocumentMagnifyingGlassIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-semibold">{error}</p>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm font-bold mt-2 inline-block">
                            Attempt Direct Download Instead &rarr;
                        </a>
                    </div>
                ) : isPdf ? (
                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar w-full flex justify-center py-4">
                        <Document
                            file={url}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={null} // custom loading UI rendered above
                            className="drop-shadow-xl border border-slate-200"
                        >
                            <Page
                                pageNumber={pageNumber}
                                width={Math.min(window.innerWidth * 0.5, 600)}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                            />
                        </Document>
                    </div>
                ) : (
                    <div className="relative w-full h-full min-h-[400px]">
                        <img
                            src={url}
                            alt="Document Preview"
                            className="absolute inset-0 w-full h-full object-contain p-2"
                            onLoad={() => setLoading(false)}
                            onError={() => onDocumentLoadError(new Error('Image failed to load'))}
                        />
                    </div>
                )}

                {/* PDF Controls */}
                {isPdf && numPages > 1 && !error && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-4 z-20">
                        <button onClick={() => setPageNumber(p => Math.max(p - 1, 1))} disabled={pageNumber <= 1} className="disabled:opacity-50 hover:text-indigo-300 font-bold">&larr;</button>
                        <span className="text-xs font-semibold tracking-wider">Page {pageNumber} of {numPages}</span>
                        <button onClick={() => setPageNumber(p => Math.min(p + 1, numPages))} disabled={pageNumber >= numPages} className="disabled:opacity-50 hover:text-indigo-300 font-bold">&rarr;</button>
                    </div>
                )}
            </div>

            {/* Smart Validation & OCR Snippet (Stub) */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Smart Validation</h4>

                    {validationResult === 'MATCH' && (
                        <div className="flex items-start gap-3 text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                            <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" />
                            <div className="text-sm font-semibold">
                                Algorithms confirm high confidence match with expected document template.
                            </div>
                        </div>
                    )}

                    {validationResult === 'MISMATCH' && (
                        <div className="flex items-start gap-3 text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-100">
                            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
                            <div>
                                <div className="text-sm font-bold mb-1">Mismatch Detected</div>
                                <div className="text-xs">The uploaded document does not appear to match the required type or data fields.</div>
                            </div>
                        </div>
                    )}

                    {!validationResult && (
                        <div className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                            Automated validation pending or unavailable for this document type.
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex-1 flex flex-col">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex justify-between items-center">
                        Extracted Text (OCR)
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px]">Beta</span>
                    </h4>

                    <div className="flex-1 bg-slate-900 text-emerald-400 p-4 rounded-lg overflow-y-auto text-xs font-mono leading-relaxed border border-slate-800 shadow-inner min-h-[200px] whitespace-pre-wrap">
                        {ocrText || "System initializing...\nNo OCR payload received from verification engine yet.\n\nWaiting for processing..."}
                    </div>

                    <div className="mt-4 flex gap-2">
                        <button className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-sm transition-colors">
                            Request Manual Verification
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
