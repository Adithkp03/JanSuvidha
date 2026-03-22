import axios from 'axios';
import useStore from '../store/useStore';
import { API_BASE } from '../config/apiBase';
import { normalizeRequestRow } from '../utils/normalizeRequestRow';
import { getCitizenSubmissionsNormalized } from '../utils/citizenBridge';
import { mergeOfflineRequestPool } from '../utils/offlineRequestPool';
import { notifyActiveAlertsChanged } from '../utils/activeAlertsSync';
import { readAndPruneActiveAlerts } from '../utils/activeAlertsStore';
import seedData from '../../seed/admin-seed.json';

const adminApi = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420',
    },
    timeout: 8000,
});

adminApi.interceptors.request.use(
    (config) => {
        const { adminToken } = useStore.getState();
        if (adminToken) {
            config.headers.Authorization = `Bearer ${adminToken}`;
        }
        if (!config.headers['X-Request-Id']) {
            config.headers['X-Request-Id'] = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const AdminServices = {
    getMetrics: async () => {
        try {
            const response = await adminApi.get('/admin/analytics');
            return response.data;
        } catch {
            return seedData.metrics;
        }
    },

    getRequests: async (params) => {
        try {
            const response = await adminApi.get('/admin/requests', { params });
            const items = response.data.requests || [];
            const mapped = items.map((r) => normalizeRequestRow(r));
            const localSubs = getCitizenSubmissionsNormalized();
            const apiIds = new Set(mapped.map((r) => r.id));
            const merged = [...mapped, ...localSubs.filter((l) => !apiIds.has(l.id))];
            return { requests: merged };
        } catch (err) {
            console.warn('Admin requests API unavailable — using seed + citizen bridge', err);
            return { requests: mergeOfflineRequestPool() };
        }
    },

    getRequestDetails: async (id) => {
        const response = await adminApi.get(`/requests/${id}`);
        return response.data;
    },

    updateRequestStatus: async (id, data) => {
        const response = await adminApi.patch(`/admin/requests/${id}`, data);
        return response.data;
    },

    assignRequest: async (id, assignData) => {
        const response = await adminApi.post(`/requests/${id}/assign`, assignData);
        return response.data;
    },

    getActiveAlerts: async () => readAndPruneActiveAlerts(),

    createAlert: async (alertData) => {
        const existing = readAndPruneActiveAlerts();
        const newAlert = { id: Date.now().toString(), ...alertData };
        localStorage.setItem('jan_active_alerts', JSON.stringify([newAlert, ...existing]));
        notifyActiveAlertsChanged();
        return newAlert;
    },

    clearAlert: async (id) => {
        const existing = readAndPruneActiveAlerts();
        const updated = existing.filter((a) => a.id !== id);
        localStorage.setItem('jan_active_alerts', JSON.stringify(updated));
        notifyActiveAlertsChanged();
        return { success: true };
    },

    getDocumentSignedUrl: async (key) => {
        const encoded = encodeURIComponent(String(key).replace(/^\//, ''));
        const response = await adminApi.get(`/documents/${encoded}/signed-url`);
        return response.data;
    },

    /** Stream file through API (avoids presigned URLs that use internal hostnames like minio:9002). */
    getDocumentBlob: async (key) => {
        const encoded = encodeURIComponent(String(key).replace(/^\//, ''));
        const response = await adminApi.get(`/documents/${encoded}/stream`, {
            responseType: 'blob',
        });
        return response.data;
    },

    triggerPayment: async (data) => {
        const response = await adminApi.post('/payments', data);
        return response.data;
    },

    simulateWebhook: async (data) => {
        const response = await adminApi.post('/payments/webhook', data);
        return response.data;
    },

    getAuditLogs: async (requestId) => {
        const response = await adminApi.get('/audit', { params: { request_id: requestId } });
        return response.data;
    },

    getServices: async () => {
        const response = await adminApi.get('/services');
        return response.data;
    },

    getHealth: async () => {
        const response = await adminApi.get('/health');
        return response.data;
    },
};

export default adminApi;
