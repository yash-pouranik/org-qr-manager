import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { useAppAuth } from '@/context/auth-context'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { user, canManageDepartments, canManageUsers, isMember } = useAppAuth()

  // Dynamically filter navigation groups based on strict RBAC permissions
  const filteredNavGroups = sidebarData.navGroups
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        // Only Super Admin can manage departments
        if (item.url === '/departments' && !canManageDepartments) {
          return false
        }
        // Only Super Admin & Department Admin can access User Management
        if (item.url === '/users' && !canManageUsers) {
          return false
        }
        // Members have read-only access (no QR creator)
        if (item.url === '/qr-codes/create' && isMember) {
          return false
        }
        return true
      })
      return { ...group, items: filteredItems }
    })
    .filter((group) => group.items.length > 0)

  const currentUserData = {
    name: user?.full_name || 'Organization User',
    email: user?.email || '',
    avatar: user?.avatar_url || '/images/favicon.png',
  }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUserData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
