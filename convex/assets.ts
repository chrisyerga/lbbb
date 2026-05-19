import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import {
  assertUploadAllowed,
  requirePetOwner,
  resolveAssetUrl,
} from './lib/assets'
import { requireUser } from './lib/requireUser'

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const finalizeUpload = mutation({
  args: {
    petId: v.id('pets'),
    storageId: v.id('_storage'),
    contentType: v.string(),
    byteSize: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    await requirePetOwner(ctx, args.petId, user._id)
    assertUploadAllowed(args.contentType, args.byteSize)

    const now = Date.now()
    const assetId = await ctx.db.insert('assets', {
      ownerUserId: user._id,
      petId: args.petId,
      kind: 'uploaded_photo',
      storageProvider: 'convex',
      storageId: args.storageId,
      contentType: args.contentType,
      byteSize: args.byteSize,
      visibility: 'private',
      moderationStatus: 'pending',
      createdAt: now,
    })

    const asset = await ctx.db.get(assetId)
    if (!asset) {
      throw new Error('Failed to create asset')
    }

    const url = await resolveAssetUrl(ctx, asset)
    return { assetId, url }
  },
})

export const listByPet = query({
  args: { petId: v.id('pets') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    await requirePetOwner(ctx, args.petId, user._id)

    const assets = await ctx.db
      .query('assets')
      .withIndex('by_pet', (q) => q.eq('petId', args.petId))
      .collect()

    const photos = assets.filter((a) => a.kind === 'uploaded_photo')
    return Promise.all(
      photos.map(async (asset) => ({
        assetId: asset._id,
        url: await resolveAssetUrl(ctx, asset),
        contentType: asset.contentType,
        byteSize: asset.byteSize,
        createdAt: asset.createdAt,
      })),
    )
  },
})
