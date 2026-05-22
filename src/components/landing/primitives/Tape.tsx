import type { CSSProperties } from 'react'
import { cn } from '#/lib/utils'

type TapeProps = {
  color?: string
  w?: number
  rotate?: number
  className?: string
  style?: CSSProperties
}

export function Tape({
  color = '#F2D27A',
  w = 90,
  rotate = -6,
  className,
  style,
}: TapeProps) {
  return (
    <div
      className={cn('opacity-[0.82] mix-blend-multiply', className)}
      style={{
        width: w,
        height: 22,
        background: color,
        transform: `rotate(${rotate}deg)`,
        boxShadow: '0 1px 2px rgba(0,0,0,.06)',
        backgroundImage:
          'linear-gradient(90deg, rgba(255,255,255,.35) 0, rgba(255,255,255,0) 30%, rgba(0,0,0,.05) 100%)',
        ...style,
      }}
    />
  )
}
