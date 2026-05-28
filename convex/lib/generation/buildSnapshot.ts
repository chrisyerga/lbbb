import type { GenericQueryCtx } from 'convex/server'
import type { DataModel, Doc, Id } from '../../_generated/dataModel'
import {
  artStyleSnapshotFromDoc,
  narratorSnapshotFromDoc,
} from './types'
import type {
  CastSnapshotEntry,
  GenerationPlan,
  TextParameters,
} from './types'
import {
  DEFAULT_METADATA_USER_TEMPLATE,
  DEFAULT_STREAM_USER_TEMPLATE,
  DEFAULT_USER_TEMPLATE,
  buildCastBlock,
  composePersonaPrompt,
  defaultSystemPrompt,
  interpolateTemplate,
  moodBlock,
} from './prompts'

type Ctx = GenericQueryCtx<DataModel>

function resolveImagePromptSuffix(
  artStyle: Doc<'artStyles'>,
  narrator?: Doc<'narrators'>,
) {
  const parts = [artStyle.imagePromptSuffix.trim()]
  const narratorSuffix = narrator?.imagePromptSuffix?.trim()
  if (narratorSuffix) parts.push(narratorSuffix)
  return parts.filter(Boolean).join(' ')
}

export async function loadNarratorBundle(
  ctx: Ctx,
  narratorId: Id<'narrators'>,
) {
  const narrator = await ctx.db.get(narratorId)
  if (!narrator || narrator.status !== 'published') {
    throw new Error('Narrator not found')
  }

  const artStyle = await ctx.db.get(narrator.defaultArtStyleId)
  if (!artStyle || artStyle.status !== 'active') {
    throw new Error('Narrator art style not found')
  }

  const traits = await Promise.all(
    narrator.traitIds.map((id) => ctx.db.get(id)),
  )

  const promptVersion = await ctx.db
    .query('promptVersions')
    .withIndex('by_active', (q) =>
      q.eq('key', narrator.promptVersionKey).eq('active', true),
    )
    .first()

  return {
    narrator,
    artStyle,
    traits: traits.filter((t): t is Doc<'narratorTraits'> => t !== null),
    promptVersion,
  }
}

export async function resolveGenerationPlan(
  ctx: Ctx,
  args: {
    narratorId: Id<'narrators'>
    memoryDescription: string
    petName: string
    petSpecies?: string
    castSnapshot?: Array<CastSnapshotEntry>
  },
): Promise<GenerationPlan> {
  const { narrator, artStyle, traits, promptVersion } =
    await loadNarratorBundle(ctx, args.narratorId)

  const personaBlock = composePersonaPrompt({
    traits,
    specializationPrompt: narrator.specializationPrompt,
    systemPromptAddon: narrator.systemPromptAddon,
  })

  const moodHints = narrator.defaultMoodHints ?? []
  const wordTarget = narrator.wordTarget

  const systemPrompt = [
    promptVersion?.systemPrompt ?? defaultSystemPrompt(),
    personaBlock,
  ]
    .filter(Boolean)
    .join('\n\n')

  const castBlock = args.castSnapshot?.length
    ? buildCastBlock(args.castSnapshot)
    : ''

  const templateVars = {
    petName: `${args.petName}${args.petSpecies ? ` (${args.petSpecies})` : ''}`,
    memoryDescription: args.memoryDescription.trim(),
    castBlock: castBlock ? `${castBlock}\n` : '',
    personaBlock,
    moodBlock: moodBlock(moodHints),
    wordTarget: String(wordTarget),
    bodyMarkdown: '',
  }

  const userTemplate = promptVersion?.userPromptTemplate ?? DEFAULT_USER_TEMPLATE
  const userPrompt = interpolateTemplate(userTemplate, templateVars)
  const streamUserPrompt = interpolateTemplate(
    DEFAULT_STREAM_USER_TEMPLATE,
    templateVars,
  )

  const textParameters: TextParameters = {
    temperature:
      narrator.textParameters?.temperature ??
      (typeof promptVersion?.parameters?.temperature === 'number'
        ? promptVersion.parameters.temperature
        : 0.7),
    maxTokens: narrator.textParameters?.maxTokens,
  }

  const imagePromptSuffix = resolveImagePromptSuffix(artStyle, narrator)

  return {
    narratorId: narrator._id,
    narratorSnapshot: narratorSnapshotFromDoc(narrator),
    promptVersionId: promptVersion?._id,
    text: {
      systemPrompt,
      userPrompt,
      streamUserPrompt,
      metadataUserPrompt: DEFAULT_METADATA_USER_TEMPLATE,
      model:
        narrator.textModel ??
        promptVersion?.model ??
        process.env.OPENAI_TEXT_MODEL ??
        'gpt-5.4-mini',
      parameters: textParameters,
      wordTarget,
      strategy: narrator.generationStrategy,
    },
    image: {
      artStyle: artStyleSnapshotFromDoc(artStyle),
      promptSuffix: imagePromptSuffix,
      model:
        narrator.imageModel ??
        process.env.OPENAI_IMAGE_MODEL ??
        'gpt-image-2',
      variantCount: 4,
    },
    speech: narrator.speechProfile,
  }
}
