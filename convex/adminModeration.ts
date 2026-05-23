import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { resolveAssetUrl } from './lib/assets'
import { requireStaff } from './lib/requireAccount'
import { requireUser } from './lib/requireUser'

const moderationDecision = v.union(
  v.literal('approved'),
  v.literal('flagged'),
  v.literal('rejected'),
)

export const queueList = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const limit = args.limit ?? 50

    const posts = await ctx.db
      .query('generatedPosts')
      .withIndex('by_status', (q) => q.eq('status', 'awaiting_moderation'))
      .collect()

    const pendingAssets = await ctx.db.query('assets').collect()
    const assetItems = pendingAssets.filter(
      (a) =>
        a.moderationStatus === 'pending' || a.moderationStatus === 'flagged',
    )

    const postItems = posts.filter(
      (p) =>
        p.moderationStatus === 'pending' || p.moderationStatus === 'flagged',
    )

    type QueueItem = {
      id: string
      kind: 'post' | 'asset'
      postId?: typeof postItems[number]['_id']
      assetId?: typeof assetItems[number]['_id']
      status: typeof postItems[number]['moderationStatus']
      createdAt: number
      petName: string
      ownerEmail: string
      title: string
      excerpt?: string
      reason?: string
    }

    const items: Array<QueueItem> = []

    for (const post of postItems) {
      const [pet, owner, latestEvent] = await Promise.all([
        ctx.db.get(post.petId),
        ctx.db.get(post.ownerUserId),
        ctx.db
          .query('moderationEvents')
          .withIndex('by_post', (q) => q.eq('postId', post._id))
          .collect()
          .then((events) =>
            events.sort((a, b) => b.createdAt - a.createdAt)[0],
          ),
      ])

      items.push({
        id: `post:${post._id}`,
        kind: 'post',
        postId: post._id,
        status: post.moderationStatus,
        createdAt: post.createdAt,
        petName: pet?.name ?? 'Unknown pet',
        ownerEmail: owner?.email ?? 'unknown',
        title: post.title,
        excerpt: post.excerpt,
        reason: latestEvent?.reason,
      })
    }

    for (const asset of assetItems) {
      const [pet, owner, latestEvent] = await Promise.all([
        asset.petId ? ctx.db.get(asset.petId) : null,
        ctx.db.get(asset.ownerUserId),
        ctx.db
          .query('moderationEvents')
          .withIndex('by_asset', (q) => q.eq('assetId', asset._id))
          .collect()
          .then((events) =>
            events.sort((a, b) => b.createdAt - a.createdAt)[0],
          ),
      ])

      items.push({
        id: `asset:${asset._id}`,
        kind: 'asset',
        assetId: asset._id,
        status: asset.moderationStatus,
        createdAt: asset.createdAt,
        petName: pet?.name ?? 'Unknown pet',
        ownerEmail: owner?.email ?? 'unknown',
        title: asset.kind.replace('_', ' '),
        reason: latestEvent?.reason,
      })
    }

    items.sort((a, b) => b.createdAt - a.createdAt)
    return items.slice(0, limit)
  },
})

export const queueDetail = query({
  args: {
    postId: v.optional(v.id('generatedPosts')),
    assetId: v.optional(v.id('assets')),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)

    if (args.postId) {
      const post = await ctx.db.get(args.postId)
      if (!post) return null

      const [pet, owner, events, job] = await Promise.all([
        ctx.db.get(post.petId),
        ctx.db.get(post.ownerUserId),
        ctx.db
          .query('moderationEvents')
          .withIndex('by_post', (q) => q.eq('postId', post._id))
          .collect(),
        post.jobId ? ctx.db.get(post.jobId) : null,
      ])

      events.sort((a, b) => b.createdAt - a.createdAt)

      const imageUrls = await Promise.all(
        post.imageAssetIds.map(async (assetId) => {
          const asset = await ctx.db.get(assetId)
          if (!asset) return null
          return await resolveAssetUrl(ctx, asset)
        }),
      )

      return {
        kind: 'post' as const,
        post,
        pet,
        ownerEmail: owner?.email ?? 'unknown',
        events,
        job,
        imageUrls,
      }
    }

    if (args.assetId) {
      const asset = await ctx.db.get(args.assetId)
      if (!asset) return null

      const [pet, owner, events] = await Promise.all([
        asset.petId ? ctx.db.get(asset.petId) : null,
        ctx.db.get(asset.ownerUserId),
        ctx.db
          .query('moderationEvents')
          .withIndex('by_asset', (q) => q.eq('assetId', asset._id))
          .collect(),
      ])

      events.sort((a, b) => b.createdAt - a.createdAt)

      return {
        kind: 'asset' as const,
        asset,
        pet,
        ownerEmail: owner?.email ?? 'unknown',
        imageUrl: await resolveAssetUrl(ctx, asset),
        events,
      }
    }

    return null
  },
})

export const resolve = mutation({
  args: {
    postId: v.optional(v.id('generatedPosts')),
    assetId: v.optional(v.id('assets')),
    decision: moderationDecision,
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const admin = await requireUser(ctx)
    const now = Date.now()
    const reason = args.reason?.trim() || undefined

    if (args.postId) {
      const post = await ctx.db.get(args.postId)
      if (!post) throw new Error('Post not found')

      const postPatch: {
        moderationStatus: typeof args.decision
        status?: typeof post.status
        updatedAt: number
      } = {
        moderationStatus: args.decision,
        updatedAt: now,
      }

      if (args.decision === 'approved') {
        postPatch.status = 'approved'
      } else if (args.decision === 'rejected') {
        postPatch.status = 'rejected'
      }

      await ctx.db.patch(args.postId, postPatch)

      await ctx.db.insert('moderationEvents', {
        ownerUserId: post.ownerUserId,
        petId: post.petId,
        postId: post._id,
        status: args.decision,
        reason,
        metadata: { resolvedBy: admin._id },
        createdAt: now,
      })

      await ctx.db.insert('adminEvents', {
        adminUserId: admin._id,
        action: 'moderate_post',
        targetTable: 'generatedPosts',
        targetId: post._id,
        metadata: { decision: args.decision, reason },
        createdAt: now,
      })

      return null
    }

    if (args.assetId) {
      const asset = await ctx.db.get(args.assetId)
      if (!asset) throw new Error('Asset not found')

      await ctx.db.patch(args.assetId, {
        moderationStatus: args.decision,
      })

      await ctx.db.insert('moderationEvents', {
        ownerUserId: asset.ownerUserId,
        petId: asset.petId,
        assetId: asset._id,
        status: args.decision,
        reason,
        metadata: { resolvedBy: admin._id },
        createdAt: now,
      })

      await ctx.db.insert('adminEvents', {
        adminUserId: admin._id,
        action: 'moderate_asset',
        targetTable: 'assets',
        targetId: asset._id,
        metadata: { decision: args.decision, reason },
        createdAt: now,
      })

      return null
    }

    throw new Error('postId or assetId required')
  },
})
