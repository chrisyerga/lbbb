import { Link } from '@tanstack/react-router'
import type { Doc } from '#convex/_generated/dataModel'
import { OP_LABEL, elapsedMs, formatElapsed, formatUsd } from '#/lib/adminJobsUi'
import { StatusPill } from './primitives'

export function JobHeader({
  job,
  petName,
  ownerEmail,
  costTotal,
}: {
  job: Doc<'generationJobs'>
  petName: string
  ownerEmail: string
  costTotal: number
}) {
  const elapsed = formatElapsed(elapsedMs(job))

  async function copyId() {
    await navigator.clipboard.writeText(job._id)
  }

  return (
    <header className="admin-job-header">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          className="admin-mono admin-btn-secondary"
          onClick={() => void copyId()}
          title="Copy job id"
        >
          {job._id}
        </button>
        <StatusPill status={job.status} size="lg" />
        <span style={{ fontWeight: 600 }}>
          {petName} · {OP_LABEL[job.operation]}
        </span>
        <span className="admin-mono" style={{ fontSize: 11, color: 'var(--admin-ink-3)' }}>
          {ownerEmail}
        </span>
      </div>

      <div
        className="admin-mono"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          fontSize: 11,
          color: 'var(--admin-ink-3)',
          marginBottom: 12,
        }}
      >
        <span>provider {job.provider ?? 'openai'}</span>
        {job.textModel ? <span>text {job.textModel}</span> : null}
        {job.imageModel ? <span>image {job.imageModel}</span> : null}
        <span>attempt {job.attempt}</span>
        <span>elapsed {elapsed}</span>
        <span>cost {formatUsd(costTotal)}</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {job.memoryId ? (
          <Link to="/app/pets/$petId/memories" params={{ petId: job.petId }} className="admin-btn-secondary">
            View memory
          </Link>
        ) : null}
        <Link to="/app/generations/$jobId" params={{ jobId: job._id }} className="admin-btn-secondary">
          Open draft
        </Link>
        <button type="button" className="admin-btn-secondary" disabled title="Cancel not implemented yet">
          Cancel
        </button>
        <button type="button" className="admin-btn-secondary" disabled title="Retry not implemented yet">
          Retry
        </button>
      </div>
    </header>
  )
}

export function OutputPanel({
  draft,
  imageCount,
  isProcessing,
}: {
  draft: {
    title: string
    excerpt?: string
    bodyMarkdown: string
    imageUrls: Array<string | null>
  } | null
  imageCount: number
  isProcessing: boolean
}) {
  const slots = Math.max(2, imageCount || (isProcessing ? 2 : 0))

  return (
    <div className="admin-output-panel">
      <div className="admin-output-text">
        {draft ? (
          <>
            <h3 className="admin-output-title">{draft.title}</h3>
            {draft.excerpt ? (
              <p className="admin-output-body" style={{ opacity: 0.75, marginBottom: 10 }}>
                {draft.excerpt}
              </p>
            ) : null}
            <p className="admin-output-body">{draft.bodyMarkdown}</p>
          </>
        ) : (
          <p className="admin-output-body" style={{ color: 'var(--admin-ink-3)' }}>
            {isProcessing ? 'Waiting for generated text…' : 'No draft output yet.'}
          </p>
        )}
      </div>
      <div className="admin-output-images">
        {Array.from({ length: Math.min(slots, 4) }).map((_, i) => {
          const url = draft?.imageUrls[i]
          return (
            <div key={i} className="admin-output-image">
              {url ? <img src={url} alt="" /> : <div className="admin-output-placeholder" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
