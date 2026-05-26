import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { requireStaff } from './lib/requireAccount'
import {
  composePersonaPrompt,
  loadNarratorBundle,
  resolveGenerationPlan,
} from './lib/generationPlan'
import { buildCastBlock } from './lib/castContext'
import { resolveCastSnapshot } from './lib/castContext'
import { syncCastMemberFromPet } from './lib/castSync'
import { assertCanCreateGenerationJob } from './lib/quotaEnforcement'
import { requireUser } from './lib/requireUser'
import { resolveAssetUrl } from './lib/assets'

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

    const pet = await ctx.db.get(args.petId)
    if (pet && pet.deletedAt === undefined) {
      await syncCastMemberFromPet(ctx, pet)
    }

    const castSnapshot = await resolveCastSnapshot(ctx, {
      ownerUserId: user._id,
      subjectPetId: args.petId,
      memoryDescription: args.description,
    })

    const generationPlan = await resolveGenerationPlan(ctx, {
      narratorId: args.narratorId,
      memoryDescription: args.description,
      petName: args.petName,
      petSpecies: args.petSpecies,
      castSnapshot,
    })

    const { narrator, traits } = await loadNarratorBundle(ctx, args.narratorId)

    const personaBlock = composePersonaPrompt({
      traits,
      specializationPrompt: narrator.specializationPrompt,
      systemPromptAddon: narrator.systemPromptAddon,
    })
    const moodHints = narrator.defaultMoodHints ?? []
    const moodBlock =
      moodHints.length > 0
        ? `Mood and scene tone: ${moodHints.filter(Boolean).join(', ')}`
        : ''

    const promptVars = {
      petName: `${args.petName}${args.petSpecies ? ` (${args.petSpecies})` : ''}`,
      memoryDescription: args.description.trim(),
      castBlock: buildCastBlock(castSnapshot),
      personaBlock,
      moodBlock,
    }

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
        castSnapshot,
        promptVars,
      },
      streamStatus: 'idle',
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

    const draft = await ctx.db
      .query('generatedPosts')
      .withIndex('by_job', (q) => q.eq('jobId', args.jobId))
      .first()

    const imageUrls = draft
      ? await Promise.all(
          draft.imageAssetIds.map(async (assetId) => {
            const asset = await ctx.db.get(assetId)
            if (!asset) return null
            return await resolveAssetUrl(ctx, asset)
          }),
        )
      : []

    return {
      job,
      events,
      draft,
      imageUrls,
      streamBody: job.streamBody ?? null,
      streamStatus: job.streamStatus ?? null,
      streamId: job.streamId ?? null,
    }
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
