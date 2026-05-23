import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { requireStaff } from './lib/requireAccount'
import { resolveGenerationPlan } from './lib/generationPlan'
import { assertCanCreateGenerationJob } from './lib/quotaEnforcement'
import { requireUser } from './lib/requireUser'

const vibeHintsValidator = v.object({
  mood: v.array(v.string()),
  style: v.array(v.string()),
  voice: v.array(v.string()),
  length: v.array(v.string()),
  custom: v.array(v.string()),
})

const advancedOverridesValidator = v.object({
  mood: v.optional(v.array(v.string())),
  artStyleId: v.optional(v.id('artStyles')),
  wordTarget: v.optional(v.number()),
  customHints: v.optional(v.array(v.string())),
})

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
    narratorId: v.optional(v.id('narrators')),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    await assertCanCreateGenerationJob(ctx, user._id, args.operation)

    const now = Date.now()
    const jobId = await ctx.db.insert('generationJobs', {
      ownerUserId: user._id,
      petId: args.petId,
      memoryId: args.memoryId,
      status: 'queued',
      operation: args.operation,
      provider: args.provider ?? 'openai',
      stylePresetId: args.stylePresetId,
      narratorId: args.narratorId,
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

export const startMemoryGeneration = mutation({
  args: {
    petId: v.id('pets'),
    memoryId: v.id('petMemories'),
    narratorId: v.id('narrators'),
    description: v.string(),
    petName: v.string(),
    petSpecies: v.optional(v.string()),
    advancedOverrides: v.optional(advancedOverridesValidator),
    vibeHints: v.optional(vibeHintsValidator),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    await assertCanCreateGenerationJob(ctx, user._id, 'blog_post')

    const memory = await ctx.db.get(args.memoryId)
    if (!memory || memory.ownerUserId !== user._id) {
      throw new Error('Memory not found')
    }
    if (memory.petId !== args.petId) {
      throw new Error('Memory does not belong to this pet')
    }

    const generationPlan = await resolveGenerationPlan(ctx, {
      narratorId: args.narratorId,
      memoryDescription: args.description,
      petName: args.petName,
      petSpecies: args.petSpecies,
      advancedOverrides: args.advancedOverrides,
      vibeHints: args.vibeHints,
    })

    const now = Date.now()
    const jobId = await ctx.db.insert('generationJobs', {
      ownerUserId: user._id,
      petId: args.petId,
      memoryId: args.memoryId,
      narratorId: args.narratorId,
      promptVersionId: generationPlan.promptVersionId,
      textModel: generationPlan.text.model,
      imageModel: generationPlan.image.model,
      status: 'queued',
      operation: 'blog_post',
      provider: 'openai',
      inputSnapshot: {
        description: args.description.trim(),
        petName: args.petName,
        petSpecies: args.petSpecies,
        narratorId: args.narratorId,
        generationPlan,
        advancedOverrides: args.advancedOverrides,
        vibeHints: args.vibeHints,
      },
      attempt: 0,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert('generationEvents', {
      jobId,
      ownerUserId: user._id,
      type: 'queued',
      message: `Memory generation queued with ${generationPlan.narratorSnapshot.name}.`,
      createdAt: now,
    })

    return jobId
  },
})

export const getMineById = query({
  args: { jobId: v.id('generationJobs') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const job = await ctx.db.get(args.jobId)
    if (!job || job.ownerUserId !== user._id) return null

    const events = await ctx.db
      .query('generationEvents')
      .withIndex('by_job', (q) => q.eq('jobId', args.jobId))
      .collect()

    events.sort((a, b) => a.createdAt - b.createdAt)

    const post = await ctx.db
      .query('generatedPosts')
      .withIndex('by_pet', (q) => q.eq('petId', job.petId))
      .collect()
    const draft = post.find((p) => p.jobId === args.jobId) ?? null

    return { job, events, draft }
  },
})

export const recentMine = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const jobs = await ctx.db
      .query('generationJobs')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', user._id))
      .collect()

    return jobs
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit ?? 50)
  },
})

/** Cross-user job feed for staff admin views. */
export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    return await ctx.db
      .query('generationJobs')
      .withIndex('by_created')
      .order('desc')
      .take(args.limit ?? 25)
  },
})
