import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MailPlus, Send } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SelectDropdown } from '@/components/select-dropdown'
import { roles, roleDisplayMap } from '../data/data'
import { userService } from '@/services/user-service'
import { useAuthUser } from '@/context/auth-context'

const formSchema = z.object({
  email: z.email({
    error: (iss) =>
      iss.input === '' ? 'Please enter an email to invite.' : undefined,
  }),
  role: z.string().min(1, 'Role is required.'),
  desc: z.string().optional(),
})

type UserInviteForm = z.infer<typeof formSchema>

type UserInviteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersInviteDialog({
  open,
  onOpenChange,
}: UserInviteDialogProps) {
  const queryClient = useQueryClient()
  const { isSuperAdmin, assignedDepartmentId, assignedDepartmentName } = useAuthUser()

  const form = useForm<UserInviteForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', role: '', desc: '' },
  })

  const onSubmit = async (values: UserInviteForm) => {
    try {
      const username = values.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '')
      await userService.create({
        email: values.email,
        username: username || `user_${Date.now()}`,
        firstName: 'Invited',
        lastName: 'Member',
        role: values.role,
        departmentId: !isSuperAdmin ? assignedDepartmentId : null,
        departmentName: !isSuperAdmin ? assignedDepartmentName : undefined,
      })
      toast.success(`Invitation sent to ${values.email}`)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invite')
    }

    form.reset()
    showSubmittedData(values)
    onOpenChange(false)
  }

  // Distinct roles for the select dropdown
  const uniqueRoles = Array.from(
    new Map(
      roles.map((r) => [
        r.value,
        {
          label: roleDisplayMap[r.value] || r.label,
          value: r.value,
        },
      ])
    ).values()
  ).filter((r) => !['cashier', 'superadmin'].includes(r.value))

  const availableRoles = isSuperAdmin
    ? uniqueRoles
    : uniqueRoles.filter((r) => r.value === 'manager' || r.value === 'member')

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <MailPlus /> Invite User
          </DialogTitle>
          <DialogDescription>
            Invite new user to join your team by sending them an email
            invitation. Assign a role to define their access level.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='user-invite-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='eg: john.doe@organization.local'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='role'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Select a role'
                    items={availableRoles}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='desc'
              render={({ field }) => (
                <FormItem className=''>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      className='resize-none'
                      placeholder='Add a personal note to your invitation (optional)'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className='gap-y-2'>
          <DialogClose asChild>
            <Button variant='outline'>Cancel</Button>
          </DialogClose>
          <Button type='submit' form='user-invite-form'>
            Invite User <Send />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
