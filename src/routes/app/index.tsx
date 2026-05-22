'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { MetricCard } from '#/components/MetricCard'
import { PageShell } from '#/components/PageShell'
import { buttonClassName } from '#/components/ui/Button'
import { api } from '#convex/_generated/api'

export const Route = createFileRoute('/app/')({ component: AppDashboard })

function AppDashboard() {
  const jobs = useQuery(api.jobs.recentMine, { limit: 50 })
  const pets = useQuery(api.pets.listMine)

  const queued =
    jobs?.filter((j) => j.status === 'queued' || j.status === 'processing')
      .length ?? 0
  const awaitingReview =
    jobs?.filter((j) => j.status === 'awaiting_review').length ?? 0

  return (
    <PageShell
      eyebrow="Dashboard"
      title="Create, review, and publish pet stories."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Link to="/app/pets" className={buttonClassName('primary')}>
          Manage pets
        </Link>
        <Link to="/app/account" className={buttonClassName('secondary')}>
          Account
        </Link>
      </div>
      <div className="metric-grid sm:grid-cols-3">
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
