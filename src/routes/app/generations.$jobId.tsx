import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '#/components/PageShell'

export const Route = createFileRoute('/app/generations/$jobId')({
  component: GenerationPage,
})

function GenerationPage() {
  const { jobId } = Route.useParams()

  return (
    <PageShell eyebrow="Generation Job" title={`Job ${jobId}`}>
      <div className="panel p-5 text-sm text-[var(--text-muted)]">
        Job detail pages will subscribe to Convex job events, cost rows,
        moderation state, and retry controls.
      </div>
    </PageShell>
  )
}
