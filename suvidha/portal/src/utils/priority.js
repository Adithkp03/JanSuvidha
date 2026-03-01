/**
 * Priority and SLA Calculation Engine
 */

export const PRIORITY_LEVELS = {
    URGENT: { label: 'URGENT', color: 'bg-red-100 text-red-800 border-red-200', score: 3 },
    HIGH: { label: 'HIGH', color: 'bg-amber-100 text-amber-800 border-amber-200', score: 2 },
    NORMAL: { label: 'NORMAL', color: 'bg-slate-100 text-slate-800 border-slate-200', score: 1 }
};

/**
 * Calculates priority score and enum based on multiple input signals.
 * @param {Object} requestData - The citizen request data.
 * @param {Object} serviceMeta - Metadata for the specific service (SLA days, etc).
 * @returns {Object} { priority: 'URGENT'|'HIGH'|'NORMAL', score: number, slaRemainingMs: number }
 */
export const calculatePriority = (requestData, serviceMeta = {}) => {
    let score = 0;

    // 1. Base SLA check
    const createdAt = new Date(requestData.created_at || Date.now());
    const estimatedDays = serviceMeta.processing_days || 7;
    const slaDeadline = new Date(createdAt.getTime() + estimatedDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const slaRemainingMs = slaDeadline - now;

    // If overdue or less than 24 hours remaining -> Bump priority heavily
    if (slaRemainingMs < 0) {
        score += 50; // Massively overdue
    } else if (slaRemainingMs < 24 * 60 * 60 * 1000) {
        score += 20; // 1 day left
    }

    // 2. Explicit Urgency Flag
    if (requestData.urgency_flag) {
        score += 30;
    }

    // 3. Citizen Category (e.g. Elderly / Disabled get prioritization)
    if (['elderly', 'disabled', 'veteran'].includes(requestData.citizen_category?.toLowerCase())) {
        score += 15;
    }

    // 4. Intent Confidence (If AI routing confidence was very low, manual admin review is critical)
    if (requestData.intent_confidence !== undefined && requestData.intent_confidence < 0.5) {
        score += 10;
    }

    // Determine strict enum classification
    let priorityEnum = 'NORMAL';
    if (score >= 40) {
        priorityEnum = 'URGENT';
    } else if (score >= 20) {
        priorityEnum = 'HIGH';
    }

    return {
        priority: priorityEnum,
        score,
        slaRemainingMs,
        slaDeadline
    };
};

/**
 * Helper to get human readable SLA remaining text.
 */
export const formatSLARemaining = (ms) => {
    if (ms < 0) {
        const daysOverdue = Math.floor(Math.abs(ms) / (1000 * 60 * 60 * 24));
        return `Overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}`;
    }

    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} left`;

    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours > 0) return `${hours} hr${hours !== 1 ? 's' : ''} left`;

    const minutes = Math.floor(ms / (1000 * 60));
    return `${minutes} min${minutes !== 1 ? 's' : ''} left`;
};
