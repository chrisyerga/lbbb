import { query } from './_generated/server'
import { accountLimits, planLimits, startOfUtcDay } from './lib/userAccount'
import { getAccountByUserId } from './lib/requireAccount'
import { optionalUser, requireUser } from './lib/requireUser'

export const usageToday = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const account = await getAccountByUserId(ctx, user._id)
    if (!account) {
      const free = planLimits('pup')
      return {
        rendersUsed: 0,
        rendersLimit: free.dailyTextGenerations,
        rendersRemaining: free.dailyTextGenerations,
      }
    }

    const limits = accountLimits(account)
    const dayStart = startOfUtcDay()
    const jobs = await ctx.db
      .query('generationJobs')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', user._id))
      .collect()

    const rendersUsed = jobs.filter(
      (j) =>
        j.createdAt >= dayStart &&
        (j.operation === 'blog_post' || j.operation === 'regeneration'),
    ).length

    const rendersLimit = limits.dailyTextGenerations
    return {
      rendersUsed,
      rendersLimit,
      rendersRemaining: Math.max(0, rendersLimit - rendersUsed),
    }
  },
})

export const defaults = query({
  args: {},
  handler: async (ctx) => {
    const user = await optionalUser(ctx)
    if (user) {
      const account = await getAccountByUserId(ctx, user._id)
      if (account) {
        const limits = accountLimits(account)
        return {
          planTier: account.planTier,
          dailyTextGenerations: limits.dailyTextGenerations,
          dailyImageGenerations: limits.dailyImageGenerations,
          maxUploadBytes: limits.maxUploadBytes,
          maxPets: limits.maxPets,
          maxPostsPerMonth: limits.maxPostsPerMonth,
          allowedUploadTypes: ['image/jpeg', 'image/png', 'image/webp'],
        }
      }
    }

    const free = planLimits('pup')
    return {
      planTier: 'pup' as const,
      dailyTextGenerations: free.dailyTextGenerations,
      dailyImageGenerations: free.dailyImageGenerations,
      maxUploadBytes: free.maxUploadBytes,
      maxPets: free.maxPets,
      maxPostsPerMonth: free.maxPostsPerMonth,
      allowedUploadTypes: ['image/jpeg', 'image/png', 'image/webp'],
    }
  },
})
