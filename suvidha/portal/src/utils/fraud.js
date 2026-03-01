/**
 * Simple Rules Engine for Fraud & Misuse Detection flags.
 */

/**
 * Analyzes a request against historical aggregated data to flag fraud risk.
 * @param {Object} request - The single request payload
 * @param {Object} historicalContext - Relevant metrics fetched from backend (e.g. recent hashes)
 * @returns {Array} List of flags. If empty, no fraud detected.
 */
export const detectFraudFlags = (request, historicalContext = {}) => {
    const flags = [];

    // Rule 1: Document Hash / Content Reuse
    // If the same exact PDF payload/hash is used across unrelated applications in a short span.
    if (request.documents && historicalContext.flagged_hashes) {
        const reusedFound = request.documents.some(doc => historicalContext.flagged_hashes.includes(doc.hash));
        if (reusedFound) {
            flags.push({
                severity: 'CRITICAL',
                code: 'DOC_REUSE_DETECTED',
                reason: 'A document in this request matches a hash flagged in multiple recent applications.',
                action_required: 'Manual verification of document authenticity required.'
            });
        }
    }

    // Rule 2: High Velocity from single phone number
    // We expect 1-2 applications. If > 5 in 24 hours, suspicious.
    if (request.phone && historicalContext.velocity_counts && historicalContext.velocity_counts[request.phone]) {
        if (historicalContext.velocity_counts[request.phone] > 5) {
            flags.push({
                severity: 'WARNING',
                code: 'HIGH_VELOCITY_USER',
                reason: `Phone number ${request.phone} submitted > 5 applications in 24 hours.`,
                action_required: 'Check for overlapping/duplicate requests.'
            });
        }
    }

    // Rule 3: Intent / Service Category Mismatch
    // If AI routing confidence was extremely low but they forced an application through.
    if (request.intent_confidence !== undefined && request.intent_confidence < 0.3) {
        // Further check if OCR data completely mismatches expected fields (stub)
        if (request.ai_ocr_validation_status === 'MISMATCH') {
            flags.push({
                severity: 'HIGH',
                code: 'INTENT_DOC_MISMATCH',
                reason: 'The applicant intent confidence is very low AND the uploaded document OCR data does not match the requested service requirements.',
                action_required: 'Review documents closely; ensure correct form was filled.'
            });
        }
    }

    return flags;
};
