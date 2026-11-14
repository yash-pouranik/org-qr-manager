import { useRef } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Shield, Sparkles } from 'lucide-react'
import { QrStyleOptions } from '../types'
import { cn } from '@/lib/utils'

interface QrLogoFramePanelProps {
  options: QrStyleOptions
  onChange: (options: QrStyleOptions) => void
}

const PRESET_EMBLEMS = [
  {
    name: 'None',
    url: '',
    icon: X,
  },
  {
    name: 'UPI Pay Emblem',
    // Clean SVG Data URI for UPI payment badge
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23166534"/><path d="M30 65 L45 35 L60 65 Z" fill="%23E9A23B"/><circle cx="50" cy="45" r="8" fill="%23FFFFFF"/></svg>',
    icon: Sparkles,
  },
  {
    name: 'Lotus Blossom',
    // Clean SVG Data URI for Lotus flower symbol
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23FFFFFF" stroke="%23E9A23B" stroke-width="4"/><path d="M50 20 C40 35 30 50 50 75 C70 50 60 35 50 20 Z" fill="%23E9A23B"/><path d="M50 40 C35 50 25 60 40 75 C45 65 48 55 50 40 Z" fill="%23166534"/><path d="M50 40 C65 50 75 60 60 75 C55 65 52 55 50 40 Z" fill="%23166534"/></svg>',
    icon: Sparkles,
  },
  {
    name: 'Organization Crest',
    // Clean SVG Data URI for generic temple shield emblem
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 10 L85 25 L85 55 C85 75 50 90 50 90 C50 90 15 75 15 55 L15 25 Z" fill="%23166534" stroke="%23E9A23B" stroke-width="4"/><circle cx="50" cy="48" r="16" fill="%23E9A23B"/><path d="M50 38 L50 58 M40 48 L60 48" stroke="%23FFFFFF" stroke-width="4"/></svg>',
    icon: Shield,
  },
]

const FRAME_PRESETS = [
  { id: 'none', label: 'No Frame', desc: 'Raw minimalist QR' },
  { id: 'bottom-banner', label: 'Bottom Banner', desc: 'Standard CTA ribbon below QR' },
  { id: 'top-banner', label: 'Top Banner', desc: 'Heading ribbon above QR' },
  { id: 'card', label: 'Enclosed Card', desc: 'Card border with headline' },
] as const

const QUICK_FRAME_TEXTS = [
  'SCAN TO PAY / SEVA',
  'SCAN FOR PRASADAM',
  'SCAN FOR DARSHAN',
  'SCAN TO CONNECT',
  'SCAN TO VISIT',
]

export function QrLogoFramePanel({ options, onChange }: QrLogoFramePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file must be under 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result as string
      onChange({ ...options, logoUrl: result })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    onChange({ ...options, logoUrl: undefined })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className='space-y-6'>
      {/* Center Emblem / Logo */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <Label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
            Center Logo / Emblem
          </Label>
          {options.logoUrl && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={handleRemoveLogo}
              className='h-6 gap-1 px-2 text-xs text-destructive hover:text-destructive'
            >
              <X className='size-3' /> Remove Logo
            </Button>
          )}
        </div>

        {/* Emblem Presets */}
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
          {PRESET_EMBLEMS.map((emblem) => {
            const isSelected = (!options.logoUrl && !emblem.url) || options.logoUrl === emblem.url

            return (
              <button
                key={emblem.name}
                type='button'
                onClick={() => onChange({ ...options, logoUrl: emblem.url || undefined })}
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 rounded-lg border p-2 text-center transition-all cursor-pointer',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                    : 'border-border/70 hover:border-primary/40 hover:bg-muted/30'
                )}
              >
                {emblem.url ? (
                  <img
                    src={emblem.url}
                    alt={emblem.name}
                    className='size-7 rounded-full object-contain'
                  />
                ) : (
                  <div className='flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground'>
                    <X className='size-4' />
                  </div>
                )}
                <span className='text-[11px] font-medium text-foreground'>{emblem.name}</span>
              </button>
            )
          })}
        </div>

        {/* Custom Logo File Upload */}
        <div className='mt-2'>
          <input
            ref={fileInputRef}
            type='file'
            accept='image/png, image/jpeg, image/svg+xml'
            onChange={handleFileUpload}
            className='hidden'
            id='logo-upload-input'
          />
          <label
            htmlFor='logo-upload-input'
            className='flex items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 p-3 text-xs font-medium text-muted-foreground hover:border-primary/60 hover:text-foreground cursor-pointer transition-colors'
          >
            <Upload className='size-4 text-primary' />
            <span>Upload Custom Emblem (PNG, SVG, JPG under 2MB)</span>
          </label>
        </div>

        {/* Logo Size and Margin Sliders (if logo is active) */}
        {options.logoUrl && (
          <div className='space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3'>
            <div className='space-y-1.5'>
              <div className='flex justify-between text-xs'>
                <span className='text-muted-foreground'>Emblem Scale</span>
                <span className='font-mono font-medium'>{Math.round(options.logoSize * 100)}%</span>
              </div>
              <input
                type='range'
                value={options.logoSize * 100}
                min={15}
                max={40}
                step={1}
                onChange={(e) => onChange({ ...options, logoSize: Number(e.target.value) / 100 })}
                className='w-full accent-primary cursor-pointer'
              />
            </div>

            <div className='flex items-center justify-between pt-1'>
              <Label htmlFor='clear-dots-toggle' className='text-xs text-muted-foreground cursor-pointer'>
                Clear QR Pattern Behind Emblem
              </Label>
              <Switch
                id='clear-dots-toggle'
                checked={options.hideBackgroundDots}
                onCheckedChange={(checked) => onChange({ ...options, hideBackgroundDots: checked })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Branded CTA Frame */}
      <div className='space-y-3 border-t border-border/60 pt-5'>
        <Label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
          Call-to-Action (CTA) Frame
        </Label>

        {/* Frame Style Picker */}
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
          {FRAME_PRESETS.map((frame) => (
            <button
              key={frame.id}
              type='button'
              onClick={() => onChange({ ...options, frameStyle: frame.id })}
              className={cn(
                'flex flex-col items-start rounded-lg border p-2.5 text-start transition-all cursor-pointer',
                options.frameStyle === frame.id
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                  : 'border-border/70 hover:border-primary/40 hover:bg-muted/30'
              )}
            >
              <span className='text-xs font-medium text-foreground'>{frame.label}</span>
              <span className='text-[10px] text-muted-foreground'>{frame.desc}</span>
            </button>
          ))}
        </div>

        {/* Frame Text and Customizer if frame is enabled */}
        {options.frameStyle !== 'none' && (
          <div className='space-y-3 rounded-xl border border-border/70 bg-card p-4'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>Banner Headline Text</Label>
              <Input
                placeholder='e.g. SCAN TO PAY / SEVA'
                value={options.frameText}
                onChange={(e) => onChange({ ...options, frameText: e.target.value })}
                className='text-xs font-bold tracking-wider'
              />
              <div className='flex flex-wrap items-center gap-1 pt-1'>
                <span className='text-[10px] text-muted-foreground'>Quick text:</span>
                {QUICK_FRAME_TEXTS.map((t) => (
                  <Badge
                    key={t}
                    variant='outline'
                    onClick={() => onChange({ ...options, frameText: t })}
                    className='cursor-pointer text-[10px] hover:bg-muted'
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4 pt-1'>
              <div className='space-y-1.5'>
                <Label className='text-xs'>Frame Ribbon Color</Label>
                <div className='flex items-center gap-2'>
                  <input
                    type='color'
                    value={options.frameColor}
                    onChange={(e) => onChange({ ...options, frameColor: e.target.value })}
                    className='size-7 cursor-pointer rounded border border-border'
                  />
                  <span className='font-mono text-xs'>{options.frameColor}</span>
                </div>
              </div>

              <div className='space-y-1.5'>
                <Label className='text-xs'>Banner Text Color</Label>
                <div className='flex items-center gap-2'>
                  <input
                    type='color'
                    value={options.frameTextColor}
                    onChange={(e) => onChange({ ...options, frameTextColor: e.target.value })}
                    className='size-7 cursor-pointer rounded border border-border'
                  />
                  <span className='font-mono text-xs'>{options.frameTextColor}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
