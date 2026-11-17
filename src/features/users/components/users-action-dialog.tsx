'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'
import { roles, roleDisplayMap } from '../data/data'
import { type User } from '../data/schema'
import { departmentService } from '@/services/department-service'
import { userService } from '@/services/user-service'
import { useAuthUser } from '@/context/auth-context'

const formSchema = z
  .object({
    firstName: z.string().min(1, 'First Name is required.'),
    lastName: z.string().min(1, 'Last Name is required.'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters.')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, and hyphens.'),
    phoneNumber: z.string(),
    email: z.string().email('Please enter a valid email address.'),
    password: z.string(),
    confirmPassword: z.string(),
    role: z.string().min(1, 'Role is required.'),
    departmentId: z.string().optional().nullable(),
    isEdit: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.isEdit && !data.password) return true
      return data.password.length >= 6
    },
    {
      message: 'Password must be at least 6 characters long.',
      path: ['password'],
    }
  )
  .refine(
    (data) => {
      if (data.isEdit && !data.password) return true
      return data.password === data.confirmPassword
    },
    {
      message: 'Passwords do not match.',
      path: ['confirmPassword'],
    }
  )

type UserForm = z.infer<typeof formSchema>

type UserActionDialogProps = {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UserActionDialogProps) {
  const isEdit = !!currentRow
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const { user: currentAuthUser, isSuperAdmin, assignedDepartmentId } = useAuthUser()

  // Prohibit self-role modification
  const isSelf = Boolean(
    isEdit &&
      currentRow?.email &&
      currentAuthUser?.email &&
      currentRow.email.toLowerCase() === currentAuthUser.email.toLowerCase()
  )

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
  })

  // Normalize initial role and department
  const normalizedRole = currentRow?.role === 'superadmin' ? 'super_admin' : (currentRow?.role || 'member')
  const initialDeptId = currentRow?.departmentId || '__unassigned__'

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    values: isEdit && currentRow
      ? {
          firstName: currentRow.firstName || '',
          lastName: currentRow.lastName || '',
          username: currentRow.username || '',
          email: currentRow.email || '',
          phoneNumber: currentRow.phoneNumber || '',
          role: normalizedRole,
          departmentId: initialDeptId,
          password: '',
          confirmPassword: '',
          isEdit: true,
        }
      : {
          firstName: '',
          lastName: '',
          username: '',
          email: '',
          phoneNumber: '',
          role: isSuperAdmin ? 'manager' : 'member',
          departmentId: !isSuperAdmin ? (assignedDepartmentId || '__unassigned__') : '__unassigned__',
          password: '',
          confirmPassword: '',
          isEdit: false,
        },
  })

  const onSubmit = async (values: UserForm) => {
    try {
      setIsSubmitting(true)
      const targetDeptId =
        values.departmentId === '__unassigned__' || !values.departmentId
          ? null
          : values.departmentId

      if (isEdit && currentRow) {
        if (isSelf && values.role !== currentRow.role) {
          toast.error('Self-role alteration is strictly prohibited for security.')
          return
        }

        if (!isSuperAdmin) {
          if (currentRow.role === 'super_admin' || currentRow.role === 'admin') {
            toast.error('Permission denied: You cannot modify administrator accounts.')
            return
          }
          if (values.role !== 'manager' && values.role !== 'member') {
            toast.error('Permission denied: You can only assign Manager or Member roles.')
            return
          }
        }

        await userService.updateRoleAndStatus({
          targetUserId: currentRow.id || (currentRow as any)._id,
          newRole: values.role,
          newDepartmentId: !isSuperAdmin ? (assignedDepartmentId || null) : targetDeptId,
          requesterEmail: currentAuthUser?.email,
          firstName: values.firstName,
          lastName: values.lastName,
          phoneNumber: values.phoneNumber,
        })
        toast.success(`User ${values.email} updated successfully`)
      } else {
        await userService.create({
          firstName: values.firstName,
          lastName: values.lastName,
          username: values.username,
          email: values.email,
          password: values.password,
          phoneNumber: values.phoneNumber,
          role: !isSuperAdmin && (values.role === 'super_admin' || values.role === 'admin') ? 'member' : values.role,
          departmentId: !isSuperAdmin ? (assignedDepartmentId || null) : targetDeptId,
        })
        toast.success(`User ${values.email} created successfully`)
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
        queryClient.invalidateQueries({ queryKey: ['departments'] }),
      ])
      form.reset()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Operation failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Distinct enterprise roles
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

  const departmentOptions = isSuperAdmin
    ? [
        { label: 'Unassigned (No Department)', value: '__unassigned__' },
        ...departments.map((d: any) => ({
          label: d.name,
          value: String(d._id || d.id),
        })),
      ]
    : departments
        .filter((d: any) => String(d._id || d.id) === assignedDepartmentId)
        .map((d: any) => ({ label: d.name, value: String(d._id || d.id) }))

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) {
          form.reset()
        }
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Edit User Profile' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update user roles, assigned department, and profile details.'
              : 'Create a new user account with portal access and credentials.'}
          </DialogDescription>
        </DialogHeader>

        {isSelf && (
          <div className='flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300'>
            <ShieldAlert className='size-4 shrink-0 text-amber-600' />
            <span>
              You are editing your own profile. Role and department changes are restricted by governance policy.
            </span>
          </div>
        )}

        <Form {...form}>
          <form
            id='user-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 pt-1'
          >
            {/* First & Last Name */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Rahul' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Sharma' autoComplete='off' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email & Username */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='user@organization.local'
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
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. rahul_s'
                        disabled={isEdit}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Role & Department */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enterprise Role</FormLabel>
                    <SelectDropdown
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder='Select role'
                      disabled={isSelf}
                      items={availableRoles}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='departmentId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Scope</FormLabel>
                    <SelectDropdown
                      value={field.value || '__unassigned__'}
                      onValueChange={field.onChange}
                      placeholder='Select department'
                      disabled={!isSuperAdmin || isSelf}
                      items={departmentOptions}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Phone Number */}
            <FormField
              control={form.control}
              name='phoneNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder='+91 9876543210' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Credentials */}
            {!isEdit ? (
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder='Minimum 6 characters' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder='Re-enter password' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
          </form>
        </Form>

        <DialogFooter className='gap-2 pt-2 sm:gap-0'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type='submit' form='user-form' disabled={isSubmitting}>
            {isSubmitting && <Loader2 className='mr-2 size-4 animate-spin' />}
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
