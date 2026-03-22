import React, { useState } from 'react';
import { MegaphoneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { AdminServices } from '../../services/adminApi';
import { notifyActiveAlertsChanged } from '../../utils/activeAlertsSync';
import { readAndPruneActiveAlerts } from '../../utils/activeAlertsStore';

const TYPES = ['Information', 'Warning', 'Emergency'];
const DEPTS = ['All Departments', 'Electricity', 'Gas', 'Water', 'Municipal', 'Waste', 'Public Works'];
const DURATIONS = ['1 hour', '4 hours', 'Until manually cleared'];

export default function BroadcastForm({ onBroadcastSuccess, setAppToast }) {
    const [type, setType] = useState('Information');
    const [department, setDepartment] = useState('All Departments');
    const [duration, setDuration] = useState('1 hour');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        try {
            const payload = {
                type,
                department,
                message,
                duration,
                created_at: new Date().toISOString()
            };
            
            // Primary: API call
            try {
                await AdminServices.createAlert(payload);
            } catch (apiErr) {
                console.warn('API unavailable, falling back to offline storage');
                const existing = readAndPruneActiveAlerts();
                const newAlert = { id: Date.now().toString(), ...payload };
                localStorage.setItem('jan_active_alerts', JSON.stringify([newAlert, ...existing]));
                notifyActiveAlertsChanged();
            }

            setMessage('');
            setAppToast({ message: 'Broadcast transmitted successfully', type: 'success' });
            if (onBroadcastSuccess) onBroadcastSuccess();

        } catch (err) {
            setAppToast({ message: 'Failed to broadcast', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:p-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-rose-100 rounded-xl text-rose-600">
                    <MegaphoneIcon className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-extrabold text-slate-800">New Broadcast Message</h2>
                    <p className="text-sm font-semibold text-slate-500">Push emergency alerts to citizen kiosks</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Alert Type</label>
                    <select 
                        value={type} 
                        onChange={e => setType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Target Filter</label>
                    <select 
                        value={department} 
                        onChange={e => setDepartment(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {DEPTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Duration</label>
                    <select 
                        value={duration} 
                        onChange={e => setDuration(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {DURATIONS.map(d => <option key={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex justify-between items-end mb-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Message Content</label>
                    <span className={`text-xs font-bold ${message.length > 180 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {message.length} / 200
                    </span>
                </div>
                <textarea 
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Type urgent public notification here..."
                ></textarea>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-6">
                <button 
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="flex items-center gap-2 px-8 py-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-lg hover:shadow-rose-600/30 transition-all"
                >
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    {loading ? 'Transmitting...' : 'Broadcast Now'}
                </button>
            </div>
        </form>
    );
}
