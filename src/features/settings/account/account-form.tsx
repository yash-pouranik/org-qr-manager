import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { KeyRound, Loader2, ShieldCheck, Database, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PasswordInput } from '@/components/password-input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthUser } from '@/context/auth-context'
import { userService } from '@/services/user-service'
import { urClient } from '@/lib/urbackend'

const passwordFormSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long.'),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ['confirmPassword'],
  })

type PasswordFormValues = z.infer<typeof passwordFormSchema>

export function AccountForm() {
  const { user } = useAuthUser()
  const [isUpdating, setIsUpdating] = useState(false)

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: PasswordFormValues) => {
    if (!user?.email) {
      toast.error('No authenticated user session found.')
      return
    }

    try {
      setIsUpdating(true)

      // 1. Update password in backend API
      await userService.changePassword({
        email: user.email,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })

      // 2. Also attempt update in urBackend if auth token exists
      try {
        const token =
          localStorage.getItem('ub_auth_token') ||
          sessionStorage.getItem('ub_auth_token') ||
          undefined
        if (token && values.currentPassword) {
          await urClient.auth.changePassword(
            {
              currentPassword: values.currentPassword,
              newPassword: values.newPassword,
            },
            token
          )
        }
      } catch (urErr) {
        console.warn('Direct urBackend changePassword notice:', urErr)
      }

      toast.success('Your password has been changed successfully.')
      form.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password. Please check your current password.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className='space-y-8'>
      {/* Account Security Information Card */}
      <Card className='border-border/60 shadow-xs'>
        <CardContent className='p-5 space-y-4'>
          <h4 className='text-sm font-semibold text-foreground flex items-center gap-2'>
            <ShieldCheck className='size-4 text-primary' />
            Session & Security Credentials
          </h4>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs'>
            <div className='space-y-1'>
              <span className='text-muted-foreground flex items-center gap-1.5'>
                <Database className='size-3.5 text-muted-foreground/70' />
                Auth Service Provider
              </span>
              <p className='font-medium text-foreground'>urBackend Cloud Auth & MongoDB</p>
            </div>

            <div className='space-y-1'>
              <span className='text-muted-foreground'>Account Status</span>
              <div>
                <Badge variant='outline' className='bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-medium'>
                  Active
                </Badge>
              </div>
            </div>

            <div className='space-y-1'>
              <span className='text-muted-foreground'>Account Identifier (UID)</span>
              <p className='font-mono text-muted-foreground truncate'>
                {user?.auth_id || user?._id || 'Standard Identity'}
              </p>
            </div>

            <div className='space-y-1'>
              <span className='text-muted-foreground flex items-center gap-1.5'>
                <Calendar className='size-3.5 text-muted-foreground/70' />
                Last Session Login
              </span>
              <p className='text-muted-foreground font-mono'>
                {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Active Session'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Form */}
      <div className='space-y-4'>
        <div>
          <h3 className='text-base font-semibold text-foreground flex items-center gap-2'>
            <KeyRound className='size-4 text-primary' />
            Change Password
          </h3>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Ensure your account is using a strong password with at least 6 characters.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4 max-w-lg'>
            <FormField
              control={form.control}
              name='currentPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password (If set)</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='Enter current password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='Minimum 6 characters' {...field} />
                  </FormControl>
                  <FormDescription>
                    Must be at least 6 characters long.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='Re-enter new password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type='submit'
              disabled={isUpdating}
              className='gap-2 shadow-xs'
            >
              {isUpdating && <Loader2 className='size-4 animate-spin' />}
              <span>Update Password</span>
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
