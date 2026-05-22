import type { GenericMutationCtx, GenericQueryCtx } from 'convex/server'
import type { DataModel, Doc, Id } from '../_generated/dataModel'
import type { UserAccountDoc } from './userAccount'
import {
  accountLimits,
  startOfUtcDay,
  startOfUtcMonth,
} from './userAccount'
import { requireAccount } from './requireAccount'

type Ctx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>

export async function assertCanCreatePet(ctx: Ctx, userId: Id<'users'>) {
  const account = await requireAccount(ctx)
  const limits = accountLimits(account)
  if (limits.maxPets === null) return

  const pets = await ctx.db
    .query('pets')
    .withIndex('by_owner', (q) => q.eq('ownerUserId', userId))
    .collect()

  const activeCount = pets.filter((p) => p.deletedAt === undefined).length
  if (activeCount >= limits.maxPets) {
    throw new Error(
      `Pet limit reached (${limits.maxPets}). Upgrade your plan for more pets.`,
    )
  }
}

export async function assertCanCreateGenerationJob(
  ctx: Ctx,
  userId: Id<'users'>,
  operation: Doc<'generationJobs'>['operation'],
) {
  const account = await requireAccount(ctx)
  const limits = accountLimits(account)
  const dayStart = startOfUtcDay()

  const jobs = await ctx.db
    .query('generationJobs')
    .withIndex('by_owner', (q) => q.eq('ownerUserId', userId))
    .collect()

  const todayJobs = jobs.filter((j) => j.createdAt >= dayStart)

  if (operation === 'image') {
    const imageCount = todayJobs.filter((j) => j.operation === 'image').length
    if (imageCount >= limits.dailyImageGenerations) {
      throw new Error(
        `Daily image generation limit reached (${limits.dailyImageGenerations}).`,
      )
    }
    return
  }

  const textCount = todayJobs.filter(
    (j) => j.operation === 'blog_post' || j.operation === 'regeneration',
  ).length
  if (textCount >= limits.dailyTextGenerations) {
    throw new Error(
      `Daily text generation limit reached (${limits.dailyTextGenerations}).`,
    )
  }

  if (
    operation === 'blog_post' &&
    limits.maxPostsPerMonth !== null
  ) {
    const monthStart = startOfUtcMonth()
    const posts = await ctx.db
      .query('generatedPosts')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', userId))
      .collect()

    const monthPosts = posts.filter((p) => p.createdAt >= monthStart).length
    if (monthPosts >= limits.maxPostsPerMonth) {
      throw new Error(
        `Monthly post limit reached (${limits.maxPostsPerMonth}). Upgrade your plan for more posts.`,
      )
    }
  }
}

export function assertUploadWithinLimits(
  account: UserAccountDoc,
  contentType: string,
  byteSize: number,
) {
  const limits = accountLimits(account)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] as const

  if (!(allowedTypes as readonly string[]).includes(contentType)) {
    throw new Error('File type not allowed. Use JPEG, PNG, or WebP.')
  }
  if (byteSize <= 0) {
    throw new Error('File is empty.')
  }
  if (byteSize > limits.maxUploadBytes) {
    throw new Error(
      `File exceeds ${Math.round(limits.maxUploadBytes / (1024 * 1024))} MB limit.`,
    )
  }
}
