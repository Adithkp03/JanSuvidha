import React, { useState } from 'react';
import KioskStatusCard from '../../components/Admin/KioskStatusCard';

const mockKiosks = [
    { id:'K001', location:'Municipal Office - Gate 1', status:'online', sessions:47, lastSeen:'2 min ago' },
    { id:'K002', location:'Bus Stand - Counter 3', status:'online', sessions:23, lastSeen:'1 min ago' },
    { id:'K003', location:'Metro Station - Level 2', status:'offline', sessions:0, lastSeen:'3 hrs ago' },
    { id:'K004', location:'Community Center - Block A', status:'online', sessions:31, lastSeen:'just now' },
    { id:'K005', location:'Railway Station - Entrance', status:'maintenance', sessions:0, lastSeen:'1 day ago' },
    { id:'K006', location:'District Collectorate', status:'online', sessions:62, lastSeen:'just now' },
];

export default function KioskManagement() {
    const [kiosks, setKiosks] = useState(mockKiosks);

    const toggleStatus = (id) => {
        setKiosks(prev => prev.map(k => {
            if (k.id === id) {
                return { ...k, status: k.status === 'maintenance' ? 'online' : 'maintenance' };
            }
            return k;
        }));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Kiosk Network Fleet</h1>
                <p className="text-sm font-semibold text-slate-500 mt-1">Monitor deployed endpoint hardware</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {kiosks.map(kiosk => (
                    <KioskStatusCard 
                        key={kiosk.id} 
                        kiosk={kiosk} 
                        onToggleStatus={toggleStatus} 
                    />
                ))}
            </div>
        </div>
    );
}
