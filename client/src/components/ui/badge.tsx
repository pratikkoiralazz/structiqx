import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const colors = {
  green: 'bg-green-soft text-green',
  amber: 'bg-amber-soft text-[#a3751f]',
  red: 'bg-red-soft text-[#b74e43]',
  gray: 'bg-[#f0f2f3] text-[#6c7780]',
  orange: 'bg-[#fbede6] text-[#c35e31]',
  blue: 'bg-[#edf4fb] text-[#4a6d90]',
} as const

export function Badge({
  className,
  tone = 'gray',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof colors }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none', colors[tone], className)}
      {...props}
    />
  )
}
