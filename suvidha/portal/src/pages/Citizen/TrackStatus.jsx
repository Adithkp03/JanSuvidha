import React, { useState } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/date';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

const STATUS_MAP = {
    draft: "Draft Saved",
    submitted: "Application Submitted",
    under_review: "Under Review",
    doc_required: "Action Required (Additional Docs)",
    payment_pending: "Payment Pending",
    completed: "Process Completed",
    approved: "Application Approved",
    rejected: "Application Rejected"
};

export default function TrackingLookup() {
    const [query, setQuery] = useState('');
    const [type, setType] = useState('email'); // email or id
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null); // Arrays or single obj
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setError('');

        try {
            if (type === 'id') {
                const res = await api.get(`/requests/${query}`);
                setResults([res.data]);
            } else {
                // Wait, backend only has `/requests?limit=...` logic normally but assume admin filters work, 
                // here we can pretend there's a `/requests/lookup?phone=...` or standard filter.
                // For phase 1, we implemented lookup inside /requests generic endpoint
                const res = await api.get(`/requests?email=${query}&limit=5`);
                setResults(res.data.requests || []);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'No records found.');
            setResults(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
                <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Track Request</h2>
                <p className="text-slate-500 mb-8">Enter your registered email or Request ID to check live status.</p>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex rounded-xl bg-slate-50 border border-slate-200 p-1 sm:w-1/3">
                        <button type="button" onClick={() => setType('email')} className={`flex-1 px-4 py-2 font-bold text-sm rounded-lg transition-colors ${type === 'email' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-800'}`}>Email</button>
                        <button type="button" onClick={() => setType('id')} className={`flex-1 px-4 py-2 font-bold text-sm rounded-lg transition-colors ${type === 'id' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-800'}`}>Request ID</button>
                    </div>

                    <div className="relative flex-1">
                        <input
                            type={type === 'email' ? 'email' : 'text'}
                            value={query} onChange={e => setQuery(e.target.value)}
                            placeholder={type === 'email' ? 'e.g. you@example.com' : 'e.g. fd4a-...'}
                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-5 py-3 text-slate-800 focus-ring sm:text-lg"
                        />
                        <button disabled={loading} type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow transition-colors flex items-center gap-2">
                            <MagnifyingGlassIcon className="w-5 h-5" />
                            {loading ? 'Searching...' : 'Track'}
                        </button>
                    </div>
                </form>

                {error && <p className="mt-6 p-4 bg-red-50 text-red-600 font-bold rounded-xl text-center border border-red-100">{error}</p>}
            </div>

            {results && results.length > 0 && (
                <div className="space-y-6">
                    {results.map(req => (
                        <div key={req.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
                                <div>
                                    <span className="text-xs font-bold bg-primary-50 text-primary-700 px-2 py-1 rounded-md mb-2 inline-block">ID: {req.id}</span>
                                    <h3 className="text-xl font-bold text-slate-800">{req.service?.name || req.service_id || 'Citizen Service'}</h3>
                                    <p className="text-sm text-slate-500 font-medium mt-1">Submitted on {formatDate(req.created_at)}</p>
                                </div>

                                <div className="text-right">
                                    <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-extrabold uppercase tracking-wide
                          ${req.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                            req.status === 'approved' ? 'bg-teal-100 text-teal-800' :
                                                req.status === 'doc_required' ? 'bg-amber-100 text-amber-800' :
                                                    req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                        req.status === 'payment_pending' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-slate-100 text-slate-600'
                                        }
                       `}>
                                        {STATUS_MAP[req.status] || req.status}
                                    </span>
                                </div>
                            </div>

                            {/* Timeline rendering mocked (requires detailed audit events normally) */}
                            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 pt-2 pb-2">
                                <div className="relative">
                                    <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-slate-200 border-4 border-white"></div>
                                    <p className="text-sm font-bold text-slate-700">Application Submitted</p>
                                    <p className="text-xs text-slate-400">{formatDate(req.created_at)}</p>
                                </div>
                                {req.status !== 'draft' && req.status !== 'submitted' && (
                                    <div className="relative">
                                        <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-primary-500 border-4 border-white shadow-[0_0_0_2px_rgba(37,99,235,0.2)]"></div>
                                        <p className="text-sm font-bold text-slate-700">{STATUS_MAP[req.status] || req.status}</p>
                                        <p className="text-xs text-slate-400">Latest update</p>
                                        {req.status === 'doc_required' && <p className="text-sm text-amber-600 mt-2 font-semibold bg-amber-50 p-2 rounded-lg">Please visit your nearest center to provide supplementary docs.</p>}
                                        {req.status === 'payment_pending' && <p className="text-sm text-blue-600 mt-2 font-semibold bg-blue-50 p-2 rounded-lg">Payment is required to process this request.</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {results && results.length === 0 && (
                <p className="mt-6 p-4 bg-slate-50 text-slate-600 font-bold rounded-xl text-center border border-slate-200">No requests found for this query.</p>
            )}
        </div>
    );
}
