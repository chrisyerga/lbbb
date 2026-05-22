'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { PageShell } from '#/components/PageShell'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'

export const Route = createFileRoute('/app/generations/$jobId')({
  component: GenerationPage,
})

function GenerationPage() {
  const { jobId } = Route.useParams()
  const parsedJobId = jobId as Id<'generationJobs'>
  const data = useQuery(api.jobs.getMineById, { jobId: parsedJobId })

  if (data === undefined) {
    return (
      <PageShell eyebrow="Generation" title="Working on your post…">
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      </PageShell>
    )
  }

  if (data === null) {
    return (
      <PageShell eyebrow="Generation" title="Job not found">
        <p className="text-sm text-[var(--text-muted)]">
          This generation job does not exist or you do not have access.
        </p>
      </PageShell>
    )
  }

  const { job, events, draft } = data
  const statusLabel = job.status.replace(/_/g, ' ')

  return (
    <PageShell
      eyebrow="Generation"
      title={draft?.title ?? 'Generating your memory'}
      description={`Status: ${statusLabel}`}
    >
      <div className="panel grid gap-4 p-6 text-sm">
        {job.error ? (
          <p className="alert-error m-0 px-3 py-2">{job.error}</p>
        ) : null}

        {draft ? (
          <>
            {draft.excerpt ? (
              <p className="m-0 text-[var(--text-muted)]">{draft.excerpt}</p>
            ) : null}
            <div className="whitespace-pre-wrap text-[var(--text-primary)]">
              {draft.bodyMarkdown}
            </div>
            {draft.imageAssetIds.length > 0 ? (
              <p className="section-label m-0">
                {draft.imageAssetIds.length} sample images generated
              </p>
            ) : null}
          </>
        ) : (
          <p className="m-0 text-[var(--text-muted)]">
            {job.status === 'processing' || job.status === 'queued'
              ? 'Writing the post and painting four sample images…'
              : 'Waiting for generation output.'}
          </p>
        )}

        <ul className="m-0 grid list-none gap-2 p-0">
          {events.map((event) => (
            <li
              key={event._id}
              className="font-mono text-xs tracking-wide text-[var(--text-muted)] uppercase"
            >
              {event.type} · {event.message}
            </li>
          ))}
        </ul>

        {job.petId ? (
          <p className="m-0">
            <Link
              to="/app/pets/$petId/memories/new"
              params={{ petId: job.petId }}
              className="font-semibold no-underline"
            >
              ← Compose another memory
            </Link>
          </p>
        ) : null}
      </div>
    </PageShell>
  )
}
