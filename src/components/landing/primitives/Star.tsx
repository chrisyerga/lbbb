import type { CSSProperties } from 'react'
import { cn } from '#/lib/utils'

type StarProps = {
  color: string
  size?: number
  className?: string
  style?: CSSProperties
}

export function Star({ color, size = 32, className, style }: StarProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={cn('block', className)} style={style}>
      <path
        d="M12 1 C 12 9, 13 12, 23 12 C 13 12, 12 15, 12 23 C 12 15, 11 12, 1 12 C 11 12, 12 9, 12 1 Z"
        fill={color}
      />
    </svg>
  )
}
