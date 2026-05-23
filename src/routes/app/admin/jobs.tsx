'use client'

import { createFileRoute } from '@tanstack/react-router'
import type { Id } from '#convex/_generated/dataModel'
import { AdminQueuePage } from '#/components/admin/jobs/AdminQueuePage'

type JobsSearch = {
  job?: string
}

export const Route = createFileRoute('/app/admin/jobs')({
  validateSearch: (search: Record<string, unknown>): JobsSearch => ({
    job: typeof search.job === 'string' ? search.job : undefined,
  }),
  component: AdminJobsRoute,
})

function AdminJobsRoute() {
  const { job } = Route.useSearch()
  const selectedJobId = (job as Id<'generationJobs'> | undefined) ?? null
  return <AdminQueuePage selectedJobId={selectedJobId} />
}
