import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUsers } from './users-provider'

export function UsersPrimaryButtons() {
  const { setOpen } = useUsers()
  return (
    <div className='flex gap-2'>
      <Button className='gap-2 shadow-xs' onClick={() => setOpen('add')}>
        <UserPlus className='size-4' />
        <span>Add User</span>
      </Button>
    </div>
  )
}
