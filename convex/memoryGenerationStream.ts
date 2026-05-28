import { httpAction, query } from './_generated/server'
import { v } from 'convex/values'
import { components, internal } from './_generated/api'
import { PersistentTextStreaming } from '@convex-dev/persistent-text-streaming'
import type { StreamId } from '@convex-dev/persistent-text-streaming'
import { getAuthUserId } from '@convex-dev/auth/server'
import {
  buildMetadataPromptFromPlan,
  buildStreamMessagesFromPlan,
} from './lib/generation/prompts'
import type { MemoryJobInputSnapshot } from './lib/generation/types'
import { estimateTextCostUsd } from './lib/generation/pricing'
import {
  callOpenAIMetadata,
  streamOpenAIMarkdown,
} from './lib/generation/providers/openaiText'

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

export async function createMemoryGenerationStream(
  ctx: Parameters<typeof persistentTextStreaming.createStream>[0],
) {
  return await persistentTextStreaming.createStream(ctx)
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
    internal.generationState.getJobForStreamInternal,
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

        await ctx.runMutation(internal.generationState.markProcessing, { jobId })
        await ctx.runMutation(internal.generationState.patchStreamStatus, {
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

        await ctx.runMutation(internal.generationState.upsertDraftFromText, {
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

        await ctx.runMutation(internal.generationState.patchStreamStatus, {
          jobId,
          streamStatus: 'text_done',
          streamBody: fullBody.trim(),
        })

        await ctx.scheduler.runAfter(
          0,
          internal.generationWorkflow.runMemoryGenerationImages,
          { jobId },
        )
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Generation failed'
        await ctx.runMutation(internal.generationState.markFailed, {
          jobId: job._id,
          error: message,
        })
        await ctx.runMutation(internal.generationState.patchStreamStatus, {
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
