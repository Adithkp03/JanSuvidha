import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { formatDate } from '../../utils/date';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

export default function TrackingLookup() {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [type, setType] = useState('email'); // email or id
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null); // Arrays or single obj
    const [error, setError] = useState('');

    const getStatusStr = (statusStr) => {
        const smap = {
            draft: 'DraftSaved',
            submitted: 'AppSubmitted',
            under_review: 'UnderReview',
            doc_required: 'ActionReq',
            payment_pending: 'PaymentPending',
            completed: 'ProcessCompleted',
            approved: 'AppApproved',
            rejected: 'AppRejected'
        };
        return smap[statusStr] ? t(smap[statusStr]) : statusStr;
    };

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
                const res = await api.get(`/requests?email=${query}&limit=5`);
                setResults(res.data.requests || []);
            }
        } catch (err) {
            setError(err.response?.data?.error || t('NoRecords'));
            setResults(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
                <h2 className="text-3xl font-extrabold text-slate-800 mb-2">{t('TrackRequest')}</h2>
                <p className="text-slate-500 mb-8">{t('TrackDesc')}</p>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex rounded-xl bg-slate-50 border border-slate-200 p-1 sm:w-1/3">
                        <button type="button" onClick={() => setType('email')} className={`flex-1 px-4 py-2 font-bold text-sm rounded-lg transition-colors ${type === 'email' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-800'}`}>{t('Email')}</button>
                        <button type="button" onClick={() => setType('id')} className={`flex-1 px-4 py-2 font-bold text-sm rounded-lg transition-colors ${type === 'id' ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-800'}`}>{t('RequestID')}</button>
                    </div>

                    <div className="relative flex-1">
                        <input
                            type={type === 'email' ? 'email' : 'text'}
                            value={query} onChange={e => setQuery(e.target.value)}
                            placeholder={type === 'email' ? t('SearchPlaceholderEmail') : t('SearchPlaceholderID')}
                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-5 py-3 text-slate-800 focus-ring sm:text-lg"
                        />
                        <button disabled={loading} type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow transition-colors flex items-center gap-2">
                            <MagnifyingGlassIcon className="w-5 h-5" />
                            {loading ? t('Searching') : t('Track')}
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
                                    <p className="text-sm text-slate-500 font-medium mt-1">{t('SubmittedOn')} {formatDate(req.created_at)}</p>
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
                                        {getStatusStr(req.status)}
                                    </span>
                                </div>
                            </div>

                            {/* Timeline rendering mocked (requires detailed audit events normally) */}
                            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 pt-2 pb-2">
                                <div className="relative">
                                    <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-slate-200 border-4 border-white"></div>
                                    <p className="text-sm font-bold text-slate-700">{t('AppSubmitted')}</p>
                                    <p className="text-xs text-slate-400">{formatDate(req.created_at)}</p>
                                </div>
                                {req.status !== 'draft' && req.status !== 'submitted' && (
                                    <div className="relative">
                                        <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-primary-500 border-4 border-white shadow-[0_0_0_2px_rgba(37,99,235,0.2)]"></div>
                                        <p className="text-sm font-bold text-slate-700">{getStatusStr(req.status)}</p>
                                        <p className="text-xs text-slate-400">{t('LatestUpdate')}</p>
                                        {req.status === 'doc_required' && <p className="text-sm text-amber-600 mt-2 font-semibold bg-amber-50 p-2 rounded-lg">{t('VisitCenter')}</p>}
                                        {req.status === 'payment_pending' && <p className="text-sm text-blue-600 mt-2 font-semibold bg-blue-50 p-2 rounded-lg">{t('PaymentReq')}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {results && results.length === 0 && (
                <p className="mt-6 p-4 bg-slate-50 text-slate-600 font-bold rounded-xl text-center border border-slate-200">{t('NoReqFound')}</p>
            )}
        </div>
    );
}
