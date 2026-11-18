import { UrBackendClient } from '@urbackend/sdk'

export const URBACKEND_BASE_URL = (
  import.meta.env.VITE_URBACKEND_BASE_URL || 'https://urbackend-api.onrender.com'
).replace(/\/+$/, '')

export const URBACKEND_PUBLISHABLE_KEY =
  import.meta.env.VITE_URBACKEND_PUBLISHABLE_KEY || ''

/**
 * Official urBackend JavaScript/TypeScript SDK Client
 */
export const urClient = new UrBackendClient({
  apiKey: URBACKEND_PUBLISHABLE_KEY,
  baseUrl: URBACKEND_BASE_URL,
})

/**
 * Request password reset OTP to user's email
 */
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (urClient?.auth && typeof urClient.auth.requestPasswordReset === 'function') {
      const res = await urClient.auth.requestPasswordReset({ email })
      return {
        success: true,
        message: res?.message || 'Verification OTP code sent to your email.',
      }
    }
  } catch (err: any) {
    throw new Error(err?.message || 'Failed to request password reset code.')
  }

  // Direct HTTP Fallback
  const res = await fetch(`${URBACKEND_BASE_URL}/api/userAuth/request-password-reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': URBACKEND_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ email }),
  })

  const json = await res.json()
  if (!res.ok || json.success === false) {
    throw new Error(json.message || json.error || 'Failed to request password reset code.')
  }

  return {
    success: true,
    message: json.message || 'Verification OTP code sent to your email.',
  }
}

/**
 * Reset password using OTP received via email
 */
export async function resetPasswordWithOtp(payload: {
  email: string
  otp: string
  newPassword: string
}): Promise<{ success: boolean; message: string }> {
  try {
    if (urClient?.auth && typeof urClient.auth.resetPassword === 'function') {
      const res = await urClient.auth.resetPassword(payload)
      return {
        success: true,
        message: res?.message || 'Password has been reset successfully.',
      }
    }
  } catch (err: any) {
    throw new Error(err?.message || 'Invalid or expired OTP code.')
  }

  // Direct HTTP Fallback
  const res = await fetch(`${URBACKEND_BASE_URL}/api/userAuth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': URBACKEND_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(payload),
  })

  const json = await res.json()
  if (!res.ok || json.success === false) {
    throw new Error(json.message || json.error || 'Invalid or expired OTP code.')
  }

  return {
    success: true,
    message: json.message || 'Password has been reset successfully.',
  }
}
