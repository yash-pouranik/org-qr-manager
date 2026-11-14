import { useMemo } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, UserCheck, Users as UsersIcon, UserX } from 'lucide-react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import { users as defaultUsers } from './data/users'
import { userService } from '@/services/user-service'
import { useAuthUser } from '@/context/auth-context'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { isSuperAdmin, isAdmin, assignedDepartmentId, assignedDepartmentName } = useAuthUser()
  const canManageUsers = isSuperAdmin || isAdmin

  const { data: usersData = defaultUsers, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => userService.getAll(),
  })

  // Scope user list to assigned department for Department Admins
  const filteredUsers = useMemo(() => {
    if (isSuperAdmin) return usersData
    if (assignedDepartmentId) {
      return usersData.filter(
        (u) =>
          u.departmentId === assignedDepartmentId ||
          u.departmentName === assignedDepartmentName
      )
    }
    return usersData
  }, [usersData, isSuperAdmin, assignedDepartmentId, assignedDepartmentName])

  // Statistical calculations
  const stats = useMemo(() => {
    const total = filteredUsers.length
    const active = filteredUsers.filter((u) => u.status === 'active').length
    const admins = filteredUsers.filter(
      (u) => u.role === 'super_admin' || u.role === 'admin' || u.role === 'superadmin'
    ).length
    const managersAndMembers = filteredUsers.filter(
      (u) => u.role === 'manager' || u.role === 'member'
    ).length

    return { total, active, admins, managersAndMembers }
  }, [filteredUsers])

  return (
    <UsersProvider>
      <Header fixed>
        <div className='flex items-center gap-2 px-2 text-sm font-medium text-muted-foreground'>
          <span>Organization</span>
          <span>/</span>
          <span className='font-semibold text-foreground'>User Management</span>
        </div>
        <div className='ms-auto flex items-center space-x-2'>
          <Search className='me-auto' />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-6'>
        {/* Header Title & Actions */}
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight text-foreground'>
              User Governance & Access
            </h2>
            <p className='text-sm text-muted-foreground'>
              Manage team members, enforce role-based access control, and assign departmental workspaces.
            </p>
          </div>
          {canManageUsers && <UsersPrimaryButtons />}
        </div>

        {/* RBAC Metric Cards */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card className='border-border/60 shadow-xs'>
            <CardContent className='flex items-center gap-4 p-4'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <UsersIcon className='size-5' />
              </div>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>Total Accounts</p>
                <p className='text-xl font-bold tracking-tight text-foreground'>
                  {isLoading ? '...' : stats.total}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardContent className='flex items-center gap-4 p-4'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
                <UserCheck className='size-5' />
              </div>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>Active Status</p>
                <p className='text-xl font-bold tracking-tight text-foreground'>
                  {isLoading ? '...' : stats.active}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardContent className='flex items-center gap-4 p-4'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400'>
                <ShieldCheck className='size-5' />
              </div>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>Admins & Super Admins</p>
                <p className='text-xl font-bold tracking-tight text-foreground'>
                  {isLoading ? '...' : stats.admins}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardContent className='flex items-center gap-4 p-4'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400'>
                <UserX className='size-5' />
              </div>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>Managers & Members</p>
                <p className='text-xl font-bold tracking-tight text-foreground'>
                  {isLoading ? '...' : stats.managersAndMembers}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Table or Loading Skeleton */}
        {isLoading ? (
          <div className='space-y-3'>
            <Skeleton className='h-10 w-full rounded-md' />
            <Skeleton className='h-64 w-full rounded-md' />
          </div>
        ) : (
          <UsersTable data={filteredUsers} search={search} navigate={navigate} />
        )}
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
