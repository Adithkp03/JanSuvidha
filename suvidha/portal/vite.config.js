import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Ensure .env is always loaded from the portal folder (fixes wrong VITE_* when cwd differs)
const portalRoot = path.resolve(__dirname);

/**
 * When Docker/nginx is running, these paths hit the real API.
 * Do NOT use a blanket `/admin` proxy — it steals frontend routes like
 * `/admin/login`, `/admin/requests` (SPA), causing 404 JS bundles or blank pages.
 */
const backendProxy = 'http://127.0.0.1:80';

export default defineConfig({
    envDir: portalRoot,
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        allowedHosts: true,
        proxy: {
            '/auth': backendProxy,
            '/services': backendProxy,
            '/departments': backendProxy,
            '/requests': backendProxy,
            '/intent': backendProxy,
            '/sync': backendProxy,
            '/payments': backendProxy,
            '/docs': backendProxy,
            '/documents': backendProxy,
            '/health': backendProxy,
            '/admin/analytics': backendProxy,
            // Same path as dept-admin SPA "Requests" page — only proxy API (JSON) calls
            '/admin/requests': {
                target: backendProxy,
                changeOrigin: true,
                bypass(req) {
                    const accept = req.headers.accept || '';
                    if (accept.includes('text/html')) {
                        return '/index.html';
                    }
                },
            },
        },
    },
});
