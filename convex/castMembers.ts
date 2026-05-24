import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { GenericMutationCtx, GenericQueryCtx } from 'convex/server'
import type { DataModel, Doc } from './_generated/dataModel'
import { resolveAssetUrl, requireCastMemberOwner } from './lib/assets'
import { nameMatchesMemory } from './lib/castContext'
import { syncAllCastMembersFromPets } from './lib/castSync'
import { requireUser } from './lib/requireUser'

type Ctx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>

async function resolveMemberAvatarUrl(
  ctx: Ctx,
  member: Pick<Doc<'castMembers'>, 'avatarAssetId' | 'referenceAssetIds'>,
) {
  const assetId = member.avatarAssetId ?? member.referenceAssetIds.at(0)
  if (!assetId) return null
  const asset = await ctx.db.get(assetId)
  if (!asset) return null
  return await resolveAssetUrl(ctx, asset)
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)

    const members = await ctx.db
      .query('castMembers')
      .withIndex('by_owner_status', (q) =>
        q.eq('ownerUserId', user._id).eq('status', 'active'),
      )
      .collect()

    members.sort((a, b) => a.sortOrder - b.sortOrder)

    return Promise.all(
      members.map(async (member) => {
        const linkedPet = member.linkedPetId
          ? await ctx.db.get(member.linkedPetId)
          : null
        return {
          ...member,
          avatarUrl: await resolveMemberAvatarUrl(ctx, member),
          linkedPetName: linkedPet?.name ?? null,
        }
      }),
    )
  },
})

export const getById = query({
  args: { castMemberId: v.id('castMembers') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const member = await requireCastMemberOwner(ctx, args.castMemberId, user._id)

    const referencePhotos = await Promise.all(
      member.referenceAssetIds.map(async (assetId) => {
        const asset = await ctx.db.get(assetId)
        if (!asset) return null
        return {
          assetId,
          url: await resolveAssetUrl(ctx, asset),
        }
      }),
    )

    const linkedPet = member.linkedPetId
      ? await ctx.db.get(member.linkedPetId)
      : null

    return {
      ...member,
      avatarUrl: await resolveMemberAvatarUrl(ctx, member),
      linkedPetName: linkedPet?.name ?? null,
      referencePhotos: referencePhotos.filter(
        (photo): photo is NonNullable<typeof photo> => photo !== null,
      ),
    }
  },
})

export const ensureSyncedFromPets = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    await syncAllCastMembersFromPets(ctx, user._id)
    return null
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    kind: v.union(v.literal('person'), v.literal('animal')),
    aliases: v.optional(v.array(v.string())),
    relationship: v.optional(v.string()),
    species: v.optional(v.string()),
    breed: v.optional(v.string()),
    visualDescription: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const name = args.name.trim()
    if (!name) throw new Error('Name is required')

    const visualDescription = args.visualDescription.trim()
    if (!visualDescription) throw new Error('Visual description is required')

    const members = await ctx.db
      .query('castMembers')
      .withIndex('by_owner', (q) => q.eq('ownerUserId', user._id))
      .collect()
    const maxSort = members.reduce((n, m) => Math.max(n, m.sortOrder), 0)

    const now = Date.now()
    const castMemberId = await ctx.db.insert('castMembers', {
      ownerUserId: user._id,
      name,
      aliases: (args.aliases ?? []).map((alias) => alias.trim()).filter(Boolean),
      kind: args.kind,
      relationship: args.relationship?.trim() || undefined,
      species: args.species?.trim() || undefined,
      breed: args.breed?.trim() || undefined,
      visualDescription,
      referenceAssetIds: [],
      sortOrder: maxSort + 10,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })

    return { castMemberId }
  },
})

export const update = mutation({
  args: {
    castMemberId: v.id('castMembers'),
    name: v.optional(v.string()),
    aliases: v.optional(v.array(v.string())),
    relationship: v.optional(v.string()),
    species: v.optional(v.string()),
    breed: v.optional(v.string()),
    visualDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const member = await requireCastMemberOwner(ctx, args.castMemberId, user._id)

    const now = Date.now()
    const patch: Record<string, unknown> = { updatedAt: now }

    if (args.name !== undefined) {
      const name = args.name.trim()
      if (!name) throw new Error('Name cannot be empty')
      patch.name = name
    }
    if (args.aliases !== undefined) {
      patch.aliases = args.aliases.map((alias) => alias.trim()).filter(Boolean)
    }
    if (args.relationship !== undefined) {
      patch.relationship = args.relationship.trim() || undefined
    }
    if (args.species !== undefined) {
      patch.species = args.species.trim() || undefined
    }
    if (args.breed !== undefined) {
      patch.breed = args.breed.trim() || undefined
    }
    if (args.visualDescription !== undefined) {
      const visualDescription = args.visualDescription.trim()
      if (!visualDescription) throw new Error('Visual description is required')
      patch.visualDescription = visualDescription
    }

    if (member.linkedPetId) {
      delete patch.species
      delete patch.breed
      if (args.name !== undefined) {
        throw new Error('Rename linked pets from their pet profile')
      }
    }

    await ctx.db.patch(args.castMemberId, patch)
    return null
  },
})

export const archive = mutation({
  args: { castMemberId: v.id('castMembers') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const member = await requireCastMemberOwner(ctx, args.castMemberId, user._id)

    if (member.linkedPetId) {
      const pet = await ctx.db.get(member.linkedPetId)
      if (pet && pet.deletedAt === undefined) {
        throw new Error('Remove linked pets from the Pets page')
      }
    }

    await ctx.db.patch(args.castMemberId, {
      status: 'archived',
      updatedAt: Date.now(),
    })
    return null
  },
})

export const addReferencePhoto = mutation({
  args: {
    castMemberId: v.id('castMembers'),
    assetId: v.id('assets'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const member = await requireCastMemberOwner(ctx, args.castMemberId, user._id)

    const asset = await ctx.db.get(args.assetId)
    if (!asset || asset.ownerUserId !== user._id) {
      throw new Error('Asset not found')
    }
    if (asset.kind !== 'reference_photo') {
      throw new Error('Invalid asset kind')
    }
    if (asset.castMemberId !== args.castMemberId) {
      throw new Error('Asset does not belong to this cast member')
    }
    if (member.referenceAssetIds.includes(args.assetId)) {
      return null
    }

    const referenceAssetIds = [...member.referenceAssetIds, args.assetId]
    const patch: {
      referenceAssetIds: typeof referenceAssetIds
      updatedAt: number
      avatarAssetId?: typeof args.assetId
    } = {
      referenceAssetIds,
      updatedAt: Date.now(),
    }
    if (!member.avatarAssetId) {
      patch.avatarAssetId = args.assetId
    }

    await ctx.db.patch(args.castMemberId, patch)
    return null
  },
})

export const removeReferencePhoto = mutation({
  args: {
    castMemberId: v.id('castMembers'),
    assetId: v.id('assets'),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const member = await requireCastMemberOwner(ctx, args.castMemberId, user._id)

    const referenceAssetIds = member.referenceAssetIds.filter(
      (id) => id !== args.assetId,
    )
    const patch: {
      referenceAssetIds: typeof referenceAssetIds
      updatedAt: number
      avatarAssetId?: typeof args.assetId
    } = {
      referenceAssetIds,
      updatedAt: Date.now(),
    }

    if (member.avatarAssetId === args.assetId) {
      patch.avatarAssetId = referenceAssetIds.at(0)
    }

    await ctx.db.patch(args.castMemberId, patch)
    return null
  },
})

export const reorder = mutation({
  args: {
    orderedIds: v.array(v.id('castMembers')),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const now = Date.now()

    for (let i = 0; i < args.orderedIds.length; i++) {
      const castMemberId = args.orderedIds[i]
      const member = await requireCastMemberOwner(ctx, castMemberId, user._id)
      await ctx.db.patch(member._id, {
        sortOrder: (i + 1) * 10,
        updatedAt: now,
      })
    }

    return null
  },
})

export const previewMatches = query({
  args: { memoryDescription: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const members = await ctx.db
      .query('castMembers')
      .withIndex('by_owner_status', (q) =>
        q.eq('ownerUserId', user._id).eq('status', 'active'),
      )
      .collect()

    return members
      .filter((member) =>
        nameMatchesMemory(args.memoryDescription, member.name, member.aliases),
      )
      .map((member) => ({ castMemberId: member._id, name: member.name }))
  },
})
