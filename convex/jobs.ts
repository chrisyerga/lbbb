import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { requireUser } from './lib/requireUser'

export const createGenerationJob = mutation({
  args: {
    petId: v.id('pets'),
    memoryId: v.optional(v.id('petMemories')),
    operation: v.union(
      v.literal('blog_post'),
      v.literal('image'),
      v.literal('regeneration'),
    ),
    provider: v.optional(v.union(v.literal('openai'), v.literal('openrouter'))),
    stylePresetId: v.optional(v.id('stylePresets')),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)

    const now = Date.now()
    const jobId = await ctx.db.insert('generationJobs', {
      ownerUserId: user._id,
      petId: args.petId,
      memoryId: args.memoryId,
      status: 'queued',
      operation: args.operation,
      provider: args.provider ?? 'openai',
      stylePresetId: args.stylePresetId,
      attempt: 0,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert('generationEvents', {
      jobId,
      ownerUserId: user._id,
      type: 'queued',
      message: 'Generation job queued.',
      createdAt: now,
    })

    return jobId
  },
})

export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('generationJobs')
      .withIndex('by_created')
      .order('desc')
      .take(args.limit ?? 25)
  },
})
