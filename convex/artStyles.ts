import { query } from './_generated/server'

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const styles = await ctx.db
      .query('artStyles')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .collect()

    styles.sort((a, b) => a.sortOrder - b.sortOrder)

    return styles.map((style) => ({
      _id: style._id,
      slug: style.slug,
      name: style.name,
      description: style.description,
    }))
  },
})
