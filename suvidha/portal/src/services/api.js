import axios from 'axios';
import useStore from '../store/useStore';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

api.interceptors.request.use(
    (config) => {
        const state = useStore.getState();
        const token = state.token;
        const requestId = state.requestId;

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Always inject tracking request ID
        if (requestId) {
            config.headers['X-Request-Id'] = requestId;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        // Reconcile downstream request tracking if the gateway changed it
        const incomingRequestId = response.headers['x-request-id'];
        if (incomingRequestId && incomingRequestId !== useStore.getState().requestId) {
            // Could sync local to remote if backend dictates authoritative tracing
        }
        return response;
    },
    (error) => {
        // Handle offline scenario automatically
        if (!error.response && error.message === 'Network Error') {
            // We are offline or the API proxy is unreachable
            return Promise.reject({ offline: true, ...error });
        }

        // Global error interceptor
        if (error.response && error.response.status === 401) {
            useStore.getState().logout();
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;
