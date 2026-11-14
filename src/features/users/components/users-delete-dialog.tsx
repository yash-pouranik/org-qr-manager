'use client'

import { useState } from 'react'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type User } from '../data/schema'
import { userService } from '@/services/user-service'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: UserDeleteDialogProps) {
  const [value, setValue] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  const isRootAdmin =
    currentRow.email.toLowerCase() === 'admin@organization.local' ||
    currentRow.role === 'super_admin'

  const handleDelete = async () => {
    if (value.trim() !== currentRow.username) return

    if (isRootAdmin) {
      toast.error('The root Super Admin account cannot be deleted for governance protection.')
      return
    }

    try {
      setIsDeleting(true)
      await userService.delete(currentRow.id)
      toast.success(`User ${currentRow.email} has been removed.`)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user')
    } finally {
      setIsDeleting(false)
    }

    onOpenChange(false)
    showSubmittedData(currentRow, 'The following user has been deleted:')
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      form='users-delete-form'
      disabled={value.trim() !== currentRow.username || isDeleting || isRootAdmin}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          Delete User
        </span>
      }
      desc={
        <form
          id='users-delete-form'
          onSubmit={(e) => {
            e.preventDefault()
            handleDelete()
          }}
          className='space-y-4'
        >
          {isRootAdmin ? (
            <Alert variant='destructive' className='border-destructive/30 bg-destructive/10'>
              <ShieldAlert className='size-4' />
              <AlertTitle className='font-semibold'>Root Administrator Protected</AlertTitle>
              <AlertDescription className='text-xs'>
                The initial Super Admin account is protected by system security protocols and cannot be removed.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className='mb-2'>
                Are you sure you want to delete{' '}
                <span className='font-bold'>{currentRow.username}</span>?
                <br />
                This action will permanently remove the user with the role of{' '}
                <span className='font-bold'>
                  {currentRow.role.toUpperCase()}
                </span>{' '}
                from the system. This cannot be undone.
              </p>

              <Label className='my-2'>
                Username:
                <Input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder='Enter username to confirm deletion.'
                  autoFocus
                />
              </Label>

              <Alert variant='destructive'>
                <AlertTitle>Warning!</AlertTitle>
                <AlertDescription>
                  Please be careful, this operation cannot be rolled back.
                </AlertDescription>
              </Alert>
            </>
          )}
        </form>
      }
      confirmText={isDeleting ? 'Deleting...' : 'Delete'}
      destructive
    />
  )
}
