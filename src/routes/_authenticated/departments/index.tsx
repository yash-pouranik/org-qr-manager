import { createFileRoute, redirect } from '@tanstack/react-router'
import { DepartmentsPage } from '@/features/departments'

export const Route = createFileRoute('/_authenticated/departments/')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('org_user_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Super admin only route
        if (parsed?.role !== 'super_admin' && parsed?.role !== 'superadmin') {
          throw redirect({ to: '/' })
        }
      }
    } catch (e: any) {
      if (e?.to) throw e
    }
  },
  component: DepartmentsPage,
})
