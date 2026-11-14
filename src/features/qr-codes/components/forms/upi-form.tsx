import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Info } from 'lucide-react'
import { UpiFormData } from '../../types'

interface UpiFormProps {
  value: UpiFormData
  onChange: (value: UpiFormData) => void
}

const COMMON_VPA_HANDLES = ['@okhdfcbank', '@okaxis', '@oksbi', '@paytm', '@ybl', '@upi']
const QUICK_AMOUNTS = ['101', '251', '501', '1100', '2100', '5001']

export function UpiForm({ value, onChange }: UpiFormProps) {
  const handleVpaSuffix = (suffix: string) => {
    const current = value.vpa.split('@')[0] || ''
    onChange({ ...value, vpa: `${current}${suffix}` })
  }

  const handleAmountChip = (amt: string) => {
    onChange({ ...value, amount: value.amount === amt ? '' : amt })
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300'>
        <ShieldCheck className='size-4 shrink-0 text-emerald-600 dark:text-emerald-400' />
        <div>
          <span className='font-semibold'>Direct Static UPI Compatibility:</span> Generates a native{' '}
          <code className='rounded bg-emerald-500/20 px-1 py-0.5 text-[11px] font-mono'>upi://pay</code> URI.
          Guaranteed 100% compatible with PhonePe, Google Pay, Paytm, BHIM, Cred, and all bank UPI apps.
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='space-y-1.5 sm:col-span-2'>
          <Label htmlFor='upi-vpa' className='text-xs font-medium'>
            Payee UPI ID (VPA) <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='upi-vpa'
            placeholder='e.g. temple.seva@okhdfcbank'
            value={value.vpa}
            onChange={(e) => onChange({ ...value, vpa: e.target.value })}
            className='font-mono text-xs'
          />
          <div className='flex flex-wrap items-center gap-1.5 pt-1'>
            <span className='text-[10px] text-muted-foreground'>Common handles:</span>
            {COMMON_VPA_HANDLES.map((handle) => (
              <Badge
                key={handle}
                variant='outline'
                onClick={() => handleVpaSuffix(handle)}
                className='cursor-pointer text-[10px] font-mono hover:bg-muted'
              >
                {handle}
              </Badge>
            ))}
          </div>
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='upi-name' className='text-xs font-medium'>
            Payee / Temple Legal Name <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='upi-name'
            placeholder='e.g. Temple Management Trust'
            value={value.payeeName}
            onChange={(e) => onChange({ ...value, payeeName: e.target.value })}
            className='text-xs'
          />
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='upi-amount' className='text-xs font-medium'>
            Fixed Amount (₹ Optional)
          </Label>
          <Input
            id='upi-amount'
            type='number'
            min='1'
            placeholder='Leave empty for open donor amount'
            value={value.amount}
            onChange={(e) => onChange({ ...value, amount: e.target.value })}
            className='text-xs'
          />
          <div className='flex flex-wrap items-center gap-1 pt-1'>
            <span className='text-[10px] text-muted-foreground'>Quick seva:</span>
            {QUICK_AMOUNTS.map((amt) => (
              <Badge
                key={amt}
                variant={value.amount === amt ? 'default' : 'secondary'}
                onClick={() => handleAmountChip(amt)}
                className='cursor-pointer text-[10px]'
              >
                ₹{amt}
              </Badge>
            ))}
          </div>
        </div>

        <div className='space-y-1.5 sm:col-span-2'>
          <Label htmlFor='upi-note' className='text-xs font-medium'>
            Seva / Purpose Note
          </Label>
          <Input
            id='upi-note'
            placeholder='e.g. Annadhanam Seva / General Temple Donation'
            value={value.transactionNote}
            onChange={(e) => onChange({ ...value, transactionNote: e.target.value })}
            className='text-xs'
          />
        </div>
      </div>

      <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
        <Info className='size-3.5 text-muted-foreground/80' />
        <span>Donors scanning this QR can directly pay from any UPI app on their phone without opening a browser.</span>
      </div>
    </div>
  )
}
