import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Department } from '@/types/department'
import { departmentService } from '@/services/department-service'
import { userService } from '@/services/user-service'

const departmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lower-case alphanumeric with dashes only'),
  description: z.string().max(250, 'Description cannot exceed 250 characters').optional(),
  managerUserId: z.string().optional(),
  managerName: z.string().optional(),
  managerEmail: z.string().optional(),
})

type DepartmentFormData = z.infer<typeof departmentSchema>

interface DepartmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department?: Department | null
  onSuccess: () => void
}

export function DepartmentDialog({
  open,
  onOpenChange,
  department,
  onSuccess,
}: DepartmentDialogProps) {
  const isEdit = !!department

  // Fetch all registered users to select from
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => userService.getAll(),
  })

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      managerUserId: 'none',
      managerName: 'Unassigned',
      managerEmail: '',
    },
  })

  useEffect(() => {
    if (department) {
      const matchingUser = users.find(
        (u) =>
          (department.managerEmail &&
            u.email.toLowerCase() === department.managerEmail.toLowerCase()) ||
          (department.managerName &&
            `${u.firstName} ${u.lastName}`.trim().toLowerCase() ===
              department.managerName.toLowerCase())
      )

      form.reset({
        name: department.name,
        slug: department.slug,
        description: department.description || '',
        managerUserId: matchingUser ? matchingUser.id : 'none',
        managerName: department.managerName || 'Unassigned',
        managerEmail: department.managerEmail || '',
      })
    } else {
      form.reset({
        name: '',
        slug: '',
        description: '',
        managerUserId: 'none',
        managerName: 'Unassigned',
        managerEmail: '',
      })
    }
  }, [department, users, form, open])

  // Auto-generate slug when name changes in add mode
  const handleNameChange = (val: string) => {
    form.setValue('name', val)
    if (!isEdit) {
      const generatedSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      form.setValue('slug', generatedSlug)
    }
  }

  const onSubmit = async (values: DepartmentFormData) => {
    try {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        description: values.description || '',
        managerName: values.managerName || 'Unassigned',
        managerEmail: values.managerEmail || '',
      }

      if (isEdit && department) {
        await departmentService.update(department.id, payload)
        toast.success(`Department "${values.name}" updated successfully`)
      } else {
        await departmentService.create(payload)
        toast.success(`Department "${values.name}" created successfully`)
      }
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Operation failed')
    }
  }

  const currentManagerEmail = form.watch('managerEmail')
  const currentManagerName = form.watch('managerName')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Department' : 'Create Department'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update department scope, management lead, and operational details.'
              : 'Add a new administrative division for dedicated QR generation and tracking.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form id='department-form' onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g. Donations & Seva'
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='slug'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identifier Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='e.g. donations'
                      disabled={isEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Brief operational mission of this department...'
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Member Dropdown from Database */}
            <FormField
              control={form.control}
              name='managerUserId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Lead / Manager</FormLabel>
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(val) => {
                      field.onChange(val)
                      if (val === 'none') {
                        form.setValue('managerName', 'Unassigned')
                        form.setValue('managerEmail', '')
                      } else {
                        const selectedUser = users.find((u) => u.id === val)
                        if (selectedUser) {
                          const fullName =
                            `${selectedUser.firstName} ${selectedUser.lastName}`.trim() ||
                            selectedUser.username
                          form.setValue('managerName', fullName)
                          form.setValue('managerEmail', selectedUser.email)
                        }
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full text-xs'>
                        <SelectValue placeholder='Select an existing user to lead this department' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='none'>
                        <span className='text-muted-foreground'>Unassigned (No manager)</span>
                      </SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          <span className='font-medium text-foreground'>
                            {u.firstName} {u.lastName}
                          </span>
                          <span className='text-xs text-muted-foreground ms-1'>
                            ({u.email})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentManagerEmail && currentManagerEmail.length > 0 && (
                    <div className='rounded-md border border-border/80 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground'>
                      Assigned Lead: <strong className='text-foreground'>{currentManagerName}</strong> ({currentManagerEmail})
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className='pt-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Department'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
