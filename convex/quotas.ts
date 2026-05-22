import { query } from './_generated/server'
import { accountLimits, planLimits } from './lib/userAccount'
import { getAccountByUserId } from './lib/requireAccount'
import { optionalUser } from './lib/requireUser'

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
