import { mutation } from './_generated/server'
import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { requireStaff } from './lib/requireAccount'
import { computeArtStyleImageDryRun } from './lib/generation/artStyleDryRun'

export const dryRunImagePrompts = mutation({
  args: {
    artStyleId: v.id('artStyles'),
    petId: v.id('pets'),
    memoryDescription: v.string(),
    imagePrompt: v.optional(v.string()),
    title: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    narratorId: v.optional(v.id('narrators')),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)

    const memoryDescription = args.memoryDescription.trim()
    if (memoryDescription.length < 10) {
      throw new Error('Sample scene must be at least 10 characters')
    }

    const artStyle = await ctx.db.get(args.artStyleId)
    if (!artStyle || artStyle.status === 'archived') {
      throw new Error('Art style not found')
    }

    const pet = await ctx.db.get(args.petId)
    if (!pet || pet.deletedAt !== undefined) {
      throw new Error('Pet not found')
    }

    let narrator: Doc<'narrators'> | undefined
    if (args.narratorId) {
      const loaded = await ctx.db.get(args.narratorId)
      if (!loaded || loaded.status === 'archived') {
        throw new Error('Narrator not found')
      }
      narrator = loaded
    }

    return await computeArtStyleImageDryRun(ctx, {
      artStyle,
      pet,
      memoryDescription,
      imagePrompt: args.imagePrompt,
      title: args.title,
      excerpt: args.excerpt,
      narrator,
    })
  },
})
