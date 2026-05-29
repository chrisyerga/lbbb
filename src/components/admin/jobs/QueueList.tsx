import type { Id } from '#convex/_generated/dataModel'
import { OP_LABEL, matchesFilter, relTime } from '#/lib/adminJobsUi'
import type { QueueFilter } from '#/lib/adminJobsUi'
import { StatusPill } from './primitives'

export type QueueListRow = {
  jobId: Id<'generationJobs'>
  petName: string
  ownerEmail: string
  avatarUrl: string | null
  operation: 'blog_post' | 'image' | 'regeneration'
  status: 'queued' | 'processing' | 'awaiting_review' | 'completed' | 'failed' | 'cancelled'
  attempt: number
  error?: string
  createdAt: number
  progress: number
  costSoFar: number
}

const FILTERS: Array<{ id: QueueFilter; label: string }> = [
  { id: 'all', label: 'all' },
  { id: 'active', label: 'active' },
  { id: 'queue', label: 'queue' },
  { id: 'review', label: 'review' },
  { id: 'failed', label: 'failed' },
]

export function QueueList({
  rows,
  activeId,
  filter,
  search,
  onFilterChange,
  onSearchChange,
  onSelect,
}: {
  rows: Array<QueueListRow> | undefined
  activeId: Id<'generationJobs'> | null
  filter: QueueFilter
  search: string
  onFilterChange: (f: QueueFilter) => void
  onSearchChange: (s: string) => void
  onSelect: (jobId: Id<'generationJobs'>) => void
}) {
  const q = search.trim().toLowerCase()
  const filtered =
    rows?.filter((row) => {
      if (!matchesFilter(row.status, filter)) return false
      if (!q) return true
      return (
        row.petName.toLowerCase().includes(q) ||
        row.ownerEmail.toLowerCase().includes(q) ||
        row.jobId.toLowerCase().includes(q)
      )
    }) ?? []

  const counts = FILTERS.reduce(
    (acc, f) => {
      acc[f.id] = rows?.filter((r) => matchesFilter(r.status, f.id)).length ?? 0
      return acc
    },
    {} as Record<QueueFilter, number>,
  )

  const hasActive = (rows?.filter((r) => r.status === 'processing').length ?? 0) > 0

  return (
    <aside className="admin-queue-list">
      <div className="admin-queue-list-head">
        <input
          type="search"
          placeholder="Search pet, owner, job id…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="admin-queue-search"
        />
        <div className="admin-filter-chips">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? 'admin-filter-chip is-active' : 'admin-filter-chip'}
              onClick={() => onFilterChange(f.id)}
            >
              {f.label} · {counts[f.id]}
              {f.id === 'active' && hasActive ? ' ●' : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-queue-rows">
        {rows === undefined ? (
          <p className="admin-empty-state">Loading queue…</p>
        ) : filtered.length === 0 ? (
          <p className="admin-empty-state">No jobs match.</p>
        ) : (
          filtered.map((row) => (
            <button
              key={row.jobId}
              type="button"
              className={[
                'admin-queue-row',
                activeId === row.jobId ? 'is-active' : '',
                row.status === 'processing' ? 'is-processing' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect(row.jobId)}
            >
              <span className="admin-pet-dot">
                {row.avatarUrl ? <img src={row.avatarUrl} alt="" /> : (row.petName.slice(0, 1) || '?').toUpperCase()}
              </span>
              <span style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{row.petName}</span>
                  <StatusPill status={row.status} />
                  {row.attempt > 1 ? (
                    <span
                      className="admin-mono"
                      style={{
                        fontSize: 10,
                        color: 'var(--admin-amber)',
                        letterSpacing: '0.06em',
                      }}
                    >
                      retry ×{row.attempt}
                    </span>
                  ) : null}
                </div>
                <div
                  className="admin-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--admin-ink-3)',
                    marginTop: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.ownerEmail} · {relTime(row.createdAt)} · {OP_LABEL[row.operation]}
                </div>
                {row.status === 'processing' ? (
                  <div className="admin-progress-bar">
                    <div className="admin-progress-fill" style={{ width: `${Math.round(row.progress * 100)}%` }} />
                  </div>
                ) : null}
                {row.error ? (
                  <div
                    className="admin-mono"
                    style={{
                      fontSize: 10.5,
                      color: 'var(--admin-red)',
                      marginTop: 6,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.error}
                  </div>
                ) : null}
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  )
}
