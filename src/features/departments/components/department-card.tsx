import { Building2, MoreVertical, Pencil, QrCode, Trash2, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Department } from '@/types/department'

interface DepartmentCardProps {
  department: Department
  canManage: boolean
  onEdit: (dept: Department) => void
  onDelete: (dept: Department) => void
}

export function DepartmentCard({
  department,
  canManage,
  onEdit,
  onDelete,
}: DepartmentCardProps) {
  return (
    <Card className='group border-border/60 shadow-sm transition-all hover:border-primary/50 hover:shadow-md'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors'>
            <Building2 className='size-5' />
          </div>
          <div className='flex items-center gap-1.5'>
            <Badge
              variant='outline'
              className={
                department.status === 'active'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-neutral-500/20 bg-neutral-500/10 text-neutral-600'
              }
            >
              {department.status === 'active' ? 'Active' : 'Archived'}
            </Badge>

            {canManage && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant='ghost' size='icon' className='size-8 text-muted-foreground'>
                    <MoreVertical className='size-4' />
                    <span className='sr-only'>Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => onEdit(department)} className='gap-2 text-xs'>
                    <Pencil className='size-3.5' /> Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(department)}
                    className='gap-2 text-xs text-destructive focus:text-destructive'
                  >
                    <Trash2 className='size-3.5' /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <CardTitle className='mt-2.5 text-base font-semibold tracking-tight'>
          {department.name}
        </CardTitle>
        <CardDescription className='line-clamp-2 text-xs text-muted-foreground min-h-[2rem]'>
          {department.description || 'Dedicated departmental workspace for QR asset routing and analytics.'}
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-3 pt-0'>
        <div className='rounded-lg bg-muted/40 p-2.5 text-xs'>
          <span className='text-muted-foreground'>Manager: </span>
          <span className='font-medium text-foreground'>{department.managerName}</span>
          {department.managerEmail && (
            <div className='truncate text-[11px] text-muted-foreground/80'>
              {department.managerEmail}
            </div>
          )}
        </div>

        <div className='flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground'>
          <span className='flex items-center gap-1.5 font-medium'>
            <QrCode className='size-3.5 text-primary' />
            {department.totalQrs} QR Codes
          </span>
          <span className='flex items-center gap-1.5 font-medium'>
            <Users className='size-3.5 text-amber-500' />
            {department.totalMembers} Members
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
