import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Plus, QrCode, Search as SearchIcon, Users, Layers } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Department } from '@/types/department'
import { departmentService } from '@/services/department-service'
import { useAuthUser } from '@/context/auth-context'
import { DepartmentCard } from './components/department-card'
import { DepartmentDialog } from './components/department-dialog'
import { DepartmentDeleteDialog } from './components/department-delete-dialog'

export function DepartmentsPage() {
  const queryClient = useQueryClient()
  const { isSuperAdmin } = useAuthUser()
  const canManage = isSuperAdmin

  const [searchQuery, setSearchQuery] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.getAll(),
  })

  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments
    const query = searchQuery.toLowerCase().trim()
    return departments.filter(
      (dept) =>
        dept.name.toLowerCase().includes(query) ||
        dept.slug.toLowerCase().includes(query) ||
        dept.managerName.toLowerCase().includes(query)
    )
  }, [departments, searchQuery])

  // Summary Metrics
  const totalQrs = useMemo(
    () => departments.reduce((acc, curr) => acc + (curr.totalQrs || 0), 0),
    [departments]
  )
  const totalMembers = useMemo(
    () => departments.reduce((acc, curr) => acc + (curr.totalMembers || 0), 0),
    [departments]
  )

  const handleCreate = () => {
    setSelectedDepartment(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (dept: Department) => {
    setSelectedDepartment(dept)
    setIsDialogOpen(true)
  }

  const handleDelete = (dept: Department) => {
    setSelectedDepartment(dept)
    setIsDeleteDialogOpen(true)
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['departments'] })
  }

  return (
    <>
      <Header fixed>
        <div className='flex items-center gap-2 px-2 text-sm font-medium text-muted-foreground'>
          <span>Organization</span>
          <span>/</span>
          <span className='font-semibold text-foreground'>Departments</span>
        </div>
        <div className='ms-auto flex items-center space-x-2'>
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='space-y-6'>
        {/* Header Section */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight text-foreground'>
              Department Governance
            </h1>
            <p className='text-sm text-muted-foreground'>
              Centralized administrative scopes, departmental leadership, and QR quota management.
            </p>
          </div>
          {canManage && (
            <Button
              onClick={handleCreate}
              size='sm'
              className='gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
            >
              <Plus className='size-4' />
              Add Department
            </Button>
          )}
        </div>

        {/* Statistical Summary Bar */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
          <Card className='border-border/60 shadow-xs'>
            <CardContent className='flex items-center gap-4 p-4'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <Layers className='size-5' />
              </div>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>Total Departments</p>
                <p className='text-xl font-bold tracking-tight text-foreground'>
                  {isLoading ? '...' : departments.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardContent className='flex items-center gap-4 p-4'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
                <QrCode className='size-5' />
              </div>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>Total QR Deployments</p>
                <p className='text-xl font-bold tracking-tight text-foreground'>
                  {isLoading ? '...' : totalQrs}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className='border-border/60 shadow-xs'>
            <CardContent className='flex items-center gap-4 p-4'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400'>
                <Users className='size-5' />
              </div>
              <div>
                <p className='text-xs font-medium text-muted-foreground'>Assigned Members</p>
                <p className='text-xl font-bold tracking-tight text-foreground'>
                  {isLoading ? '...' : totalMembers}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Toolbar */}
        <div className='flex items-center justify-between gap-4'>
          <div className='relative w-full max-w-sm'>
            <SearchIcon className='absolute left-2.5 top-2.5 size-4 text-muted-foreground' />
            <Input
              type='search'
              placeholder='Filter by department or lead name...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-8 text-xs'
            />
          </div>
          <span className='text-xs text-muted-foreground'>
            Showing {filteredDepartments.length} of {departments.length} departments
          </span>
        </div>

        {/* Department Grid */}
        {isLoading ? (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className='border-border/60 p-4 space-y-3'>
                <div className='flex items-center justify-between'>
                  <Skeleton className='size-10 rounded-lg' />
                  <Skeleton className='h-5 w-16' />
                </div>
                <Skeleton className='h-5 w-3/4' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-12 w-full rounded-md' />
              </Card>
            ))}
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 py-12 text-center'>
            <Building2 className='size-12 text-muted-foreground/40' />
            <h3 className='mt-4 text-sm font-semibold text-foreground'>No Departments Found</h3>
            <p className='mt-1 text-xs text-muted-foreground max-w-sm'>
              {searchQuery
                ? `No departments matching "${searchQuery}". Try adjusting your search query.`
                : 'Get started by creating your first departmental division.'}
            </p>
            {canManage && !searchQuery && (
              <Button onClick={handleCreate} size='sm' className='mt-4 gap-1.5'>
                <Plus className='size-3.5' /> Add Department
              </Button>
            )}
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {filteredDepartments.map((dept) => (
              <DepartmentCard
                key={dept.id}
                department={dept}
                canManage={canManage}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Action Dialogs */}
        <DepartmentDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          department={selectedDepartment}
          onSuccess={handleRefresh}
        />

        <DepartmentDeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          department={selectedDepartment}
          onSuccess={handleRefresh}
        />
      </Main>
    </>
  )
}
