import { query } from './_generated/server'
import { v } from 'convex/values'
import type { GenericQueryCtx } from 'convex/server'
import type { DataModel, Doc, Id } from './_generated/dataModel'
import { resolveAssetUrl } from './lib/assets'
import { requireStaff } from './lib/requireAccount'
import { startOfUtcDay } from './lib/userAccount'

type JobStatus = Doc<'generationJobs'>['status']

function deriveProgress(job: Doc<'generationJobs'>) {
  if (job.status === 'queued') return 0
  if (job.status === 'processing') {
    if (job.startedAt) {
      const elapsed = Date.now() - job.startedAt
      return Math.min(0.85, 0.2 + elapsed / 120_000)
    }
    return 0.35
  }
  return 1
}

type QueryCtx = GenericQueryCtx<DataModel>

async function resolvePetAvatarUrl(ctx: QueryCtx, pet: Doc<'pets'>) {
  if (!pet.avatarAssetId) return null
  const asset = await ctx.db.get(pet.avatarAssetId)
  if (!asset) return null
  return await resolveAssetUrl(ctx, asset)
}

async function costForJob(ctx: QueryCtx, jobId: Id<'generationJobs'>) {
  const costs = await ctx.db
    .query('generationCosts')
    .withIndex('by_job', (q) => q.eq('jobId', jobId))
    .collect()
  return costs.reduce((sum, c) => sum + c.estimatedCostUsd, 0)
}

async function eventCountForJob(ctx: QueryCtx, jobId: Id<'generationJobs'>) {
  const events = await ctx.db
    .query('generationEvents')
    .withIndex('by_job', (q) => q.eq('jobId', jobId))
    .collect()
  return events.length
}

export const queueList = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireStaff(ctx)

    const jobs = await ctx.db
      .query('generationJobs')
      .withIndex('by_created')
      .order('desc')
      .take(args.limit ?? 100)

    return Promise.all(
      jobs.map(async (job) => {
        const [pet, owner, costSoFar, eventCount] = await Promise.all([
          ctx.db.get(job.petId),
          ctx.db.get(job.ownerUserId),
          costForJob(ctx, job._id),
          eventCountForJob(ctx, job._id),
        ])

        const avatarUrl = pet ? await resolvePetAvatarUrl(ctx, pet) : null

        return {
          jobId: job._id,
          petId: job.petId,
          petName: pet?.name ?? 'Unknown pet',
          ownerEmail: owner?.email ?? 'unknown',
          avatarUrl,
          operation: job.operation,
          status: job.status,
          provider: job.provider ?? 'openai',
          textModel: job.textModel,
          imageModel: job.imageModel,
          attempt: job.attempt,
          error: job.error,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          costSoFar,
          eventCount,
          progress: deriveProgress(job),
        }
      }),
    )
  },
})

export const queueDetail = query({
  args: { jobId: v.id('generationJobs') },
  handler: async (ctx, args) => {
    await requireStaff(ctx)

    const job = await ctx.db.get(args.jobId)
    if (!job) return null

    const [pet, owner, events, costs] = await Promise.all([
      ctx.db.get(job.petId),
      ctx.db.get(job.ownerUserId),
      ctx.db
        .query('generationEvents')
        .withIndex('by_job', (q) => q.eq('jobId', args.jobId))
        .collect(),
      ctx.db
        .query('generationCosts')
        .withIndex('by_job', (q) => q.eq('jobId', args.jobId))
        .collect(),
    ])

    events.sort((a, b) => a.createdAt - b.createdAt)

    const posts = await ctx.db
      .query('generatedPosts')
      .withIndex('by_pet', (q) => q.eq('petId', job.petId))
      .collect()
    const draft = posts.find((p) => p.jobId === args.jobId) ?? null

    const imageUrls = draft
      ? await Promise.all(
          draft.imageAssetIds.map(async (assetId) => {
            const asset = await ctx.db.get(assetId)
            if (!asset) return null
            return await resolveAssetUrl(ctx, asset)
          }),
        )
      : []

    const avatarUrl = pet ? await resolvePetAvatarUrl(ctx, pet) : null
    const costTotal = costs.reduce((sum, c) => sum + c.estimatedCostUsd, 0)
    const hasTextCost = costs.some((c) => c.operation === 'blog_text')
    const imageCostCount = costs.filter(
      (c) => c.operation === 'image_generation',
    ).length

    return {
      job,
      pet: pet
        ? { petId: pet._id, name: pet.name, avatarUrl }
        : null,
      ownerEmail: owner?.email ?? 'unknown',
      events,
      costs,
      costTotal,
      hasTextCost,
      imageCostCount,
      draft: draft
        ? {
            postId: draft._id,
            title: draft.title,
            excerpt: draft.excerpt,
            bodyMarkdown: draft.bodyMarkdown,
            imageAssetIds: draft.imageAssetIds,
            imageUrls,
            outputSnapshot: draft.outputSnapshot,
          }
        : null,
      progress: deriveProgress(job),
    }
  },
})

export const queueStats = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx)

    const dayStart = startOfUtcDay()
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000

    const [recentJobs, todayCosts, jobsLast24h] = await Promise.all([
      ctx.db
        .query('generationJobs')
        .withIndex('by_created')
        .order('desc')
        .take(500),
      ctx.db
        .query('generationCosts')
        .withIndex('by_created')
        .order('desc')
        .take(500),
      ctx.db
        .query('generationJobs')
        .withIndex('by_created')
        .order('desc')
        .take(200),
    ])

    const costsToday = todayCosts.filter((c) => c.createdAt >= dayStart)

    const statusCounts: Record<JobStatus, number> = {
      queued: 0,
      processing: 0,
      awaiting_review: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    }
    for (const job of recentJobs) {
      statusCounts[job.status] += 1
    }

    const costTodayTotal = costsToday.reduce(
      (sum, c) => sum + c.estimatedCostUsd,
      0,
    )

    const costByModel = new Map<string, number>()
    for (const cost of costsToday) {
      costByModel.set(
        cost.model,
        (costByModel.get(cost.model) ?? 0) + cost.estimatedCostUsd,
      )
    }
    const costByModelRows = [...costByModel.entries()]
      .map(([model, amount]) => ({ model, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)

    const jobsInLast24h = jobsLast24h.filter((j) => j.createdAt >= dayAgo)
    const hourlyBuckets = Array.from({ length: 24 }, (_, i) => {
      const bucketStart = dayAgo + i * 60 * 60 * 1000
      const bucketEnd = bucketStart + 60 * 60 * 1000
      return jobsInLast24h.filter(
        (j) => j.createdAt >= bucketStart && j.createdAt < bucketEnd,
      ).length
    })

    const terminalLast24h = jobsInLast24h.filter(
      (j) =>
        j.status === 'completed' ||
        j.status === 'failed' ||
        j.status === 'cancelled',
    )
    const completedLast24h = jobsInLast24h.filter(
      (j) => j.status === 'completed',
    ).length
    const successRate =
      terminalLast24h.length > 0
        ? Math.round((completedLast24h / terminalLast24h.length) * 100)
        : 100

    const failedRecent = recentJobs
      .filter((j) => j.status === 'failed' && j.error)
      .slice(0, 50)
    const incidentMap = new Map<string, { count: number; lastAt: number }>()
    for (const job of failedRecent) {
      const key = job.error ?? 'unknown'
      const cur = incidentMap.get(key) ?? { count: 0, lastAt: 0 }
      incidentMap.set(key, {
        count: cur.count + 1,
        lastAt: Math.max(cur.lastAt, job.completedAt ?? job.updatedAt),
      })
    }
    const incidents = [...incidentMap.entries()]
      .map(([error, data]) => ({ error, ...data }))
      .sort((a, b) => b.lastAt - a.lastAt)
      .slice(0, 5)

    const jobsPerHour =
      jobsInLast24h.length > 0
        ? Math.round(jobsInLast24h.length / 24)
        : 0

    return {
      activeCount: statusCounts.processing,
      queuedCount: statusCounts.queued,
      reviewCount: statusCounts.awaiting_review,
      failedCount: statusCounts.failed,
      completedCount: statusCounts.completed,
      costTodayTotal,
      successRate,
      jobsPerHour,
      hourlyBuckets,
      costByModel: costByModelRows,
      incidents,
    }
  },
})
