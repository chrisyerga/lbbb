import { action, internalMutation } from './_generated/server'
import { v } from 'convex/values'

type TextGenerationResult = {
  title: string
  excerpt: string
  bodyMarkdown: string
  tags: Array<string>
  imagePrompt: string
  usage?: {
    inputTokens?: number
    outputTokens?: number
  }
  providerRequestId?: string
}

async function callOpenAIText(prompt: string): Promise<TextGenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const model = process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.1-mini'
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: prompt,
      text: { format: { type: 'json_object' } },
    }),
  })

  if (!response.ok)
    throw new Error(`OpenAI text generation failed: ${response.status}`)

  const json = await response.json()
  const outputText = json.output_text ?? '{}'
  const parsed = JSON.parse(outputText) as TextGenerationResult

  return {
    ...parsed,
    usage: {
      inputTokens: json.usage?.input_tokens,
      outputTokens: json.usage?.output_tokens,
    },
    providerRequestId: response.headers.get('x-request-id') ?? undefined,
  }
}

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

export const completeWithDraft = internalMutation({
  args: {
    jobId: v.id('generationJobs'),
    title: v.string(),
    excerpt: v.string(),
    bodyMarkdown: v.string(),
    outputSnapshot: v.any(),
    cost: v.object({
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
      outputSnapshot: args.outputSnapshot,
      imageAssetIds: [],
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

    await ctx.db.patch(args.jobId, {
      status: 'awaiting_review',
      completedAt: now,
      updatedAt: now,
    })
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

function estimateTextCostUsd(inputTokens = 0, outputTokens = 0) {
  return Number(
    ((inputTokens / 1_000_000) * 0.25 + (outputTokens / 1_000_000) * 2).toFixed(
      6,
    ),
  )
}
