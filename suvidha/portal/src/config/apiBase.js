/**
 * Single source for dev/prod API origin. Empty string = same-origin (Vite proxy in dev).
 * Supports legacy VITE_API_URL until all env files are updated.
 */
export const API_BASE =
    import.meta.env.VITE_API_BASE ?? import.meta.env.VITE_API_URL ?? '';
