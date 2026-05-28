'use client'

import type { CSSProperties } from 'react'
import { cn } from '#/lib/utils'

type SunBurstProps = {
  color?: string
  size?: number
  rays?: number
  className?: string
  style?: CSSProperties
}

function roundThou(n: number) {
  return Math.round(n * 1000) / 1000
}

export function SunBurst({
  color = '#F2A02E',
  size = 120,
  rays = 12,
  className,
  style,
}: SunBurstProps) {
  const lines = []
  for (let i = 0; i < rays; i += 1) {
    const a = (i / rays) * Math.PI * 2
    const x1 = 50 + Math.cos(a) * 18
    const y1 = 50 + Math.sin(a) * 18
    const x2 = 50 + Math.cos(a) * 48
    const y2 = 50 + Math.sin(a) * 48
    lines.push(
      <line
        key={i}
        x1={roundThou(x1)}
        y1={roundThou(y1)}
        x2={roundThou(x2)}
        y2={roundThou(y2)}
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />,
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn('block', className)}
      style={style}
    >
      {lines}
    </svg>
  )
}
