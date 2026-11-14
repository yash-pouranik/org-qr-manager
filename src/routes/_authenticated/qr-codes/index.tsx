import { createFileRoute } from '@tanstack/react-router'
import { QrCodesPage } from '@/features/qr-codes'

export const Route = createFileRoute('/_authenticated/qr-codes/')({
  component: QrCodesPage,
})
