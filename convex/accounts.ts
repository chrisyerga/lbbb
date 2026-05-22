import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import {
  accountCapabilities,
  accountLimits,
} from './lib/userAccount'
import {
  getAccountByUserId,
  getOrCreateAccount,
  requireAccount,
  requireSiteAdmin,
  requireStaff,
} from './lib/requireAccount'
import { optionalUser, requireUser } from './lib/requireUser'

const accessRole = v.union(
  v.literal('user'),
  v.literal('site_admin'),
  v.literal('moderator'),
  v.literal('support'),
)
const planTier = v.union(
  v.literal('pup'),
  v.literal('top_dog'),
  v.literal('the_pack'),
)
const planStatus = v.union(
  v.literal('active'),
  v.literal('trialing'),
  v.literal('cancelled'),
  v.literal('past_due'),
)

export const ensureAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    return await getOrCreateAccount(ctx, user)
  },
})

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await optionalUser(ctx)
    if (!user) return null

    const profile = await ctx.db
      .query('userProfiles')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first()

    const account = await getAccountByUserId(ctx, user._id)
    if (!account) {
      return {
        user,
        profile,
        account: null,
        capabilities: null,
      }
    }

    return {
      user,
      profile,
      account: {
        accessRole: account.accessRole,
        planTier: account.planTier,
        planStatus: account.planStatus,
        planExpiresAt: account.planExpiresAt,
      },
      capabilities: accountCapabilities(account),
    }
  },
})

export const setRole = mutation({
  args: {
    userId: v.id('users'),
    accessRole,
  },
  handler: async (ctx, args) => {
    await requireSiteAdmin(ctx)
    const account = await getAccountByUserId(ctx, args.userId)
    if (!account) throw new Error('User account not found')

    await ctx.db.patch(account._id, {
      accessRole: args.accessRole,
      updatedAt: Date.now(),
    })

    await ctx.db.insert('adminEvents', {
      adminUserId: (await requireUser(ctx))._id,
      action: 'set_role',
      targetTable: 'userAccounts',
      targetId: account._id,
      metadata: { userId: args.userId, accessRole: args.accessRole },
      createdAt: Date.now(),
    })

    return null
  },
})

export const setPlan = mutation({
  args: {
    userId: v.id('users'),
    planTier,
    planStatus: v.optional(planStatus),
    planExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSiteAdmin(ctx)
    const account = await getAccountByUserId(ctx, args.userId)
    if (!account) throw new Error('User account not found')

    const patch: {
      planTier: typeof args.planTier
      planStatus?: typeof args.planStatus
      planExpiresAt?: number
      updatedAt: number
    } = {
      planTier: args.planTier,
      updatedAt: Date.now(),
    }
    if (args.planStatus !== undefined) patch.planStatus = args.planStatus
    if (args.planExpiresAt !== undefined) {
      patch.planExpiresAt = args.planExpiresAt
    }

    await ctx.db.patch(account._id, patch)

    await ctx.db.insert('adminEvents', {
      adminUserId: (await requireUser(ctx))._id,
      action: 'set_plan',
      targetTable: 'userAccounts',
      targetId: account._id,
      metadata: {
        userId: args.userId,
        planTier: args.planTier,
        planStatus: args.planStatus,
      },
      createdAt: Date.now(),
    })

    return null
  },
})

export const limitsForMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await optionalUser(ctx)
    if (!user) return null

    const account = await getAccountByUserId(ctx, user._id)
    if (!account) return null

    return accountLimits(account)
  },
})

export { requireAccount, requireStaff, requireSiteAdmin }
