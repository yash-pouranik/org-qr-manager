import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Loader2 } from 'lucide-react'
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
import { requestPasswordReset } from '@/lib/urbackend'

const formSchema = z.object({
  email: z
    .string()
    .min(1, 'Please enter your email.')
    .email('Please enter a valid organization email.'),
})

export function ForgotPasswordForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await requestPasswordReset(data.email)

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('reset_email', data.email)
      }

      toast.success(`6-digit OTP code sent to ${data.email}`)
      form.reset()
      navigate({ to: '/otp', search: { email: data.email } })
    } catch (err: any) {
      toast.error(err?.message || 'Failed to request password reset.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-2', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='admin@organization.local' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2 bg-primary text-primary-foreground hover:bg-primary/90' disabled={isLoading}>
          {isLoading ? (
            <Loader2 className='animate-spin' />
          ) : (
            <>
              Continue
              <ArrowRight className='size-4 ms-1' />
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
