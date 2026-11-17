import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, ShieldCheck, Building2, Mail, Phone, User, CheckCircle2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuthUser } from '@/context/auth-context'
import { userService } from '@/services/user-service'
import { urClient } from '@/lib/urbackend'

const profileFormSchema = z.object({
  firstName: z.string().min(1, 'First Name is required.'),
  lastName: z.string().min(1, 'Last Name is required.'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters.')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, and hyphens.'),
  phoneNumber: z.string(),
  email: z.string().email(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const { user, updateUserProfile } = useAuthUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Derive initial values from active auth profile
  const initialFirstName = user?.firstName || (user?.full_name?.split(' ')[0] || '')
  const initialLastName = user?.lastName || (user?.full_name?.split(' ').slice(1).join(' ') || '')
  const initialUsername = user?.username || user?.email?.split('@')[0] || ''
  const initialPhone = user?.phoneNumber || user?.phone || ''
  const email = user?.email || ''

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: {
      firstName: initialFirstName,
      lastName: initialLastName,
      username: initialUsername,
      phoneNumber: initialPhone,
      email,
    },
    mode: 'onChange',
  })

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsSubmitting(true)

      // 1. Update personal details in backend API and persistence layer
      await userService.updateProfile({
        email,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        phoneNumber: data.phoneNumber,
      })

      // 2. Also sync to urBackend Cloud Auth profile if accessToken is present
      try {
        const token =
          localStorage.getItem('ub_auth_token') ||
          sessionStorage.getItem('ub_auth_token') ||
          undefined
        if (token) {
          await urClient.auth.updateProfile(
            {
              name: `${data.firstName} ${data.lastName}`.trim(),
              username: data.username,
              phoneNumber: data.phoneNumber,
            },
            token
          )
        }
      } catch (urErr) {
        // Non-blocking fallback if urBackend auth session is handled via server
        console.warn('Direct urBackend profile sync notice:', urErr)
      }

      // 3. Update global client AuthContext state
      updateUserProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        phone: data.phoneNumber,
        phoneNumber: data.phoneNumber,
        full_name: `${data.firstName} ${data.lastName}`.trim(),
      })

      toast.success('Your profile details have been successfully updated in database.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayName = `${form.watch('firstName') || initialFirstName} ${form.watch('lastName') || initialLastName}`.trim() || 'User Profile'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const roleLabel = (user?.role || 'member').replace('_', ' ').toUpperCase()
  const departmentLabel = user?.department_name || 'All Departments'

  return (
    <div className='space-y-6'>
      {/* Profile Header Summary Card */}
      <div className='flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 sm:flex-row sm:items-center sm:justify-between shadow-xs'>
        <div className='flex items-center gap-4'>
          <Avatar className='size-14 border border-border/80 bg-muted'>
            <AvatarImage src={user?.avatar_url || ''} alt={displayName} />
            <AvatarFallback className='bg-primary/10 text-primary text-base font-bold'>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className='space-y-1'>
            <h3 className='text-lg font-semibold text-foreground flex items-center gap-2'>
              {displayName}
              <CheckCircle2 className='size-4 text-emerald-600' />
            </h3>
            <p className='text-xs text-muted-foreground flex items-center gap-1.5'>
              <Mail className='size-3 text-muted-foreground/70' />
              {email}
            </p>
          </div>
        </div>

        {/* Badges for Enterprise Governance & Department */}
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant='outline' className='bg-primary/10 text-primary border-primary/25 gap-1 py-1'>
            <ShieldCheck className='size-3.5' />
            <span>{roleLabel}</span>
          </Badge>
          <Badge variant='outline' className='bg-muted text-muted-foreground gap-1 py-1'>
            <Building2 className='size-3.5' />
            <span>{departmentLabel}</span>
          </Badge>
        </div>
      </div>

      {/* Editable Profile Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* First & Last Name */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='firstName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <User className='size-3.5 text-muted-foreground' />
                    First Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. Yash' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='lastName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. Pouranik' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Username & Phone Number */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='username'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. yashpouranik' {...field} />
                  </FormControl>
                  <FormDescription>
                    Unique organizational handle used in activity attribution and team logs.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='phoneNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='flex items-center gap-1.5'>
                    <Phone className='size-3.5 text-muted-foreground' />
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. +91 9876543210' {...field} />
                  </FormControl>
                  <FormDescription>
                    Contact number for important administrative and alerts communication.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Primary Authentication Email (Read-Only) */}
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='flex items-center gap-1.5'>
                  <Mail className='size-3.5 text-muted-foreground' />
                  Primary Authentication Email
                </FormLabel>
                <FormControl>
                  <Input {...field} disabled className='bg-muted/60 cursor-not-allowed font-mono' />
                </FormControl>
                <FormDescription>
                  Your primary authentication email address. Managed through centralized organizational security.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Button */}
          <div className='flex items-center justify-end gap-3 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => form.reset()}
              disabled={isSubmitting || !form.formState.isDirty}
            >
              Discard Changes
            </Button>
            <Button
              type='submit'
              disabled={isSubmitting || !form.formState.isDirty}
              className='gap-2 shadow-xs'
            >
              {isSubmitting && <Loader2 className='size-4 animate-spin' />}
              <span>Save Profile Details</span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
