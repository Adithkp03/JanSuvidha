import { normalizeRequestRow } from './normalizeRequestRow';

export const CITIZEN_SUBMISSIONS_KEY = 'jan-citizen-submissions';

const BC_NAME = 'jan-citizen-bridge';

function notifyBridgeUpdated() {
    try {
        window.dispatchEvent(new CustomEvent('jan-citizen-bridge-updated'));
    } catch { /* ignore */ }
    try {
        const bc = new BroadcastChannel(BC_NAME);
        bc.postMessage({ type: 'updated', ts: Date.now() });
        bc.close();
    } catch { /* ignore */ }
}

export function getCitizenSubmissionsRaw() {
    try {
        const raw = localStorage.getItem(CITIZEN_SUBMISSIONS_KEY);
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/** Submissions shaped for admin tables (normalized fields). */
export function getCitizenSubmissionsNormalized() {
    return getCitizenSubmissionsRaw().map((s) => normalizeRequestRow(s));
}

/**
 * Append or replace a submission (newest first). Used after citizen apply flow.
 */
export function appendCitizenSubmission(entry) {
    if (!entry?.id) return;
    const existing = getCitizenSubmissionsRaw();
    const next = [entry, ...existing.filter((e) => e.id !== entry.id)];
    localStorage.setItem(CITIZEN_SUBMISSIONS_KEY, JSON.stringify(next));
    notifyBridgeUpdated();
}

/**
 * Merge imported rows (e.g. from another device) by id. Later imports win on duplicate id.
 */
export function mergeImportedSubmissions(incoming) {
    if (!Array.isArray(incoming) || incoming.length === 0) return 0;
    const map = new Map();
    getCitizenSubmissionsRaw().forEach((r) => {
        if (r?.id) map.set(r.id, r);
    });
    incoming.forEach((r) => {
        if (r?.id) map.set(r.id, r);
    });
    const merged = [...map.values()];
    localStorage.setItem(CITIZEN_SUBMISSIONS_KEY, JSON.stringify(merged));
    notifyBridgeUpdated();
    return incoming.length;
}

export function downloadBridgeExport() {
    const raw = getCitizenSubmissionsRaw();
    const blob = new Blob([JSON.stringify(raw, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jan-citizen-submissions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}

export function parseBridgeImportFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                const arr = Array.isArray(data) ? data : data.submissions || data.items || [];
                if (!Array.isArray(arr)) {
                    reject(new Error('Invalid file: expected a JSON array'));
                    return;
                }
                resolve(arr);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

export function subscribeToBridgeUpdates(callback) {
    const onStorage = (e) => {
        if (e.key === CITIZEN_SUBMISSIONS_KEY) callback();
    };
    const onCustom = () => callback();
    window.addEventListener('storage', onStorage);
    window.addEventListener('jan-citizen-bridge-updated', onCustom);
    let bc;
    try {
        bc = new BroadcastChannel(BC_NAME);
        bc.onmessage = () => callback();
    } catch { /* ignore */ }
    return () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('jan-citizen-bridge-updated', onCustom);
        try {
            bc?.close();
        } catch { /* ignore */ }
    };
}
