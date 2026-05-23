import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { requirePetAsset, requirePetOwner, resolveAssetUrl } from './lib/assets'
import { requireUser } from './lib/requireUser'

export const listByPet = query({
  args: { petId: v.id('pets') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    await requirePetOwner(ctx, args.petId, user._id)

    const memories = await ctx.db
      .query('petMemories')
      .withIndex('by_pet', (q) => q.eq('petId', args.petId))
      .collect()

    memories.sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))

    return Promise.all(
      memories.map(async (memory) => {
        const photos = await Promise.all(
          memory.sourceAssetIds.map(async (assetId) => {
            const asset = await ctx.db.get(assetId)
            if (!asset) {
              return { assetId, url: null }
            }
            return {
              assetId,
              url: await resolveAssetUrl(ctx, asset),
            }
          }),
        )
        return {
          memoryId: memory._id,
          occurredOn: memory.occurredOn,
          description: memory.description,
          photos,
          createdAt: memory.createdAt,
        }
      }),
    )
  },
})

export const createDraft = mutation({
  args: {
    petId: v.id('pets'),
    description: v.string(),
    occurredOn: v.optional(v.string()),
    sourceAssetIds: v.optional(v.array(v.id('assets'))),
    narratorId: v.id('narrators'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    await requirePetOwner(ctx, args.petId, user._id)

    const narrator = await ctx.db.get(args.narratorId)
    if (!narrator || narrator.status !== 'published' || !narrator.public) {
      throw new Error('Narrator not found')
    }

    const description = args.description.trim()
    if (!description) {
      throw new Error('Description is required')
    }

    const sourceAssetIds = args.sourceAssetIds ?? []
    for (const assetId of sourceAssetIds) {
      await requirePetAsset(ctx, assetId, args.petId, user._id)
    }

    const occurredOn =
      args.occurredOn?.trim() ||
      new Date().toISOString().slice(0, 10)

    const memoryId = await ctx.db.insert('petMemories', {
      ownerUserId: user._id,
      petId: args.petId,
      occurredOn,
      description,
      sourceAssetIds,
      narratorId: args.narratorId,
      createdAt: Date.now(),
    })

    return { memoryId }
  },
})

export const create = mutation({
  args: {
    petId: v.id('pets'),
    occurredOn: v.string(),
    description: v.string(),
    sourceAssetIds: v.array(v.id('assets')),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    await requirePetOwner(ctx, args.petId, user._id)

    const occurredOn = args.occurredOn.trim()
    const description = args.description.trim()
    if (!occurredOn) {
      throw new Error('Date is required')
    }
    if (!description) {
      throw new Error('Description is required')
    }
    if (args.sourceAssetIds.length === 0) {
      throw new Error('At least one photo is required')
    }

    for (const assetId of args.sourceAssetIds) {
      await requirePetAsset(ctx, assetId, args.petId, user._id)
    }

    const memoryId = await ctx.db.insert('petMemories', {
      ownerUserId: user._id,
      petId: args.petId,
      occurredOn,
      description,
      sourceAssetIds: args.sourceAssetIds,
      createdAt: Date.now(),
    })

    return { memoryId }
  },
})

export const remove = mutation({
  args: {
    memoryId: v.id('petMemories'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const memory = await ctx.db.get(args.memoryId)
    if (!memory) {
      throw new Error('Memory not found')
    }
    if (memory.ownerUserId !== user._id) {
      throw new Error('Not allowed')
    }

    await ctx.db.delete(args.memoryId)
    return null
  },
})
