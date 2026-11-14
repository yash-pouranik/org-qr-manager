import * as React from 'react'
import { ChevronsUpDown, ShieldCheck, Building2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuthUser } from '@/context/auth-context'

type TeamSwitcherProps = {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const { isMobile } = useSidebar()
  const { isSuperAdmin, assignedDepartmentName, role } = useAuthUser()
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  // If user is scoped to a specific department, show their assigned department
  const displayName = isSuperAdmin
    ? activeTeam.name
    : assignedDepartmentName || 'Department Workspace'

  const displayPlan = isSuperAdmin
    ? activeTeam.plan
    : `${role.toUpperCase().replace('_', ' ')} Scope`

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              disabled={!isSuperAdmin}
            >
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm'>
                {isSuperAdmin ? (
                  <activeTeam.logo className='size-4' />
                ) : (
                  <Building2 className='size-4' />
                )}
              </div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold text-foreground'>
                  {displayName}
                </span>
                <span className='truncate text-xs text-muted-foreground'>{displayPlan}</span>
              </div>
              {isSuperAdmin ? (
                <ChevronsUpDown className='ms-auto text-muted-foreground' />
              ) : (
                <ShieldCheck className='ms-auto size-4 text-emerald-600' />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {isSuperAdmin && (
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              align='start'
              side={isMobile ? 'bottom' : 'right'}
              sideOffset={4}
            >
              <DropdownMenuLabel className='text-xs text-muted-foreground'>
                Select Department Scope
              </DropdownMenuLabel>
              {teams.map((team) => (
                <DropdownMenuItem
                  key={team.name}
                  onClick={() => setActiveTeam(team)}
                  className='gap-2 p-2 cursor-pointer'
                >
                  <div className='flex size-6 items-center justify-center rounded-sm border border-border bg-background'>
                    <team.logo className='size-3.5 shrink-0 text-primary' />
                  </div>
                  <span className='text-sm font-medium'>{team.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setActiveTeam(teams[0])}
                className='gap-2 p-2 cursor-pointer'
              >
                <div className='font-medium text-xs text-muted-foreground'>
                  Reset to All Departments
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
