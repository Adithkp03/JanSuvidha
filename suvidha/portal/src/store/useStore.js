import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateUUID } from '../utils/uuid';

const useStore = create(
    persist(
        (set, get) => ({
            // Auth State
            token: null,
            user: null,
            role: null, // "ADMIN" | "CITIZEN"

            // Request Metadata
            requestId: generateUUID(),

            // UI/UX State
            theme: 'light', // light, dark, high-contrast
            language: 'en',
            largeFont: false,
            seniorMode: false,

            // Offline Queue
            offlineQueue: [],

            // Actions
            setAuth: (token, user) => set({ token, user }),
            setRole: (role) => set({ role }),
            logout: () => set({ token: null, user: null, role: null, requestId: generateUUID() }),

            setTheme: (theme) => set({ theme }),
            setLanguage: (language) => set({ language }),
            toggleLargeFont: () => set((state) => ({ largeFont: !state.largeFont })),
            setSeniorMode: (seniorMode) => set({ seniorMode }),

            rotateRequestId: () => set({ requestId: generateUUID() }),

            // Offline Actions
            addToQueue: (item) => set((state) => ({ offlineQueue: [...state.offlineQueue, item] })),
            clearQueue: () => set({ offlineQueue: [] }),
            removeFromQueue: (id) => set((state) => ({
                offlineQueue: state.offlineQueue.filter(item => item.id !== id)
            })),
        }),
        {
            name: 'jan-portal-storage',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                role: state.role,
                theme: state.theme,
                language: state.language,
                largeFont: state.largeFont,
                seniorMode: state.seniorMode
            }),
        }
    )
);

export default useStore;
