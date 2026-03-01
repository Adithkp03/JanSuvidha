import localforage from 'localforage';
import useStore from '../store/useStore';
import api from '../services/api';

localforage.config({
    name: 'JanSuvidha',
    storeName: 'offlineQueue'
});

export const saveOfflineItem = async (key, data) => {
    try {
        await localforage.setItem(key, data);
    } catch (err) {
        console.error("Offline storage failed", err);
    }
};

export const getOfflineItem = async (key) => {
    return await localforage.getItem(key);
};

// Queue operations for background sync (offline-first kiosk)
export const syncQueue = async () => {
    const state = useStore.getState();
    const queue = [...state.offlineQueue];

    if (queue.length === 0) return true;

    for (const item of queue) {
        try {
            if (item.type === 'REQUEST_SUBMIT') {
                const payload = item.payload || {};
                const body = {
                    department: payload.department,
                    service_type: payload.service_type,
                    payload: payload.payload || payload,
                    priority: payload.priority || 'normal',
                };
                const resp = await api.post('/requests', body);
                useStore.getState().removeFromQueue(item.id);
                // Update receipt URL if we navigated to draft receipt
                if (resp?.data?.id) {
                    window.history.replaceState(null, '', `/citizen/receipt/${resp.data.id}`);
                }
            }
        } catch (err) {
            console.error("Sync failed for item", item.id, err);
            return false;
        }
    }
    return true;
};
