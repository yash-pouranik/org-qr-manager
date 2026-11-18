import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2, Loader2, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'
import { requestPasswordReset, resetPasswordWithOtp } from '@/lib/urbackend'

const formSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Please enter your registered email.')
      .email('Please enter a valid organization email.'),
    otp: z
      .string()
      .min(6, 'Please enter the 6-digit verification code.')
      .max(6, 'Please enter the 6-digit verification code.'),
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters long.'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

type OtpFormData = z.infer<typeof formSchema>

type OtpFormProps = React.HTMLAttributes<HTMLFormElement>

export function OtpForm({ className, ...props }: OtpFormProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(60)

  // Retrieve email from URL search or sessionStorage
  const search: any = (() => {
    try {
      return useSearch({ from: '/(auth)/otp' })
    } catch {
      return {}
    }
  })()

  const initialEmail =
    search?.email ||
    (typeof window !== 'undefined' ? sessionStorage.getItem('reset_email') || '' : '')

  const [emailLocked, setEmailLocked] = useState(Boolean(initialEmail))

  const form = useForm<OtpFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: initialEmail,
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  // 60-second cooldown timer for resending OTP
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const watchedEmail = form.watch('email')
  const watchedOtp = form.watch('otp')

  async function handleResendCode() {
    if (!watchedEmail) {
      toast.error('Please specify your email to resend OTP.')
      return
    }

    setIsResending(true)
    try {
      await requestPasswordReset(watchedEmail)
      toast.success(`A fresh 6-digit OTP code has been sent to ${watchedEmail}`)
      setCountdown(60)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend verification code.')
    } finally {
      setIsResending(false)
    }
  }

  async function onSubmit(data: OtpFormData) {
    setIsLoading(true)
    try {
      await resetPasswordWithOtp({
        email: data.email.trim(),
        otp: data.otp.trim(),
        newPassword: data.newPassword,
      })

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('reset_email')
      }

      toast.success('Password reset successfully! Please sign in with your new password.')
      navigate({ to: '/sign-in' })
    } catch (err: any) {
      toast.error(err?.message || 'Invalid or expired OTP code.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-4', className)}
        {...props}
      >
        {/* Email Field with locked / edit capability */}
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <div className='flex items-center justify-between'>
                <FormLabel>Registered Email</FormLabel>
                {emailLocked && (
                  <button
                    type='button'
                    onClick={() => setEmailLocked(false)}
                    className='text-xs text-primary underline underline-offset-2 hover:opacity-80'
                  >
                    Change Email
                  </button>
                )}
              </div>
              <FormControl>
                <Input
                  placeholder='admin@organization.local'
                  {...field}
                  disabled={emailLocked || isLoading}
                  className={emailLocked ? 'bg-muted text-muted-foreground' : ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 6-digit OTP Input */}
        <FormField
          control={form.control}
          name='otp'
          render={({ field }) => (
            <FormItem>
              <div className='flex items-center justify-between'>
                <FormLabel>One-Time Password (6-Digit OTP)</FormLabel>
                <button
                  type='button'
                  onClick={handleResendCode}
                  disabled={countdown > 0 || isResending || isLoading}
                  className='text-xs text-primary hover:underline disabled:text-muted-foreground disabled:no-underline'
                >
                  {isResending ? (
                    <span className='flex items-center gap-1'>
                      <RotateCw className='size-3 animate-spin' /> Sending...
                    </span>
                  ) : countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : (
                    'Resend OTP'
                  )}
                </button>
              </div>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  {...field}
                  disabled={isLoading}
                  containerClassName='justify-between sm:[&>[data-slot="input-otp-group"]>div]:w-12'
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* New Password */}
        <FormField
          control={form.control}
          name='newPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder='Enter new password (min 6 characters)'
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Confirm Password */}
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder='Confirm new password'
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className='flex flex-col gap-2 pt-2'>
          <Button
            type='submit'
            className='w-full bg-primary text-primary-foreground hover:bg-primary/90'
            disabled={watchedOtp.length < 6 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className='me-2 size-4 animate-spin' />
                Verifying & Updating...
              </>
            ) : (
              <>
                <CheckCircle2 className='me-2 size-4' />
                Reset Password
              </>
            )}
          </Button>

          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => navigate({ to: '/forgot-password' })}
            disabled={isLoading}
            className='w-full text-muted-foreground'
          >
            <ArrowLeft className='me-1 size-3.5' />
            Back to Request Form
          </Button>
        </div>
      </form>
    </Form>
  )
}
