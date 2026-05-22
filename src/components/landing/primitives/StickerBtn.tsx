'use client'

import type { CSSProperties, PropsWithChildren } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '#/lib/utils'

type StickerBtnProps = PropsWithChildren<{
  bg: string
  color?: string
  size?: 'lg' | 'md'
  className?: string
  style?: CSSProperties
  to?: string
  onClick?: () => void
  type?: 'button' | 'submit'
}>

export function StickerBtn({
  children,
  bg,
  color = '#fff',
  size = 'lg',
  className,
  style,
  to,
  onClick,
  type = 'button',
}: StickerBtnProps) {
  const classes = cn(
    'inline-flex cursor-pointer items-center gap-2.5 border border-[#14100E] font-semibold transition-[transform,opacity] duration-100',
    size === 'lg' && 'rounded-2xl px-7 py-[18px] text-lg',
    size === 'md' && 'rounded-xl px-5 py-3 text-sm',
    className,
  )
  const inlineStyle = { background: bg, color, ...style }

  const pressHandlers = {
    onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.transform = 'translateY(1px)'
    },
    onMouseUp: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.transform = ''
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.transform = ''
    },
  }

  if (to) {
    return (
      <Link
        to={to}
        className={cn(classes, 'no-underline')}
        style={inlineStyle}
        {...pressHandlers}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      className={classes}
      style={inlineStyle}
      onClick={onClick}
      {...pressHandlers}
    >
      {children}
    </button>
  )
}
