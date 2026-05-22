import { authTables } from '@convex-dev/auth/server'
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

const visibility = v.union(
  v.literal('private'),
  v.literal('public'),
  v.literal('unlisted'),
)
const jobStatus = v.union(
  v.literal('queued'),
  v.literal('processing'),
  v.literal('awaiting_review'),
  v.literal('completed'),
  v.literal('failed'),
  v.literal('cancelled'),
)
const postStatus = v.union(
  v.literal('draft'),
  v.literal('awaiting_moderation'),
  v.literal('approved'),
  v.literal('published'),
  v.literal('rejected'),
  v.literal('unpublished'),
)
const moderationStatus = v.union(
  v.literal('pending'),
  v.literal('approved'),
  v.literal('flagged'),
  v.literal('rejected'),
)
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

export default defineSchema({
  ...authTables,

  userAccounts: defineTable({
    userId: v.id('users'),
    accessRole,
    planTier,
    planStatus,
    planExpiresAt: v.optional(v.number()),
    billing: v.optional(
      v.object({
        provider: v.literal('stripe'),
        customerId: v.string(),
        subscriptionId: v.optional(v.string()),
        currentPeriodEnd: v.optional(v.number()),
      }),
    ),
    quotaOverrides: v.optional(
      v.object({
        dailyTextGenerations: v.optional(v.number()),
        dailyImageGenerations: v.optional(v.number()),
        maxPets: v.optional(v.number()),
      }),
    ),
    suspendedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_plan_tier', ['planTier'])
    .index('by_access_role', ['accessRole']),

  userProfiles: defineTable({
    userId: v.id('users'),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  pets: defineTable({
    ownerUserId: v.id('users'),
    name: v.string(),
    species: v.optional(v.string()),
    breed: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarAssetId: v.optional(v.id('assets')),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index('by_owner', ['ownerUserId'])
    .index('by_owner_name', ['ownerUserId', 'name']),

  petBlogs: defineTable({
    ownerUserId: v.id('users'),
    petId: v.id('pets'),
    slug: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    visibility,
    canonicalUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_pet', ['petId'])
    .index('by_slug', ['slug'])
    .index('by_owner', ['ownerUserId']),

  slugHistory: defineTable({
    ownerUserId: v.id('users'),
    petId: v.optional(v.id('pets')),
    postId: v.optional(v.id('generatedPosts')),
    slug: v.string(),
    kind: v.union(v.literal('pet'), v.literal('post')),
    active: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_pet', ['petId'])
    .index('by_post', ['postId']),

  petMemories: defineTable({
    ownerUserId: v.id('users'),
    petId: v.id('pets'),
    occurredOn: v.string(),
    description: v.string(),
    sourceAssetIds: v.array(v.id('assets')),
    vibeHints: v.optional(
      v.object({
        mood: v.array(v.string()),
        style: v.array(v.string()),
        voice: v.array(v.string()),
        length: v.array(v.string()),
        custom: v.array(v.string()),
      }),
    ),
    stylePresetId: v.optional(v.id('stylePresets')),
    createdAt: v.number(),
  })
    .index('by_pet', ['petId'])
    .index('by_owner', ['ownerUserId'])
    .index('by_pet_date', ['petId', 'occurredOn']),

  assets: defineTable({
    ownerUserId: v.id('users'),
    petId: v.optional(v.id('pets')),
    kind: v.union(
      v.literal('uploaded_photo'),
      v.literal('generated_image'),
      v.literal('og_image'),
    ),
    storageProvider: v.union(v.literal('convex'), v.literal('do_spaces')),
    storageId: v.optional(v.id('_storage')),
    bucket: v.optional(v.string()),
    key: v.optional(v.string()),
    cdnUrl: v.optional(v.string()),
    contentType: v.string(),
    byteSize: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    checksum: v.optional(v.string()),
    visibility,
    moderationStatus,
    createdAt: v.number(),
  })
    .index('by_owner', ['ownerUserId'])
    .index('by_pet', ['petId'])
    .index('by_storage', ['storageProvider', 'storageId']),

  generationJobs: defineTable({
    ownerUserId: v.id('users'),
    petId: v.id('pets'),
    memoryId: v.optional(v.id('petMemories')),
    status: jobStatus,
    operation: v.union(
      v.literal('blog_post'),
      v.literal('image'),
      v.literal('regeneration'),
    ),
    textModel: v.optional(v.string()),
    imageModel: v.optional(v.string()),
    provider: v.optional(v.union(v.literal('openai'), v.literal('openrouter'))),
    promptVersionId: v.optional(v.id('promptVersions')),
    stylePresetId: v.optional(v.id('stylePresets')),
    inputSnapshot: v.optional(v.any()),
    attempt: v.number(),
    error: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_owner', ['ownerUserId'])
    .index('by_pet', ['petId'])
    .index('by_status', ['status'])
    .index('by_created', ['createdAt']),

  generationEvents: defineTable({
    jobId: v.id('generationJobs'),
    ownerUserId: v.id('users'),
    type: v.string(),
    message: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('by_job', ['jobId'])
    .index('by_owner', ['ownerUserId']),

  generationCosts: defineTable({
    jobId: v.optional(v.id('generationJobs')),
    ownerUserId: v.id('users'),
    petId: v.optional(v.id('pets')),
    provider: v.union(v.literal('openai'), v.literal('openrouter')),
    model: v.string(),
    operation: v.union(
      v.literal('blog_text'),
      v.literal('blog_title'),
      v.literal('image_prompt'),
      v.literal('image_generation'),
      v.literal('moderation'),
      v.literal('regeneration'),
      v.literal('style_variation'),
    ),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    cachedInputTokens: v.optional(v.number()),
    imageCount: v.optional(v.number()),
    imageSize: v.optional(v.string()),
    imageQuality: v.optional(v.string()),
    estimatedCostUsd: v.number(),
    actualCostUsd: v.optional(v.number()),
    providerRequestId: v.optional(v.string()),
    providerMetadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('by_owner', ['ownerUserId'])
    .index('by_pet', ['petId'])
    .index('by_job', ['jobId'])
    .index('by_provider', ['provider'])
    .index('by_created', ['createdAt']),

  generatedPosts: defineTable({
    ownerUserId: v.id('users'),
    petId: v.id('pets'),
    memoryId: v.optional(v.id('petMemories')),
    jobId: v.optional(v.id('generationJobs')),
    slug: v.string(),
    title: v.string(),
    excerpt: v.optional(v.string()),
    bodyMarkdown: v.string(),
    status: postStatus,
    moderationStatus,
    promptVersionId: v.optional(v.id('promptVersions')),
    inputSnapshot: v.optional(v.any()),
    outputSnapshot: v.optional(v.any()),
    imageAssetIds: v.array(v.id('assets')),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_pet', ['petId'])
    .index('by_pet_slug', ['petId', 'slug'])
    .index('by_status', ['status'])
    .index('by_owner', ['ownerUserId']),

  promptVersions: defineTable({
    key: v.string(),
    version: v.number(),
    purpose: v.string(),
    provider: v.union(v.literal('openai'), v.literal('openrouter')),
    model: v.string(),
    systemPrompt: v.string(),
    userPromptTemplate: v.string(),
    outputSchema: v.optional(v.any()),
    parameters: v.optional(v.any()),
    active: v.boolean(),
    createdAt: v.number(),
    createdBy: v.optional(v.id('users')),
  })
    .index('by_key', ['key'])
    .index('by_key_version', ['key', 'version'])
    .index('by_active', ['key', 'active']),

  stylePresets: defineTable({
    ownerUserId: v.optional(v.id('users')),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    imagePromptSuffix: v.string(),
    public: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_owner', ['ownerUserId'])
    .index('by_public', ['public']),

  moderationEvents: defineTable({
    ownerUserId: v.id('users'),
    petId: v.optional(v.id('pets')),
    postId: v.optional(v.id('generatedPosts')),
    assetId: v.optional(v.id('assets')),
    status: moderationStatus,
    provider: v.optional(v.string()),
    reason: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('by_owner', ['ownerUserId'])
    .index('by_post', ['postId'])
    .index('by_asset', ['assetId'])
    .index('by_status', ['status']),

  adminEvents: defineTable({
    adminUserId: v.id('users'),
    action: v.string(),
    targetTable: v.optional(v.string()),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index('by_admin', ['adminUserId'])
    .index('by_action', ['action']),
})
