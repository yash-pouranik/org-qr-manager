import { createFileRoute, redirect } from '@tanstack/react-router'
import { QrGeneratorPage } from '@/features/qr-codes/create'

export const Route = createFileRoute('/_authenticated/qr-codes/create')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('org_user_profile')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Members cannot generate QR codes
        if (parsed?.role === 'member') {
          throw redirect({ to: '/qr-codes' })
        }
      }
    } catch (e: any) {
      if (e?.to) throw e
    }
  },
  component: QrGeneratorPage,
})
