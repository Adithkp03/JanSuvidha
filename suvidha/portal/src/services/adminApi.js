import axios from 'axios';
import useStore from '../store/useStore';

// The existing gateway handles requests via relative paths in dev,
// but we explicitly use the VITE_API_URL or default to relative if proxied.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const adminApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '69420'
    },
});

// Interceptor to attach Authorization token and X-Request-Id
adminApi.interceptors.request.use((config) => {
    const { adminToken } = useStore.getState();
    if (adminToken) {
        config.headers['Authorization'] = `Bearer ${adminToken}`;
    }
    // Generate an X-Request-Id for tracing if not present
    if (!config.headers['X-Request-Id']) {
        config.headers['X-Request-Id'] = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const AdminServices = {
    // Analytics & Metrics
    getMetrics: async () => {
        const response = await adminApi.get('/admin/analytics');
        return response.data;
    },

    // Requests Adjudication
    getRequests: async (params) => {
        // params: limit, offset, department, service, status, priority, from, to, search
        const response = await adminApi.get('/admin/requests', { params });
        const items = response.data.requests || [];
        
        // Map backend payload to frontend expectations
        const mappedRequests = items.map(r => ({
            ...r,
            applicant_name: r.payload?.fullName || r.payload?.name || r.payload?.applicant_name || r.payload?.applicantName || 'Citizen',
            phone: r.payload?.phoneNumber || r.payload?.phone || r.payload?.mobile || 'N/A',
            service_name: r.service_type || 'Service Request',
            extracted_data: r.payload || {},
            intent_confidence: r.payload?.intent_confidence || 0.85,
            urgency_flag: r.priority === 'urgent' || r.priority === 'high' || r.fraud_flag
        }));

        return { requests: mappedRequests };
    },

    getRequestDetails: async (id) => {
        const response = await adminApi.get(`/requests/${id}`);
        return response.data;
    },

    updateRequestStatus: async (id, data) => {
        // data: { status, fraud_flag? }
        const response = await adminApi.patch(`/admin/requests/${id}`, data);
        return response.data;
    },

    assignRequest: async (id, assignData) => {
        // assignData: { team_id, assignee_id }
        const response = await adminApi.post(`/requests/${id}/assign`, assignData);
        return response.data;
    },

    // Alerts / Broadcasts (No Backend Support Currently - Using LocalStorage strictly to avoid CORS/API Gateway conflicts)
    getActiveAlerts: async () => {
        return JSON.parse(localStorage.getItem('jan_active_alerts') || '[]');
    },

    createAlert: async (alertData) => {
        const existing = JSON.parse(localStorage.getItem('jan_active_alerts') || '[]');
        const newAlert = { id: Date.now().toString(), ...alertData };
        localStorage.setItem('jan_active_alerts', JSON.stringify([newAlert, ...existing]));
        return newAlert;
    },

    clearAlert: async (id) => {
        const existing = JSON.parse(localStorage.getItem('jan_active_alerts') || '[]');
        const updated = existing.filter(a => a.id !== id);
        localStorage.setItem('jan_active_alerts', JSON.stringify(updated));
        return { success: true };
    },

    // Documents
    getDocumentSignedUrl: async (key) => {
        const response = await adminApi.get(`/documents/${key}/signed-url`);
        return response.data;
    },

    // Payments (Admin Triggers / Demos)
    triggerPayment: async (data) => {
        // data: { request_id, amount }
        const response = await adminApi.post('/payments', data);
        return response.data; // Expected { payment_id, checkout_url }
    },

    simulateWebhook: async (data) => {
        // data: { payment_id, status: 'success'|'failed' }
        const response = await adminApi.post('/payments/webhook', data);
        return response.data;
    },

    // Audit
    getAuditLogs: async (requestId) => {
        const response = await adminApi.get('/audit', { params: { request_id: requestId } });
        return response.data;
    },

    // Services Catalog Meta
    getServices: async () => {
        const response = await adminApi.get('/services');
        return response.data;
    },

    // Health
    getHealth: async () => {
        const response = await adminApi.get('/health');
        return response.data;
    }
};
