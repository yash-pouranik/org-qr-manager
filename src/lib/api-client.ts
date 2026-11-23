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

/**
 * Resolves the public dynamic redirect base URL (where /r/:shortCode lives)
 * Priority:
 * 1. Explicit VITE_REDIRECT_BASE_URL environment variable
 * 2. If host matches tools.gitaforlife.net or gitaforlife.net -> https://qr.gitaforlife.net
 * 3. In dev mode (localhost:5173) -> http://localhost:3001
 * 4. Fallback to current window origin or https://qr.gitaforlife.net
 */
export function getRedirectBaseUrl(): string {
  if (import.meta.env.VITE_REDIRECT_BASE_URL) {
    return import.meta.env.VITE_REDIRECT_BASE_URL.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    const host = window.location.host
    if (host.includes('tools.gitaforlife.net') || host.includes('gitaforlife.net')) {
      return 'https://qr.gitaforlife.net'
    }
    if (host.includes('localhost:5173')) {
      return 'http://localhost:3001'
    }
    if (window.location.origin && !window.location.origin.includes('localhost')) {
      return window.location.origin.replace(/\/$/, '')
    }
  }
  return 'https://qr.gitaforlife.net'
}

/**
 * Generates the full dynamic short redirect link for a given shortCode
 */
export function getShortUrl(shortCode: string): string {
  const cleanCode = (shortCode || '').trim().replace(/^\/r\//, '').replace(/^\//, '')
  return `${getRedirectBaseUrl()}/r/${cleanCode}`
}

