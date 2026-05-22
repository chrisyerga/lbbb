import type { CSSProperties, PropsWithChildren } from 'react'
import { cn } from '#/lib/utils'

type PillProps = PropsWithChildren<{
  bg: string
  color: string
  className?: string
  style?: CSSProperties
}>

export function Pill({ children, bg, color, className, style }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[rgba(0,0,0,.85)] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap',
        className,
      )}
      style={{ background: bg, color, ...style }}
    >
      {children}
    </span>
  )
}
