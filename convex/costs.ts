import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const record = mutation({
  args: {
    jobId: v.optional(v.id('generationJobs')),
    ownerUserId: v.id('users'),
    petId: v.optional(v.id('pets')),
    provider: v.union(v.literal('openai'), v.literal('openrouter')),
    model: v.string(),
    operation: v.union(
      v.literal('blog_text'),
      v.literal('blog_title'),
      v.literal('image_prompt'),
      v.literal('image_generation'),
      v.literal('moderation'),
      v.literal('regeneration'),
      v.literal('style_variation'),
    ),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    cachedInputTokens: v.optional(v.number()),
    imageCount: v.optional(v.number()),
    imageSize: v.optional(v.string()),
    imageQuality: v.optional(v.string()),
    estimatedCostUsd: v.number(),
    actualCostUsd: v.optional(v.number()),
    providerRequestId: v.optional(v.string()),
    providerMetadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('generationCosts', {
      ...args,
      createdAt: Date.now(),
    })
  },
})

export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('generationCosts')
      .withIndex('by_created')
      .order('desc')
      .take(args.limit ?? 50)
  },
})
