import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Trash2, AlertTriangle } from 'lucide-react'
import { QrCodeItem, qrService } from '@/services/qr-service'

interface QrTrashDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  qrItem: QrCodeItem | null
  permanent?: boolean
  onSuccess: () => void
}

export function QrTrashDialog({
  open,
  onOpenChange,
  qrItem,
  permanent = false,
  onSuccess,
}: QrTrashDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!qrItem) return null

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await qrService.delete(qrItem.id, permanent)
      if (permanent) {
        toast.success(`QR Code "${qrItem.name}" permanently deleted.`)
      } else {
        toast.success(`QR Code "${qrItem.name}" moved to Trash. It can be restored within 30 days.`)
      }
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Operation failed')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2 text-destructive'>
            {permanent ? <AlertTriangle className='size-5' /> : <Trash2 className='size-5' />}
            {permanent ? 'Permanently Delete QR Asset?' : 'Move to 30-Day Trash?'}
          </AlertDialogTitle>
          <AlertDialogDescription className='text-xs space-y-2'>
            <p>
              Are you sure you want to {permanent ? 'permanently erase' : 'move'}{' '}
              <strong className='text-foreground'>{qrItem.name}</strong>{' '}
              {permanent ? 'from the system' : 'to the trash'}?
            </p>
            {permanent ? (
              <p className='text-destructive font-medium'>
                This action is irreversible. All associated scan metrics and short code routing will be permanently removed.
              </p>
            ) : (
              <p className='text-muted-foreground'>
                The QR will become inactive, but all analytics history will be preserved. You can restore this QR anytime within 30 days.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {isDeleting ? 'Deleting...' : permanent ? 'Permanently Delete' : 'Move to Trash'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
