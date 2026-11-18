import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, type RenderResult } from 'vitest-browser-react'
import { type Locator, userEvent } from 'vitest/browser'
import { OtpForm } from './otp-form'

const navigate = vi.fn()

vi.mock('@tanstack/react-router', async (orig) => {
  const actual = await orig<typeof import('@tanstack/react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
    useSearch: () => ({ email: 'test@example.com' }),
  }
})

vi.mock('@/lib/urbackend', () => ({
  requestPasswordReset: vi.fn().mockResolvedValue({ success: true, message: 'OTP sent' }),
  resetPasswordWithOtp: vi.fn().mockResolvedValue({ success: true, message: 'Password reset' }),
}))

describe('OtpForm', () => {
  let screen: RenderResult
  let otpInput: Locator
  let submitButton: Locator

  beforeEach(async () => {
    vi.clearAllMocks()

    screen = await render(<OtpForm />)
    otpInput = screen.getByLabelText(/Verification Code|One-Time Password/i)
    submitButton = screen.getByRole('button', { name: /Reset Password/i })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('disables submit button until 6 digits are entered', async () => {
    await expect.element(submitButton).toBeDisabled()

    await userEvent.fill(otpInput, '12345')
    await expect.element(submitButton).toBeDisabled()

    await userEvent.fill(otpInput, '123456')
    await expect.element(submitButton).toBeEnabled()
  })
})
