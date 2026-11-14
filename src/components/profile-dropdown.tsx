import { Link } from '@tanstack/react-router'
import useDialogState from '@/hooks/use-dialog-state'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutDialog } from '@/components/sign-out-dialog'
import { useAppAuth } from '@/context/auth-context'
import { ShieldCheck, User } from 'lucide-react'

export function ProfileDropdown() {
  const [open, setOpen] = useDialogState()
  const { user, isSuperAdmin } = useAppAuth()

  const displayName = user?.full_name || 'Administrator'
  const displayEmail = user?.email || 'admin@organization.local'
  const displayRole = user?.role ? user.role.replace('_', ' ').toUpperCase() : 'SUPER ADMIN'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full border border-border/80'>
            <Avatar className='h-8 w-8'>
              <AvatarImage src={user?.avatar_url || ''} alt={displayName} />
              <AvatarFallback className='bg-primary/10 text-primary font-semibold text-xs'>
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-60' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col gap-1.5'>
              <div className='flex items-center justify-between'>
                <p className='text-sm leading-none font-semibold text-foreground'>{displayName}</p>
                {isSuperAdmin && (
                  <span className='inline-flex items-center gap-0.5 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary'>
                    <ShieldCheck className='size-3' />
                    SUPER ADMIN
                  </span>
                )}
              </div>
              <p className='text-xs leading-none text-muted-foreground'>{displayEmail}</p>
              <p className='text-[10px] font-mono uppercase text-muted-foreground/80 tracking-wider'>
                Role: {displayRole}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to='/settings'>
                <User className='size-4 me-2 text-muted-foreground' />
                My Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to='/settings'>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant='destructive' onClick={() => setOpen(true)} className='cursor-pointer'>
            Sign out
            <DropdownMenuShortcut className='text-current'>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
