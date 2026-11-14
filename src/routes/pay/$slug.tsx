import { createFileRoute } from '@tanstack/react-router'
import { SmartDonationPage } from '@/features/donation/smart-donation-page'

export const Route = createFileRoute('/pay/$slug')({
  component: SmartDonationPage,
})
