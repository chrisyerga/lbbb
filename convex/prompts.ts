import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const seedDefaultPrompt = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query('promptVersions')
      .withIndex('by_key_version', (q) => q.eq('key', 'pet_blog_post').eq('version', 1))
      .unique()

    if (existing) return existing._id

    return await ctx.db.insert('promptVersions', {
      key: 'pet_blog_post',
      version: 1,
      purpose: 'Generate a tasteful public blog post from a daily pet memory.',
      provider: 'openai',
      model: process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.4-mini',
      systemPrompt:
        'You write warm, specific, non-cringey pet blog posts. Preserve the owner voice, avoid baby talk, and keep posts suitable for public indexing.',
      userPromptTemplate:
        'Pet: {{petName}}\nMemory: {{memoryDescription}}\nStyle: {{styleDescription}}\nReturn JSON with title, excerpt, bodyMarkdown, tags, and imagePrompt.',
      outputSchema: {
        type: 'object',
        required: ['title', 'excerpt', 'bodyMarkdown', 'tags', 'imagePrompt'],
      },
      parameters: { temperature: 0.7 },
      active: true,
      createdAt: Date.now(),
    })
  },
})

export const activeByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('promptVersions')
      .withIndex('by_active', (q) => q.eq('key', args.key).eq('active', true))
      .first()
  },
})
