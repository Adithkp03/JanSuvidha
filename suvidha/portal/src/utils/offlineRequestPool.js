import seedData from '../../seed/admin-seed.json';
import { normalizeRequestRow } from './normalizeRequestRow';
import { getCitizenSubmissionsNormalized } from './citizenBridge';

/**
 * Citizen bridge rows first, then seed demo rows (deduped by id).
 * Used when the API gateway is unreachable.
 */
export function mergeOfflineRequestPool() {
    const seedRows = (seedData.requests || []).map((r) => normalizeRequestRow(r));
    const localRows = getCitizenSubmissionsNormalized();
    const localIds = new Set(localRows.map((r) => r.id));
    return [...localRows, ...seedRows.filter((s) => !localIds.has(s.id))];
}
