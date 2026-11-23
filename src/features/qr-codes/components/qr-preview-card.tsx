import { useEffect, useRef, useState } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Download,
  Eye,
  Printer,
  Copy,
  Check,
  FileCode,
  Zap,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { QrStyleOptions, QrContentType } from '../types'
import { QrStandeeDialog } from './qr-standee-dialog'
import { getShortUrl } from '@/lib/api-client'

interface QrPreviewCardProps {
  serializedData: string
  contentType: QrContentType
  styleOptions: QrStyleOptions
  qrName?: string
  category?: 'dynamic' | 'static'
  shortCode?: string
  shortUrl?: string
}

export function QrPreviewCard({
  serializedData,
  contentType,
  styleOptions,
  qrName = 'organization-qr',
  category = 'static',
  shortCode,
  shortUrl,
}: QrPreviewCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)
  const [copiedPayload, setCopiedPayload] = useState(false)
  const [copiedShort, setCopiedShort] = useState(false)
  const [standeeOpen, setStandeeOpen] = useState(false)
  const [previewImageSrc, setPreviewImageSrc] = useState<string>('')

  const isDynamic = category === 'dynamic'
  const resolvedShortUrl = isDynamic
    ? shortUrl || (shortCode ? getShortUrl(shortCode) : getShortUrl('sample'))
    : ''

  // CRITICAL ARCHITECTURE RULE:
  // Dynamic QR MUST encode the dynamic short redirect URL (e.g. https://qr.gitaforlife.net/r/:shortCode)
  // Static QR directly encodes the raw destination payload.
  const qrDataToEncode = isDynamic
    ? resolvedShortUrl
    : serializedData || 'https://organization.local'

  // Initialize or update QRCodeStyling instance
  useEffect(() => {
    const dotsOptions: any = {
      type: styleOptions.dotsType,
      color: styleOptions.dotsColor,
    }

    if (styleOptions.useGradient) {
      dotsOptions.gradient = {
        type: styleOptions.gradientType,
        colorStops: [
          { offset: 0, color: styleOptions.gradientColor1 },
          { offset: 1, color: styleOptions.gradientColor2 },
        ],
      }
    }

    const options: any = {
      width: 280,
      height: 280,
      data: qrDataToEncode,
      margin: 8,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: styleOptions.logoUrl ? 'H' : 'Q', // High error correction when logo is present
      },
      imageOptions: {
        hideBackgroundDots: styleOptions.hideBackgroundDots,
        imageSize: styleOptions.logoSize,
        margin: styleOptions.logoMargin,
        crossOrigin: 'anonymous',
      },
      dotsOptions,
      cornersSquareOptions: {
        type: styleOptions.cornersSquareType,
        color: styleOptions.cornersSquareColor,
      },
      cornersDotOptions: {
        type: styleOptions.cornersDotType,
        color: styleOptions.cornersDotColor,
      },
      backgroundOptions: {
        color: styleOptions.backgroundColor,
      },
    }

    if (styleOptions.logoUrl) {
      options.image = styleOptions.logoUrl
    } else {
      options.image = undefined
    }

    if (!qrCodeRef.current) {
      qrCodeRef.current = new QRCodeStyling(options)
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
        qrCodeRef.current.append(containerRef.current)
      }
    } else {
      qrCodeRef.current.update(options)
    }

    // Capture raw PNG for standee preview
    qrCodeRef.current.getRawData('png').then((blob) => {
      if (blob && blob instanceof Blob) {
        const url = URL.createObjectURL(blob)
        setPreviewImageSrc(url)
      }
    }).catch(() => {})
  }, [qrDataToEncode, styleOptions])

  const handleDownloadPng = async () => {
    if (!qrCodeRef.current) return
    try {
      await qrCodeRef.current.download({
        name: qrName.toLowerCase().replace(/\s+/g, '-'),
        extension: 'png',
      })
      toast.success('High-Resolution PNG downloaded!')
    } catch {
      toast.error('Failed to download PNG')
    }
  }

  const handleDownloadSvg = async () => {
    if (!qrCodeRef.current) return
    try {
      await qrCodeRef.current.download({
        name: qrName.toLowerCase().replace(/\s+/g, '-'),
        extension: 'svg',
      })
      toast.success('Scalable Vector SVG downloaded!')
    } catch {
      toast.error('Failed to download SVG')
    }
  }

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(serializedData)
    setCopiedPayload(true)
    toast.success('Target payload copied to clipboard!')
    setTimeout(() => setCopiedPayload(false), 2000)
  }

  const handleCopyShortLink = () => {
    if (!resolvedShortUrl) return
    navigator.clipboard.writeText(resolvedShortUrl)
    setCopiedShort(true)
    toast.success('Dynamic short redirect link copied!')
    setTimeout(() => setCopiedShort(false), 2000)
  }

  return (
    <>
      <Card className='border-border/60 shadow-md'>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm font-semibold flex items-center gap-1.5'>
              <Eye className='size-4 text-primary' />
              Live QR Preview
            </CardTitle>
            {isDynamic ? (
              <Badge className='text-[10px] gap-1 bg-emerald-600 dark:bg-emerald-700 text-white hover:bg-emerald-600'>
                <Zap className='size-2.5 text-amber-300' /> Dynamic Tracked
              </Badge>
            ) : (
              <Badge variant='secondary' className='text-[10px]'>
                Direct Static
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className='flex flex-col items-center justify-center p-4 pt-0'>
          {/* Decorative Frame Container */}
          <div
            className={`flex flex-col items-center justify-center transition-all ${
              styleOptions.frameStyle === 'card'
                ? 'rounded-2xl border-2 p-4 shadow-sm'
                : ''
            }`}
            style={{
              borderColor:
                styleOptions.frameStyle === 'card'
                  ? styleOptions.frameColor
                  : undefined,
              backgroundColor:
                styleOptions.frameStyle === 'card' ? '#FFFFFF' : undefined,
            }}
          >
            {/* Top Frame Banner */}
            {styleOptions.frameStyle === 'top-banner' && (
              <div
                className='mb-2 rounded-lg px-4 py-1.5 text-xs font-bold tracking-wider shadow-xs'
                style={{
                  backgroundColor: styleOptions.frameColor,
                  color: styleOptions.frameTextColor,
                }}
              >
                {styleOptions.frameText || 'SCAN HERE'}
              </div>
            )}

            {/* Canvas / SVG Output */}
            <div
              className='relative flex size-[280px] items-center justify-center rounded-xl bg-white p-2 shadow-xs border border-border/40'
              style={{ backgroundColor: styleOptions.backgroundColor }}
            >
              <div ref={containerRef} className='flex items-center justify-center' />
            </div>

            {/* Bottom Frame Banner */}
            {(styleOptions.frameStyle === 'bottom-banner' ||
              styleOptions.frameStyle === 'card') && (
              <div
                className='mt-2.5 rounded-lg px-4 py-1.5 text-xs font-bold tracking-wider shadow-xs'
                style={{
                  backgroundColor: styleOptions.frameColor,
                  color: styleOptions.frameTextColor,
                }}
              >
                {styleOptions.frameText || (isDynamic ? 'SCAN TO REDIRECT' : 'SCAN TO PAY / ACCESS')}
              </div>
            )}
          </div>

          {/* Encoded Data Display Box */}
          {isDynamic ? (
            <div className='mt-4 w-full rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-start space-y-2'>
              <div className='flex items-center justify-between text-[10px]'>
                <span className='font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1'>
                  <Zap className='size-3 text-amber-500' /> Encoded Dynamic Short Link
                </span>
                <div className='flex items-center gap-2'>
                  <a
                    href={resolvedShortUrl}
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
                    onClick={handleCopyShortLink}
                    className='flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer'
                  >
                    {copiedShort ? <Check className='size-3 text-emerald-600' /> : <Copy className='size-3' />}
                    <span>{copiedShort ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <p className='truncate font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300 select-all bg-background/90 p-1.5 rounded border border-emerald-500/20'>
                {resolvedShortUrl}
              </p>
              <div className='flex items-center gap-1 text-[11px] text-muted-foreground pt-0.5 truncate'>
                <ArrowRight className='size-3 shrink-0 text-muted-foreground' />
                <span className='truncate'>
                  302 Redirect Target: <strong className='font-mono text-foreground font-normal'>{serializedData}</strong>
                </span>
              </div>
            </div>
          ) : (
            <div className='mt-4 w-full rounded-lg border border-border/60 bg-muted/30 p-2.5 text-start'>
              <div className='flex items-center justify-between text-[10px] text-muted-foreground mb-1'>
                <span className='font-semibold uppercase tracking-wider'>
                  Direct Payload ({contentType.toUpperCase()})
                </span>
                <button
                  type='button'
                  onClick={handleCopyPayload}
                  className='flex items-center gap-1 hover:text-foreground cursor-pointer'
                >
                  {copiedPayload ? <Check className='size-3 text-emerald-600' /> : <Copy className='size-3' />}
                  <span>{copiedPayload ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className='truncate font-mono text-[11px] text-foreground select-all'>
                {serializedData}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className='flex flex-col gap-2 border-t border-border/60 pt-4'>
          <div className='grid grid-cols-2 gap-2 w-full'>
            <Button
              onClick={handleDownloadPng}
              className='w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs shadow-xs'
            >
              <Download className='size-3.5' /> Download PNG
            </Button>
            <Button
              onClick={handleDownloadSvg}
              variant='outline'
              className='w-full gap-1.5 text-xs shadow-xs'
            >
              <FileCode className='size-3.5' /> Vector SVG
            </Button>
          </div>

          <Button
            onClick={() => setStandeeOpen(true)}
            variant='secondary'
            className='w-full gap-1.5 text-xs text-foreground hover:bg-secondary/80'
          >
            <Printer className='size-3.5 text-amber-600 dark:text-amber-400' />
            <span>Generate Printable Desk Standee (PDF)</span>
          </Button>
        </CardFooter>
      </Card>

      {/* Desk Standee Print Modal */}
      <QrStandeeDialog
        open={standeeOpen}
        onOpenChange={setStandeeOpen}
        qrImageSrc={previewImageSrc}
        qrFrameText={styleOptions.frameText}
        qrFrameColor={styleOptions.frameColor}
      />
    </>
  )
}

