import {
  action,
  internalMutation,
  internalQuery,
} from './_generated/server'
import type { ActionCtx } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'
import {
  buildImagePromptsFromPlan,
  buildTextPromptFromPlan,
} from './lib/generationPlan'
import type { MemoryJobInputSnapshot } from './lib/narratorTypes'
import { callOpenAIImage } from './lib/openaiImage'

type TextGenerationResult = {
  title: string
  excerpt: string
  bodyMarkdown: string
  tags: Array<string>
  imagePrompt?: string
  usage?: {
    inputTokens?: number
    outputTokens?: number
  }
  providerRequestId?: string
}

function normalizeTextResult(raw: Record<string, unknown>): TextGenerationResult {
  const imagePrompt =
    typeof raw.imagePrompt === 'string'
      ? raw.imagePrompt
      : typeof raw.image_prompt === 'string'
        ? raw.image_prompt
        : undefined

  return {
    title: String(raw.title ?? ''),
    excerpt: String(raw.excerpt ?? ''),
    bodyMarkdown: String(raw.bodyMarkdown ?? raw.body_markdown ?? ''),
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((t): t is string => typeof t === 'string')
      : [],
    imagePrompt,
  }
}

function isMemoryJobInput(
  input: unknown,
): input is MemoryJobInputSnapshot {
  return (
    typeof input === 'object' &&
    input !== null &&
    'generationPlan' in input &&
    typeof (input as MemoryJobInputSnapshot).generationPlan === 'object'
  )
}

async function callOpenAIText(prompt: string): Promise<TextGenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const model = process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.4-mini'
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: prompt
//      text: { format: { type: 'json_object' } },
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(
      `OpenAI text generation failed: ${response.status} ${detail.slice(0, 200)}`,
    )
  }

  const json = await response.json()
  const outputText = json.output_text ?? '{}'
  const parsed = normalizeTextResult(JSON.parse(outputText) as Record<string, unknown>)

  return {
    ...parsed,
    usage: {
      inputTokens: json.usage?.input_tokens,
      outputTokens: json.usage?.output_tokens,
    },
    providerRequestId: response.headers.get('x-request-id') ?? undefined,
  }
}

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

export const completeWithDraft = internalMutation({
  args: {
    jobId: v.id('generationJobs'),
    title: v.string(),
    excerpt: v.string(),
    bodyMarkdown: v.string(),
    outputSnapshot: v.any(),
    imageAssetIds: v.array(v.id('assets')),
    cost: v.object({
      model: v.string(),
      inputTokens: v.optional(v.number()),
      outputTokens: v.optional(v.number()),
      estimatedCostUsd: v.number(),
      providerRequestId: v.optional(v.string()),
    }),
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
    const now = Date.now()

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
      imageAssetIds: args.imageAssetIds,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert('generationCosts', {
      jobId: args.jobId,
      ownerUserId: job.ownerUserId,
      petId: job.petId,
      provider: job.provider ?? 'openai',
      model: args.cost.model,
      operation: 'blog_text',
      inputTokens: args.cost.inputTokens,
      outputTokens: args.cost.outputTokens,
      estimatedCostUsd: args.cost.estimatedCostUsd,
      providerRequestId: args.cost.providerRequestId,
      createdAt: now,
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
      completedAt: now,
      updatedAt: now,
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

export const atest_openai_text = action({
  args: { prompt: v.string() },
  handler: async (_ctx, args) => {
    const result = await callOpenAIText(args.prompt)
    return result
  },
})

export const processJob = action({
  args: { jobId: v.id('generationJobs'), prompt: v.string() },
  handler: async (_ctx, args) => {
    const result = await callOpenAIText(args.prompt)

    return {
      jobId: args.jobId,
      result,
      estimatedCostUsd: estimateTextCostUsd(
        result.usage?.inputTokens,
        result.usage?.outputTokens,
      ),
    }
  },
})

async function finishGeneration(
  ctx: ActionCtx,
  args: {
    jobId: Id<'generationJobs'>
    job: Doc<'generationJobs'>
    textModel: string
    imageModel: string
    textResult: TextGenerationResult
    imagePrompts: Array<string>
    baseImagePrompt: string
  },
) {
  const imageAssetIds: Array<Id<'assets'>> = []
  const imageCosts: Array<{
    model: string
    estimatedCostUsd: number
    providerRequestId?: string
  }> = []

  for (const imagePrompt of args.imagePrompts) {
    const { blob, providerRequestId } = await callOpenAIImage(imagePrompt)
    const storageId = await ctx.storage.store(blob)
    const assetId = await ctx.runMutation(
      internal.generation.storeGeneratedImage,
      {
        jobId: args.jobId,
        petId: args.job.petId,
        ownerUserId: args.job.ownerUserId,
        storageId,
        byteSize: blob.size,
        contentType: blob.type || 'image/png',
      },
    )
    imageAssetIds.push(assetId)
    imageCosts.push({
      model: args.imageModel,
      estimatedCostUsd: estimateImageCostUsd(),
      providerRequestId,
    })
  }

  await ctx.runMutation(internal.generation.completeWithDraft, {
    jobId: args.jobId,
    title: args.textResult.title,
    excerpt: args.textResult.excerpt,
    bodyMarkdown: args.textResult.bodyMarkdown,
    outputSnapshot: {
      tags: args.textResult.tags,
      imagePrompt: args.baseImagePrompt,
      imagePromptFromModel: args.textResult.imagePrompt,
      imagePrompts: args.imagePrompts,
    },
    imageAssetIds,
    cost: {
      model: args.textModel,
      inputTokens: args.textResult.usage?.inputTokens,
      outputTokens: args.textResult.usage?.outputTokens,
      estimatedCostUsd: estimateTextCostUsd(
        args.textResult.usage?.inputTokens,
        args.textResult.usage?.outputTokens,
      ),
      providerRequestId: args.textResult.providerRequestId,
    },
    imageCosts,
  })
}

/** Legacy batch path; memory compose uses HTTP stream + runMemoryGenerationImages. */
export const runMemoryGeneration = action({
  args: { jobId: v.id('generationJobs') },
  handler: async (
    ctx,
    args,
  ): Promise<{
    jobId: Id<'generationJobs'>
    status: Doc<'generationJobs'>['status']
  }> => {
    const job = await ctx.runQuery(internal.generation.getJobInternal, {
      jobId: args.jobId,
    })
    if (!job) throw new Error('Job not found')
    if (job.streamId) {
      return { jobId: args.jobId, status: job.status as Doc<'generationJobs'>['status'] }
    }
    if (!job.inputSnapshot) throw new Error('Job is missing input snapshot')

    const rawInput = job.inputSnapshot

    let textModel = process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.4-mini'
    let imageModel = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2'
    let prompt: string
    let imagePrompts: Array<string>

    try {
      await ctx.runMutation(internal.generation.markProcessing, {
        jobId: args.jobId,
      })

      if (!isMemoryJobInput(rawInput)) {
        throw new Error('Job input snapshot is missing generation plan')
      }

      const input = rawInput
      const plan = input.generationPlan
      textModel = plan.text.model
      imageModel = plan.image.model
      prompt = buildTextPromptFromPlan(plan)

      const textResult = await callOpenAIText(prompt)
      imagePrompts = buildImagePromptsFromPlan({
        plan,
        textResult,
        petName: input.petName,
        memoryDescription: input.description,
        castSnapshot: input.castSnapshot ?? [],
      })

      await finishGeneration(ctx, {
        jobId: args.jobId,
        job,
        textModel,
        imageModel,
        textResult,
        imagePrompts,
        baseImagePrompt: textResult.imagePrompt ?? input.description,
      })
      return { jobId: args.jobId, status: 'awaiting_review' as const }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Generation failed'
      await ctx.runMutation(internal.generation.markFailed, {
        jobId: args.jobId,
        error: message,
      })
      throw error
    }
  },
})

function estimateTextCostUsd(inputTokens = 0, outputTokens = 0) {
  return Number(
    ((inputTokens / 1_000_000) * 0.25 + (outputTokens / 1_000_000) * 2).toFixed(
      6,
    ),
  )
}

function estimateImageCostUsd() {
  return Number(process.env.OPENAI_IMAGE_COST_USD ?? '0.04')
}
