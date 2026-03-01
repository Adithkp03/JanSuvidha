import axios from 'axios';

// The existing gateway handles requests via relative paths in dev,
// but we explicitly use the VITE_API_URL or default to relative if proxied.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const adminApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to attach Authorization token and X-Request-Id
adminApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
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
        const response = await adminApi.get('/metrics');
        return response.data;
    },

    // Requests Adjudication
    getRequests: async (params) => {
        // params: limit, offset, department, service, status, priority, from, to, search
        const response = await adminApi.get('/requests', { params });
        return response.data; // Expected { data: [], total: number } or similar
    },

    getRequestDetails: async (id) => {
        const response = await adminApi.get(`/requests/${id}`);
        return response.data;
    },

    updateRequestStatus: async (id, data) => {
        // data: { status, reason? }
        const response = await adminApi.patch(`/requests/${id}/status`, data);
        return response.data;
    },

    assignRequest: async (id, assignData) => {
        // assignData: { team_id, assignee_id }
        const response = await adminApi.post(`/requests/${id}/assign`, assignData);
        return response.data;
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
