import { STATUS_TAX } from '#/lib/adminJobsUi'
import type { JobStatus } from '#/lib/adminJobsUi'

export function StatusPill({
  status,
  size = 'sm',
}: {
  status: JobStatus
  size?: 'sm' | 'lg'
}) {
  const s = STATUS_TAX[status]
  return (
    <span
      className={size === 'lg' ? 'admin-status-pill is-lg' : 'admin-status-pill'}
      style={{
        background: s.bg,
        border: `1px solid ${s.ring}`,
      }}
    >
      <span
        className={s.live ? 'admin-status-dot is-live' : 'admin-status-dot'}
        style={{ background: s.dot }}
      />
      {s.label}
    </span>
  )
}

export function MonoLabel({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={`admin-mono ${className ?? ''}`}
      style={{
        fontSize: '10.5px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--admin-ink-3)',
      }}
    >
      {children}
    </span>
  )
}
