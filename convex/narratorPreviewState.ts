import { internalMutation, internalQuery } from './_generated/server'
import { v } from 'convex/values'

export const getPreviewForStreamInternal = internalQuery({
  args: { streamId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('narratorTextPreviews')
      .withIndex('by_streamId', (q) => q.eq('streamId', args.streamId))
      .first()
  },
})

export const patchPreviewStreamStatus = internalMutation({
  args: {
    previewId: v.id('narratorTextPreviews'),
    streamStatus: v.union(
      v.literal('idle'),
      v.literal('streaming_text'),
      v.literal('text_done'),
      v.literal('failed'),
    ),
    streamBody: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const preview = await ctx.db.get(args.previewId)
    if (!preview) throw new Error('Preview not found')
    await ctx.db.patch(args.previewId, {
      streamStatus: args.streamStatus,
      streamBody: args.streamBody ?? preview.streamBody,
      updatedAt: Date.now(),
    })
  },
})

export const upsertPreviewResult = internalMutation({
  args: {
    previewId: v.id('narratorTextPreviews'),
    title: v.string(),
    excerpt: v.string(),
    bodyMarkdown: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.previewId, {
      title: args.title,
      excerpt: args.excerpt,
      streamBody: args.bodyMarkdown,
      tags: args.tags,
      streamStatus: 'text_done',
      updatedAt: Date.now(),
    })
  },
})

export const markPreviewFailed = internalMutation({
  args: {
    previewId: v.id('narratorTextPreviews'),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.previewId, {
      streamStatus: 'failed',
      error: args.error,
      updatedAt: Date.now(),
    })
  },
})
