import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuditLogsPage } from '@/features/audit-logs'

export const Route = createFileRoute('/_authenticated/audit-logs/')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('org_user_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Super Admin or Admin only route
        const role = parsed?.role
        if (role !== 'super_admin' && role !== 'superadmin' && role !== 'admin') {
          throw redirect({ to: '/' })
        }
      }
    } catch (e: any) {
      if (e?.to) throw e
    }
  },
  component: AuditLogsPage,
})
