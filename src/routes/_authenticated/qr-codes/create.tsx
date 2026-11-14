import { createFileRoute } from '@tanstack/react-router'
import { QrGeneratorPage } from '@/features/qr-codes/create'

export const Route = createFileRoute('/_authenticated/qr-codes/create')({
  component: QrGeneratorPage,
})
