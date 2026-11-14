import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldCheck, History } from 'lucide-react'

export function AuditLogsPage() {
  const sampleLogs = [
    { action: 'QR Destination Updated', resource: 'Diwali Seva Dynamic QR', actor: 'Admin (Admin)', time: '10 minutes ago' },
    { action: 'QR Created', resource: 'Prasadam Counter UPI QR', actor: 'Kitchen Lead (Manager)', time: '2 hours ago' },
    { action: 'User Role Changed', resource: 'volunteer@organization.local -> Manager', actor: 'Super Admin', time: '5 hours ago' },
    { action: 'QR Status Toggled (Active -> Paused)', resource: 'Old Festival Notice QR', actor: 'Events Lead', time: '1 day ago' },
    { action: 'Department Created', resource: 'Sankirtan & Media', actor: 'Super Admin', time: '2 days ago' },
  ]

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2 px-2 text-sm font-medium text-muted-foreground'>
          <span>Organization</span>
          <span>/</span>
          <span className='text-foreground font-semibold'>Audit Logs</span>
        </div>
        <div className='ms-auto flex items-center space-x-2'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold tracking-tight text-foreground'>
            Administrative Audit Trail
          </h1>
          <p className='text-sm text-muted-foreground'>
            Immutable audit records tracking QR creation, destination modifications, status changes, and RBAC events.
          </p>
        </div>

        <Card className='border-border/60 shadow-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base font-semibold'>
              <History className='size-5 text-primary' />
              Recent System Events
            </CardTitle>
            <CardDescription>
              Chronological log of administrative actions stored in MongoDB `activity_logs` collection.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='divide-y divide-border/60'>
              {sampleLogs.map((log, index) => (
                <div key={index} className='flex items-center justify-between py-3.5 text-sm'>
                  <div className='flex items-center gap-3'>
                    <div className='flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary'>
                      <ShieldCheck className='size-4' />
                    </div>
                    <div>
                      <div className='font-medium text-foreground'>{log.action}</div>
                      <div className='text-xs text-muted-foreground'>{log.resource}</div>
                    </div>
                  </div>
                  <div className='text-end'>
                    <div className='text-xs font-medium text-foreground'>{log.actor}</div>
                    <div className='text-[11px] text-muted-foreground'>{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
