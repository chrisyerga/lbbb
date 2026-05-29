'use client'

import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import type { Id } from '#convex/_generated/dataModel'
import { api } from '#convex/_generated/api'
import type { QueueFilter } from '#/lib/adminJobsUi'
import { QueueTopBar } from './QueueTopBar'
import { QueueList } from './QueueList'
import { StatsRail } from './StatsRail'
import { EventStream } from './EventStream'
import { JobHeader, OutputPanel } from './JobDetailPanels'
import { StepRail } from './StepRail'

export function AdminQueuePage({ selectedJobId }: { selectedJobId: Id<'generationJobs'> | null }) {
  const navigate = useNavigate()
  const rows = useQuery(api.adminJobs.queueList, { limit: 100 })
  const stats = useQuery(api.adminJobs.queueStats, {})

  const [filter, setFilter] = useState<QueueFilter>('all')
  const [search, setSearch] = useState('')

  const effectiveJobId = useMemo(() => {
    if (selectedJobId) return selectedJobId
    return rows?.[0]?.jobId ?? null
  }, [selectedJobId, rows])

  const detail = useQuery(api.adminJobs.queueDetail, effectiveJobId ? { jobId: effectiveJobId } : 'skip')

  function onSelect(jobId: Id<'generationJobs'>) {
    void navigate({
      to: '/app/admin/jobs',
      search: { job: jobId },
    })
  }

  return (
    <div className="admin-queue-page">
      <QueueTopBar stats={stats ?? undefined} />
      <div className="admin-queue-layout">
        <QueueList
          rows={rows ?? undefined}
          activeId={effectiveJobId}
          filter={filter}
          search={search}
          onFilterChange={setFilter}
          onSearchChange={setSearch}
          onSelect={onSelect}
        />

        <main className="admin-queue-main">
          {!effectiveJobId ? (
            <p className="admin-empty-state">No jobs in queue.</p>
          ) : detail === undefined ? (
            <p className="admin-empty-state">Loading job…</p>
          ) : detail === null ? (
            <p className="admin-empty-state">Job not found.</p>
          ) : (
            <>
              <JobHeader
                job={detail.job}
                petName={detail.pet?.name ?? 'Unknown'}
                ownerEmail={detail.ownerEmail}
                costTotal={detail.costTotal}
              />
              <StepRail
                job={detail.job}
                hasTextCost={detail.hasTextCost}
                imageCostCount={detail.imageCostCount}
                hasDraft={detail.draft !== null}
                eventTypes={detail.events.map((e) => e.type)}
              />
              <div className="admin-center-grid">
                <EventStream events={detail.events} isLive={detail.job.status === 'processing'} />
                <OutputPanel
                  draft={detail.draft}
                  imageCount={detail.draft?.imageUrls.length ?? 0}
                  isProcessing={detail.job.status === 'processing'}
                />
              </div>
            </>
          )}
        </main>

        <StatsRail stats={stats ?? undefined} />
      </div>
    </div>
  )
}
