import { createFileRoute } from '@tanstack/react-router'
import { MetricCard } from '#/components/MetricCard'
import { PageShell } from '#/components/PageShell'

export const Route = createFileRoute('/app/')({ component: AppDashboard })

function AppDashboard() {
  return (
    <PageShell
      eyebrow="Dashboard"
      title="Create, review, and publish pet stories."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Today" value="0" detail="Generation jobs queued." />
        <MetricCard
          label="Cost"
          value="$0.00"
          detail="Provider spend tracked today."
        />
        <MetricCard
          label="Moderation"
          value="0"
          detail="Posts awaiting approval."
        />
      </div>
    </PageShell>
  )
}
