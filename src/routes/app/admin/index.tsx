import { createFileRoute } from '@tanstack/react-router'
import { MetricCard } from '#/components/MetricCard'
import { PageShell } from '#/components/PageShell'

export const Route = createFileRoute('/app/admin/')({ component: AdminPage })

function AdminPage() {
  return (
    <PageShell
      eyebrow="Admin"
      title="Operate jobs, costs, moderation, and assets."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Jobs"
          value="/jobs"
          detail="Inspect, retry, cancel."
        />
        <MetricCard
          label="Costs"
          value="/costs"
          detail="Provider spend drilldowns."
        />
        <MetricCard
          label="Posts"
          value="/posts"
          detail="Approve or unpublish."
        />
        <MetricCard
          label="Assets"
          value="/assets"
          detail="Audit storage and visibility."
        />
      </div>
    </PageShell>
  )
}
