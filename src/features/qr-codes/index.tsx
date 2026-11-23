import { useState, useMemo, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  QrCode,
  Search as SearchIcon,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Edit3,
  Layers,
  Smartphone,
  Globe,
  Radio,
  Eye,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { QrCodeItem, qrService } from '@/services/qr-service'
import { departmentService } from '@/services/department-service'
import { useAuthUser } from '@/context/auth-context'
import { QrEditDestinationDialog } from './components/qr-edit-destination-dialog'
import { QrTrashDialog } from './components/qr-trash-dialog'
import { QrViewDialog } from './components/qr-view-dialog'
import { getShortUrl } from '@/lib/api-client'

export function QrCodesPage() {
  const queryClient = useQueryClient()
  const {
    isSuperAdmin,
    canCreateQr,
    canEditQr,
    canDeleteQr,
    canAccessTrash,
    assignedDepartmentId,
    assignedDepartmentName,
  } = useAuthUser()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState(
    isSuperAdmin ? 'all' : assignedDepartmentId || 'all'
  )
  const [activeTab, setActiveTab] = useState<'all' | 'dynamic' | 'static' | 'trash'>('all')

  // Keep department synced if assignedDepartmentId updates
  useEffect(() => {
    if (!isSuperAdmin && assignedDepartmentId) {
      setSelectedDepartment(assignedDepartmentId)
    }
  }, [isSuperAdmin, assignedDepartmentId])

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [trashDialogOpen, setTrashDialogOpen] = useState(false)
  const [isPermanentDelete, setIsPermanentDelete] = useState(false)
  const [selectedQr, setSelectedQr] = useState<QrCodeItem | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Fetch active QRs
  const { data: rawActiveQrs = [], isLoading: loadingActive } = useQuery({
    queryKey: ['qr-codes', 'active'],
    queryFn: () => qrService.getAll({ trash: false }),
  })

  // Fetch trash QRs
  const { data: rawTrashQrs = [], isLoading: loadingTrash } = useQuery({
    queryKey: ['qr-codes', 'trash'],
    queryFn: () => qrService.getAll({ trash: true }),
    enabled: canAccessTrash,
  })

  // Fetch departments for filter
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
  })

  // Scope active QRs to department if not super admin
  const activeQrs = useMemo(() => {
    if (isSuperAdmin || !assignedDepartmentId) return rawActiveQrs
    return rawActiveQrs.filter((q) => q.departmentId === assignedDepartmentId)
  }, [rawActiveQrs, isSuperAdmin, assignedDepartmentId])

  // Scope trash QRs to department if not super admin
  const trashQrs = useMemo(() => {
    if (!canAccessTrash) return []
    if (isSuperAdmin || !assignedDepartmentId) return rawTrashQrs
    return rawTrashQrs.filter((q) => q.departmentId === assignedDepartmentId)
  }, [rawTrashQrs, canAccessTrash, isSuperAdmin, assignedDepartmentId])

  // Filtered dataset based on tab, department & search
  const currentDataset = activeTab === 'trash' ? trashQrs : activeQrs

  const filteredQrs = useMemo(() => {
    return currentDataset.filter((item) => {
      // Tab filter
      if (activeTab === 'dynamic' && item.category !== 'dynamic') return false
      if (activeTab === 'static' && item.category !== 'static') return false

      // Department filter (Super Admin can pick 'all' or specific)
      if (isSuperAdmin && selectedDepartment !== 'all' && item.departmentId !== selectedDepartment) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = item.name.toLowerCase().includes(q)
        const matchCode = item.shortCode?.toLowerCase().includes(q)
        const matchDest = item.destinationUrl.toLowerCase().includes(q)
        const matchDept = item.departmentName.toLowerCase().includes(q)
        return matchName || matchCode || matchDest || matchDept
      }

      return true
    })
  }, [currentDataset, activeTab, selectedDepartment, searchQuery, isSuperAdmin])

  // Statistical calculations
  const totalScans = useMemo(
    () => activeQrs.reduce((acc, curr) => acc + (curr.totalScans || 0), 0),
    [activeQrs]
  )
  const dynamicCount = useMemo(
    () => activeQrs.filter((q) => q.category === 'dynamic').length,
    [activeQrs]
  )
  const staticCount = useMemo(
    () => activeQrs.filter((q) => q.category === 'static').length,
    [activeQrs]
  )

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleToggleStatus = async (item: QrCodeItem) => {
    // Permission check
    const hasPermission =
      canEditQr && (isSuperAdmin || item.departmentId === assignedDepartmentId)
    if (!hasPermission) {
      toast.error('Permission denied to modify QR status in this department')
      return
    }

    const newStatus = item.status === 'active' ? 'paused' : 'active'
    try {
      await qrService.update(item.id, { status: newStatus })
      toast.success(
        `QR "${item.name}" is now ${newStatus === 'active' ? 'Active' : 'Paused'}`
      )
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] })
    } catch {
      toast.error('Failed to change status')
    }
  }

  const handleRestore = async (item: QrCodeItem) => {
    if (!canDeleteQr) {
      toast.error('Permission denied to restore QR codes')
      return
    }
    try {
      await qrService.restore(item.id)
      toast.success(`Restored "${item.name}" from Trash!`)
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] })
    } catch {
      toast.error('Failed to restore QR code')
    }
  }

  const openViewDialog = (item: QrCodeItem) => {
    setSelectedQr(item)
    setViewDialogOpen(true)
  }

  const openEditDestination = (item: QrCodeItem) => {
    setSelectedQr(item)
    setEditDialogOpen(true)
  }

  const openTrashDialog = (item: QrCodeItem, permanent = false) => {
    setSelectedQr(item)
    setIsPermanentDelete(permanent)
    setTrashDialogOpen(true)
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['qr-codes'] })
  }

  const isLoading = loadingActive || loadingTrash

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2 px-2 text-sm font-medium text-muted-foreground'>
          <span>Organization</span>
          <span>/</span>
          <span className='font-semibold text-foreground'>QR Directory</span>
        </div>
        <div className='ms-auto flex items-center space-x-2'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='space-y-6'>
        {/* Top Header & Quick Generator Link */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>
              QR Code Directory
            </h1>
            <p className='text-sm text-muted-foreground'>
              Centralized registry of dynamic redirects, static payment codes, and soft-delete trash recovery.
            </p>
          </div>
          {canCreateQr && (
            <div className='flex items-center gap-2'>
              <Button
                asChild
                size='sm'
                className='gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
              >
                <Link to='/qr-codes/create'>
                  <Plus className='size-4' />
                  Generate New QR
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Statistical Summary Cards */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card className='border-border/60 shadow-xs'>
            <CardContent className='flex items-center gap-4 p-4'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <QrCode className='size-5' />
              </div>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>Total Active QRs</p>
                <p className='text-xl font-bold tracking-tight text-foreground'>
                  {isLoading ? '...' : activeQrs.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardContent className='flex items-center gap-4 p-4'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
                <Radio className='size-5' />
              </div>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>Total Lifetime Scans</p>
                <p className='text-xl font-bold tracking-tight text-foreground'>
                  {isLoading ? '...' : totalScans.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardContent className='flex items-center gap-4 p-4'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400'>
                <Globe className='size-5' />
              </div>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>Dynamic Managed</p>
                <p className='text-xl font-bold tracking-tight text-foreground'>
                  {isLoading ? '...' : dynamicCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardContent className='flex items-center gap-4 p-4'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400'>
                <Smartphone className='size-5' />
              </div>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>Static / Direct UPI</p>
                <p className='text-xl font-bold tracking-tight text-foreground'>
                  {isLoading ? '...' : staticCount}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls & Tabs */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <Tabs
            value={activeTab}
            onValueChange={(val: any) => setActiveTab(val)}
            className='w-auto'
          >
            <TabsList className='bg-muted/60 p-1'>
              <TabsTrigger value='all' className='text-xs'>
                All Codes ({activeQrs.length})
              </TabsTrigger>
              <TabsTrigger value='dynamic' className='text-xs'>
                Dynamic ({dynamicCount})
              </TabsTrigger>
              <TabsTrigger value='static' className='text-xs'>
                Static ({staticCount})
              </TabsTrigger>
              {canAccessTrash && (
                <TabsTrigger value='trash' className='text-xs gap-1 text-destructive'>
                  <Trash2 className='size-3' />
                  <span>Trash ({trashQrs.length})</span>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          <div className='flex flex-wrap items-center gap-2'>
            {/* Department Filter (Only Super Admin can switch) */}
            {isSuperAdmin ? (
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger className='h-8 w-44 text-xs'>
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
            ) : (
              <Badge variant='outline' className='h-8 px-2.5 text-xs text-primary border-primary/30'>
                {assignedDepartmentName || 'Assigned Department'}
              </Badge>
            )}

            {/* Search Input */}
            <div className='relative w-full sm:w-56'>
              <SearchIcon className='absolute left-2.5 top-2.5 size-3.5 text-muted-foreground' />
              <Input
                type='search'
                placeholder='Search QRs, links...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='h-8 pl-8 text-xs'
              />
            </div>
          </div>
        </div>

        {/* QR Code Items List */}
        {isLoading ? (
          <div className='space-y-3'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-20 w-full rounded-xl' />
            ))}
          </div>
        ) : filteredQrs.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 py-16 text-center'>
            <QrCode className='size-12 text-muted-foreground/40' />
            <h3 className='mt-4 text-sm font-semibold text-foreground'>
              {activeTab === 'trash' ? 'Trash is Empty' : 'No QR Codes Found'}
            </h3>
            <p className='mt-1 text-xs text-muted-foreground max-w-sm'>
              {activeTab === 'trash'
                ? 'Deleted QR codes will appear here for 30-day recovery.'
                : searchQuery
                ? `No QR codes matching "${searchQuery}".`
                : 'Get started by creating your first styled QR code or donation portal.'}
            </p>
            {activeTab !== 'trash' && !searchQuery && canCreateQr && (
              <Button asChild size='sm' className='mt-4 gap-1.5'>
                <Link to='/qr-codes/create'>
                  <Plus className='size-3.5' /> Generate QR
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className='space-y-3'>
            {filteredQrs.map((item) => {
              const isDynamic = item.category === 'dynamic'
              const isTrash = activeTab === 'trash'
              const canEditThisItem =
                canEditQr && (isSuperAdmin || item.departmentId === assignedDepartmentId)
              const canDeleteThisItem =
                canDeleteQr && (isSuperAdmin || item.departmentId === assignedDepartmentId)

              return (
                <Card
                  key={item.id}
                  className={`border-border/60 transition-colors hover:border-primary/40 ${
                    item.status === 'paused' ? 'opacity-70 bg-muted/20' : ''
                  }`}
                >
                  <CardContent className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between'>
                    {/* Left: Thumbnail & Main Info */}
                    <div className='flex items-start gap-4'>
                      <button
                        type='button'
                        onClick={() => openViewDialog(item)}
                        className='group relative flex size-12 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-background shadow-xs hover:border-primary/60 hover:bg-muted/40 transition-all cursor-pointer'
                        title='Click to View & Download QR'
                      >
                        <QrCode className='size-6 text-primary group-hover:scale-105 transition-transform' />
                        {isDynamic && (
                          <span
                            className='absolute -top-1 -right-1 flex size-2.5 rounded-full bg-emerald-500 ring-2 ring-background'
                            title='Dynamic Active'
                          />
                        )}
                      </button>

                      <div className='space-y-1 min-w-0'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <button
                            type='button'
                            onClick={() => openViewDialog(item)}
                            className='font-semibold text-sm text-foreground hover:text-primary transition-colors truncate max-w-xs sm:max-w-md text-start cursor-pointer'
                          >
                            {item.name}
                          </button>
                          <Badge
                            variant={isDynamic ? 'default' : 'secondary'}
                            className='text-[10px] font-normal uppercase tracking-wider'
                          >
                            {item.category}
                          </Badge>
                          <Badge variant='outline' className='text-[10px]'>
                            {item.type.replace('_', ' ')}
                          </Badge>
                        </div>

                        {/* URLs & Department */}
                        <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                          <span className='flex items-center gap-1 text-primary/90 font-medium'>
                            <Layers className='size-3' />
                            {item.departmentName || 'General'}
                          </span>

                          {isDynamic && (
                            <div className='flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono font-medium'>
                              {(() => {
                                const resolvedLink =
                                  item.shortUrl ||
                                  (item.shortCode ? getShortUrl(item.shortCode) : '')
                                return (
                                  <>
                                    <span className='truncate max-w-[220px]'>{resolvedLink}</span>
                                    {resolvedLink && (
                                      <button
                                        type='button'
                                        onClick={() => handleCopyLink(resolvedLink, item.id)}
                                        className='p-0.5 hover:text-foreground cursor-pointer'
                                        title='Copy Short Link'
                                      >
                                        {copiedId === item.id ? (
                                          <Check className='size-3 text-emerald-600' />
                                        ) : (
                                          <Copy className='size-3' />
                                        )}
                                      </button>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          )}

                          <span className='truncate max-w-[200px] text-muted-foreground/80' title={item.destinationUrl}>
                            → {item.destinationUrl}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Metrics & Controls */}
                    <div className='flex items-center justify-between sm:justify-end gap-4 border-t border-border/60 pt-2 sm:border-0 sm:pt-0'>
                      {/* Scan Metrics */}
                      <div className='text-end text-xs'>
                        <div className='font-bold text-foreground'>
                          {item.totalScans.toLocaleString()} Scans
                        </div>
                        <div className='text-[10px] text-muted-foreground'>
                          {item.uniqueVisitors.toLocaleString()} unique
                        </div>
                      </div>

                      {/* Active/Paused Switch (only for active QRs and if authorized) */}
                      {!isTrash && canEditThisItem && (
                        <div className='flex items-center gap-1.5'>
                          <Switch
                            checked={item.status === 'active'}
                            onCheckedChange={() => handleToggleStatus(item)}
                            title={
                              item.status === 'active'
                                ? 'Active (Click to pause)'
                                : 'Paused (Click to activate)'
                            }
                          />
                          <span
                            className={`text-[10px] font-medium ${
                              item.status === 'active'
                                ? 'text-emerald-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {item.status === 'active' ? 'Active' : 'Paused'}
                          </span>
                        </div>
                      )}

                      {/* Trash notice if in Trash */}
                      {isTrash && (
                        <Badge variant='destructive' className='text-[10px]'>
                          Soft-Deleted
                        </Badge>
                      )}

                      {/* Action Menu */}
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='sm' className='h-8 px-2'>
                            Options
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-48'>
                          {!isTrash && (
                            <DropdownMenuItem
                              onClick={() => openViewDialog(item)}
                              className='gap-2 text-xs font-medium text-foreground'
                            >
                              <Eye className='size-3.5 text-primary' /> View QR & Download
                            </DropdownMenuItem>
                          )}

                          {isDynamic && !isTrash && canEditThisItem && (
                            <DropdownMenuItem
                              onClick={() => openEditDestination(item)}
                              className='gap-2 text-xs'
                            >
                              <Edit3 className='size-3.5' /> Edit Destination URL
                            </DropdownMenuItem>
                          )}

                          {!isTrash && (
                            <DropdownMenuItem
                              onClick={() => {
                                const url =
                                  isDynamic
                                    ? item.shortUrl || (item.shortCode ? getShortUrl(item.shortCode) : item.destinationUrl)
                                    : item.destinationUrl
                                window.open(url, '_blank')
                              }}
                              className='gap-2 text-xs'
                            >
                              <ExternalLink className='size-3.5' /> {isDynamic ? 'Test Redirect' : 'Open Destination'}
                            </DropdownMenuItem>
                          )}

                          {isTrash ? (
                            <>
                              {canDeleteQr && (
                                <DropdownMenuItem
                                  onClick={() => handleRestore(item)}
                                  className='gap-2 text-xs text-emerald-600 focus:text-emerald-600'
                                >
                                  <RotateCcw className='size-3.5' /> Restore to Directory
                                </DropdownMenuItem>
                              )}
                              {isSuperAdmin && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openTrashDialog(item, true)}
                                    className='gap-2 text-xs text-destructive focus:text-destructive'
                                  >
                                    <Trash2 className='size-3.5' /> Permanent Erase
                                  </DropdownMenuItem>
                                </>
                              )}
                            </>
                          ) : (
                            canDeleteThisItem && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openTrashDialog(item, false)}
                                  className='gap-2 text-xs text-destructive focus:text-destructive'
                                >
                                  <Trash2 className='size-3.5' /> Move to Trash
                                </DropdownMenuItem>
                              </>
                            )
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Dialogs */}
        <QrViewDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          qrItem={selectedQr}
          onEditDestination={openEditDestination}
        />

        <QrEditDestinationDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          qrItem={selectedQr}
          onSuccess={handleRefresh}
        />

        <QrTrashDialog
          open={trashDialogOpen}
          onOpenChange={setTrashDialogOpen}
          qrItem={selectedQr}
          permanent={isPermanentDelete}
          onSuccess={handleRefresh}
        />
      </Main>
    </>
  )
}
