import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { requireSiteAdmin, requireStaff } from './lib/requireAccount'
import { requireUser } from './lib/requireUser'

const traitCategory = v.union(
  v.literal('personality'),
  v.literal('tone'),
  v.literal('register'),
  v.literal('cultural'),
  v.literal('pacing'),
)
const catalogStatus = v.union(v.literal('active'), v.literal('archived'))
const narratorStatus = v.union(
  v.literal('draft'),
  v.literal('published'),
  v.literal('archived'),
)
const generationStrategy = v.union(
  v.literal('single_shot'),
  v.literal('draft_critique'),
)
const planTier = v.union(
  v.literal('pup'),
  v.literal('top_dog'),
  v.literal('the_pack'),
)

export const listTraits = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx)
    const traits = await ctx.db.query('narratorTraits').collect()
    traits.sort((a, b) => a.sortOrder - b.sortOrder)
    return traits
  },
})

export const listArtStyles = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx)
    const styles = await ctx.db.query('artStyles').collect()
    styles.sort((a, b) => a.sortOrder - b.sortOrder)
    return styles
  },
})

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx)
    const narrators = await ctx.db.query('narrators').collect()
    narrators.sort((a, b) => a.sortOrder - b.sortOrder)
    return narrators
  },
})

export const traitUsage = query({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx)
    const narrators = await ctx.db.query('narrators').collect()
    const usage: Record<string, Array<string>> = {}

    for (const narrator of narrators) {
      for (const traitId of narrator.traitIds) {
        const key = traitId as string
        usage[key] ??= []
        usage[key].push(narrator.name)
      }
    }

    return usage
  },
})

export const upsertTrait = mutation({
  args: {
    traitId: v.optional(v.id('narratorTraits')),
    slug: v.string(),
    label: v.string(),
    category: traitCategory,
    promptFragment: v.string(),
    sortOrder: v.number(),
    status: catalogStatus,
  },
  handler: async (ctx, args) => {
    await requireSiteAdmin(ctx)
    const now = Date.now()
    const patch = {
      slug: args.slug.trim(),
      label: args.label.trim(),
      category: args.category,
      promptFragment: args.promptFragment.trim(),
      sortOrder: args.sortOrder,
      status: args.status,
      updatedAt: now,
    }

    if (args.traitId) {
      await ctx.db.patch(args.traitId, patch)
      return args.traitId
    }

    return await ctx.db.insert('narratorTraits', {
      ...patch,
      createdAt: now,
    })
  },
})

export const upsertArtStyle = mutation({
  args: {
    artStyleId: v.optional(v.id('artStyles')),
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    imagePromptSuffix: v.string(),
    sortOrder: v.number(),
    status: catalogStatus,
  },
  handler: async (ctx, args) => {
    await requireSiteAdmin(ctx)
    const now = Date.now()
    const patch = {
      slug: args.slug.trim(),
      name: args.name.trim(),
      description: args.description.trim(),
      imagePromptSuffix: args.imagePromptSuffix.trim(),
      sortOrder: args.sortOrder,
      status: args.status,
      updatedAt: now,
    }

    if (args.artStyleId) {
      await ctx.db.patch(args.artStyleId, patch)
      return args.artStyleId
    }

    return await ctx.db.insert('artStyles', {
      ...patch,
      createdAt: now,
    })
  },
})

export const upsertNarrator = mutation({
  args: {
    narratorId: v.optional(v.id('narrators')),
    slug: v.string(),
    name: v.string(),
    tagline: v.string(),
    description: v.optional(v.string()),
    exampleExcerpt: v.optional(v.string()),
    traitIds: v.array(v.id('narratorTraits')),
    specializationPrompt: v.string(),
    promptVersionKey: v.string(),
    systemPromptAddon: v.optional(v.string()),
    defaultMoodHints: v.optional(v.array(v.string())),
    wordTarget: v.number(),
    textModel: v.optional(v.string()),
    defaultArtStyleId: v.id('artStyles'),
    imagePromptSuffix: v.optional(v.string()),
    generationStrategy,
    public: v.boolean(),
    featured: v.boolean(),
    minPlanTier: v.optional(planTier),
    sortOrder: v.number(),
    status: narratorStatus,
  },
  handler: async (ctx, args) => {
    await requireSiteAdmin(ctx)
    const now = Date.now()
    const patch = {
      slug: args.slug.trim(),
      name: args.name.trim(),
      tagline: args.tagline.trim(),
      description: args.description?.trim() || undefined,
      exampleExcerpt: args.exampleExcerpt?.trim() || undefined,
      traitIds: args.traitIds,
      specializationPrompt: args.specializationPrompt.trim(),
      promptVersionKey: args.promptVersionKey.trim(),
      systemPromptAddon: args.systemPromptAddon?.trim() || undefined,
      defaultMoodHints: args.defaultMoodHints,
      wordTarget: args.wordTarget,
      textModel: args.textModel,
      defaultArtStyleId: args.defaultArtStyleId,
      imagePromptSuffix: args.imagePromptSuffix?.trim() || undefined,
      generationStrategy: args.generationStrategy,
      public: args.public,
      featured: args.featured,
      minPlanTier: args.minPlanTier,
      sortOrder: args.sortOrder,
      status: args.status,
      updatedAt: now,
    }

    if (args.narratorId) {
      await ctx.db.patch(args.narratorId, patch)
      await ctx.db.insert('adminEvents', {
        adminUserId: (await requireUser(ctx))._id,
        action: 'upsert_narrator',
        targetTable: 'narrators',
        targetId: args.narratorId,
        metadata: { slug: patch.slug },
        createdAt: now,
      })
      return args.narratorId
    }

    const narratorId = await ctx.db.insert('narrators', {
      ...patch,
      createdAt: now,
    })

    await ctx.db.insert('adminEvents', {
      adminUserId: (await requireUser(ctx))._id,
      action: 'create_narrator',
      targetTable: 'narrators',
      targetId: narratorId,
      metadata: { slug: patch.slug },
      createdAt: now,
    })

    return narratorId
  },
})
