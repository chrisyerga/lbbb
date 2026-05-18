import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { optionalUser, requireUser } from './lib/requireUser'

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await optionalUser(ctx)
    if (!user) return null

    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first()
    return { user, profile }
  },
})

export const update = mutation({
  args: {
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const now = Date.now()

    const existing = await ctx.db
      .query('userProfiles')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first()

    const displayName =
      args.displayName === undefined
        ? existing?.displayName
        : args.displayName.trim() || undefined
    const bio =
      args.bio === undefined ? existing?.bio : args.bio.trim() || undefined

    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName,
        bio,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert('userProfiles', {
        userId: user._id,
        displayName,
        bio,
        updatedAt: now,
      })
    }

    return null
  },
})
