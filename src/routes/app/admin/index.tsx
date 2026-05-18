import { createFileRoute, Link } from '@tanstack/react-router'
import { MetricCard } from '#/components/MetricCard'
import { PageShell } from '#/components/PageShell'

export const Route = createFileRoute('/app/admin/')({ component: AdminPage })

function AdminPage() {
  return (
    <PageShell
      eyebrow="Admin"
      title="Operate jobs, costs, moderation, and assets."
    >
      <div className="metric-grid sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/app/admin/jobs" className="no-underline">
          <MetricCard
            label="Jobs"
            value="View"
            detail="Inspect, retry, cancel."
          />
        </Link>
        <Link to="/app/admin/costs" className="no-underline">
          <MetricCard
            label="Costs"
            value="View"
            detail="Provider spend drilldowns."
          />
        </Link>
        <MetricCard
          label="Posts"
          value="Soon"
          detail="Approve or unpublish."
        />
        <MetricCard
          label="Assets"
          value="Soon"
          detail="Audit storage and visibility."
        />
      </div>
    </PageShell>
  )
}
