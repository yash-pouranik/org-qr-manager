import { Outlet } from '@tanstack/react-router'
import { Monitor, Bell, Palette, Wrench, UserCog } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { SidebarNav } from './components/sidebar-nav'

const sidebarNavItems = [
  {
    title: 'Personal Profile',
    href: '/settings',
    icon: <UserCog size={18} />,
  },
  {
    title: 'Account & Security',
    href: '/settings/account',
    icon: <Wrench size={18} />,
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
    icon: <Palette size={18} />,
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    icon: <Bell size={18} />,
  },
  {
    title: 'Display',
    href: '/settings/display',
    icon: <Monitor size={18} />,
  },
]

export function Settings() {
  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col pb-16'>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Account Settings
          </h1>
          <p className='text-muted-foreground'>
            Manage your personal profile, credentials, and organizational preferences.
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />
        <div className='flex flex-1 flex-col space-y-4 md:space-y-4 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <aside className='top-20 lg:sticky lg:w-1/5 self-start'>
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className='flex-1 p-1 pr-4 lg:max-w-3xl'>
            <div className='w-full'>
              <Outlet />
            </div>
          </div>
        </div>
      </Main>
    </>
  )
}
