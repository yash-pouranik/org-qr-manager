import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    if (typeof window === 'undefined') return

    const hasToken =
      localStorage.getItem('ub_auth_token') ||
      localStorage.getItem('org_user_profile') ||
      document.cookie.includes('thisisjustarandomstring')

    if (!hasToken) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.href },
      })
    }
  },
  component: AuthenticatedLayout,
})
