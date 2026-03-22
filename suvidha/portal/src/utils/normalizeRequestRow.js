/**
 * Normalize admin request rows from API, seed, or citizen bridge so tables always
 * get consistent applicant_name, service_name, phone.
 */
export function normalizeRequestRow(r) {
    if (!r || typeof r !== 'object') return r;
    const p = r.payload && typeof r.payload === 'object' ? r.payload : {};

    const applicant_name =
        r.applicant_name ||
        p.full_name ||
        p.fullName ||
        p.name ||
        p.applicant_name ||
        p.applicantName ||
        p.child_name ||
        p.ChildName ||
        p.owner_name ||
        p.OwnerName ||
        p['Owner Name'] ||
        'Citizen';

    const phone =
        r.phone ||
        p.phone ||
        p.phoneNumber ||
        p.mobile ||
        p.mobile_number ||
        p.Mobile ||
        'N/A';

    const rawService =
        r.service_name ||
        r.service_type ||
        r.service_code ||
        p.service_type ||
        'Service Request';
    const service_name =
        typeof rawService === 'string'
            ? rawService.replace(/_/g, ' ')
            : String(rawService);

    return {
        ...r,
        applicant_name,
        phone,
        service_name,
        extracted_data: r.extracted_data || p,
        intent_confidence:
            r.intent_confidence ??
            p.intent_confidence ??
            0.85,
        urgency_flag:
            r.urgency_flag ||
            r.priority === 'urgent' ||
            r.priority === 'URGENT' ||
            r.priority === 'high' ||
            r.priority === 'HIGH' ||
            !!r.fraud_flag,
    };
}
