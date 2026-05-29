import type { Doc } from '../_generated/dataModel'

export const ACCESS_ROLES = ['user', 'site_admin', 'moderator', 'support'] as const
export type AccessRole = (typeof ACCESS_ROLES)[number]

export const PLAN_TIERS = ['pup', 'top_dog', 'the_pack'] as const
export type PlanTier = (typeof PLAN_TIERS)[number]

export const PLAN_STATUSES = ['active', 'trialing', 'cancelled', 'past_due'] as const
export type PlanStatus = (typeof PLAN_STATUSES)[number]

export const FEATURES = [
  'custom_domain',
  'all_narrator_voices',
  'auto_schedule_socials',
  'print_zine',
  'founder_hotline',
  'early_access_models',
] as const
export type Feature = (typeof FEATURES)[number]

export type PlanLimits = {
  maxPets: number | null
  maxPostsPerMonth: number | null
  dailyTextGenerations: number
  dailyImageGenerations: number
  maxUploadBytes: number
}

export type UserAccountDoc = Doc<'userAccounts'>

export const DEFAULT_ACCESS_ROLE: AccessRole = 'user'
export const DEFAULT_PLAN_TIER: PlanTier = 'pup'
export const DEFAULT_PLAN_STATUS: PlanStatus = 'active'

const STAFF_ROLES = new Set<AccessRole>(['site_admin', 'moderator', 'support'])

const TIER_RANK: Record<PlanTier, number> = {
  pup: 0,
  top_dog: 1,
  the_pack: 2,
}

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  pup: {
    maxPets: 1,
    maxPostsPerMonth: 3,
    dailyTextGenerations: Number(process.env.DAILY_TEXT_GENERATION_LIMIT ?? 20),
    dailyImageGenerations: Number(process.env.DAILY_IMAGE_GENERATION_LIMIT ?? 5),
    maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024),
  },
  top_dog: {
    maxPets: null,
    maxPostsPerMonth: null,
    dailyTextGenerations: Number(process.env.DAILY_TEXT_GENERATION_LIMIT ?? 20) * 5,
    dailyImageGenerations: Number(process.env.DAILY_IMAGE_GENERATION_LIMIT ?? 5) * 5,
    maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024),
  },
  the_pack: {
    maxPets: 10,
    maxPostsPerMonth: null,
    dailyTextGenerations: Number(process.env.DAILY_TEXT_GENERATION_LIMIT ?? 20) * 5,
    dailyImageGenerations: Number(process.env.DAILY_IMAGE_GENERATION_LIMIT ?? 5) * 5,
    maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024),
  },
}

const TIER_FEATURES: Record<PlanTier, ReadonlySet<Feature>> = {
  pup: new Set(),
  top_dog: new Set(['custom_domain', 'all_narrator_voices', 'auto_schedule_socials']),
  the_pack: new Set([
    'custom_domain',
    'all_narrator_voices',
    'auto_schedule_socials',
    'print_zine',
    'founder_hotline',
    'early_access_models',
  ]),
}

export function isStaff(role: AccessRole): boolean {
  return STAFF_ROLES.has(role)
}

export function isSiteAdmin(role: AccessRole): boolean {
  return role === 'site_admin'
}

export function effectivePlanTier(account: UserAccountDoc): PlanTier {
  if (account.planStatus === 'cancelled') return 'pup'
  if (account.planExpiresAt !== undefined && account.planExpiresAt < Date.now() && account.planStatus !== 'active') {
    return 'pup'
  }
  return account.planTier
}

export function planLimits(tier: PlanTier): PlanLimits {
  return PLAN_LIMITS[tier]
}

export function accountLimits(account: UserAccountDoc): PlanLimits {
  const base = planLimits(effectivePlanTier(account))
  const overrides = account.quotaOverrides
  if (!overrides) return base

  return {
    maxPets: overrides.maxPets ?? base.maxPets,
    maxPostsPerMonth: base.maxPostsPerMonth,
    dailyTextGenerations: overrides.dailyTextGenerations ?? base.dailyTextGenerations,
    dailyImageGenerations: overrides.dailyImageGenerations ?? base.dailyImageGenerations,
    maxUploadBytes: base.maxUploadBytes,
  }
}

export function hasFeature(account: UserAccountDoc, feature: Feature): boolean {
  return TIER_FEATURES[effectivePlanTier(account)].has(feature)
}

export function hasPlanAtLeast(account: UserAccountDoc, tier: PlanTier): boolean {
  return TIER_RANK[effectivePlanTier(account)] >= TIER_RANK[tier]
}

export function accountCapabilities(account: UserAccountDoc) {
  const role = account.accessRole
  return {
    isStaff: isStaff(role),
    isSiteAdmin: isSiteAdmin(role),
    limits: accountLimits(account),
  }
}

export function startOfUtcDay(now = Date.now()) {
  const d = new Date(now)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

export function startOfUtcMonth(now = Date.now()) {
  const d = new Date(now)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)
}
