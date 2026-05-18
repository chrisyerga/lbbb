import { query } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'

function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      return { email: undefined as string | undefined, isAdmin: false }
    }
    const user = await ctx.db.get(userId)
    const email = user?.email?.toLowerCase()
    return {
      email,
      isAdmin: Boolean(email && adminEmails().has(email)),
    }
  },
})
