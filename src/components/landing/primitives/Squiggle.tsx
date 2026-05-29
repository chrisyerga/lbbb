import type { CSSProperties } from 'react'
import { cn } from '#/lib/utils'

type SquiggleProps = {
  color?: string
  width?: number
  className?: string
  style?: CSSProperties
}

export function Squiggle({ color = '#E0382E', width = 200, className, style }: SquiggleProps) {
  return (
    <svg width={width} height={14} viewBox="0 0 200 14" className={cn('block', className)} style={style} fill="none">
      <path
        d="M2 8 C 20 0, 40 14, 60 8 S 100 0, 120 8 S 160 14, 198 6"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
