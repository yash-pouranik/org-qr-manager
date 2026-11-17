import { Loader } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FormControl } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type SelectDropdownProps = {
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
  placeholder?: string
  isPending?: boolean
  items: { label: string; value: string }[] | undefined
  disabled?: boolean
  className?: string
  isControlled?: boolean
}

export function SelectDropdown({
  value,
  defaultValue,
  onValueChange,
  isPending,
  items,
  placeholder,
  disabled,
  className = '',
  isControlled = false,
}: SelectDropdownProps) {
  const handleChange = (val: string) => {
    if (onValueChange) {
      onValueChange(val === '__unassigned__' ? '' : val)
    }
  }

  const rawValue = value !== undefined ? value : defaultValue
  const activeValue =
    rawValue === '' || rawValue === null || rawValue === undefined
      ? '__unassigned__'
      : rawValue

  const selectProps =
    isControlled || value !== undefined
      ? { value: activeValue, onValueChange: handleChange }
      : { defaultValue: activeValue, onValueChange: handleChange }

  return (
    <Select {...selectProps}>
      <FormControl>
        <SelectTrigger disabled={disabled} className={cn(className)}>
          <SelectValue placeholder={placeholder ?? 'Select'} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {isPending ? (
          <SelectItem disabled value='loading' className='h-14'>
            <div className='flex items-center justify-center gap-2'>
              <Loader className='h-5 w-5 animate-spin' />
              Loading...
            </div>
          </SelectItem>
        ) : (
          items?.map(({ label, value: itemVal }) => {
            const safeItemVal =
              itemVal === '' || itemVal === null || itemVal === undefined
                ? '__unassigned__'
                : itemVal
            return (
              <SelectItem key={safeItemVal} value={safeItemVal}>
                {label}
              </SelectItem>
            )
          })
        )}
      </SelectContent>
    </Select>
  )
}
