import type { GenericMutationCtx, GenericQueryCtx } from 'convex/server'
import type { DataModel, Doc } from '../_generated/dataModel'
import {
  DEFAULT_ACCESS_ROLE,
  DEFAULT_PLAN_STATUS,
  DEFAULT_PLAN_TIER,
  isSiteAdmin,
  isStaff,
} from './userAccount'
import { requireUser } from './requireUser'

type Ctx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>

function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

function bootstrapAccessRole(email: string | undefined) {
  if (email && adminEmails().has(email.toLowerCase())) {
    return 'site_admin' as const
  }
  return DEFAULT_ACCESS_ROLE
}

export async function getAccountByUserId(
  ctx: Ctx,
  userId: Doc<'users'>['_id'],
): Promise<Doc<'userAccounts'> | null> {
  return await ctx.db
    .query('userAccounts')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first()
}

export async function getOrCreateAccount(
  ctx: GenericMutationCtx<DataModel>,
  user: Doc<'users'>,
): Promise<Doc<'userAccounts'>> {
  const existing = await getAccountByUserId(ctx, user._id)
  if (existing) return existing

  const now = Date.now()
  const accountId = await ctx.db.insert('userAccounts', {
    userId: user._id,
    accessRole: bootstrapAccessRole(user.email),
    planTier: DEFAULT_PLAN_TIER,
    planStatus: DEFAULT_PLAN_STATUS,
    createdAt: now,
    updatedAt: now,
  })

  const account = await ctx.db.get(accountId)
  if (!account) throw new Error('Failed to create user account')
  return account
}

export async function requireAccount(
  ctx: Ctx,
): Promise<Doc<'userAccounts'>> {
  const user = await requireUser(ctx)

  if ('insert' in ctx.db) {
    return await getOrCreateAccount(ctx as GenericMutationCtx<DataModel>, user)
  }

  const account = await getAccountByUserId(ctx, user._id)
  if (!account) {
    throw new Error('User account not provisioned')
  }
  if (account.suspendedAt !== undefined) {
    throw new Error('Account suspended')
  }
  return account
}

function effectiveStaffRole(
  account: Doc<'userAccounts'>,
  email: string | undefined,
) {
  if (isStaff(account.accessRole)) return account.accessRole
  if (email && adminEmails().has(email.toLowerCase())) return 'site_admin' as const
  return account.accessRole
}

export async function requireStaff(ctx: Ctx): Promise<Doc<'userAccounts'>> {
  const user = await requireUser(ctx)
  const account = await requireAccount(ctx)
  if (!isStaff(effectiveStaffRole(account, user.email))) {
    throw new Error('Staff access required')
  }
  return account
}

export async function requireSiteAdmin(
  ctx: Ctx,
): Promise<Doc<'userAccounts'>> {
  const user = await requireUser(ctx)
  const account = await requireAccount(ctx)
  const role = effectiveStaffRole(account, user.email)
  if (!isSiteAdmin(role)) {
    throw new Error('Site admin access required')
  }
  return account
}
