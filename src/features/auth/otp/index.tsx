import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { OtpForm } from './components/otp-form'

export function Otp() {
  return (
    <AuthLayout>
      <Card className='max-w-md gap-4 sm:min-w-md'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Reset Password
          </CardTitle>
          <CardDescription>
            Enter the 6-digit verification code sent to your email along with your new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OtpForm />
        </CardContent>
        <CardFooter>
          <p className='px-8 text-center text-sm text-muted-foreground w-full'>
            Remember your credentials?{' '}
            <Link
              to='/sign-in'
              className='underline underline-offset-4 hover:text-primary'
            >
              Back to Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
