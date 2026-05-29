import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { GenericQueryCtx } from 'convex/server'
import type { DataModel, Id } from './_generated/dataModel'
import { requirePetAsset, resolveAssetUrl } from './lib/assets'
import { syncCastMemberFromPet } from './lib/castSync'
import { parsePetId } from './lib/ids'
import { assertCanCreatePet } from './lib/quotaEnforcement'
import { optionalUser, requireUser } from './lib/requireUser'

const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'archive',
  'assets',
  'feed',
  'login',
  'new',
  'posts',
  'settings',
  'sitemap',
])

function slugify(value: string) {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

  return slug || 'untitled'
}

function petBlogBaseSlug(name: string) {
  const slug = slugify(name)
  return RESERVED_SLUGS.has(slug) ? `${slug}-pet` : slug
}

type DbReader = Pick<GenericQueryCtx<DataModel>, 'db'>

async function resolveAvatarUrl(ctx: GenericQueryCtx<DataModel>, avatarAssetId: Id<'assets'> | undefined) {
  if (!avatarAssetId) return null
  const asset = await ctx.db.get(avatarAssetId)
  if (!asset) return null
  return await resolveAssetUrl(ctx, asset)
}

async function allocatePetBlogSlug(ctx: DbReader, baseSlug: string) {
  let candidate = baseSlug
  let n = 2
  for (;;) {
    const taken = await ctx.db
      .query('petBlogs')
      .withIndex('by_slug', (q) => q.eq('slug', candidate))
      .first()
    if (!taken) return candidate
    candidate = `${baseSlug}-${n}`
    n += 1
  }
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await optionalUser(ctx)
    if (!user) return []

    const pets = await ctx.db
      .query('pets')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', user._id))
      .collect()

    const active = pets.filter((p) => p.deletedAt === undefined)
    const withBlogs = await Promise.all(
      active.map(async (pet) => {
        const blog = await ctx.db
          .query('petBlogs')
          .withIndex('by_pet', (q) => q.eq('petId', pet._id))
          .first()
        const avatarUrl = await resolveAvatarUrl(ctx, pet.avatarAssetId)

        const posts = await ctx.db
          .query('generatedPosts')
          .withIndex('by_pet', (q) => q.eq('petId', pet._id))
          .collect()
        const images = await ctx.db
          .query('assets')
          .withIndex('by_pet', (q) => q.eq('petId', pet._id))
          .collect()
        const imageCount = images.filter((a) => a.kind === 'generated_image').length

        const latestPost = posts.reduce<(typeof posts)[number] | null>((latest, post) => {
          if (!latest || post.updatedAt > latest.updatedAt) return post
          return latest
        }, null)

        return {
          pet,
          blog,
          avatarUrl,
          postCount: posts.length,
          imageCount,
          latestPost: latestPost ? { title: latestPost.title, updatedAt: latestPost.updatedAt } : null,
        }
      }),
    )
    return withBlogs
  },
})

export const getMineByPetId = query({
  args: { petId: v.string() },
  handler: async (ctx, args) => {
    const user = await optionalUser(ctx)
    if (!user) return null

    const petId = parsePetId(args.petId)
    if (!petId) return null

    const pet = await ctx.db.get(petId)
    if (!pet || pet.deletedAt !== undefined) return null
    if (pet.ownerUserId !== user._id) return null
    const blog = await ctx.db
      .query('petBlogs')
      .withIndex('by_pet', (q) => q.eq('petId', pet._id))
      .first()
    const avatarUrl = await resolveAvatarUrl(ctx, pet.avatarAssetId)
    return { pet, blog, avatarUrl }
  },
})

export const getPublicBlogBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const blog = await ctx.db
      .query('petBlogs')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()
    if (!blog || blog.visibility !== 'public') return null
    const pet = await ctx.db.get(blog.petId)
    if (!pet || pet.deletedAt !== undefined) return null
    return { pet, blog }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    species: v.optional(v.string()),
    breed: v.optional(v.string()),
    bio: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal('private'), v.literal('public'), v.literal('unlisted'))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    await assertCanCreatePet(ctx, user._id)
    const name = args.name.trim()
    if (!name) throw new Error('Name is required')

    const now = Date.now()
    const base = petBlogBaseSlug(name)
    const slug = await allocatePetBlogSlug(ctx, base)

    const petId = await ctx.db.insert('pets', {
      ownerUserId: user._id,
      name,
      species: args.species?.trim() || undefined,
      breed: args.breed?.trim() || undefined,
      bio: args.bio?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert('petBlogs', {
      ownerUserId: user._id,
      petId,
      slug,
      title: `${name}'s blog`,
      description: undefined,
      visibility: args.visibility ?? 'public',
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert('slugHistory', {
      ownerUserId: user._id,
      petId,
      slug,
      kind: 'pet',
      active: true,
      createdAt: now,
    })

    const pet = await ctx.db.get(petId)
    if (pet) {
      await syncCastMemberFromPet(ctx, pet)
    }

    return { petId, slug }
  },
})

export const update = mutation({
  args: {
    petId: v.id('pets'),
    name: v.optional(v.string()),
    species: v.optional(v.string()),
    breed: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const pet = await ctx.db.get(args.petId)
    if (!pet || pet.deletedAt !== undefined) throw new Error('Pet not found')
    if (pet.ownerUserId !== user._id) throw new Error('Not allowed')

    const now = Date.now()
    const patch: Record<string, unknown> = { updatedAt: now }

    if (args.name !== undefined) {
      const name = args.name.trim()
      if (!name) throw new Error('Name cannot be empty')
      patch.name = name
    }
    if (args.species !== undefined) patch.species = args.species.trim() || undefined
    if (args.breed !== undefined) patch.breed = args.breed.trim() || undefined
    if (args.bio !== undefined) patch.bio = args.bio.trim() || undefined

    await ctx.db.patch(args.petId, patch)

    const updatedPet = await ctx.db.get(args.petId)
    if (updatedPet) {
      await syncCastMemberFromPet(ctx, updatedPet)
    }

    if (args.name !== undefined) {
      const blog = await ctx.db
        .query('petBlogs')
        .withIndex('by_pet', (q) => q.eq('petId', args.petId))
        .first()
      if (blog) {
        const displayName = patch.name as string
        await ctx.db.patch(blog._id, {
          title: `${displayName}'s blog`,
          updatedAt: now,
        })
      }
    }

    return null
  },
})

export const updateBlogMeta = mutation({
  args: {
    petId: v.id('pets'),
    description: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal('private'), v.literal('public'), v.literal('unlisted'))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const pet = await ctx.db.get(args.petId)
    if (!pet || pet.deletedAt !== undefined) throw new Error('Pet not found')
    if (pet.ownerUserId !== user._id) throw new Error('Not allowed')

    const blog = await ctx.db
      .query('petBlogs')
      .withIndex('by_pet', (q) => q.eq('petId', args.petId))
      .first()
    if (!blog) throw new Error('Blog not found')

    const now = Date.now()
    const patch: Record<string, unknown> = { updatedAt: now }
    if (args.description !== undefined) patch.description = args.description.trim() || undefined
    if (args.visibility !== undefined) patch.visibility = args.visibility

    await ctx.db.patch(blog._id, patch)
    return null
  },
})

export const setAvatar = mutation({
  args: {
    petId: v.id('pets'),
    assetId: v.id('assets'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    await requirePetAsset(ctx, args.assetId, args.petId, user._id)

    const pet = await ctx.db.get(args.petId)
    if (!pet || pet.deletedAt !== undefined) {
      throw new Error('Pet not found')
    }
    if (pet.ownerUserId !== user._id) {
      throw new Error('Not allowed')
    }

    await ctx.db.patch(args.petId, {
      avatarAssetId: args.assetId,
      updatedAt: Date.now(),
    })

    const updatedPet = await ctx.db.get(args.petId)
    if (updatedPet) {
      await syncCastMemberFromPet(ctx, updatedPet)
    }
    return null
  },
})

export const clearAvatar = mutation({
  args: {
    petId: v.id('pets'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const pet = await ctx.db.get(args.petId)
    if (!pet || pet.deletedAt !== undefined) {
      throw new Error('Pet not found')
    }
    if (pet.ownerUserId !== user._id) {
      throw new Error('Not allowed')
    }

    await ctx.db.patch(args.petId, {
      avatarAssetId: undefined,
      updatedAt: Date.now(),
    })

    const updatedPet = await ctx.db.get(args.petId)
    if (updatedPet) {
      await syncCastMemberFromPet(ctx, updatedPet)
    }
    return null
  },
})
