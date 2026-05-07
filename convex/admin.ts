import { query } from './_generated/server'

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
    const identity = await ctx.auth.getUserIdentity()
    const email = identity?.email?.toLowerCase()
    return {
      email,
      isAdmin: Boolean(email && adminEmails().has(email)),
    }
  },
})
