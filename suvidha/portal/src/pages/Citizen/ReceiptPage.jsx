import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import Receipt from '../../components/Receipt';

export default function ReceiptPage() {
    const { id } = useParams();
    const location = useLocation();
    const [requestData, setRequestData] = useState(null);
    const [loading, setLoading] = useState(true);

    // If offline, the state will pass 'offline FLAG'
    const isOffline = location.state?.offline;

    useEffect(() => {
        let active = true;
        if (isOffline) {
            // Mock the receipt data for offline draft
            setRequestData({ id, service_code: 'DRAFT_OFFLINE', created_at: new Date().toISOString() });
            setLoading(false);
            return;
        }

        const fetchRequest = async () => {
            try {
                const resp = await api.get(`/requests/${id}`);
                const data = resp.data?.request || resp.data;
                if (active) setRequestData(data ? { ...data, service_code: data.service_type || data.service_code } : null);
            } catch (err) {
                console.error(err);
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchRequest();

        return () => active = false;
    }, [id, isOffline]);

    if (loading) return <div className="text-center py-20 text-slate-500 font-medium">Fetching Receipt...</div>;

    return <Receipt requestData={requestData} isOffline={isOffline} />;
}
