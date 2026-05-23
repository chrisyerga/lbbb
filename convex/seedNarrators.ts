import { internalMutation, mutation } from './_generated/server'
import type { DataModel, Id } from './_generated/dataModel'
import type { GenericMutationCtx } from 'convex/server'
import { requireStaff } from './lib/requireAccount'

type SeedCtx = GenericMutationCtx<DataModel>

type TraitSeed = {
  slug: string
  label: string
  category:
    | 'personality'
    | 'tone'
    | 'register'
    | 'cultural'
    | 'pacing'
  promptFragment: string
  sortOrder: number
}

type ArtStyleSeed = {
  slug: string
  name: string
  description: string
  imagePromptSuffix: string
  sortOrder: number
}

type NarratorSeed = {
  slug: string
  name: string
  tagline: string
  exampleExcerpt: string
  description: string
  traitSlugs: Array<string>
  specializationPrompt: string
  defaultArtStyleSlug: string
  defaultMoodHints: Array<string>
  wordTarget: number
  featured: boolean
  sortOrder: number
  minPlanTier?: 'pup' | 'top_dog' | 'the_pack'
}

const TRAIT_SEEDS: Array<TraitSeed> = [
  {
    slug: 'sarcastic',
    label: 'Sarcastic',
    category: 'tone',
    promptFragment: 'Use dry, sarcastic wit without being mean to the pet.',
    sortOrder: 1,
  },
  {
    slug: 'grumpy',
    label: 'Grumpy',
    category: 'personality',
    promptFragment: 'Sound mildly grumpy but affectionate underneath.',
    sortOrder: 2,
  },
  {
    slug: 'flirtatious',
    label: 'Flirtatious',
    category: 'tone',
    promptFragment: 'Use playful, flirtatious charm in a family-safe way.',
    sortOrder: 3,
  },
  {
    slug: 'silly',
    label: 'Silly',
    category: 'personality',
    promptFragment: 'Lean into silly, joyful exaggeration.',
    sortOrder: 4,
  },
  {
    slug: 'stoner',
    label: 'Stoner',
    category: 'register',
    promptFragment: 'Use laid-back, meandering observations and gentle absurdity.',
    sortOrder: 5,
  },
  {
    slug: 'literary',
    label: 'Literary',
    category: 'register',
    promptFragment: 'Write with literary polish and vivid sensory detail.',
    sortOrder: 6,
  },
  {
    slug: 'midwestern',
    label: 'Midwestern',
    category: 'cultural',
    promptFragment: 'Use plainspoken Midwestern warmth and understatement.',
    sortOrder: 7,
  },
  {
    slug: 'warm',
    label: 'Warm',
    category: 'tone',
    promptFragment: 'Keep the tone tender, sincere, and emotionally open.',
    sortOrder: 8,
  },
  {
    slug: 'formal',
    label: 'Formal',
    category: 'register',
    promptFragment: 'Use precise, formal diction with restrained emotion.',
    sortOrder: 9,
  },
  {
    slug: 'chaotic',
    label: 'Chaotic',
    category: 'pacing',
    promptFragment: 'Let the pacing feel chaotic, breathless, and delighted.',
    sortOrder: 10,
  },
  {
    slug: 'dry',
    label: 'Dry',
    category: 'tone',
    promptFragment: 'Keep humor dry, deadpan, and observational.',
    sortOrder: 11,
  },
  {
    slug: 'nostalgic',
    label: 'Nostalgic',
    category: 'cultural',
    promptFragment: 'Evoke nostalgia with specific, lived-in cultural references.',
    sortOrder: 12,
  },
  {
    slug: 'wholesome',
    label: 'Wholesome',
    category: 'personality',
    promptFragment: 'Stay wholesome, optimistic, and family-friendly.',
    sortOrder: 13,
  },
  {
    slug: 'irreverent',
    label: 'Irreverent',
    category: 'tone',
    promptFragment: 'Be irreverent and cheeky while still loving the pet.',
    sortOrder: 14,
  },
  {
    slug: 'pedantic',
    label: 'Pedantic',
    category: 'personality',
    promptFragment: 'Sound pedantic, over-explanatory, and delightfully precise.',
    sortOrder: 15,
  },
]

const ART_STYLE_SEEDS: Array<ArtStyleSeed> = [
  {
    slug: 'watercolor',
    name: 'Watercolor',
    description: 'Soft washes and gentle edges.',
    imagePromptSuffix: 'Soft watercolor illustration with gentle washes.',
    sortOrder: 1,
  },
  {
    slug: 'comic',
    name: 'Comic strip',
    description: 'Panels, halftone, and bold outlines.',
    imagePromptSuffix: 'Comic strip illustration with bold outlines and halftone.',
    sortOrder: 2,
  },
  {
    slug: 'polaroid',
    name: 'Polaroid',
    description: 'Square frame with nostalgic grain.',
    imagePromptSuffix: 'Polaroid-style photo illustration with subtle grain.',
    sortOrder: 3,
  },
  {
    slug: 'anime',
    name: 'Anime',
    description: 'Cel-shaded lines and expressive faces.',
    imagePromptSuffix: 'Anime cel-shaded illustration with clean lines.',
    sortOrder: 4,
  },
  {
    slug: 'oil',
    name: 'Oil paint',
    description: 'Thick impasto and painterly texture.',
    imagePromptSuffix: 'Oil painting with thick impasto texture.',
    sortOrder: 5,
  },
  {
    slug: 'sticker',
    name: 'Sticker book',
    description: 'Die-cut charm with flat color.',
    imagePromptSuffix: 'Sticker-book illustration with flat color and die-cut feel.',
    sortOrder: 6,
  },
]

const NARRATOR_SEEDS: Array<NarratorSeed> = [
  {
    slug: 'earnest-pet-mom',
    name: 'Earnest Pet-Mom',
    tagline: 'Tender, sincere, and a little weepy.',
    exampleExcerpt:
      'I still cannot believe the little way she looked at me when the treat bag crinkled.',
    description: 'Warm, emotionally open posts with sincere affection.',
    traitSlugs: ['warm', 'wholesome'],
    specializationPrompt:
      'Write like a devoted pet parent who finds everyday moments genuinely moving.',
    defaultArtStyleSlug: 'watercolor',
    defaultMoodHints: ['tender', 'proud'],
    wordTarget: 200,
    featured: true,
    sortOrder: 1,
  },
  {
    slug: 'wry-essayist',
    name: 'Wry Essayist',
    tagline: 'Dry humor, sharp eye, soft heart.',
    exampleExcerpt:
      'The dog had, once again, mistaken confidence for competence.',
    description: 'Observational humor with literary restraint.',
    traitSlugs: ['dry', 'literary', 'sarcastic'],
    specializationPrompt:
      'Write like a wry personal essayist noticing the absurdity of pet ownership.',
    defaultArtStyleSlug: 'polaroid',
    defaultMoodHints: ['cozy'],
    wordTarget: 200,
    featured: true,
    sortOrder: 2,
  },
  {
    slug: 'wes-anderson',
    name: 'Wes Anderson',
    tagline: 'Symmetrical feelings in vintage hues.',
    exampleExcerpt:
      'Chapter One, in which Biscuit considers the moral implications of a rogue tennis ball.',
    description: 'Precise, whimsical narration with cinematic framing.',
    traitSlugs: ['formal', 'nostalgic', 'literary'],
    specializationPrompt:
      'Write with symmetrical whimsy, chapter titles, and deadpan emotional stakes.',
    defaultArtStyleSlug: 'comic',
    defaultMoodHints: ['dramatic'],
    wordTarget: 250,
    featured: false,
    sortOrder: 3,
    minPlanTier: 'top_dog',
  },
  {
    slug: 'sports-announcer',
    name: 'Sports Announcer',
    tagline: 'Every walk is the big game.',
    exampleExcerpt:
      'AND SHE TAKES THE CORNER AT FULL SPEED — what a move from a very small athlete!',
    description: 'High-energy play-by-play narration.',
    traitSlugs: ['chaotic', 'silly'],
    specializationPrompt:
      'Call the memory like an excited sports broadcast with rising drama.',
    defaultArtStyleSlug: 'sticker',
    defaultMoodHints: ['sporty', 'proud'],
    wordTarget: 180,
    featured: false,
    sortOrder: 4,
    minPlanTier: 'top_dog',
  },
  {
    slug: 'kids-book',
    name: "Kid's Book",
    tagline: 'Simple words, big wonder.',
    exampleExcerpt:
      'Zoe went zoom-zoom through the leaves, and the whole park felt like magic.',
    description: 'Gentle, read-aloud storytelling for all ages.',
    traitSlugs: ['wholesome', 'warm', 'silly'],
    specializationPrompt:
      "Write like a picture-book narrator with simple rhythms and gentle wonder.",
    defaultArtStyleSlug: 'watercolor',
    defaultMoodHints: ['cozy', 'tender'],
    wordTarget: 150,
    featured: false,
    sortOrder: 5,
  },
]

async function seedCatalogHandler(ctx: SeedCtx) {
  const existingNarrator = await ctx.db.query('narrators').first()
  if (existingNarrator) {
    return { seeded: false, reason: 'Catalog already seeded' }
  }

  const existingPrompt = await ctx.db
    .query('promptVersions')
    .withIndex('by_key_version', (q) =>
      q.eq('key', 'pet_blog_post').eq('version', 1),
    )
    .unique()

  if (!existingPrompt) {
    await ctx.db.insert('promptVersions', {
      key: 'pet_blog_post',
      version: 1,
      purpose: 'Generate a tasteful public blog post from a daily pet memory.',
      provider: 'openai',
      model: process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.4-mini',
      systemPrompt:
        'You write warm, specific, non-cringey pet blog posts. Preserve the owner voice, avoid baby talk, and keep posts suitable for public indexing.',
      userPromptTemplate:
        'Pet: {{petName}}\nMemory: {{memoryDescription}}\n{{personaBlock}}\n{{moodBlock}}\nWrite a public blog post of about {{wordTarget}} words.\nReturn JSON with title, excerpt, bodyMarkdown, tags, and imagePrompt.',
      outputSchema: {
        type: 'object',
        required: ['title', 'excerpt', 'bodyMarkdown', 'tags', 'imagePrompt'],
      },
      parameters: { temperature: 0.7 },
      active: true,
      createdAt: Date.now(),
    })
  }

  const now = Date.now()
  const traitIds = new Map<string, Id<'narratorTraits'>>()

  for (const trait of TRAIT_SEEDS) {
    const traitId = await ctx.db.insert('narratorTraits', {
      slug: trait.slug,
      label: trait.label,
      category: trait.category,
      promptFragment: trait.promptFragment,
      sortOrder: trait.sortOrder,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
    traitIds.set(trait.slug, traitId)
  }

  const artStyleIds = new Map<string, Id<'artStyles'>>()
  for (const style of ART_STYLE_SEEDS) {
    const artStyleId = await ctx.db.insert('artStyles', {
      slug: style.slug,
      name: style.name,
      description: style.description,
      imagePromptSuffix: style.imagePromptSuffix,
      sortOrder: style.sortOrder,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
    artStyleIds.set(style.slug, artStyleId)
  }

  for (const narrator of NARRATOR_SEEDS) {
    const defaultArtStyleId = artStyleIds.get(narrator.defaultArtStyleSlug)
    if (!defaultArtStyleId) {
      throw new Error(`Missing art style ${narrator.defaultArtStyleSlug}`)
    }

    await ctx.db.insert('narrators', {
      slug: narrator.slug,
      name: narrator.name,
      tagline: narrator.tagline,
      description: narrator.description,
      exampleExcerpt: narrator.exampleExcerpt,
      traitIds: narrator.traitSlugs
        .map((slug) => traitIds.get(slug))
        .filter((id): id is Id<'narratorTraits'> => id !== undefined),
      specializationPrompt: narrator.specializationPrompt,
      promptVersionKey: 'pet_blog_post',
      defaultMoodHints: narrator.defaultMoodHints,
      wordTarget: narrator.wordTarget,
      defaultArtStyleId,
      generationStrategy: 'single_shot',
      public: true,
      featured: narrator.featured,
      minPlanTier: narrator.minPlanTier,
      sortOrder: narrator.sortOrder,
      status: 'published',
      createdAt: now,
      updatedAt: now,
    })
  }

  return {
    seeded: true,
    traits: TRAIT_SEEDS.length,
    artStyles: ART_STYLE_SEEDS.length,
    narrators: NARRATOR_SEEDS.length,
  }
}

/** Run from CLI: `npx convex run seedNarrators:seedCatalogInternal` */
export const seedCatalogInternal = internalMutation({
  args: {},
  handler: async (ctx) => await seedCatalogHandler(ctx),
})

/** Staff-only; call from the app while signed in. */
export const seedCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    await requireStaff(ctx)
    return await seedCatalogHandler(ctx)
  },
})
