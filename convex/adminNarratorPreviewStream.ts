import { httpAction } from './_generated/server'
import { components, internal } from './_generated/api'
import { PersistentTextStreaming } from '@convex-dev/persistent-text-streaming'
import type { StreamId } from '@convex-dev/persistent-text-streaming'
import { getAuthUserId } from '@convex-dev/auth/server'
import { buildMetadataPromptFromPlan, buildStreamMessagesFromPlan } from './lib/generation/prompts'
import { isNarratorPreviewInputSnapshot } from './lib/generation/previewSnapshot'
import { callOpenAIMetadata, streamOpenAIMarkdown } from './lib/generation/providers/openaiText'

const persistentTextStreaming = new PersistentTextStreaming(components.persistentTextStreaming)

function corsHeaders(origin: string | null) {
  const allowed = process.env.SITE_URL ?? process.env.VITE_SITE_URL ?? 'http://localhost:3000'
  const allowOrigin = origin && (origin === allowed || allowed === '*') ? origin : allowed
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  }
}


export const streamNarratorTextPreview = httpAction(async (ctx, request) => {
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

  const preview = await ctx.runQuery(internal.narratorPreviewState.getPreviewForStreamInternal, {
    streamId: body.streamId,
  })
  if (!preview || preview.staffUserId !== userId) {
    return new Response('Forbidden', {
      status: 403,
      headers: corsHeaders(origin),
    })
  }

  if (preview.streamStatus === 'streaming_text' || preview.streamStatus === 'text_done') {
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
        const previewId = preview._id

        await ctx.runMutation(internal.narratorPreviewState.patchPreviewStreamStatus, {
          previewId,
          streamStatus: 'streaming_text',
        })

        if (!isNarratorPreviewInputSnapshot(preview.inputSnapshot)) {
          throw new Error('Preview input snapshot is missing generation plan')
        }

        const input = preview.inputSnapshot
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

        await ctx.runMutation(internal.narratorPreviewState.upsertPreviewResult, {
          previewId,
          title: metadata.title,
          excerpt: metadata.excerpt,
          bodyMarkdown: fullBody.trim(),
          tags: metadata.tags,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Generation failed'
        await ctx.runMutation(internal.narratorPreviewState.markPreviewFailed, {
          previewId: preview._id,
          error: message,
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
