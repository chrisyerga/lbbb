import { query } from './_generated/server'
import { v } from 'convex/values'
import { resolveAssetUrl } from './lib/assets'
import { requireStaff } from './lib/requireAccount'

export const listForStaff = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 200)
    const search = args.search?.trim().toLowerCase() ?? ''

    const pets = await ctx.db.query('pets').collect()
    const active = pets.filter((pet) => pet.deletedAt === undefined)

    const filtered = active.filter((pet) => {
      if (!search) return true
      const name = pet.name.toLowerCase()
      const species = (pet.species ?? '').toLowerCase()
      return name.includes(search) || species.includes(search)
    })

    filtered.sort((a, b) => a.name.localeCompare(b.name))

    return await Promise.all(
      filtered.slice(0, limit).map(async (pet) => ({
        _id: pet._id,
        name: pet.name,
        species: pet.species ?? null,
        ownerUserId: pet.ownerUserId,
        avatarUrl: pet.avatarAssetId
          ? await (async () => {
              const asset = await ctx.db.get(pet.avatarAssetId!)
              if (!asset) return null
              return await resolveAssetUrl(ctx, asset)
            })()
          : null,
      })),
    )
  },
})
