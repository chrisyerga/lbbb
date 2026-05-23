import type { Doc } from '#convex/_generated/dataModel'

export type JobStatus = Doc<'generationJobs'>['status']

export const STATUS_TAX: Record<
  JobStatus,
  { label: string; dot: string; bg: string; ring: string; live?: boolean }
> = {
  queued: {
    label: 'queued',
    dot: 'rgba(251,241,222,0.42)',
    bg: 'rgba(251,241,222,0.05)',
    ring: '#3a3027',
  },
  processing: {
    label: 'processing',
    dot: '#e0382e',
    bg: 'rgba(224,56,46,0.10)',
    ring: 'rgba(224,56,46,0.45)',
    live: true,
  },
  awaiting_review: {
    label: 'review',
    dot: '#f2a02e',
    bg: 'rgba(242,160,46,0.10)',
    ring: 'rgba(242,160,46,0.4)',
  },
  completed: {
    label: 'completed',
    dot: '#3cb07a',
    bg: 'rgba(60,176,122,0.10)',
    ring: 'rgba(60,176,122,0.35)',
  },
  failed: {
    label: 'failed',
    dot: '#e25d5d',
    bg: 'rgba(226,93,93,0.10)',
    ring: 'rgba(226,93,93,0.45)',
  },
  cancelled: {
    label: 'cancelled',
    dot: 'rgba(251,241,222,0.22)',
    bg: 'rgba(251,241,222,0.04)',
    ring: '#2a231d',
  },
}

export const OP_LABEL: Record<Doc<'generationJobs'>['operation'], string> = {
  blog_post: 'blog post',
  image: 'image',
  regeneration: 'regen',
}

export const EVENT_COLOR: Record<string, string> = {
  queued: 'rgba(251,241,222,0.42)',
  processing: '#5fa8e0',
  completed: '#3cb07a',
  failed: '#e25d5d',
  'job.created': 'rgba(251,241,222,0.42)',
  'job.dequeued': 'rgba(251,241,222,0.42)',
  'job.started': '#5fa8e0',
  'prompt.built': 'rgba(251,241,222,0.66)',
  'moderation.input': '#f2a02e',
  'moderation.passed': '#3cb07a',
  'text.streaming': '#e0382e',
  'text.completed': '#3cb07a',
  'image.queued': 'rgba(251,241,222,0.42)',
  'image.streaming': '#e0382e',
  'image.partial': '#e0382e',
  'image.completed': '#3cb07a',
  'image.failed': '#e25d5d',
  'cost.recorded': 'rgba(251,241,222,0.42)',
  'job.awaiting_review': '#f2a02e',
  'job.completed': '#3cb07a',
  'job.failed': '#e25d5d',
  'retry.scheduled': '#f2a02e',
}

export type QueueFilter = 'all' | 'active' | 'queue' | 'review' | 'failed'

export function matchesFilter(status: JobStatus, filter: QueueFilter) {
  switch (filter) {
    case 'all':
      return true
    case 'active':
      return status === 'processing'
    case 'queue':
      return status === 'queued'
    case 'review':
      return status === 'awaiting_review'
    case 'failed':
      return status === 'failed' || status === 'cancelled'
  }
}

export function relTime(timestamp: number, now = Date.now()) {
  const d = Math.max(0, (now - timestamp) / 1000)
  if (d < 60) return `${d.toFixed(d < 10 ? 1 : 0)}s`
  if (d < 3600) return `${(d / 60).toFixed(d < 600 ? 1 : 0)}m`
  if (d < 86400) return `${(d / 3600).toFixed(1)}h`
  return `${(d / 86400).toFixed(1)}d`
}

export function elapsedMs(job: {
  startedAt?: number
  completedAt?: number
  status: JobStatus
}) {
  if (!job.startedAt) return null
  const end =
    job.completedAt ??
    (job.status === 'processing' ? Date.now() : job.startedAt)
  return end - job.startedAt
}

export function formatElapsed(ms: number | null) {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function formatUsd(amount: number) {
  return `$${amount.toFixed(amount >= 1 ? 2 : 3)}`
}

const TERMINAL_STATUSES: Array<JobStatus> = [
  'completed',
  'failed',
  'cancelled',
]

export type StepId =
  | 'queued'
  | 'started'
  | 'text'
  | 'image'
  | 'review'
  | 'done'

export const STEPS: Array<{ id: StepId; label: string }> = [
  { id: 'queued', label: 'queued' },
  { id: 'started', label: 'started' },
  { id: 'text', label: 'text' },
  { id: 'image', label: 'image' },
  { id: 'review', label: 'review' },
  { id: 'done', label: 'done' },
]

export function deriveStepState(args: {
  status: JobStatus
  operation: Doc<'generationJobs'>['operation']
  hasTextCost: boolean
  imageCostCount: number
  hasDraft: boolean
  eventTypes: Array<string>
}) {
  const done = new Set<StepId>()
  const { status, operation, hasTextCost, imageCostCount, hasDraft, eventTypes } =
    args

  if (eventTypes.includes('queued') || status !== 'queued') done.add('queued')
  if (
    eventTypes.includes('processing') ||
    status === 'processing' ||
    status === 'awaiting_review' ||
    status === 'completed' ||
    status === 'failed'
  ) {
    done.add('started')
  }
  if (
    operation !== 'image' &&
    (hasTextCost || hasDraft || status === 'awaiting_review' || status === 'completed')
  ) {
    done.add('text')
  }
  if (operation === 'image' && (imageCostCount > 0 || status === 'completed')) {
    done.add('text')
  }
  if (imageCostCount > 0 || (hasDraft && imageCostCount >= 0)) {
    if (hasDraft || imageCostCount > 0) done.add('image')
  }
  if (status === 'awaiting_review' || status === 'completed') done.add('review')
  if (TERMINAL_STATUSES.includes(status)) {
    done.add('done')
  }

  let current: StepId = 'queued'
  if (status === 'processing') {
    if (!done.has('text') && operation === 'blog_post') current = 'text'
    else if (!done.has('image')) current = 'image'
    else current = 'started'
  } else if (status === 'awaiting_review') current = 'review'
  else if (status === 'queued') current = 'queued'
  else if (TERMINAL_STATUSES.includes(status)) current = 'done'
  else current = 'started'

  return { done, current }
}

export function isoTime(ts: number) {
  return new Date(ts).toISOString()
}
