import type { GenericMutationCtx, GenericQueryCtx } from 'convex/server'
import type { DataModel, Doc } from '../_generated/dataModel'

type Ctx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>

export async function requireUser(ctx: Ctx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error('Authentication required')

  const user = await ctx.db
    .query('users')
    .withIndex('email', (q) => q.eq('email', identity.email ?? ''))
    .first()
  if (!user) throw new Error('User record not found')

  return user
}
