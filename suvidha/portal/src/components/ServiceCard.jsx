import React from 'react';
import { useTranslation } from 'react-i18next';
import { CurrencyRupeeIcon, ClockIcon, DocumentTextIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function ServiceCard({ service, onSelect }) {
    const { t } = useTranslation();
    const docs = service.required_documents || [];

    return (
        <div
            onClick={() => onSelect(service)}
            className="group bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-primary-900/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full cursor-pointer relative overflow-hidden"
        >
            {/* Subtle Gradient Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-4 mb-3">
                    <h3 className="text-xl font-extrabold text-slate-800 leading-tight group-hover:text-primary-700 transition-colors">
                        {t(service.name)}
                    </h3>
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-primary-100 group-hover:text-primary-700 transition-colors">
                        <ChevronRightIcon className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                </div>

                <p className="text-slate-500 text-sm font-medium line-clamp-2 flex-1 mb-6">
                    {service.description ? t(service.description) : t('DefaultServiceDesc')}
                </p>

                {/* Info Badges */}
                <div className="flex flex-wrap gap-2 mt-auto">
                    <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-slate-200">
                        <ClockIcon className="w-4 h-4 text-primary-500" />
                        {service.processing_days} {t('Days')}
                    </div>
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-emerald-100">
                        <CurrencyRupeeIcon className="w-4 h-4 text-emerald-600" />
                        {service.fee_amount > 0 ? service.fee_amount : t('Free')}
                    </div>
                    {docs.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-amber-100">
                            <DocumentTextIcon className="w-4 h-4 text-amber-600" />
                            {docs.length} {t('Docs')}
                        </div>
                    )}
                </div>
            </div>

            <button
                className="relative z-10 mt-6 w-full py-3.5 px-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-200 group-hover:bg-primary-600 group-hover:shadow-primary-500/30 transition-all duration-300 flex items-center justify-center gap-2"
            >
                {t('StartApplication')}
                <svg className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </button>
        </div>
    );
}
