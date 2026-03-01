/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb', // New Primary
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },
                secondary: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    500: '#6366f1',
                    600: '#4f46e5', // New Secondary
                    700: '#4338ca',
                    900: '#312e81',
                },
                accent: {
                    500: '#06b6d4', // New Accent
                    600: '#0891b2',
                },
                civic: {
                    light: '#f8fafc', // Background
                    dark: '#0f172a', // Text Primary
                    secondaryText: '#64748b', // Text Secondary
                    success: '#10b981', // Success
                    warning: '#f59e0b', // Warning
                    danger: '#ef4444' // Error
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
