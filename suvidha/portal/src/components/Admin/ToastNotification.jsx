import React, { useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export default function ToastNotification({ message, type = 'success', onClose }) {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;

    const baseClasses = "fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border min-w-[300px] animate-in slide-in-from-bottom-8 duration-300 transform transition-all";
    
    let typeClasses = "";
    let Icon = InformationCircleIcon;

    if (type === 'success') {
        typeClasses = "bg-emerald-50 text-emerald-800 border-emerald-200";
        Icon = CheckCircleIcon;
    } else if (type === 'error') {
        typeClasses = "bg-rose-50 text-rose-800 border-rose-200";
        Icon = ExclamationTriangleIcon;
    } else {
        typeClasses = "bg-blue-50 text-blue-800 border-blue-200";
    }

    return (
        <div className={`${baseClasses} ${typeClasses}`}>
            <Icon className="w-6 h-6 shrink-0" />
            <span className="text-sm font-bold flex-1">{message}</span>
            <button 
                onClick={onClose}
                className="p-1 hover:bg-black/5 rounded-md transition-colors"
            >
                <XMarkIcon className="w-5 h-5 opacity-60 hover:opacity-100" />
            </button>
        </div>
    );
}
