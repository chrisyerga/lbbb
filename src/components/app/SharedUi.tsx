import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { IconArrowRight, IconPencil } from './icons'
import { cn } from '#/lib/utils'

export function SectionHead({
  kicker,
  title,
  actionLabel,
  to,
  size = 'lg',
}: {
  kicker: string
  title: string
  actionLabel?: string
  to?: string
  size?: 'lg' | 'sm'
}) {
  return (
    <div className="app-section-head">
      <div>
        <p className="app-section-kicker">{kicker}</p>
        <h2 className={cn('app-section-title', size === 'sm' && 'is-sm')}>{title}</h2>
      </div>
      {actionLabel && to ? (
        <Link to={to} className="app-section-action">
          {actionLabel} <IconArrowRight size={14} stroke={2.2} />
        </Link>
      ) : null}
    </div>
  )
}

export function EditableLink({
  to,
  children,
  title,
  className,
}: {
  to: string
  children: ReactNode
  title?: string
  className?: string
}) {
  return (
    <Link to={to} title={title} className={cn('editable-link', className)}>
      {children}
    </Link>
  )
}

export function EditHint({ label = 'click name or photo to edit' }: { label?: string }) {
  return (
    <span className="edit-hint">
      <IconPencil size={11} stroke={2} /> {label}
    </span>
  )
}
