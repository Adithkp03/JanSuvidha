import { create } from 'zustand';

const useAdminStore = create((set) => ({
    // Polling Control
    isPolling: true,
    pollingInterval: 4000,

    // Global Table Filters
    filters: {
        department: '',
        service: '',
        status: '',
        priority: '',
        search: ''
    },

    // Actions
    setPolling: (isPolling) => set({ isPolling }),
    setPollingInterval: (interval) => set({ pollingInterval: interval }),

    setFilter: (key, value) => set((state) => ({
        filters: { ...state.filters, [key]: value }
    })),

    clearFilters: () => set({
        filters: { department: '', service: '', status: '', priority: '', search: '' }
    })
}));

export default useAdminStore;
