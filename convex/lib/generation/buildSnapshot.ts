import type { GenericQueryCtx } from 'convex/server'
import type { DataModel, Doc, Id } from '../../_generated/dataModel'
import { artStyleSnapshotFromDoc, narratorSnapshotFromDoc } from './types'
import type { CastSnapshotEntry, GenerationPlan, TextParameters } from './types'
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

export function resolveImagePromptSuffix(artStyle: Doc<'artStyles'>, narrator?: Doc<'narrators'>) {
  const parts = [artStyle.imagePromptSuffix.trim()]
  const narratorSuffix = narrator?.imagePromptSuffix?.trim()
  if (narratorSuffix) parts.push(narratorSuffix)
  return parts.filter(Boolean).join(' ')
}

async function loadNarratorBundleInternal(
  ctx: Ctx,
  narratorId: Id<'narrators'>,
  options: { requirePublished: boolean },
) {
  const narrator = await ctx.db.get(narratorId)
  if (!narrator) {
    throw new Error('Narrator not found')
  }
  if (options.requirePublished) {
    if (narrator.status !== 'published') {
      throw new Error('Narrator not found')
    }
  } else if (narrator.status === 'archived') {
    throw new Error('Narrator is archived')
  }

  const artStyle = await ctx.db.get(narrator.defaultArtStyleId)
  if (!artStyle || artStyle.status !== 'active') {
    throw new Error('Narrator art style not found')
  }

  const traits = await Promise.all(narrator.traitIds.map((id) => ctx.db.get(id)))

  const promptVersion = await ctx.db
    .query('promptVersions')
    .withIndex('by_active', (q) => q.eq('key', narrator.promptVersionKey).eq('active', true))
    .first()

  return {
    narrator,
    artStyle,
    traits: traits.filter((t): t is Doc<'narratorTraits'> => t !== null),
    promptVersion,
  }
}

export async function loadNarratorBundle(ctx: Ctx, narratorId: Id<'narrators'>) {
  return await loadNarratorBundleInternal(ctx, narratorId, { requirePublished: true })
}

export async function loadNarratorBundleForAdmin(ctx: Ctx, narratorId: Id<'narrators'>) {
  return await loadNarratorBundleInternal(ctx, narratorId, { requirePublished: false })
}

function buildGenerationPlanFromBundle(
  bundle: Awaited<ReturnType<typeof loadNarratorBundleInternal>>,
  args: {
    memoryDescription: string
    petName: string
    petSpecies?: string
    castSnapshot?: Array<CastSnapshotEntry>
  },
): GenerationPlan {
  const { narrator, artStyle, traits, promptVersion } = bundle

  const personaBlock = composePersonaPrompt({
    traits,
    specializationPrompt: narrator.specializationPrompt,
    systemPromptAddon: narrator.systemPromptAddon,
  })

  const moodHints = narrator.defaultMoodHints ?? []
  const wordTarget = narrator.wordTarget

  const systemPrompt = [promptVersion?.systemPrompt ?? defaultSystemPrompt(), personaBlock].filter(Boolean).join('\n\n')

  const castBlock = args.castSnapshot?.length ? buildCastBlock(args.castSnapshot) : ''

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
  const streamUserPrompt = interpolateTemplate(DEFAULT_STREAM_USER_TEMPLATE, templateVars)

  const textParameters: TextParameters = {
    temperature:
      narrator.textParameters?.temperature ??
      (typeof promptVersion?.parameters?.temperature === 'number' ? promptVersion.parameters.temperature : 0.7),
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
      model: narrator.textModel ?? promptVersion?.model ?? process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.4-mini',
      parameters: textParameters,
      wordTarget,
      strategy: narrator.generationStrategy,
    },
    image: {
      artStyle: artStyleSnapshotFromDoc(artStyle),
      promptSuffix: imagePromptSuffix,
      model: narrator.imageModel ?? process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2',
      variantCount: 4,
    },
    speech: narrator.speechProfile,
  }
}

type ResolveGenerationPlanArgs = {
  narratorId: Id<'narrators'>
  memoryDescription: string
  petName: string
  petSpecies?: string
  castSnapshot?: Array<CastSnapshotEntry>
}

export async function resolveGenerationPlan(ctx: Ctx, args: ResolveGenerationPlanArgs): Promise<GenerationPlan> {
  const bundle = await loadNarratorBundle(ctx, args.narratorId)
  return buildGenerationPlanFromBundle(bundle, args)
}

export async function resolveGenerationPlanForAdmin(
  ctx: Ctx,
  args: ResolveGenerationPlanArgs,
): Promise<GenerationPlan> {
  const bundle = await loadNarratorBundleForAdmin(ctx, args.narratorId)
  return buildGenerationPlanFromBundle(bundle, args)
}
