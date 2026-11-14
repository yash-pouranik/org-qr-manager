import { UrBackendClient } from '@urbackend/sdk'

export const URBACKEND_BASE_URL = (
  import.meta.env.VITE_URBACKEND_BASE_URL || 'https://urbackend-api.onrender.com'
).replace(/\/$/, '')

export const URBACKEND_PUBLISHABLE_KEY =
  import.meta.env.VITE_URBACKEND_PUBLISHABLE_KEY || ''

/**
 * Official urBackend JavaScript/TypeScript SDK Client
 * Configured with the official API Base URL: https://api.urbackend.in
 */
export const urClient = new UrBackendClient({
  apiKey: URBACKEND_PUBLISHABLE_KEY,
  baseUrl: URBACKEND_BASE_URL,
})
