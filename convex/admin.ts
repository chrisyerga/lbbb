import { query } from './_generated/server'
import { accountCapabilities } from './lib/userAccount'
import { getAccountByUserId } from './lib/requireAccount'
import { optionalUser } from './lib/requireUser'

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const user = await optionalUser(ctx)
    if (!user) {
      return {
        email: undefined as string | undefined,
        isAdmin: false,
        isStaff: false,
        capabilities: null,
      }
    }

    const account = await getAccountByUserId(ctx, user._id)
    const email = user.email?.toLowerCase()

    if (!account) {
      return {
        email,
        isAdmin: false,
        isStaff: false,
        capabilities: null,
      }
    }

    const capabilities = accountCapabilities(account)
    return {
      email,
      isAdmin: capabilities.isSiteAdmin,
      isStaff: capabilities.isStaff,
      capabilities,
    }
  },
})

export { requireStaff, requireSiteAdmin } from './lib/requireAccount'
