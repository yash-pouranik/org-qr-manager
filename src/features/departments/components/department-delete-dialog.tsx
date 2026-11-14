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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, QrCode, Users } from 'lucide-react'
import { Department } from '@/types/department'
import { departmentService } from '@/services/department-service'

interface DepartmentDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: Department | null
  onSuccess: () => void
}

export function DepartmentDeleteDialog({
  open,
  onOpenChange,
  department,
  onSuccess,
}: DepartmentDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  if (!department) return null

  const hasDependencies = department.totalQrs > 0 || department.totalMembers > 0

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await departmentService.delete(department.id)
      toast.success(`Department "${department.name}" removed successfully`)
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove department')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Department</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong className='text-foreground'>{department.name}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasDependencies ? (
          <Alert variant='destructive' className='border-destructive/30 bg-destructive/10'>
            <AlertCircle className='size-4' />
            <AlertTitle className='font-semibold'>Deletion Blocked by Governance Policy</AlertTitle>
            <AlertDescription className='space-y-2 text-xs'>
              <p>This department has active dependencies and cannot be deleted:</p>
              <div className='flex gap-4 font-medium'>
                {department.totalQrs > 0 && (
                  <span className='flex items-center gap-1 text-destructive'>
                    <QrCode className='size-3.5' /> {department.totalQrs} Active QR Code(s)
                  </span>
                )}
                {department.totalMembers > 0 && (
                  <span className='flex items-center gap-1 text-destructive'>
                    <Users className='size-3.5' /> {department.totalMembers} Member(s)
                  </span>
                )}
              </div>
              <p className='text-muted-foreground'>
                Reassign or archive all associated QR codes and team members before deleting this department.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <p className='text-xs text-muted-foreground'>
            This action will permanently delete the department record. This cannot be undone.
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          {!hasDependencies && (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? 'Deleting...' : 'Delete Department'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
