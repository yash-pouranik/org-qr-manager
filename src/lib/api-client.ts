/**
 * API Client helper for dynamic backend endpoint resolution
 * Prevents "blocked:mixed-content" by enforcing HTTPS on secure origins.
 */

/**
 * Resolves the backend API base URL with HTTPS enforcement
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return (
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_REDIRECT_BASE_URL ||
      'https://qr.gitaforlife.net'
    ).replace(/\/$/, '')
  }

  const isHttps = window.location.protocol === 'https:'
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'

  let raw = (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_REDIRECT_BASE_URL ||
    ''
  ).trim()

  // If deployed on remote HTTPS/production, do NOT use localhost:3001
  if (!isLocalhost && (raw.includes('localhost') || raw.includes('127.0.0.1'))) {
    raw = 'https://qr.gitaforlife.net'
  }

  // If no env variable is provided in hosting dashboard
  if (!raw) {
    if (isLocalhost) {
      raw = 'http://localhost:3001'
    } else if (window.location.host.includes('gitaforlife.net')) {
      raw = 'https://qr.gitaforlife.net'
    } else {
      raw = window.location.origin
    }
  }

  // CRITICAL: Blocked Mixed Content Prevention
  // When the UI is loaded over HTTPS (https://tools.gitaforlife.net),
  // ANY request to http:// is blocked by the browser. Force HTTPS protocol!
  if (isHttps && raw.startsWith('http://')) {
    raw = raw.replace(/^http:\/\//i, 'https://')
  }

  return raw.replace(/\/$/, '')
}

/**
 * Backwards compatibility accessor for API_BASE_URL
 */
export const API_BASE_URL = getApiBaseUrl()

/**
 * Builds a safe API URL for fetch / axios calls.
 * Guaranteed to never return an insecure HTTP URL on HTTPS pages.
 */
export function apiUrl(endpoint: string): string {
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const base = getApiBaseUrl()
  let fullUrl = base ? `${base}${clean}` : clean

  // Double check mixed content safeguard
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    fullUrl.startsWith('http://')
  ) {
    fullUrl = fullUrl.replace(/^http:\/\//i, 'https://')
  }

  return fullUrl
}

/**
 * Resolves the public dynamic redirect base URL (where /r/:shortCode lives)
 */
export function getRedirectBaseUrl(): string {
  return getApiBaseUrl()
}

/**
 * Generates the full dynamic short redirect link for a given shortCode
 */
export function getShortUrl(shortCode: string): string {
  const cleanCode = (shortCode || '').trim().replace(/^\/r\//, '').replace(/^\//, '')
  return `${getRedirectBaseUrl()}/r/${cleanCode}`
}
