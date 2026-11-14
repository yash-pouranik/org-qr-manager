import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  QrStyleOptions,
  DotStyleType,
  CornerSquareStyleType,
  CornerDotStyleType,
} from '../types'
import { cn } from '@/lib/utils'

interface QrStylePanelProps {
  options: QrStyleOptions
  onChange: (options: QrStyleOptions) => void
}

const COLOR_PRESETS = [
  {
    name: 'Forest Green & Gold',
    dotsColor: '#166534',
    cornersSquareColor: '#166534',
    cornersDotColor: '#E9A23B',
    backgroundColor: '#FFFFFF',
    useGradient: true,
    gradientColor1: '#166534',
    gradientColor2: '#15803D',
  },
  {
    name: 'Saffron Radiance',
    dotsColor: '#D97706',
    cornersSquareColor: '#B45309',
    cornersDotColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    useGradient: true,
    gradientColor1: '#B45309',
    gradientColor2: '#F59E0B',
  },
  {
    name: 'Classic Charcoal',
    dotsColor: '#0F172A',
    cornersSquareColor: '#0F172A',
    cornersDotColor: '#0F172A',
    backgroundColor: '#FFFFFF',
    useGradient: false,
    gradientColor1: '#0F172A',
    gradientColor2: '#334155',
  },
  {
    name: 'Vedic Terracotta',
    dotsColor: '#9A3412',
    cornersSquareColor: '#9A3412',
    cornersDotColor: '#EA580C',
    backgroundColor: '#FFFFFF',
    useGradient: true,
    gradientColor1: '#9A3412',
    gradientColor2: '#EA580C',
  },
  {
    name: 'Royal Sapphire',
    dotsColor: '#1E3A8A',
    cornersSquareColor: '#1E3A8A',
    cornersDotColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    useGradient: true,
    gradientColor1: '#1E3A8A',
    gradientColor2: '#2563EB',
  },
]

const DOT_STYLES: Array<{ type: DotStyleType; label: string; desc: string }> = [
  { type: 'square', label: 'Classic Square', desc: 'Standard sharp corners' },
  { type: 'rounded', label: 'Rounded', desc: 'Softened module corners' },
  { type: 'dots', label: 'Circular Dots', desc: 'Modern pinpoint dots' },
  { type: 'extra-rounded', label: 'Pill / Extra-Round', desc: 'Curved organic edges' },
  { type: 'classy', label: 'Classy Diamond', desc: 'Tapered elegant tiles' },
  { type: 'classy-rounded', label: 'Classy Rounded', desc: 'Flowing refined curves' },
]

const CORNER_SQUARE_STYLES: Array<{ type: CornerSquareStyleType; label: string }> = [
  { type: 'square', label: 'Square Frame' },
  { type: 'extra-rounded', label: 'Rounded Frame' },
  { type: 'dot', label: 'Circular Frame' },
]

const CORNER_DOT_STYLES: Array<{ type: CornerDotStyleType; label: string }> = [
  { type: 'square', label: 'Square Pupil' },
  { type: 'dot', label: 'Circular Pupil' },
]

export function QrStylePanel({ options, onChange }: QrStylePanelProps) {
  const handlePresetSelect = (preset: (typeof COLOR_PRESETS)[0]) => {
    onChange({
      ...options,
      dotsColor: preset.dotsColor,
      cornersSquareColor: preset.cornersSquareColor,
      cornersDotColor: preset.cornersDotColor,
      backgroundColor: preset.backgroundColor,
      useGradient: preset.useGradient,
      gradientColor1: preset.gradientColor1,
      gradientColor2: preset.gradientColor2,
    })
  }

  return (
    <div className='space-y-6'>
      {/* Preset Schemes */}
      <div className='space-y-2'>
        <Label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
          Color Palette Presets
        </Label>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
          {COLOR_PRESETS.map((p) => {
            const isMatch =
              options.dotsColor === p.dotsColor &&
              options.cornersSquareColor === p.cornersSquareColor

            return (
              <button
                key={p.name}
                type='button'
                onClick={() => handlePresetSelect(p)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border p-2 text-start transition-all cursor-pointer',
                  isMatch
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                    : 'border-border/70 hover:border-primary/40 hover:bg-muted/30'
                )}
              >
                <div className='flex size-6 shrink-0 overflow-hidden rounded-md border border-border/80'>
                  <div className='h-full w-1/2' style={{ backgroundColor: p.dotsColor }} />
                  <div
                    className='h-full w-1/2'
                    style={{ backgroundColor: p.cornersDotColor || p.dotsColor }}
                  />
                </div>
                <span className='truncate text-xs font-medium text-foreground'>{p.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Pattern Shapes (Dot Style) */}
      <div className='space-y-2'>
        <Label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
          Data Pattern Shape
        </Label>
        <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
          {DOT_STYLES.map((style) => (
            <button
              key={style.type}
              type='button'
              onClick={() => onChange({ ...options, dotsType: style.type })}
              className={cn(
                'flex flex-col items-start rounded-lg border p-2.5 text-start transition-all cursor-pointer',
                options.dotsType === style.type
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                  : 'border-border/70 hover:border-primary/40 hover:bg-muted/30'
              )}
            >
              <span className='text-xs font-medium text-foreground'>{style.label}</span>
              <span className='text-[10px] text-muted-foreground'>{style.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Corner Eye Frames & Pupils */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <div className='space-y-2'>
          <Label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
            Corner Eye Frame
          </Label>
          <div className='space-y-1.5'>
            {CORNER_SQUARE_STYLES.map((c) => (
              <button
                key={c.type}
                type='button'
                onClick={() => onChange({ ...options, cornersSquareType: c.type })}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all cursor-pointer',
                  options.cornersSquareType === c.type
                    ? 'border-primary bg-primary/5 font-medium text-primary ring-1 ring-primary/40'
                    : 'border-border/70 hover:border-primary/40 text-muted-foreground'
                )}
              >
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className='space-y-2'>
          <Label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
            Corner Eye Center
          </Label>
          <div className='space-y-1.5'>
            {CORNER_DOT_STYLES.map((d) => (
              <button
                key={d.type}
                type='button'
                onClick={() => onChange({ ...options, cornersDotType: d.type })}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all cursor-pointer',
                  options.cornersDotType === d.type
                    ? 'border-primary bg-primary/5 font-medium text-primary ring-1 ring-primary/40'
                    : 'border-border/70 hover:border-primary/40 text-muted-foreground'
                )}
              >
                <span>{d.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Color Customization & Gradients */}
      <div className='space-y-3 rounded-xl border border-border/70 bg-card p-4'>
        <div className='flex items-center justify-between'>
          <Label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
            Gradient & Advanced Colors
          </Label>
          <div className='flex items-center gap-2'>
            <Switch
              id='gradient-toggle'
              checked={options.useGradient}
              onCheckedChange={(checked) => onChange({ ...options, useGradient: checked })}
            />
            <Label htmlFor='gradient-toggle' className='text-xs text-muted-foreground cursor-pointer'>
              Enable Gradient
            </Label>
          </div>
        </div>

        {options.useGradient ? (
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            <div className='space-y-1.5'>
              <Label className='text-xs'>Gradient Start</Label>
              <div className='flex items-center gap-2'>
                <input
                  type='color'
                  value={options.gradientColor1}
                  onChange={(e) => onChange({ ...options, gradientColor1: e.target.value })}
                  className='size-8 cursor-pointer rounded border border-border'
                />
                <span className='font-mono text-xs'>{options.gradientColor1}</span>
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs'>Gradient End</Label>
              <div className='flex items-center gap-2'>
                <input
                  type='color'
                  value={options.gradientColor2}
                  onChange={(e) => onChange({ ...options, gradientColor2: e.target.value })}
                  className='size-8 cursor-pointer rounded border border-border'
                />
                <span className='font-mono text-xs'>{options.gradientColor2}</span>
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs'>Direction</Label>
              <Select
                value={options.gradientType}
                onValueChange={(val: 'linear' | 'radial') =>
                  onChange({ ...options, gradientType: val })
                }
              >
                <SelectTrigger className='text-xs'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='linear'>Linear Gradient</SelectItem>
                  <SelectItem value='radial'>Radial / Circular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            <div className='space-y-1.5'>
              <Label className='text-xs'>QR Pattern Color</Label>
              <div className='flex items-center gap-2'>
                <input
                  type='color'
                  value={options.dotsColor}
                  onChange={(e) => onChange({ ...options, dotsColor: e.target.value })}
                  className='size-8 cursor-pointer rounded border border-border'
                />
                <span className='font-mono text-xs'>{options.dotsColor}</span>
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs'>Corner Frame Color</Label>
              <div className='flex items-center gap-2'>
                <input
                  type='color'
                  value={options.cornersSquareColor}
                  onChange={(e) => onChange({ ...options, cornersSquareColor: e.target.value })}
                  className='size-8 cursor-pointer rounded border border-border'
                />
                <span className='font-mono text-xs'>{options.cornersSquareColor}</span>
              </div>
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs'>Corner Pupil Color</Label>
              <div className='flex items-center gap-2'>
                <input
                  type='color'
                  value={options.cornersDotColor}
                  onChange={(e) => onChange({ ...options, cornersDotColor: e.target.value })}
                  className='size-8 cursor-pointer rounded border border-border'
                />
                <span className='font-mono text-xs'>{options.cornersDotColor}</span>
              </div>
            </div>
          </div>
        )}

        <div className='flex items-center justify-between border-t border-border/60 pt-3'>
          <Label className='text-xs'>Background Color</Label>
          <div className='flex items-center gap-2'>
            <input
              type='color'
              value={options.backgroundColor}
              onChange={(e) => onChange({ ...options, backgroundColor: e.target.value })}
              className='size-7 cursor-pointer rounded border border-border'
            />
            <span className='font-mono text-xs'>{options.backgroundColor}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
