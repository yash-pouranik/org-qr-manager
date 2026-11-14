import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  QrCode,
  TrendingUp,
  Radio,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Smartphone,
  CheckCircle2,
  Inbox,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'
import { qrService } from '@/services/qr-service'
import { departmentService } from '@/services/department-service'

export function Dashboard() {
  const { data: qrs = [], isLoading: loadingQrs } = useQuery({
    queryKey: ['qr-codes', 'active'],
    queryFn: () => qrService.getAll({ trash: false }),
  })

  const { data: departments = [], isLoading: loadingDepts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
  })

  // Live metrics calculation
  const totalScans = useMemo(
    () => qrs.reduce((acc, curr) => acc + (curr.totalScans || 0), 0),
    [qrs]
  )
  const dynamicCount = useMemo(
    () => qrs.filter((q) => q.category === 'dynamic').length,
    [qrs]
  )
  const staticCount = useMemo(
    () => qrs.filter((q) => q.category === 'static').length,
    [qrs]
  )
  const activeRoutingCount = useMemo(
    () => qrs.filter((q) => q.status === 'active' && q.category === 'dynamic').length,
    [qrs]
  )
  const pausedCount = useMemo(
    () => qrs.filter((q) => q.status === 'paused').length,
    [qrs]
  )

  const recentQrs = qrs.slice(0, 5)
  const isLoading = loadingQrs || loadingDepts

  return (
    <>
      {/* Top Header */}
      <Header fixed>
        <div className='flex items-center gap-2 px-2 text-sm font-medium text-muted-foreground'>
          <span>Organization</span>
          <span>/</span>
          <span className='font-semibold text-foreground'>Overview</span>
        </div>
        <div className='ms-auto flex items-center space-x-2'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      {/* Main Content */}
      <Main>
        <div className='mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>
              Platform Overview
            </h1>
            <p className='text-sm text-muted-foreground'>
              Centralized QR generation, dynamic redirect routing, and scan metrics across departments.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              asChild
              size='sm'
              className='gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
            >
              <Link to='/qr-codes/create'>
                <Plus className='size-4' />
                Generate QR Code
              </Link>
            </Button>
          </div>
        </div>

        {/* Core Metric Cards */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6'>
          <Card className='border-border/60 shadow-xs'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-medium text-muted-foreground'>Total QR Codes</CardTitle>
              <QrCode className='size-4 text-primary' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-foreground'>
                {isLoading ? <Skeleton className='h-8 w-16' /> : qrs.length}
              </div>
              <div className='flex items-center gap-2 mt-1 text-xs text-muted-foreground'>
                <span className='text-primary font-medium'>{dynamicCount} Dynamic</span>
                <span>•</span>
                <span>{staticCount} Static</span>
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-medium text-muted-foreground'>Total Scans</CardTitle>
              <TrendingUp className='size-4 text-primary' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-foreground'>
                {isLoading ? <Skeleton className='h-8 w-24' /> : totalScans.toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                Live verified scan persistence
              </p>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-medium text-muted-foreground'>Active Routing</CardTitle>
              <Radio className='size-4 text-accent animate-pulse' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-foreground'>
                {isLoading ? <Skeleton className='h-8 w-20' /> : `${activeRoutingCount} Active`}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                {pausedCount} paused
              </p>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-medium text-muted-foreground'>Departments</CardTitle>
              <Building2 className='size-4 text-primary' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-foreground'>
                {isLoading ? <Skeleton className='h-8 w-16' /> : `${departments.length} Scopes`}
              </div>
              <p className='text-xs text-muted-foreground mt-1'>
                Role-gated departmental teams
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two-Column Section: Recently Generated QRs & Live Scan Feed */}
        <div className='grid gap-6 lg:grid-cols-12'>
          {/* Left Column: Recent QR Codes Table */}
          <div className='lg:col-span-8'>
            <Card className='border-border/60 shadow-xs'>
              <CardHeader className='flex flex-row items-center justify-between pb-3'>
                <div>
                  <CardTitle className='text-base font-semibold'>Recently Generated QR Codes</CardTitle>
                  <CardDescription className='text-xs'>Active codes across organizational departments</CardDescription>
                </div>
                <Button asChild variant='ghost' size='sm' className='text-xs text-primary gap-1'>
                  <Link to='/qr-codes'>
                    View all
                    <ArrowUpRight className='size-3.5' />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className='space-y-3'>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className='h-12 w-full rounded-md' />
                    ))}
                  </div>
                ) : recentQrs.length === 0 ? (
                  <div className='flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 py-10 text-center'>
                    <Inbox className='size-10 text-muted-foreground/40 mb-2' />
                    <p className='text-sm font-semibold text-foreground'>No QR Codes Generated Yet</p>
                    <p className='text-xs text-muted-foreground max-w-sm mt-1 mb-4'>
                      Create your first static payment QR or dynamic link to start tracking visitor scans.
                    </p>
                    <Button asChild size='sm' className='gap-1.5'>
                      <Link to='/qr-codes/create'>
                        <Plus className='size-3.5' /> Create QR Code
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className='divide-y divide-border/60'>
                    {recentQrs.map((qr) => (
                      <div key={qr.id} className='flex items-center justify-between py-3 text-sm'>
                        <div className='flex items-center gap-3'>
                          <div className='flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                            <QrCode className='size-4' />
                          </div>
                          <div>
                            <div className='font-medium text-foreground'>{qr.name}</div>
                            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                              <span>{qr.departmentName}</span>
                              <span>•</span>
                              <span className={qr.category === 'dynamic' ? 'text-primary font-medium' : ''}>
                                {qr.category === 'dynamic' ? 'Dynamic' : 'Static'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className='text-end'>
                          <div className='font-semibold text-foreground'>{qr.totalScans.toLocaleString()} scans</div>
                          <div className='flex items-center justify-end gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 capitalize'>
                            <CheckCircle2 className='size-3' />
                            {qr.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Live Scan Activity Stream */}
          <div className='lg:col-span-4 space-y-4'>
            <Card className='border-border/60 shadow-xs'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base font-semibold flex items-center gap-2'>
                  <Smartphone className='size-4 text-primary' />
                  Redirection Gateway Status
                </CardTitle>
                <CardDescription className='text-xs'>
                  Server-side HTTP 302 engine & privacy session hasher
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='rounded-lg bg-muted/40 p-3 space-y-2 text-xs'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Bot Screening:</span>
                    <span className='font-medium text-emerald-600'>Active (User-Agent regex)</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Duplicate Window:</span>
                    <span className='font-medium text-foreground'>5 minutes sliding</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Visitor Privacy:</span>
                    <span className='font-medium text-foreground'>Daily Salted HMAC-SHA256</span>
                  </div>
                </div>

                <div className='rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs'>
                  <div className='flex items-center gap-2 text-foreground font-semibold'>
                    <ShieldCheck className='size-4 text-primary' />
                    <span>Synchronous Persistence</span>
                  </div>
                  <p className='text-[11px] text-muted-foreground mt-1'>
                    Every scan is validated and stored before HTTP 302 redirection is issued.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>
    </>
  )
}
