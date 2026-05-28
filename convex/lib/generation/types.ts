import type { Doc, Id } from '../../_generated/dataModel'

export const TRAIT_CATEGORIES = [
  'personality',
  'tone',
  'register',
  'cultural',
  'pacing',
] as const
export type TraitCategory = (typeof TRAIT_CATEGORIES)[number]

export const CATALOG_STATUSES = ['active', 'archived'] as const
export type CatalogStatus = (typeof CATALOG_STATUSES)[number]

export const NARRATOR_STATUSES = ['draft', 'published', 'archived'] as const
export type NarratorStatus = (typeof NARRATOR_STATUSES)[number]

export const GENERATION_STRATEGIES = ['single_shot', 'draft_critique'] as const
export type GenerationStrategy = (typeof GENERATION_STRATEGIES)[number]

export type TextParameters = {
  temperature?: number
  maxTokens?: number
}

export type SpeechProfile = {
  provider: 'elevenlabs'
  voiceId: string
  settings?: unknown
}

export type NarratorSnapshot = {
  slug: string
  name: string
  tagline: string
  exampleExcerpt?: string
  wordTarget: number
  generationStrategy: GenerationStrategy
}

export type ArtStyleSnapshot = {
  slug: string
  name: string
  imagePromptSuffix: string
}

export type GenerationPlan = {
  narratorId: Id<'narrators'>
  narratorSnapshot: NarratorSnapshot
  promptVersionId?: Id<'promptVersions'>
  text: {
    systemPrompt: string
    userPrompt: string
    streamUserPrompt: string
    metadataUserPrompt: string
    model: string
    parameters: TextParameters
    wordTarget: number
    strategy: GenerationStrategy
  }
  image: {
    artStyle: ArtStyleSnapshot
    promptSuffix: string
    model: string
    variantCount: number
  }
  speech?: SpeechProfile
}

export type CastSnapshotEntry = {
  castMemberId: Id<'castMembers'>
  name: string
  kind: 'pet' | 'person' | 'animal'
  visualDescription: string
  matchedInMemory: boolean
  referenceAssetIds: Array<Id<'assets'>>
}

export type MemoryJobPromptVars = {
  petName: string
  memoryDescription: string
  castBlock: string
  personaBlock: string
  moodBlock: string
}

export type MemoryJobInputSnapshot = {
  description: string
  petName: string
  petSpecies?: string
  narratorId: Id<'narrators'>
  generationPlan: GenerationPlan
  castSnapshot?: Array<CastSnapshotEntry>
  promptVars: MemoryJobPromptVars
}

export type TextGenerationResult = {
  title: string
  excerpt: string
  bodyMarkdown: string
  tags: Array<string>
  imagePrompt?: string
  usage?: {
    inputTokens?: number
    outputTokens?: number
  }
  providerRequestId?: string
}

export type CatalogNarrator = {
  _id: Id<'narrators'>
  slug: string
  name: string
  tagline: string
  exampleExcerpt?: string
  featured: boolean
  minPlanTier?: Doc<'narrators'>['minPlanTier']
  avatarUrl: string | null
  defaultArtStyle: {
    slug: string
    name: string
  }
}

export function narratorSnapshotFromDoc(
  narrator: Doc<'narrators'>,
): NarratorSnapshot {
  return {
    slug: narrator.slug,
    name: narrator.name,
    tagline: narrator.tagline,
    exampleExcerpt: narrator.exampleExcerpt,
    wordTarget: narrator.wordTarget,
    generationStrategy: narrator.generationStrategy,
  }
}

export function artStyleSnapshotFromDoc(
  artStyle: Doc<'artStyles'>,
): ArtStyleSnapshot {
  return {
    slug: artStyle.slug,
    name: artStyle.name,
    imagePromptSuffix: artStyle.imagePromptSuffix,
  }
}
