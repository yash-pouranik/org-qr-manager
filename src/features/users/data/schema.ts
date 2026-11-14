import { z } from 'zod'

export const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('invited'),
  z.literal('suspended'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

export const userRoleSchema = z.union([
  z.literal('super_admin'),
  z.literal('admin'),
  z.literal('manager'),
  z.literal('member'),
  // Legacy backward-compatibility aliases
  z.literal('superadmin'),
  z.literal('cashier'),
])
export type UserRole = z.infer<typeof userRoleSchema>

const _userSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  username: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  status: userStatusSchema,
  role: userRoleSchema,
  departmentId: z.string().nullable().optional(),
  departmentName: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type User = z.infer<typeof _userSchema>
