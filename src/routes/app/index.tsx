'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { MetricCard } from '#/components/MetricCard'
import { PageShell } from '#/components/PageShell'
import { api } from '#convex/_generated/api'

export const Route = createFileRoute('/app/')({ component: AppDashboard })

function AppDashboard() {
  const jobs = useQuery(api.jobs.recent, { limit: 50 })
  const pets = useQuery(api.pets.listMine)

  const queued =
    jobs?.filter(
      (j) => j.status === 'queued' || j.status === 'processing',
    ).length ?? 0
  const awaitingReview = jobs?.filter(
    (j) => j.status === 'awaiting_review',
  ).length ?? 0

  return (
    <PageShell
      eyebrow="Dashboard"
      title="Create, review, and publish pet stories."
    >
      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link
          to="/app/pets"
          className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-4 py-2 font-semibold text-[var(--lagoon-deep)] no-underline"
        >
          Manage pets
        </Link>
        <Link
          to="/app/account"
          className="rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2 font-semibold text-[var(--sea-ink)] no-underline"
        >
          Account
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Pets"
          value={pets === undefined ? '…' : String(pets.length)}
          detail="Profiles linked to your account."
        />
        <MetricCard
          label="Jobs in flight"
          value={jobs === undefined ? '…' : String(queued)}
          detail="Queued or processing generations."
        />
        <MetricCard
          label="Awaiting review"
          value={jobs === undefined ? '…' : String(awaitingReview)}
          detail="Drafts ready for you to check."
        />
      </div>
    </PageShell>
  )
}
