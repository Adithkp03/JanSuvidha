/** Human-readable reference for citizens & admins (distinct from internal request id). */
export function generateSubmissionToken() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 6; i += 1) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `JSV-${y}${m}${day}-${suffix}`;
}
