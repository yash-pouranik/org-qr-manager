/**
 * API Client helper for dynamic backend endpoint resolution
 * Prepends VITE_REDIRECT_BASE_URL / VITE_API_URL when configured in production
 */
export const API_BASE_URL = (
  import.meta.env.VITE_REDIRECT_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ''
).replace(/\/$/, '')

export function apiUrl(endpoint: string): string {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return API_BASE_URL ? `${API_BASE_URL}${clean}` : clean
}
