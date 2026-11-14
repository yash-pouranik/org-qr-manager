import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Department } from '@/types/department'
import { departmentService } from '@/services/department-service'

const departmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lower-case alphanumeric with dashes only'),
  description: z.string().max(250, 'Description cannot exceed 250 characters').optional(),
  managerName: z.string().min(2, 'Manager name must be at least 2 characters'),
  managerEmail: z.string().email('Valid manager email required'),
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

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      managerName: '',
      managerEmail: '',
    },
  })

  useEffect(() => {
    if (department) {
      form.reset({
        name: department.name,
        slug: department.slug,
        description: department.description || '',
        managerName: department.managerName,
        managerEmail: department.managerEmail,
      })
    } else {
      form.reset({
        name: '',
        slug: '',
        description: '',
        managerName: '',
        managerEmail: '',
      })
    }
  }, [department, form, open])

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
      if (isEdit && department) {
        await departmentService.update(department.id, values)
        toast.success(`Department "${values.name}" updated successfully`)
      } else {
        await departmentService.create({
          name: values.name,
          slug: values.slug,
          description: values.description,
          managerName: values.managerName,
          managerEmail: values.managerEmail,
        })
        toast.success(`Department "${values.name}" created successfully`)
      }
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Operation failed')
    }
  }

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

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='managerName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manager / Lead</FormLabel>
                    <FormControl>
                      <Input placeholder='Full Name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='managerEmail'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Email</FormLabel>
                    <FormControl>
                      <Input type='email' placeholder='lead@organization.local' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
