import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link2, Sparkles, Zap, ExternalLink, Copy, Check } from 'lucide-react'
import { QrCodeItem, qrService } from '@/services/qr-service'
import { getShortUrl } from '@/lib/api-client'

interface QrEditDestinationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  qrItem: QrCodeItem | null
  onSuccess: () => void
}

export function QrEditDestinationDialog({
  open,
  onOpenChange,
  qrItem,
  onSuccess,
}: QrEditDestinationDialogProps) {
  const [destinationUrl, setDestinationUrl] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (qrItem) {
      setDestinationUrl(qrItem.destinationUrl || '')
      setName(qrItem.name || '')
    }
  }, [qrItem, open])

  if (!qrItem) return null

  const isDynamic = qrItem.category === 'dynamic'
  const dynamicLink = isDynamic
    ? qrItem.shortUrl || (qrItem.shortCode ? getShortUrl(qrItem.shortCode) : '')
    : ''

  const handleCopyLink = () => {
    if (!dynamicLink) return
    navigator.clipboard.writeText(dynamicLink)
    setCopied(true)
    toast.success('Dynamic short link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!destinationUrl.trim()) {
      toast.error('Destination URL cannot be empty')
      return
    }

    try {
      setIsSubmitting(true)
      await qrService.update(qrItem.id, {
        name: name.trim(),
        destinationUrl: destinationUrl.trim(),
      })
      toast.success(`Updated destination for "${name}"!`)
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update destination')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Link2 className='size-5 text-primary' />
            Edit Dynamic Destination
          </DialogTitle>
          <DialogDescription className='text-xs'>
            Update where this QR code redirects in real-time. The printed QR image remains 100% unchanged.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {isDynamic && dynamicLink && (
            <div className='rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1.5 text-xs'>
              <div className='flex items-center justify-between'>
                <span className='font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 text-[11px]'>
                  <Zap className='size-3 text-amber-500' /> Permanent Dynamic QR Link:
                </span>
                <div className='flex items-center gap-2'>
                  <a
                    href={dynamicLink}
                    target='_blank'
                    rel='noreferrer'
                    className='text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5'
                    title='Test link in new tab'
                  >
                    <span>Test</span>
                    <ExternalLink className='size-2.5' />
                  </a>
                  <button
                    type='button'
                    onClick={handleCopyLink}
                    className='text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5'
                  >
                    {copied ? <Check className='size-2.5 text-emerald-600' /> : <Copy className='size-2.5' />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <p className='font-mono font-medium text-emerald-700 dark:text-emerald-300 select-all bg-background/80 p-1.5 rounded border border-emerald-500/20'>
                {dynamicLink}
              </p>
              <p className='text-[10px] text-muted-foreground'>
                The QR image encodes this exact link and never changes.
              </p>
            </div>
          )}

          <div className='space-y-1.5'>
            <Label htmlFor='edit-qr-name' className='text-xs'>
              QR Name
            </Label>
            <Input
              id='edit-qr-name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='text-xs'
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='edit-destination-url' className='text-xs'>
              New Destination Target URL <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='edit-destination-url'
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder='https://example.com/updated-page'
              className='text-xs'
            />
          </div>

          <div className='flex items-center gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg'>
            <Sparkles className='size-4 shrink-0 text-amber-500' />
            <span>
              Redirection updates instantly through the HTTP 302 engine without requiring new physical print standees.
            </span>
          </div>

          <DialogFooter className='gap-2 sm:gap-0 pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting} className='bg-primary text-primary-foreground'>
              {isSubmitting ? 'Saving...' : 'Save New Destination'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

