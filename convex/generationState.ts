import { internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'

export const getJobInternal = internalQuery({
  args: { jobId: v.id('generationJobs') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId)
  },
})

export const getDraftByJobInternal = internalQuery({
  args: { jobId: v.id('generationJobs') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('generatedPosts')
      .withIndex('by_job', (q) => q.eq('jobId', args.jobId))
      .first()
  },
})

export const getJobForStreamInternal = internalQuery({
  args: { streamId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('generationJobs')
      .withIndex('by_streamId', (q) => q.eq('streamId', args.streamId))
      .first()
  },
})

export const patchStreamStatus = internalMutation({
  args: {
    jobId: v.id('generationJobs'),
    streamStatus: v.union(
      v.literal('idle'),
      v.literal('streaming_text'),
      v.literal('text_done'),
      v.literal('generating_images'),
      v.literal('done'),
      v.literal('failed'),
    ),
    streamBody: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job) throw new Error('Job not found')
    const now = Date.now()
    await ctx.db.patch(args.jobId, {
      streamStatus: args.streamStatus,
      streamBody: args.streamBody ?? job.streamBody,
      updatedAt: now,
    })
  },
})

export const emitGenerationEvent = internalMutation({
  args: {
    jobId: v.id('generationJobs'),
    type: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job) throw new Error('Job not found')
    await ctx.db.insert('generationEvents', {
      jobId: args.jobId,
      ownerUserId: job.ownerUserId,
      type: args.type,
      message: args.message,
      metadata: args.metadata,
      createdAt: Date.now(),
    })
  },
})

export const upsertDraftFromText = internalMutation({
  args: {
    jobId: v.id('generationJobs'),
    title: v.string(),
    excerpt: v.string(),
    bodyMarkdown: v.string(),
    outputSnapshot: v.any(),
    textCost: v.object({
      model: v.string(),
      inputTokens: v.optional(v.number()),
      outputTokens: v.optional(v.number()),
      estimatedCostUsd: v.number(),
      providerRequestId: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job) throw new Error('Job not found')
    const now = Date.now()

    const existing = await ctx.db
      .query('generatedPosts')
      .withIndex('by_job', (q) => q.eq('jobId', args.jobId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        excerpt: args.excerpt,
        bodyMarkdown: args.bodyMarkdown,
        outputSnapshot: args.outputSnapshot,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('generatedPosts', {
        ownerUserId: job.ownerUserId,
        petId: job.petId,
        memoryId: job.memoryId,
        jobId: args.jobId,
        slug: 'draft-slug-pending-title-review',
        title: args.title,
        excerpt: args.excerpt,
        bodyMarkdown: args.bodyMarkdown,
        status: 'awaiting_moderation',
        moderationStatus: 'pending',
        promptVersionId: job.promptVersionId,
        narratorId: job.narratorId,
        inputSnapshot: job.inputSnapshot,
        outputSnapshot: args.outputSnapshot,
        imageAssetIds: [],
        createdAt: now,
        updatedAt: now,
      })
    }

    const costs = await ctx.db
      .query('generationCosts')
      .withIndex('by_job', (q) => q.eq('jobId', args.jobId))
      .collect()
    if (!costs.some((c) => c.operation === 'blog_text')) {
      await ctx.db.insert('generationCosts', {
        jobId: args.jobId,
        ownerUserId: job.ownerUserId,
        petId: job.petId,
        provider: job.provider ?? 'openai',
        model: args.textCost.model,
        operation: 'blog_text',
        inputTokens: args.textCost.inputTokens,
        outputTokens: args.textCost.outputTokens,
        estimatedCostUsd: args.textCost.estimatedCostUsd,
        providerRequestId: args.textCost.providerRequestId,
        createdAt: now,
      })
    }

    await ctx.db.insert('generationEvents', {
      jobId: args.jobId,
      ownerUserId: job.ownerUserId,
      type: 'text.completed',
      message: 'Blog text ready.',
      createdAt: now,
    })
  },
})

export const appendDraftImage = internalMutation({
  args: {
    jobId: v.id('generationJobs'),
    assetId: v.id('assets'),
    index: v.number(),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    const draft = await ctx.db
      .query('generatedPosts')
      .withIndex('by_job', (q) => q.eq('jobId', args.jobId))
      .first()
    if (!draft) throw new Error('Draft not found')

    const now = Date.now()
    await ctx.db.patch(draft._id, {
      imageAssetIds: [...draft.imageAssetIds, args.assetId],
      updatedAt: now,
    })

    const job = await ctx.db.get(args.jobId)
    if (!job) throw new Error('Job not found')

    await ctx.db.insert('generationEvents', {
      jobId: args.jobId,
      ownerUserId: job.ownerUserId,
      type: 'image.completed',
      message: `Image ${args.index + 1} of ${args.total} ready.`,
      metadata: { index: args.index, total: args.total },
      createdAt: now,
    })
  },
})

export const finalizeGenerationJob = internalMutation({
  args: {
    jobId: v.id('generationJobs'),
    imagePrompts: v.array(v.string()),
    baseImagePrompt: v.string(),
    imageCosts: v.array(
      v.object({
        model: v.string(),
        estimatedCostUsd: v.number(),
        providerRequestId: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job) throw new Error('Job not found')
    const draft = await ctx.db
      .query('generatedPosts')
      .withIndex('by_job', (q) => q.eq('jobId', args.jobId))
      .first()
    if (!draft) throw new Error('Draft not found')

    const now = Date.now()
    const outputSnapshot = {
      ...(typeof draft.outputSnapshot === 'object' && draft.outputSnapshot !== null
        ? draft.outputSnapshot
        : {}),
      imagePrompt: args.baseImagePrompt,
      imagePrompts: args.imagePrompts,
    }

    await ctx.db.patch(draft._id, {
      outputSnapshot,
      updatedAt: now,
    })

    for (const imageCost of args.imageCosts) {
      await ctx.db.insert('generationCosts', {
        jobId: args.jobId,
        ownerUserId: job.ownerUserId,
        petId: job.petId,
        provider: job.provider ?? 'openai',
        model: imageCost.model,
        operation: 'image_generation',
        imageCount: 1,
        estimatedCostUsd: imageCost.estimatedCostUsd,
        providerRequestId: imageCost.providerRequestId,
        createdAt: now,
      })
    }

    await ctx.db.patch(args.jobId, {
      status: 'awaiting_review',
      streamStatus: 'done',
      completedAt: now,
      updatedAt: now,
    })

    await ctx.db.insert('generationEvents', {
      jobId: args.jobId,
      ownerUserId: job.ownerUserId,
      type: 'job.awaiting_review',
      message: 'Draft post and sample art generated.',
      createdAt: now,
    })

    await ctx.db.insert('generationEvents', {
      jobId: args.jobId,
      ownerUserId: job.ownerUserId,
      type: 'completed',
      message: 'Draft post and sample art generated.',
      createdAt: now,
    })
  },
})

export const markProcessing = internalMutation({
  args: { jobId: v.id('generationJobs') },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job) throw new Error('Job not found')
    const now = Date.now()
    await ctx.db.patch(args.jobId, {
      status: 'processing',
      startedAt: now,
      updatedAt: now,
      attempt: job.attempt + 1,
    })
    await ctx.db.insert('generationEvents', {
      jobId: args.jobId,
      ownerUserId: job.ownerUserId,
      type: 'processing',
      message: 'Generation started.',
      createdAt: now,
    })
  },
})

export const markFailed = internalMutation({
  args: { jobId: v.id('generationJobs'), error: v.string() },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job) throw new Error('Job not found')
    const now = Date.now()
    await ctx.db.patch(args.jobId, {
      status: 'failed',
      streamStatus: 'failed',
      error: args.error,
      completedAt: now,
      updatedAt: now,
    })
    await ctx.db.insert('generationEvents', {
      jobId: args.jobId,
      ownerUserId: job.ownerUserId,
      type: 'failed',
      message: args.error,
      createdAt: now,
    })
  },
})

export const storeGeneratedImage = internalMutation({
  args: {
    jobId: v.id('generationJobs'),
    petId: v.id('pets'),
    ownerUserId: v.id('users'),
    storageId: v.id('_storage'),
    byteSize: v.number(),
    contentType: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert('assets', {
      ownerUserId: args.ownerUserId,
      petId: args.petId,
      kind: 'generated_image',
      storageProvider: 'convex',
      storageId: args.storageId,
      contentType: args.contentType,
      byteSize: args.byteSize,
      visibility: 'private',
      moderationStatus: 'pending',
      createdAt: now,
    })
  },
})
