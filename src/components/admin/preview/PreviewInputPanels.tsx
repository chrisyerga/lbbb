import type { ReactNode } from 'react'

export function PreviewInputSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="admin-preview-input-section">
      <h5 className="admin-preview-input-heading">{title}</h5>
      {children}
    </div>
  )
}

export function PreviewInputRow({ label, value }: { label: string; value: string | number | undefined | null }) {
  const display = value === undefined || value === null || value === '' ? '(none)' : String(value)
  const isEmpty = display === '(none)'

  return (
    <div className="admin-preview-input-row">
      <span className="admin-preview-input-label">{label}</span>
      <span className={`admin-preview-input-value${isEmpty ? ' is-empty' : ''}`}>{display}</span>
    </div>
  )
}

export function PreviewInputBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-preview-input-row is-block">
      <span className="admin-preview-input-label">{label}</span>
      <pre className="admin-preview-input-block">{value || '(none)'}</pre>
    </div>
  )
}
