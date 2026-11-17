import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DataTableColumnHeader } from '@/components/data-table'
import { callTypes, roles, roleDisplayMap } from '../data/data'
import { type User } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'super_admin':
    case 'superadmin':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
    case 'admin':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
    case 'manager':
      return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30'
    default:
      return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30'
  }
}

export const usersColumns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-0.5'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-0.5'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'username',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='User' />
    ),
    cell: ({ row }) => {
      const { firstName, lastName, username } = row.original
      const fullName = `${firstName || ''} ${lastName || ''}`.trim() || username
      const initials = (firstName && lastName)
        ? `${firstName[0]}${lastName[0]}`.toUpperCase()
        : username.slice(0, 2).toUpperCase()

      return (
        <div className='flex items-center gap-3 py-1'>
          <Avatar className='size-9 border border-border/60 bg-muted text-xs font-semibold'>
            <AvatarFallback className='bg-primary/10 text-primary'>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className='flex flex-col min-w-0'>
            <span className='font-medium text-foreground truncate'>
              {fullName}
            </span>
            <span className='text-xs text-muted-foreground truncate'>
              @{username}
            </span>
          </div>
        </div>
      )
    },
    filterFn: (row, _id, filterValue) => {
      if (!filterValue) return true
      const term = String(filterValue).toLowerCase().trim()
      const u = row.original
      return (
        (u.username || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.firstName || '').toLowerCase().includes(term) ||
        (u.lastName || '').toLowerCase().includes(term) ||
        `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(term)
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <span className='text-sm text-muted-foreground font-mono'>
        {row.getValue('email')}
      </span>
    ),
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ row }) => {
      const { role } = row.original
      const userType = roles.find(({ value }) => value === role)
      const displayLabel = roleDisplayMap[role] || role
      const badgeStyle = getRoleBadgeVariant(role)

      return (
        <Badge
          variant='outline'
          className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium', badgeStyle)}
        >
          {userType?.icon && <userType.icon className='size-3' />}
          <span>{displayLabel}</span>
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: true,
  },
  {
    accessorKey: 'departmentName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Department' />
    ),
    cell: ({ row }) => {
      const dept = row.original.departmentName || 'All Departments'
      return (
        <span className='inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground'>
          {dept}
        </span>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.original.status || 'active'
      const badgeColor = callTypes.get(status) || 'bg-muted text-muted-foreground'
      return (
        <Badge
          variant='outline'
          className={cn('capitalize text-xs font-medium', badgeColor)}
        >
          {status}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
