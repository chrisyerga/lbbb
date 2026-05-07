import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '#/components/PageShell'

export const Route = createFileRoute('/app/admin/jobs')({
  component: AdminJobsPage,
})

function AdminJobsPage() {
  return (
    <PageShell
      eyebrow="Admin"
      title="Recent generation jobs and failures."
      children={
        <p>
          Backed by <code>generationJobs</code> and{' '}
          <code>generationEvents</code>.
        </p>
      }
    />
  )
}
