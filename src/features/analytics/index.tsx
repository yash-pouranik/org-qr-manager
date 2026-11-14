import { useState, useEffect, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  analyticsService,
  AnalyticsSummary,
} from '@/services/analytics-service'
import { departmentService } from '@/services/department-service'
import { Department } from '@/types/department'
import {
  BarChart3,
  TrendingUp,
  Smartphone,
  Users,
  RefreshCw,
  Sparkles,
  Plus,
  ExternalLink,
  QrCode,
  Monitor,
  Tablet,
  ShieldCheck,
  Building2,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const TIME_RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: 'all', label: 'All Time' },
] as const

type TimeRangeKey = (typeof TIME_RANGES)[number]['id']

// Organization Brand Palette Tokens
const COLOR_PRIMARY = '#166534' // Forest Green
const COLOR_ACCENT = '#E9A23B' // Saffron Gold
const COLOR_EMERALD = '#059669'
const COLOR_SLATE = '#94A3B8'
const DEVICE_COLORS: Record<string, string> = {
  Mobile: COLOR_PRIMARY,
  Desktop: COLOR_ACCENT,
  Tablet: COLOR_EMERALD,
}

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('30d')
  const [selectedDept, setSelectedDept] = useState<string>('all')
  const [departments, setDepartments] = useState<Department[]>([])
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)

  // Fetch departments for filter dropdown
  useEffect(() => {
    departmentService
      .getAll()
      .then((depts) => setDepartments(depts))
      .catch((err) => console.error('Failed to load departments for filter:', err))
  }, [])

  // Fetch analytics summary
  const loadAnalytics = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const result = await analyticsService.getSummary({
        departmentId: selectedDept === 'all' ? undefined : selectedDept,
        timeRange,
      })
      setData(result)
    } catch (err) {
      console.error('Error loading analytics:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [timeRange, selectedDept])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const handleSimulateTestTraffic = async () => {
    setIsSimulating(true)
    try {
      await analyticsService.simulateScans(15)
      await loadAnalytics(true)
    } catch (err) {
      console.error('Failed to simulate test scans:', err)
    } finally {
      setIsSimulating(false)
    }
  }

  const hasScans = data && data.summary.totalScans > 0

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2 px-2 text-sm font-medium text-muted-foreground'>
          <span>Organization</span>
          <span>/</span>
          <span className='text-foreground font-semibold'>Scan Analytics & Traffic</span>
        </div>
        <div className='ms-auto flex items-center space-x-2'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        {/* Top Header & Global Filter Controls */}
        <div className='mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>
              Scan Analytics & Visitor Intelligence
            </h1>
            <p className='text-sm text-muted-foreground'>
              Real-time HTTP 302 redirects, device signatures, and privacy-hashed unique visitors.
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            {/* Department Filter */}
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className='w-[190px] h-9 text-xs'>
                <Building2 className='size-3.5 mr-1 text-muted-foreground' />
                <SelectValue placeholder='All Departments' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Time Range Pills */}
            <div className='flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5 text-xs font-medium'>
              {TIME_RANGES.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    timeRange === range.id
                      ? 'bg-background text-foreground shadow-sm font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <Button
              variant='outline'
              size='sm'
              onClick={() => loadAnalytics(true)}
              disabled={isRefreshing || isLoading}
              className='h-9 px-2.5'
              title='Refresh Data'
            >
              <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6'>
          {/* Card 1: Total Scans */}
          <Card className='border-border/60 shadow-sm'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-medium text-muted-foreground'>
                Total Scans Tracked
              </CardTitle>
              <TrendingUp className='size-4 text-primary' />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className='h-8 w-24' />
              ) : (
                <div className='text-2xl font-bold text-foreground'>
                  {data?.summary.totalScans.toLocaleString() || '0'}
                </div>
              )}
              <p className='text-xs text-muted-foreground mt-1 flex items-center gap-1'>
                <span className='inline-block size-1.5 rounded-full bg-emerald-500' />
                Server-side HTTP 302 redirects
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Unique Visitors */}
          <Card className='border-border/60 shadow-sm'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-medium text-muted-foreground'>
                Unique Visitors
              </CardTitle>
              <Users className='size-4 text-amber-500' />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className='h-8 w-24' />
              ) : (
                <div className='text-2xl font-bold text-foreground'>
                  {data?.summary.uniqueVisitors.toLocaleString() || '0'}
                </div>
              )}
              <p className='text-xs text-muted-foreground mt-1 flex items-center gap-1'>
                <ShieldCheck className='size-3 text-emerald-600' />
                Privacy-salted daily sessions
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Mobile Share */}
          <Card className='border-border/60 shadow-sm'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-medium text-muted-foreground'>
                Mobile Device Share
              </CardTitle>
              <Smartphone className='size-4 text-primary' />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className='h-8 w-24' />
              ) : (
                <div className='text-2xl font-bold text-foreground'>
                  {data?.summary.mobileShare || 0}%
                </div>
              )}
              <p className='text-xs text-muted-foreground mt-1'>
                Smartphone and tablet cameras
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Active QR Campaigns */}
          <Card className='border-border/60 shadow-sm'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-medium text-muted-foreground'>
                Active QR Codes
              </CardTitle>
              <QrCode className='size-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className='h-8 w-24' />
              ) : (
                <div className='text-2xl font-bold text-foreground'>
                  {data?.summary.activeQrsCount || 0}
                </div>
              )}
              <p className='text-xs text-muted-foreground mt-1'>
                Active dynamic routing campaigns
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Section: Chart or Empty State */}
        {!hasScans && !isLoading ? (
          <Card className='border-border/60 shadow-sm mb-6'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                <BarChart3 className='size-5 text-primary' />
                Scan Traffic Overview
              </CardTitle>
              <CardDescription>
                Real-time time-series aggregations from urBackend & MongoDB redirect logs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center bg-muted/10'>
                <div className='size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3'>
                  <BarChart3 className='size-6' />
                </div>
                <h3 className='text-base font-semibold text-foreground mb-1'>
                  No scan activity recorded yet
                </h3>
                <p className='text-xs text-muted-foreground max-w-md mb-4'>
                  Live scan data will automatically render here as dynamic QR codes are scanned by visitors.
                  You can also generate test scans to verify charts and aggregation pipelines.
                </p>
                <div className='flex items-center gap-2'>
                  <Button
                    size='sm'
                    onClick={handleSimulateTestTraffic}
                    disabled={isSimulating}
                    className='gap-1.5'
                  >
                    <Sparkles className='size-3.5' />
                    {isSimulating ? 'Simulating Scans...' : 'Simulate 15 Test Scans'}
                  </Button>
                  <Button variant='outline' size='sm' asChild className='gap-1.5'>
                    <Link to='/qr-codes/create'>
                      <Plus className='size-3.5' />
                      Create Dynamic QR
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Live Time-Series Chart */}
            <Card className='border-border/60 shadow-sm mb-6'>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
                <div>
                  <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                    <BarChart3 className='size-5 text-primary' />
                    Scan Activity Trends
                  </CardTitle>
                  <CardDescription>
                    Daily scan volume vs. unique visitor sessions across selected time range.
                  </CardDescription>
                </div>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleSimulateTestTraffic}
                    disabled={isSimulating}
                    className='text-xs h-8 text-muted-foreground hover:text-foreground'
                  >
                    <Sparkles className='size-3 mr-1 text-primary' />
                    {isSimulating ? 'Simulating...' : '+ Add Sample Scans'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='pt-4'>
                {isLoading ? (
                  <Skeleton className='h-[300px] w-full rounded-lg' />
                ) : (
                  <div className='h-[320px] w-full'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <AreaChart
                        data={data?.timeSeries || []}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id='colorScans' x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='5%' stopColor={COLOR_PRIMARY} stopOpacity={0.4} />
                            <stop offset='95%' stopColor={COLOR_PRIMARY} stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id='colorVisitors' x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='5%' stopColor={COLOR_ACCENT} stopOpacity={0.4} />
                            <stop offset='95%' stopColor={COLOR_ACCENT} stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray='3 3' className='stroke-border/60' vertical={false} />
                        <XAxis
                          dataKey='label'
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '0.5rem',
                            fontSize: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                          formatter={(value) => (
                            <span className='text-foreground font-medium'>{value}</span>
                          )}
                        />
                        <Area
                          type='monotone'
                          dataKey='scans'
                          name='Total Scans'
                          stroke={COLOR_PRIMARY}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill='url(#colorScans)'
                        />
                        <Area
                          type='monotone'
                          dataKey='uniqueVisitors'
                          name='Unique Visitors'
                          stroke={COLOR_ACCENT}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill='url(#colorVisitors)'
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Middle Section: Device Breakdown & OS/Browser Breakdown */}
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6'>
              {/* Device Type Donut */}
              <Card className='border-border/60 shadow-sm'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                    <Smartphone className='size-4 text-primary' />
                    Device Distribution
                  </CardTitle>
                  <CardDescription>
                    Device classification extracted from visitor User-Agent signatures.
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex flex-col items-center justify-center pt-2'>
                  {isLoading ? (
                    <Skeleton className='h-[220px] w-full rounded-lg' />
                  ) : (
                    <div className='h-[220px] w-full flex items-center justify-center'>
                      <ResponsiveContainer width='100%' height='100%'>
                        <PieChart>
                          <Pie
                            data={data?.deviceBreakdown.filter((d) => d.value > 0) || []}
                            cx='50%'
                            cy='50%'
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey='value'
                          >
                            {data?.deviceBreakdown.map((entry) => (
                              <Cell
                                key={`cell-${entry.name}`}
                                fill={DEVICE_COLORS[entry.name] || COLOR_SLATE}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              borderColor: 'hsl(var(--border))',
                              borderRadius: '0.5rem',
                              fontSize: '12px',
                            }}
                          />
                          <Legend
                            formatter={(value) => (
                              <span className='text-xs font-medium text-foreground'>{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className='grid grid-cols-3 gap-2 w-full mt-2 pt-3 border-t border-border/60 text-center'>
                    {data?.deviceBreakdown.map((item) => (
                      <div key={item.name} className='flex flex-col items-center'>
                        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                          {item.name === 'Mobile' ? (
                            <Smartphone className='size-3 text-primary' />
                          ) : item.name === 'Tablet' ? (
                            <Tablet className='size-3 text-emerald-600' />
                          ) : (
                            <Monitor className='size-3 text-amber-500' />
                          )}
                          <span>{item.name}</span>
                        </div>
                        <span className='text-base font-bold text-foreground mt-0.5'>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Operating System & Browser Mix */}
              <Card className='border-border/60 shadow-sm'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                    <ShieldCheck className='size-4 text-primary' />
                    Operating System & Browser Mix
                  </CardTitle>
                  <CardDescription>
                    Client platforms accessing dynamic redirect endpoints.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4 pt-1'>
                  <div>
                    <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5'>
                      Operating Systems
                    </h4>
                    <div className='space-y-2'>
                      {data?.osBreakdown.map((os) => {
                        const total = data.summary.totalScans || 1
                        const pct = Math.round((os.value / total) * 100)
                        return (
                          <div key={os.name} className='space-y-1'>
                            <div className='flex justify-between text-xs'>
                              <span className='font-medium text-foreground'>{os.name}</span>
                              <span className='text-muted-foreground'>
                                {os.value} scans ({pct}%)
                              </span>
                            </div>
                            <div className='h-1.5 w-full bg-muted rounded-full overflow-hidden'>
                              <div
                                className='h-full bg-primary rounded-full transition-all duration-500'
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className='pt-2 border-t border-border/60'>
                    <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5'>
                      Web Browsers
                    </h4>
                    <div className='space-y-2'>
                      {data?.browserBreakdown.map((browser) => {
                        const total = data.summary.totalScans || 1
                        const pct = Math.round((browser.value / total) * 100)
                        return (
                          <div key={browser.name} className='space-y-1'>
                            <div className='flex justify-between text-xs'>
                              <span className='font-medium text-foreground'>{browser.name}</span>
                              <span className='text-muted-foreground'>
                                {browser.value} scans ({pct}%)
                              </span>
                            </div>
                            <div className='h-1.5 w-full bg-muted rounded-full overflow-hidden'>
                              <div
                                className='h-full bg-amber-500 rounded-full transition-all duration-500'
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section: Top Performing QR Codes Table */}
            <Card className='border-border/60 shadow-sm'>
              <CardHeader className='flex flex-row items-center justify-between'>
                <div>
                  <CardTitle className='flex items-center gap-2 text-base font-semibold'>
                    <QrCode className='size-5 text-primary' />
                    Top Performing QR Codes
                  </CardTitle>
                  <CardDescription>
                    Highest traffic campaigns ranked by total scan volume and verified visitors.
                  </CardDescription>
                </div>
                <Button variant='outline' size='sm' asChild className='h-8 text-xs gap-1.5'>
                  <Link to='/qr-codes'>
                    <span>View All QR Codes</span>
                    <ExternalLink className='size-3' />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto'>
                  <table className='w-full text-xs'>
                    <thead>
                      <tr className='border-b border-border/80 text-muted-foreground text-left'>
                        <th className='py-2.5 font-medium'>Rank</th>
                        <th className='py-2.5 font-medium'>Campaign / QR Name</th>
                        <th className='py-2.5 font-medium'>Department</th>
                        <th className='py-2.5 font-medium'>Type</th>
                        <th className='py-2.5 font-medium text-right'>Total Scans</th>
                        <th className='py-2.5 font-medium text-right'>Unique Visitors</th>
                        <th className='py-2.5 font-medium text-right'>Last Scanned</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-border/50'>
                      {data?.topQrs.map((qr, idx) => (
                        <tr key={qr.id} className='hover:bg-muted/40 transition-colors'>
                          <td className='py-3 font-semibold text-muted-foreground'>
                            #{idx + 1}
                          </td>
                          <td className='py-3 font-medium text-foreground'>
                            <div className='flex items-center gap-2'>
                              <div className='size-6 rounded bg-primary/10 flex items-center justify-center text-primary'>
                                <QrCode className='size-3.5' />
                              </div>
                              <div>
                                <span>{qr.name}</span>
                                {qr.shortCode && (
                                  <span className='block text-[10px] text-muted-foreground'>
                                    /r/{qr.shortCode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className='py-3 text-muted-foreground'>{qr.departmentName}</td>
                          <td className='py-3'>
                            <Badge variant='outline' className='text-[10px] font-normal uppercase'>
                              {qr.type.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className='py-3 font-bold text-foreground text-right'>
                            {qr.totalScans.toLocaleString()}
                          </td>
                          <td className='py-3 font-medium text-amber-600 dark:text-amber-400 text-right'>
                            {qr.uniqueVisitors.toLocaleString()}
                          </td>
                          <td className='py-3 text-muted-foreground text-right'>
                            {qr.lastScannedAt
                              ? new Date(qr.lastScannedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </Main>
    </>
  )
}
