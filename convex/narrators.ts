import { query } from './_generated/server'
import { v } from 'convex/values'
import { getAccountByUserId } from './lib/requireAccount'
import { hasFeature } from './lib/userAccount'
import type { CatalogNarrator } from './lib/narratorTypes'
import { optionalUser } from './lib/requireUser'
import { resolveAssetUrl } from './lib/assets'

export const listPublished = query({
  args: {},
  handler: async (ctx): Promise<Array<CatalogNarrator>> => {
    const user = await optionalUser(ctx)
    const account = user ? await getAccountByUserId(ctx, user._id) : null

    const narrators = await ctx.db
      .query('narrators')
      .withIndex('by_public', (q) => q.eq('public', true).eq('status', 'published'))
      .collect()

    const visible = narrators.filter((narrator) => {
      if (!narrator.minPlanTier) return true
      if (!account) return narrator.minPlanTier === 'pup'
      if (narrator.minPlanTier === 'top_dog') {
        return hasFeature(account, 'all_narrator_voices')
      }
      if (narrator.minPlanTier === 'the_pack') {
        return account.planTier === 'the_pack'
      }
      return true
    })

    visible.sort((a, b) => a.sortOrder - b.sortOrder)

    return Promise.all(
      visible.map(async (narrator) => {
        const artStyle = await ctx.db.get(narrator.defaultArtStyleId)
        let avatarUrl: string | null = null
        if (narrator.avatarAssetId) {
          const asset = await ctx.db.get(narrator.avatarAssetId)
          if (asset) avatarUrl = await resolveAssetUrl(ctx, asset)
        }

        return {
          _id: narrator._id,
          slug: narrator.slug,
          name: narrator.name,
          tagline: narrator.tagline,
          exampleExcerpt: narrator.exampleExcerpt,
          featured: narrator.featured,
          minPlanTier: narrator.minPlanTier,
          avatarUrl,
          defaultArtStyle: {
            slug: artStyle?.slug ?? 'watercolor',
            name: artStyle?.name ?? 'Watercolor',
          },
        }
      }),
    )
  },
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const narrator = await ctx.db
      .query('narrators')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()

    if (!narrator || narrator.status !== 'published' || !narrator.public) {
      return null
    }

    const artStyle = await ctx.db.get(narrator.defaultArtStyleId)
    return {
      _id: narrator._id,
      slug: narrator.slug,
      name: narrator.name,
      tagline: narrator.tagline,
      exampleExcerpt: narrator.exampleExcerpt,
      defaultArtStyle: artStyle
        ? { slug: artStyle.slug, name: artStyle.name }
        : null,
    }
  },
})

export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    const featured = await ctx.db
      .query('narrators')
      .withIndex('by_featured', (q) =>
        q.eq('featured', true).eq('status', 'published'),
      )
      .collect()

    featured.sort((a, b) => a.sortOrder - b.sortOrder)
    if (featured[0]) return featured[0]._id
    const fallback = await ctx.db.query('narrators').first()
    return fallback?._id ?? null
  },
})
