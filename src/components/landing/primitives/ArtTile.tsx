import { useId } from 'react'
import type { CSSProperties } from 'react'
import { cn } from '#/lib/utils'
import type { LandingPalette } from '../landingPalette'

type ArtTileProps = {
  palette: LandingPalette
  label: string
  accent?: string
  rotate?: number
  className?: string
  style?: CSSProperties
}

export function ArtTile({
  palette,
  label,
  accent,
  rotate = 0,
  className,
  style,
}: ArtTileProps) {
  const rawId = useId()
  const id = rawId.replace(/:/g, '')
  const accentColor = accent ?? palette.accent

  return (
    <div
      className={cn('relative overflow-hidden rounded-[14px]', className)}
      style={{
        background: palette.cream,
        transform: `rotate(${rotate}deg)`,
        boxShadow:
          '0 8px 24px rgba(0,0,0,.10), 0 1.5px 0 rgba(0,0,0,.05)',
        ...style,
      }}
    >
      <svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        className="block"
      >
        <defs>
          <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={palette.ink} stopOpacity="0.85" />
          </linearGradient>
          <pattern
            id={`p${id}`}
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(35)"
          >
            <rect width="8" height="8" fill="transparent" />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="8"
              stroke="rgba(255,255,255,.18)"
              strokeWidth="1.5"
            />
          </pattern>
        </defs>
        <rect width="200" height="200" fill={`url(#g${id})`} />
        <rect width="200" height="200" fill={`url(#p${id})`} />
        <circle cx="100" cy="118" r="44" fill="rgba(255,255,255,.14)" />
        <circle cx="100" cy="80" r="28" fill="rgba(255,255,255,.18)" />
        <circle cx="82" cy="58" r="10" fill="rgba(255,255,255,.18)" />
        <circle cx="118" cy="58" r="10" fill="rgba(255,255,255,.18)" />
      </svg>
      <div className="font-mono absolute right-2.5 bottom-2.5 left-2.5 text-[11px] leading-tight font-medium tracking-wide text-white/85 uppercase">
        {label}
      </div>
    </div>
  )
}
