/**
 * localStorage 'storage' events only fire in *other* tabs, not the writer tab.
 * BroadcastChannel + CustomEvent give same-tab and instant cross-tab updates for kiosks.
 */
const CHANNEL = 'jan-active-alerts-v1';
const DOM_EVENT = 'jan-active-alerts-changed';

export function notifyActiveAlertsChanged() {
    try {
        window.dispatchEvent(new CustomEvent(DOM_EVENT));
    } catch {
        /* ignore */
    }
    try {
        const bc = new BroadcastChannel(CHANNEL);
        bc.postMessage({ v: 1, t: Date.now() });
        bc.close();
    } catch {
        /* ignore */
    }
}

/** Subscribe to alert list changes (same tab, other tabs, or other windows same origin). */
export function subscribeActiveAlertsChanged(callback) {
    const onDom = () => callback();
    window.addEventListener(DOM_EVENT, onDom);

    const onStorage = (e) => {
        if (e.key === 'jan_active_alerts') callback();
    };
    window.addEventListener('storage', onStorage);

    let bc;
    try {
        bc = new BroadcastChannel(CHANNEL);
        bc.onmessage = () => callback();
    } catch {
        /* ignore */
    }

    return () => {
        window.removeEventListener(DOM_EVENT, onDom);
        window.removeEventListener('storage', onStorage);
        try {
            bc?.close();
        } catch {
            /* ignore */
        }
    };
}
