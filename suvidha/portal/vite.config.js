import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const backendProxy = 'http://localhost:80';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        allowedHosts: true, // Allow ngrok and other external hosts
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
            '/admin/requests': backendProxy
        }
    }
});
