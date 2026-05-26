import {
  httpAction,
  internalAction,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import { v } from 'convex/values'
import { components, internal } from './_generated/api'
import {
  PersistentTextStreaming
} from '@convex-dev/persistent-text-streaming'
import type { StreamId } from '@convex-dev/persistent-text-streaming'
import { getAuthUserId } from '@convex-dev/auth/server'
import {
  buildImagePromptsFromPlan,
  buildMetadataPromptFromPlan,
  buildStreamMessagesFromPlan,
} from './lib/generationPlan'
import type { MemoryJobInputSnapshot } from './lib/narratorTypes'
import { callOpenAIImage } from './lib/openaiImage'

const persistentTextStreaming = new PersistentTextStreaming(
  components.persistentTextStreaming,
)

function corsHeaders(origin: string | null) {
  const allowed =
    process.env.SITE_URL ??
    process.env.VITE_SITE_URL ??
    'http://localhost:3000'
  const allowOrigin =
    origin && (origin === allowed || allowed === '*') ? origin : allowed
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  }
}

function isMemoryJobInput(input: unknown): input is MemoryJobInputSnapshot {
  return (
    typeof input === 'object' &&
    input !== null &&
    'generationPlan' in input &&
    typeof (input as MemoryJobInputSnapshot).generationPlan === 'object'
  )
}

async function streamOpenAIMarkdown(
  args: {
    systemPrompt: string
    userPrompt: string
    model: string
  },
  onChunk: (text: string) => Promise<void>,
): Promise<{ providerRequestId?: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: args.model,
      stream: true,
      messages: [
        { role: 'system', content: args.systemPrompt },
        { role: 'user', content: args.userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(
      `OpenAI stream failed: ${response.status} ${detail.slice(0, 200)}`,
    )
  }

  if (!response.body) throw new Error('OpenAI stream returned no body')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) await onChunk(delta)
      } catch {
        // ignore malformed SSE lines
      }
    }
  }

  return {
    providerRequestId: response.headers.get('x-request-id') ?? undefined,
  }
}

async function callOpenAIMetadata(prompt: string): Promise<{
  title: string
  excerpt: string
  tags: Array<string>
  imagePrompt?: string
  usage?: { inputTokens?: number; outputTokens?: number }
  providerRequestId?: string
}> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const model = process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.4-mini'
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(
      `OpenAI metadata failed: ${response.status} ${detail.slice(0, 200)}`,
    )
  }

  const json = await response.json()
  const content = json.choices?.[0]?.message?.content ?? '{}'
  const raw = JSON.parse(content) as Record<string, unknown>
  const imagePrompt =
    typeof raw.imagePrompt === 'string'
      ? raw.imagePrompt
      : typeof raw.image_prompt === 'string'
        ? raw.image_prompt
        : undefined

  return {
    title: String(raw.title ?? ''),
    excerpt: String(raw.excerpt ?? ''),
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter((t): t is string => typeof t === 'string')
      : [],
    imagePrompt,
    usage: {
      inputTokens: json.usage?.prompt_tokens,
      outputTokens: json.usage?.completion_tokens,
    },
    providerRequestId: response.headers.get('x-request-id') ?? undefined,
  }
}

export const getStreamBody = query({
  args: { streamId: v.string() },
  handler: async (ctx, args) => {
    return await persistentTextStreaming.getStreamBody(
      ctx,
      args.streamId as StreamId,
    )
  },
})

export const attachStreamToJob = mutation({
  args: { jobId: v.id('generationJobs') },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Authentication required')

    const job = await ctx.db.get(args.jobId)
    if (!job || job.ownerUserId !== userId) {
      throw new Error('Job not found')
    }

    const streamId = await persistentTextStreaming.createStream(ctx)
    const now = Date.now()
    await ctx.db.patch(args.jobId, {
      streamId,
      streamStatus: 'idle',
      updatedAt: now,
    })

    return { jobId: args.jobId, streamId }
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

export const streamMemoryGeneration = httpAction(async (ctx, request) => {
  const origin = request.headers.get('Origin')

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: new Headers(corsHeaders(origin)),
    })
  }

  const body = (await request.json()) as { streamId: string }

  const userId = await getAuthUserId(ctx)
  if (!userId) {
    return new Response('Unauthorized', {
      status: 401,
      headers: corsHeaders(origin),
    })
  }

  const job = await ctx.runQuery(
    internal.memoryGenerationStream.getJobForStreamInternal,
    { streamId: body.streamId },
  )
  if (!job || job.ownerUserId !== userId) {
    return new Response('Forbidden', {
      status: 403,
      headers: corsHeaders(origin),
    })
  }

  if (
    job.streamStatus === 'streaming_text' ||
    job.streamStatus === 'text_done' ||
    job.streamStatus === 'generating_images' ||
    job.streamStatus === 'done'
  ) {
    return new Response(null, {
      status: 205,
      headers: corsHeaders(origin),
    })
  }

  const response = await persistentTextStreaming.stream(
    ctx,
    request,
    body.streamId as StreamId,
    async (_ctx, _request, _streamId, chunkAppender) => {
      try {
        const jobId = job._id

        await ctx.runMutation(internal.generation.markProcessing, { jobId })
        await ctx.runMutation(internal.generation.patchStreamStatus, {
          jobId,
          streamStatus: 'streaming_text',
        })

        if (!isMemoryJobInput(job.inputSnapshot)) {
          throw new Error('Job input snapshot is missing generation plan')
        }

        const input = job.inputSnapshot
        const plan = input.generationPlan
        const streamMessages = buildStreamMessagesFromPlan(plan)

        let fullBody = ''
        await streamOpenAIMarkdown(streamMessages, async (chunk) => {
          fullBody += chunk
          await chunkAppender(chunk)
        })

        const metadataPrompt = buildMetadataPromptFromPlan(plan, {
          ...input.promptVars,
          bodyMarkdown: fullBody.trim(),
        })

        const metadata = await callOpenAIMetadata(metadataPrompt)

        await ctx.runMutation(internal.generation.upsertDraftFromText, {
          jobId,
          title: metadata.title,
          excerpt: metadata.excerpt,
          bodyMarkdown: fullBody.trim(),
          outputSnapshot: {
            tags: metadata.tags,
            imagePrompt: metadata.imagePrompt,
          },
          textCost: {
            model: plan.text.model,
            inputTokens: metadata.usage?.inputTokens,
            outputTokens: metadata.usage?.outputTokens,
            estimatedCostUsd: estimateTextCostUsd(
              metadata.usage?.inputTokens,
              metadata.usage?.outputTokens,
            ),
            providerRequestId: metadata.providerRequestId,
          },
        })

        await ctx.runMutation(internal.generation.patchStreamStatus, {
          jobId,
          streamStatus: 'text_done',
          streamBody: fullBody.trim(),
        })

        await ctx.scheduler.runAfter(
          0,
          internal.memoryGenerationStream.runMemoryGenerationImages,
          { jobId },
        )
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Generation failed'
        await ctx.runMutation(internal.generation.markFailed, {
          jobId: job._id,
          error: message,
        })
        await ctx.runMutation(internal.generation.patchStreamStatus, {
          jobId: job._id,
          streamStatus: 'failed',
        })
        throw error
      }
    },
  )

  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    response.headers.set(key, value)
  }
  return response
})

function estimateTextCostUsd(inputTokens = 0, outputTokens = 0) {
  return Number(
    ((inputTokens / 1_000_000) * 0.25 + (outputTokens / 1_000_000) * 2).toFixed(
      6,
    ),
  )
}

export const runMemoryGenerationImages = internalAction({
  args: { jobId: v.id('generationJobs') },
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(internal.generation.getJobInternal, {
      jobId: args.jobId,
    })
    if (!job?.inputSnapshot || !isMemoryJobInput(job.inputSnapshot)) {
      throw new Error('Job not found or missing plan')
    }

    if (job.streamStatus === 'generating_images' || job.streamStatus === 'done') {
      return
    }

    const input = job.inputSnapshot
    const plan = input.generationPlan

    const draft = await ctx.runQuery(internal.generation.getDraftByJobInternal, {
      jobId: args.jobId,
    })
    if (!draft) throw new Error('Draft not found after text generation')

    const textResult = {
      title: draft.title,
      excerpt: draft.excerpt ?? '',
      bodyMarkdown: draft.bodyMarkdown,
      tags: (draft.outputSnapshot as { tags?: Array<string> }).tags ?? [],
      imagePrompt:
        (draft.outputSnapshot as { imagePrompt?: string }).imagePrompt ??
        input.description,
    }

    await ctx.runMutation(internal.generation.patchStreamStatus, {
      jobId: args.jobId,
      streamStatus: 'generating_images',
    })

    const imagePrompts = buildImagePromptsFromPlan({
      plan,
      textResult,
      petName: input.petName,
      memoryDescription: input.description,
      castSnapshot: input.castSnapshot ?? [],
    })

    const imageModel = plan.image.model
    const imageCosts: Array<{
      model: string
      estimatedCostUsd: number
      providerRequestId?: string
    }> = []

    for (let i = 0; i < imagePrompts.length; i += 1) {
      const imagePrompt = imagePrompts[i]
      await ctx.runMutation(internal.generation.emitGenerationEvent, {
        jobId: args.jobId,
        type: 'image.queued',
        message: `Painting image ${i + 1} of ${imagePrompts.length}…`,
        metadata: { index: i, total: imagePrompts.length },
      })

      const { blob, providerRequestId } = await callOpenAIImage(
        imagePrompt,
        imageModel,
      )

      const storageId = await ctx.storage.store(blob)
      const assetId = await ctx.runMutation(
        internal.generation.storeGeneratedImage,
        {
          jobId: args.jobId,
          petId: job.petId,
          ownerUserId: job.ownerUserId,
          storageId,
          byteSize: blob.size,
          contentType: blob.type || 'image/png',
        },
      )

      await ctx.runMutation(internal.generation.appendDraftImage, {
        jobId: args.jobId,
        assetId,
        index: i,
        total: imagePrompts.length,
      })

      imageCosts.push({
        model: imageModel,
        estimatedCostUsd: Number(process.env.OPENAI_IMAGE_COST_USD ?? '0.04'),
        providerRequestId,
      })
    }

      await ctx.runMutation(internal.generation.finalizeGenerationJob, {
      jobId: args.jobId,
      imagePrompts,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      baseImagePrompt: textResult.imagePrompt ?? input.description,
      imageCosts,
    })
  },
})
