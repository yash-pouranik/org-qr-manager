import { Shield, UserCheck, Users, ShieldAlert, CreditCard } from 'lucide-react'
import { type UserStatus } from './schema'

export const callTypes = new Map<UserStatus, string>([
  ['active', 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'],
  ['inactive', 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20'],
  ['invited', 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20'],
  ['suspended', 'bg-destructive/10 text-destructive dark:text-red-400 border-destructive/20'],
])

export const roles = [
  {
    label: 'Super Admin',
    value: 'super_admin',
    icon: ShieldAlert,
    description: 'Full platform access, all departments, users & audit logs',
  },
  {
    label: 'Admin',
    value: 'admin',
    icon: Shield,
    description: 'Manage assigned department, members & departmental QRs',
  },
  {
    label: 'Manager',
    value: 'manager',
    icon: UserCheck,
    description: 'Create & edit QR codes and view departmental analytics',
  },
  {
    label: 'Member',
    value: 'member',
    icon: Users,
    description: 'View permitted QR codes and basic operational metrics',
  },
  // Legacy aliases
  {
    label: 'Super Admin',
    value: 'superadmin',
    icon: ShieldAlert,
    description: 'Legacy alias for Super Admin',
  },
  {
    label: 'Cashier',
    value: 'cashier',
    icon: CreditCard,
    description: 'Legacy operator role',
  },
] as const

export const roleDisplayMap: Record<string, string> = {
  super_admin: 'Super Admin',
  superadmin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  member: 'Member',
  cashier: 'Cashier',
}
