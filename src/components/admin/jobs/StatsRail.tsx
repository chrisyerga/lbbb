import { formatUsd, relTime } from '#/lib/adminJobsUi'

type Stats = {
  jobsPerHour: number
  costTodayTotal: number
  costByModel: Array<{ model: string; amount: number }>
  activeCount: number
  incidents: Array<{ error: string; count: number; lastAt: number }>
  hourlyBuckets: Array<number>
}

function Sparkline({ data }: { data: Array<number> }) {
  const max = Math.max(...data, 1)
  return (
    <div className="admin-sparkline">
      {data.map((v, i) => (
        <div
          key={i}
          className="admin-spark-bar"
          style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  )
}

function Bar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  return (
    <div className="admin-bar-row">
      <span style={{ minWidth: 90, color: 'var(--admin-ink-2)' }}>{label}</span>
      <div className="admin-bar-track">
        <div
          className="admin-bar-fill"
          style={{
            width: `${Math.min(100, (value / max) * 100)}%`,
            background: color,
          }}
        />
      </div>
      <span style={{ minWidth: 48, textAlign: 'right' }}>{formatUsd(value)}</span>
    </div>
  )
}

const BAR_COLORS = [
  'var(--admin-tomato)',
  'var(--admin-amber)',
  'var(--admin-violet)',
  'var(--admin-blue)',
  'var(--admin-green)',
  'var(--admin-ink-3)',
]

export function StatsRail({ stats }: { stats: Stats | undefined }) {
  const maxCost = Math.max(...(stats?.costByModel.map((c) => c.amount) ?? [1]), 0.01)

  return (
    <aside className="admin-stats-rail">
      <div className="admin-stat-block">
        <p className="admin-stat-block-title">throughput · last 24h</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            {stats?.hourlyBuckets.reduce((a, b) => a + b, 0) ?? '—'}
          </span>
          <span className="admin-mono" style={{ fontSize: 11, color: 'var(--admin-ink-3)' }}>
            jobs total
          </span>
          <span
            className="admin-mono"
            style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--admin-ink-3)' }}
          >
            {stats?.jobsPerHour ?? '—'} jobs/hr
          </span>
        </div>
        {stats ? <Sparkline data={stats.hourlyBuckets} /> : null}
      </div>

      <div className="admin-stat-block">
        <p className="admin-stat-block-title">cost · today</p>
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: '1.625rem', fontWeight: 700 }}>
            {stats ? formatUsd(stats.costTodayTotal) : '—'}
          </span>
        </div>
        {stats?.costByModel.map((row, i) => (
          <Bar
            key={row.model}
            label={row.model}
            value={row.amount}
            max={maxCost}
            color={BAR_COLORS[i % BAR_COLORS.length]}
          />
        ))}
      </div>

      <div className="admin-stat-block">
        <p className="admin-stat-block-title">active jobs</p>
        <div className="admin-bar-row">
          <span
            className="admin-status-dot is-live"
            style={{ background: 'var(--admin-tomato)' }}
          />
          <span style={{ color: 'var(--admin-ink-2)' }}>
            {stats?.activeCount ?? 0} processing
          </span>
        </div>
        <p
          className="admin-mono"
          style={{ fontSize: 10.5, color: 'var(--admin-ink-4)', marginTop: 8 }}
        >
          Worker pool not configured — showing live job count.
        </p>
      </div>

      <div className="admin-stat-block">
        <p className="admin-stat-block-title">incidents · recent</p>
        {!stats?.incidents.length ? (
          <p className="admin-mono" style={{ fontSize: 11, color: 'var(--admin-ink-3)' }}>
            No recent failures.
          </p>
        ) : (
          stats.incidents.map((inc) => (
            <div
              key={inc.error}
              className="admin-bar-row"
              style={{ alignItems: 'flex-start', marginBottom: 8 }}
            >
              <span
                className="admin-status-dot"
                style={{ background: 'var(--admin-red)', marginTop: 4 }}
              />
              <span
                style={{
                  flex: 1,
                  color: 'var(--admin-ink-2)',
                  fontSize: 11,
                  lineHeight: 1.35,
                }}
              >
                {inc.error} · ×{inc.count}
              </span>
              <span className="admin-mono" style={{ fontSize: 10.5, color: 'var(--admin-ink-3)' }}>
                {relTime(inc.lastAt)}
              </span>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
