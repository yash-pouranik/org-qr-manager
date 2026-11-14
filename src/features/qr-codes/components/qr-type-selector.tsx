import {
  CreditCard,
  Globe,
  User,
  MessageCircle,
  Wifi,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { QrContentType } from '../types'
import { cn } from '@/lib/utils'

interface QrTypeSelectorProps {
  selectedType: QrContentType
  onSelectType: (type: QrContentType) => void
}

const QR_TYPES: Array<{
  type: QrContentType
  label: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  featured?: boolean
}> = [
  {
    type: 'upi',
    label: 'Direct UPI Pay',
    subtitle: 'PhonePe, GPay, Paytm, BHIM',
    icon: CreditCard,
    featured: true,
  },
  {
    type: 'url',
    label: 'Website Link',
    subtitle: 'Landing page or portal',
    icon: Globe,
  },
  {
    type: 'vcard',
    label: 'vCard Contact',
    subtitle: 'Save name, phone & email',
    icon: User,
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp Chat',
    subtitle: 'Direct chat with message',
    icon: MessageCircle,
  },
  {
    type: 'wifi',
    label: 'Wi-Fi Network',
    subtitle: 'Instant wireless connection',
    icon: Wifi,
  },
  {
    type: 'text',
    label: 'Plain Text',
    subtitle: 'Notice or announcement',
    icon: FileText,
  },
  {
    type: 'phone',
    label: 'Phone Call',
    subtitle: 'One-tap dialer prompt',
    icon: Phone,
  },
  {
    type: 'email',
    label: 'Email Message',
    subtitle: 'Pre-filled subject & body',
    icon: Mail,
  },
  {
    type: 'location',
    label: 'Google Maps',
    subtitle: 'Temple / facility coordinates',
    icon: MapPin,
  },
  {
    type: 'event',
    label: 'Calendar Event',
    subtitle: 'Festival or festival seva',
    icon: Calendar,
  },
]

export function QrTypeSelector({ selectedType, onSelectType }: QrTypeSelectorProps) {
  return (
    <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-5'>
      {QR_TYPES.map((item) => {
        const Icon = item.icon
        const isSelected = selectedType === item.type

        return (
          <button
            key={item.type}
            type='button'
            onClick={() => onSelectType(item.type)}
            className={cn(
              'group relative flex flex-col items-start rounded-xl border p-3 text-start transition-all cursor-pointer',
              isSelected
                ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/40'
                : 'border-border/70 bg-card hover:border-primary/50 hover:bg-muted/40'
            )}
          >
            {item.featured && (
              <span className='absolute -top-2 right-2 flex items-center gap-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold text-accent-foreground shadow-xs'>
                <Sparkles className='size-2.5' /> Direct UPI
              </span>
            )}

            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-lg transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
              )}
            >
              <Icon className='size-4' />
            </div>

            <div className='mt-2.5'>
              <div className='text-xs font-semibold text-foreground'>{item.label}</div>
              <div className='text-[10px] text-muted-foreground line-clamp-1'>
                {item.subtitle}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
