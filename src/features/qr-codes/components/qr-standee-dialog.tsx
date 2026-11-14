import { useState, useRef } from 'react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
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
import { Printer, Download, Sparkles, ShieldCheck } from 'lucide-react'
import { StandeeOptions } from '../types'

interface QrStandeeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  qrImageSrc: string
  qrFrameText: string
  qrFrameColor: string
}

export function QrStandeeDialog({
  open,
  onOpenChange,
  qrImageSrc,
  qrFrameText,
  qrFrameColor,
}: QrStandeeDialogProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  const [standee, setStandee] = useState<StandeeOptions>({
    organizationName: 'Temple Administration',
    headerSubtitle: 'Official Seva & Donation Desk',
    callToAction: qrFrameText || 'SCAN TO PAY / SEVA',
    footerNote: 'All contributions support temple seva, annadhanam, and festival programs.',
    paperSize: 'a4',
  })

  const handleDownloadPdf = async () => {
    if (!printRef.current) return

    try {
      setIsExporting(true)
      toast.info('Rendering high-resolution printable standee...')

      const canvas = await html2canvas(printRef.current, {
        scale: 3, // 300 DPI equivalent for crisp print
        useCORS: true,
        backgroundColor: '#FFFFFF',
      })

      const imgData = canvas.toDataURL('image/png')
      const isA4 = standee.paperSize === 'a4'
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: isA4 ? 'a4' : 'a5',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()))
      pdf.save(`standee-${standee.organizationName.toLowerCase().replace(/\s+/g, '-')}.pdf`)

      toast.success('Printable Standee PDF downloaded successfully!')
      onOpenChange(false)
    } catch (err: any) {
      toast.error('Failed to generate PDF: ' + err.message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Printer className='size-5 text-primary' />
            Printable Table Standee / Tent Card
          </DialogTitle>
          <DialogDescription>
            Generate a standardized, high-resolution desk standee formatted for donation counters and reception desks.
          </DialogDescription>
        </DialogHeader>

        {/* Customization Inputs */}
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 border-b border-border/60 pb-4'>
          <div className='space-y-1.5'>
            <Label className='text-xs'>Organization / Temple Header</Label>
            <Input
              value={standee.organizationName}
              onChange={(e) => setStandee({ ...standee, organizationName: e.target.value })}
              className='text-xs'
            />
          </div>

          <div className='space-y-1.5'>
            <Label className='text-xs'>Department / Desk Subtitle</Label>
            <Input
              value={standee.headerSubtitle}
              onChange={(e) => setStandee({ ...standee, headerSubtitle: e.target.value })}
              className='text-xs'
            />
          </div>

          <div className='space-y-1.5'>
            <Label className='text-xs'>Headline Call-to-Action</Label>
            <Input
              value={standee.callToAction}
              onChange={(e) => setStandee({ ...standee, callToAction: e.target.value })}
              className='text-xs'
            />
          </div>

          <div className='space-y-1.5'>
            <Label className='text-xs'>Footer Notice / Message</Label>
            <Input
              value={standee.footerNote}
              onChange={(e) => setStandee({ ...standee, footerNote: e.target.value })}
              className='text-xs'
            />
          </div>
        </div>

        {/* Live Standee Preview (A4/A5 Printable Canvas) */}
        <div className='flex justify-center p-2 bg-muted/40 rounded-lg overflow-x-auto'>
          <div
            ref={printRef}
            className='w-[360px] bg-white text-slate-900 border-2 border-slate-300 rounded-xl p-6 shadow-md flex flex-col items-center text-center font-sans space-y-4'
          >
            {/* Cut / Fold guideline mark */}
            <div className='w-full flex items-center justify-between text-[9px] text-slate-400 border-b border-dashed border-slate-300 pb-1 uppercase tracking-widest'>
              <span>Fold Line (Top Tab)</span>
              <span>Table Standee</span>
            </div>

            {/* Header */}
            <div className='space-y-1'>
              <div className='flex items-center justify-center gap-1.5 text-emerald-800 font-bold tracking-wide text-lg'>
                <Sparkles className='size-5 text-amber-500 shrink-0' />
                <span>{standee.organizationName}</span>
              </div>
              <div className='text-xs font-medium text-slate-600 tracking-normal'>
                {standee.headerSubtitle}
              </div>
            </div>

            {/* QR Card Container */}
            <div className='bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col items-center space-y-2 w-full'>
              {/* Banner */}
              <div
                className='px-3 py-1 rounded-full text-[11px] font-bold tracking-wider text-white shadow-xs'
                style={{ backgroundColor: qrFrameColor || '#166534' }}
              >
                {standee.callToAction}
              </div>

              {/* QR Image */}
              <div className='size-48 flex items-center justify-center bg-white p-2 rounded-lg border border-slate-200 shadow-xs'>
                {qrImageSrc ? (
                  <img src={qrImageSrc} alt='QR Standee Code' className='size-full object-contain' />
                ) : (
                  <div className='text-xs text-slate-400'>QR Code Rendering...</div>
                )}
              </div>

              {/* Supported payment badges */}
              <div className='flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-500 pt-1'>
                <span>PhonePe</span> • <span>Google Pay</span> • <span>Paytm</span> • <span>BHIM UPI</span>
              </div>
            </div>

            {/* Scan Instructions */}
            <div className='w-full text-start text-[11px] text-slate-600 bg-emerald-50/60 border border-emerald-200/60 rounded-lg p-2.5 space-y-1'>
              <div className='flex items-center gap-1 font-semibold text-emerald-900 text-xs'>
                <ShieldCheck className='size-3.5 text-emerald-700' />
                <span>How to Scan & Contribute:</span>
              </div>
              <ol className='list-decimal list-inside space-y-0.5 text-[10px] text-slate-700'>
                <li>Open any camera or UPI app on your smartphone.</li>
                <li>Point your camera at the QR code above.</li>
                <li>Enter your seva amount and confirm payment.</li>
              </ol>
            </div>

            {/* Footer */}
            <div className='text-[10px] text-slate-500 pt-1'>
              {standee.footerNote}
            </div>
          </div>
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={isExporting}>
            Close
          </Button>
          <Button onClick={handleDownloadPdf} disabled={isExporting} className='gap-2 bg-primary text-primary-foreground'>
            <Download className='size-4' />
            {isExporting ? 'Generating PDF...' : 'Download Standee PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
