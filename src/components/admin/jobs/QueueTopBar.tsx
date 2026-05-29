import { formatUsd } from '#/lib/adminJobsUi'
import { MonoLabel } from './primitives'

type Stats = {
  activeCount: number
  queuedCount: number
  costTodayTotal: number
  successRate: number
  jobsPerHour: number
}

function Stat({ label, value, sub, live }: { label: string; value: string | number; sub?: string; live?: boolean }) {
  return (
    <div className="admin-top-stat">
      <div className="admin-top-stat-label">
        <MonoLabel>{label}</MonoLabel>
        {live ? (
          <span
            className="admin-status-dot is-live"
            style={{ background: 'var(--admin-tomato)', width: 5, height: 5 }}
          />
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span className="admin-top-stat-value">{value}</span>
        {sub ? <span className="admin-top-stat-sub">{sub}</span> : null}
      </div>
    </div>
  )
}

export function QueueTopBar({ stats }: { stats: Stats | undefined }) {
  return (
    <header className="admin-top-bar">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 18px',
          minWidth: 180,
        }}
      >
        <MonoLabel>generation queue</MonoLabel>
      </div>
      <Stat label="active" value={stats?.activeCount ?? '—'} sub="/ workers n/a" live={(stats?.activeCount ?? 0) > 0} />
      <Stat label="queued" value={stats?.queuedCount ?? '—'} />
      <Stat label="throughput" value={stats?.jobsPerHour ?? '—'} sub="jobs/hr" />
      <Stat label="cost today" value={stats ? formatUsd(stats.costTodayTotal) : '—'} />
      <Stat label="success" value={stats ? `${stats.successRate}%` : '—'} sub="24h" />
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
        }}
      >
        <button type="button" className="admin-btn-secondary" disabled title="Pause queue not implemented yet">
          Pause queue
        </button>
      </div>
    </header>
  )
}
