import { notifyActiveAlertsChanged } from './activeAlertsSync';

const STORAGE_KEY = 'jan_active_alerts';

/**
 * @param {string | undefined} duration - e.g. "1 hour", "4 hours", "Until manually cleared"
 * @returns {number | null} milliseconds from start, or null = does not auto-expire
 */
export function durationToMs(duration) {
    if (!duration || /manually/i.test(String(duration))) return null;
    const s = String(duration).trim();
    const m = s.match(/(\d+)\s*hours?/i);
    if (m) return parseInt(m[1], 10) * 60 * 60 * 1000;
    return null;
}

/** @param {unknown} created_at */
function parseCreatedAtMs(created_at) {
    if (created_at == null) return NaN;
    if (typeof created_at === 'number' && Number.isFinite(created_at)) {
        const n = created_at;
        return n < 1e12 ? n * 1000 : n;
    }
    return new Date(/** @type {string} */ (created_at)).getTime();
}

/**
 * Read alerts from localStorage, drop expired ones (by duration + created_at), persist if changed.
 * "Until manually cleared" never expires here.
 * Alerts with missing/unparseable created_at are kept (never silently deleted).
 */
export function readAndPruneActiveAlerts() {
    let list = [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        list = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(list)) list = [];
    } catch {
        list = [];
    }

    const now = Date.now();
    const pruned = list.filter((a) => {
        if (!a || typeof a !== 'object') return false;
        const start = parseCreatedAtMs(a.created_at);
        const ms = durationToMs(a.duration);
        if (ms == null) return true;
        if (Number.isNaN(start)) return true;
        return now < start + ms;
    });

    if (pruned.length !== list.length) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
            notifyActiveAlertsChanged();
        } catch {
            /* ignore quota / private mode */
        }
    }

    return pruned;
}
