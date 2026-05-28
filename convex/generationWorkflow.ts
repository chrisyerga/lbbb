import { internalAction } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { MemoryJobInputSnapshot } from './lib/generation/types'
import { buildImagePromptsFromPlan } from './lib/generation/prompts'
import { estimateImageCostUsd } from './lib/generation/pricing'
import { callOpenAIImage } from './lib/generation/providers/openaiImage'

function isMemoryJobInput(input: unknown): input is MemoryJobInputSnapshot {
  return (
    typeof input === 'object' &&
    input !== null &&
    'generationPlan' in input &&
    typeof (input as MemoryJobInputSnapshot).generationPlan === 'object'
  )
}

export const runMemoryGenerationImages = internalAction({
  args: { jobId: v.id('generationJobs') },
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(internal.generationState.getJobInternal, {
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

    const draft = await ctx.runQuery(
      internal.generationState.getDraftByJobInternal,
      { jobId: args.jobId },
    )
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

    await ctx.runMutation(internal.generationState.patchStreamStatus, {
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
      await ctx.runMutation(internal.generationState.emitGenerationEvent, {
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
        internal.generationState.storeGeneratedImage,
        {
          jobId: args.jobId,
          petId: job.petId,
          ownerUserId: job.ownerUserId,
          storageId,
          byteSize: blob.size,
          contentType: blob.type || 'image/png',
        },
      )

      await ctx.runMutation(internal.generationState.appendDraftImage, {
        jobId: args.jobId,
        assetId,
        index: i,
        total: imagePrompts.length,
      })

      imageCosts.push({
        model: imageModel,
        estimatedCostUsd: estimateImageCostUsd(),
        providerRequestId,
      })
    }

    await ctx.runMutation(internal.generationState.finalizeGenerationJob, {
      jobId: args.jobId,
      imagePrompts,
      baseImagePrompt: textResult.imagePrompt,
      imageCosts,
    })
  },
})
