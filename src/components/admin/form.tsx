import type { ReactNode } from 'react'
import type { CatalogStatus, ModerationStatus, NarratorStatus } from '#/lib/adminCatalogUi'
import { CATALOG_STATUS_TAX, MODERATION_STATUS_TAX, NARRATOR_STATUS_TAX } from '#/lib/adminCatalogUi'

import { MonoLabel } from './jobs/primitives'

export function CatalogStatusChip({ status }: { status: CatalogStatus }) {
  const s = CATALOG_STATUS_TAX[status]
  return (
    <span className="admin-status-pill" style={{ background: s.bg, border: `1px solid ${s.ring}` }}>
      <span className="admin-status-dot" style={{ background: s.dot }} />
      {s.label}
    </span>
  )
}

export function NarratorStatusChip({ status }: { status: NarratorStatus }) {
  const s = NARRATOR_STATUS_TAX[status]
  return (
    <span className="admin-status-pill" style={{ background: s.bg, border: `1px solid ${s.ring}` }}>
      <span className="admin-status-dot" style={{ background: s.dot }} />
      {s.label}
    </span>
  )
}

export function ModerationStatusChip({ status, size = 'sm' }: { status: ModerationStatus; size?: 'sm' | 'lg' }) {
  const s = MODERATION_STATUS_TAX[status]
  return (
    <span
      className={size === 'lg' ? 'admin-status-pill is-lg' : 'admin-status-pill'}
      style={{ background: s.bg, border: `1px solid ${s.ring}` }}
    >
      <span className="admin-status-dot" style={{ background: s.dot }} />
      {s.label}
    </span>
  )
}

export function AdminField({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) {
  return (
    <label className="admin-field">
      <div className="admin-field-head">
        <MonoLabel>{label}</MonoLabel>
        {helper ? <span className="admin-field-helper">{helper}</span> : null}
      </div>
      {children}
    </label>
  )
}

export function AdminInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <input
      className="admin-input"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function AdminTextarea({
  value,
  onChange,
  rows = 4,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <textarea
      className="admin-textarea"
      rows={rows}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function AdminSelect<T extends string>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string }>
  disabled?: boolean
}) {
  return (
    <select className="admin-select" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function AdminToggle({
  value,
  onChange,
  label,
  helper,
  disabled,
}: {
  value: boolean
  onChange: (value: boolean) => void
  label: string
  helper?: string
  disabled?: boolean
}) {
  return (
    <button type="button" className="admin-toggle" disabled={disabled} onClick={() => onChange(!value)}>
      <span className={`admin-toggle-track${value ? ' is-on' : ''}`} aria-hidden>
        <span className="admin-toggle-thumb" />
      </span>
      <span className="admin-toggle-copy">
        <span className="admin-toggle-label">{label}</span>
        {helper ? <span className="admin-toggle-helper">{helper}</span> : null}
      </span>
    </button>
  )
}

export function AdminBtnPrimary({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button type={type} className="admin-btn-primary" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
