import { useState, useEffect } from 'react'
import { useParams } from '@tanstack/react-router'
import {
  Sparkles,
  ShieldCheck,
  Smartphone,
  HeartHandshake,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { qrService } from '@/services/qr-service'

export function SmartDonationPage() {
  const { slug } = useParams({ strict: false }) as { slug?: string }
  const [loading, setLoading] = useState(true)
  const [campaign, setCampaign] = useState<any>(null)

  const [selectedAmount, setSelectedAmount] = useState<string>('501')
  const [customAmount, setCustomAmount] = useState<string>('')
  const [donorName, setDonorName] = useState<string>('')
  const [donorPhone, setDonorPhone] = useState<string>('')
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    async function loadCampaign() {
      try {
        setLoading(true)
        const data = await qrService.getDonationCampaign(slug || 'annadhanam')
        setCampaign(data)
      } finally {
        setLoading(false)
      }
    }
    loadCampaign()
  }, [slug])

  const effectiveAmount = customAmount ? customAmount : selectedAmount
  const vpa = campaign?.donationConfig?.payeeVpa || 'temple.seva@okhdfcbank'
  const payeeName = campaign?.donationConfig?.payeeName || 'Temple Management Trust'
  const sevaNote = campaign?.donationConfig?.sevaNote || campaign?.name || 'Temple Seva Contribution'

  // Construct direct UPI intent string
  const upiUrl = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${encodeURIComponent(effectiveAmount || '501')}&cu=INR&tn=${encodeURIComponent(
    donorName ? `${sevaNote} - ${donorName}` : sevaNote
  )}`

  // Quick amounts
  const presetAmounts = campaign?.donationConfig?.defaultAmounts || [101, 251, 501, 1100, 5001]

  const handleLaunchUpi = () => {
    window.location.href = upiUrl
    setTimeout(() => {
      setIsSuccess(true)
    }, 2500)
  }

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4'>
        <div className='text-center space-y-2'>
          <div className='size-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto' />
          <p className='text-xs text-muted-foreground'>Loading Seva Campaign Portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-emerald-50/60 via-slate-50 to-amber-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 px-4 sm:px-6 flex flex-col items-center justify-center'>
      <div className='w-full max-w-md space-y-4'>
        {/* Top Temple Branding Header */}
        <div className='text-center space-y-1.5'>
          <div className='inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 border border-emerald-600/20 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300'>
            <Sparkles className='size-3.5 text-amber-500' />
            <span>Organization Seva Portal</span>
          </div>
          <h1 className='text-xl sm:text-2xl font-bold tracking-tight text-foreground'>
            {campaign?.name || 'Seva & Donation Portal'}
          </h1>
          <p className='text-xs text-muted-foreground'>
            Department of {campaign?.departmentName || 'Temple Administration'}
          </p>
        </div>

        {/* Donation Card */}
        <Card className='border-border/80 shadow-md backdrop-blur-sm'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-semibold flex items-center gap-1.5'>
                <HeartHandshake className='size-4 text-primary' />
                Select Seva Offering
              </CardTitle>
              <Badge variant='outline' className='bg-primary/5 text-primary text-[10px]'>
                Direct UPI
              </Badge>
            </div>
            <CardDescription className='text-xs'>
              Choose a predefined seva amount or enter a custom contribution.
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4 pt-1'>
            {/* Amount Chips */}
            <div className='grid grid-cols-3 gap-2'>
              {presetAmounts.map((amt: number) => {
                const isSelected = selectedAmount === String(amt) && !customAmount

                return (
                  <button
                    key={amt}
                    type='button'
                    onClick={() => {
                      setSelectedAmount(String(amt))
                      setCustomAmount('')
                    }}
                    className={`rounded-xl border p-2.5 text-center font-bold text-sm transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                        : 'border-border/80 hover:border-primary/50 text-foreground bg-card'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                )
              })}
            </div>

            {/* Custom Amount Input */}
            <div className='space-y-1.5'>
              <Label htmlFor='custom-amount' className='text-xs text-muted-foreground'>
                Or Custom Contribution (₹ INR)
              </Label>
              <div className='relative'>
                <span className='absolute left-3 top-2.5 text-sm font-bold text-muted-foreground'>
                  ₹
                </span>
                <Input
                  id='custom-amount'
                  type='number'
                  min='1'
                  placeholder='Enter custom seva amount'
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className='pl-7 text-sm font-semibold'
                />
              </div>
            </div>

            {/* Donor Optional Details */}
            <div className='grid grid-cols-1 gap-2.5 pt-1'>
              <div className='space-y-1'>
                <Label htmlFor='donor-name' className='text-xs'>
                  Donor Name (Optional)
                </Label>
                <Input
                  id='donor-name'
                  placeholder='For receipt and seva prasad'
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className='text-xs'
                />
              </div>

              <div className='space-y-1'>
                <Label htmlFor='donor-phone' className='text-xs'>
                  Phone Number (Optional)
                </Label>
                <Input
                  id='donor-phone'
                  type='tel'
                  placeholder='+91 9876543210'
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className='text-xs'
                />
              </div>
            </div>

            {/* Verification & Payee Info */}
            <div className='rounded-lg bg-muted/40 p-3 space-y-1 text-xs'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Beneficiary:</span>
                <span className='font-medium text-foreground'>{payeeName}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Verified UPI ID:</span>
                <span className='font-mono text-[11px] text-foreground'>{vpa}</span>
              </div>
            </div>

            {/* One-Tap Payment Button (Mobile intent trigger) */}
            <Button
              onClick={handleLaunchUpi}
              className='w-full h-11 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold shadow-md'
            >
              <Smartphone className='size-4' />
              Pay ₹{Number(effectiveAmount || 501).toLocaleString('en-IN')} via UPI App
            </Button>

            {isSuccess && (
              <div className='rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-center text-xs text-emerald-800 dark:text-emerald-300'>
                UPI intent dispatched! Please authorize the payment in your UPI app.
              </div>
            )}

            {/* Trust badge */}
            <div className='flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1'>
              <ShieldCheck className='size-3.5 text-emerald-600' />
              <span>Direct Bank-to-Bank Transfer • 100% Secure</span>
            </div>
          </CardContent>
        </Card>

        {/* Instructions / Notice */}
        <div className='text-center text-[11px] text-muted-foreground space-y-1'>
          <p>Scanning from desktop? Open Google Pay, PhonePe, or Paytm and pay to <strong>{vpa}</strong>.</p>
          <p>© {new Date().getFullYear()} Organization QR Management Portal.</p>
        </div>
      </div>
    </div>
  )
}
