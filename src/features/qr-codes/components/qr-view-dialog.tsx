import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { QrCode, ExternalLink, Edit3 } from 'lucide-react'
import { QrCodeItem } from '@/services/qr-service'
import { QrPreviewCard } from './qr-preview-card'
import { getShortUrl } from '@/lib/api-client'
import { QrContentType, QrStyleOptions } from '../types'

interface QrViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  qrItem: QrCodeItem | null
  onEditDestination?: (item: QrCodeItem) => void
}

export function QrViewDialog({
  open,
  onOpenChange,
  qrItem,
  onEditDestination,
}: QrViewDialogProps) {
  if (!qrItem) return null

  const isDynamic = qrItem.category === 'dynamic'
  const resolvedShortUrl = isDynamic
    ? qrItem.shortUrl || (qrItem.shortCode ? getShortUrl(qrItem.shortCode) : '')
    : ''

  // Determine content type fallback
  let contentType: QrContentType = 'url'
  if (qrItem.type.includes('upi') || qrItem.type.includes('donation')) {
    contentType = 'upi'
  } else if (qrItem.type.includes('vcard')) {
    contentType = 'vcard'
  } else if (qrItem.type.includes('wifi')) {
    contentType = 'wifi'
  }

  const defaultStyles: QrStyleOptions = {
    dotsType: 'rounded',
    dotsColor: '#166534',
    cornersSquareType: 'extra-rounded',
    cornersSquareColor: '#166534',
    cornersDotType: 'dot',
    cornersDotColor: '#E9A23B',
    backgroundColor: '#FFFFFF',
    useGradient: false,
    gradientType: 'linear',
    gradientColor1: '#166534',
    gradientColor2: '#15803D',
    logoUrl: undefined,
    logoSize: 0.25,
    logoMargin: 4,
    hideBackgroundDots: true,
    frameStyle: 'bottom-banner',
    frameText: isDynamic ? 'SCAN TO REDIRECT' : 'SCAN TO PAY / ACCESS',
    frameColor: '#166534',
    frameTextColor: '#FFFFFF',
  }

  const activeStyles: QrStyleOptions = {
    ...defaultStyles,
    ...(qrItem.styleOptions || {}),
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg p-0 overflow-hidden'>
        <DialogHeader className='p-4 pb-2 border-b border-border/60'>
          <div className='flex items-center justify-between pe-6'>
            <DialogTitle className='flex items-center gap-2 text-base'>
              <QrCode className='size-5 text-primary' />
              <span className='truncate max-w-[280px]'>{qrItem.name}</span>
            </DialogTitle>
            <div className='flex items-center gap-1.5'>
              <Badge
                variant={isDynamic ? 'default' : 'secondary'}
                className='text-[10px] font-normal uppercase'
              >
                {qrItem.category}
              </Badge>
              <Badge variant='outline' className='text-[10px]'>
                {qrItem.departmentName || 'General'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className='p-4 space-y-4 max-h-[80vh] overflow-y-auto'>
          <QrPreviewCard
            serializedData={qrItem.destinationUrl}
            contentType={contentType}
            styleOptions={activeStyles}
            qrName={qrItem.name}
            category={qrItem.category}
            shortCode={qrItem.shortCode || ''}
            shortUrl={resolvedShortUrl}
          />

          {/* Quick Actions Footer inside dialog */}
          <div className='flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3 text-xs'>
            <div className='space-y-0.5'>
              <div className='font-bold text-foreground'>
                {qrItem.totalScans.toLocaleString()} Total Scans
              </div>
              <div className='text-[10px] text-muted-foreground'>
                {qrItem.uniqueVisitors.toLocaleString()} unique visitors
              </div>
            </div>

            <div className='flex items-center gap-2'>
              {isDynamic && onEditDestination && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => {
                    onOpenChange(false)
                    onEditDestination(qrItem)
                  }}
                  className='h-8 gap-1 text-xs'
                >
                  <Edit3 className='size-3.5' /> Edit Target
                </Button>
              )}
              {isDynamic && resolvedShortUrl && (
                <Button
                  size='sm'
                  asChild
                  className='h-8 gap-1 text-xs bg-primary text-primary-foreground'
                >
                  <a href={resolvedShortUrl} target='_blank' rel='noreferrer'>
                    <ExternalLink className='size-3.5' /> Test Redirect
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
