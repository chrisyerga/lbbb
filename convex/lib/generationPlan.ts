import type { GenericQueryCtx } from 'convex/server'
import type { DataModel, Doc, Id } from '../_generated/dataModel'
import {
  buildCastBlock,
  buildCastVisualSuffix,
} from './castContext'
import {
  imagePromptVariants,
  resolveBaseImagePrompt,
} from './imagePrompt'
import {
  artStyleSnapshotFromDoc,
  narratorSnapshotFromDoc,
} from './narratorTypes'
import type {
  CastSnapshotEntry,
  GenerationPlan,
  TextParameters,
} from './narratorTypes'

type Ctx = GenericQueryCtx<DataModel>

const DEFAULT_SYSTEM_PROMPT =
  'You write warm, specific, non-cringey pet blog posts. Preserve the owner voice, avoid baby talk, and keep posts suitable for public indexing.'

const DEFAULT_USER_TEMPLATE = [
  'Pet: {{petName}}',
  'Memory: {{memoryDescription}}',
  '{{castBlock}}',
  '{{personaBlock}}',
  '{{moodBlock}}',
  'Write a public blog post of about {{wordTarget}} words.',
  'Return JSON with exactly these keys: title, excerpt, bodyMarkdown, tags (string array), imagePrompt.',
  'imagePrompt must be a vivid single-scene description for an illustration of this memory.',
].join('\n')

const DEFAULT_STREAM_USER_TEMPLATE = [
  'Pet: {{petName}}',
  'Memory: {{memoryDescription}}',
  '{{castBlock}}',
  '{{personaBlock}}',
  '{{moodBlock}}',
  'Write a public blog post of about {{wordTarget}} words in Markdown.',
  'Output only the post body in Markdown (headings and paragraphs). Do not include JSON or a title line.',
].join('\n')

const DEFAULT_METADATA_USER_TEMPLATE = [
  'Pet: {{petName}}',
  'Memory: {{memoryDescription}}',
  'Blog post body (Markdown):',
  '{{bodyMarkdown}}',
  'Return JSON with exactly these keys: title, excerpt, tags (string array), imagePrompt.',
  'imagePrompt must be a vivid single-scene description for an illustration of this memory.',
].join('\n')

function interpolateTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}

export function composePersonaPrompt(args: {
  traits: Array<Doc<'narratorTraits'>>
  specializationPrompt: string
  systemPromptAddon?: string
}): string {
  const fragments = args.traits
    .filter((t) => t.status === 'active')
    .map((t) => t.promptFragment.trim())
    .filter(Boolean)

  const parts = [
    'Writing persona:',
    ...fragments.map((f) => `- ${f}`),
    args.specializationPrompt.trim(),
    args.systemPromptAddon?.trim(),
  ].filter(Boolean)

  return parts.join('\n')
}

function moodBlock(moodHints: Array<string>) {
  const all = moodHints.filter(Boolean)
  if (!all.length) return ''
  return `Mood and scene tone: ${all.join(', ')}`
}

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
    promptVersion?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    personaBlock,
  ]
    .filter(Boolean)
    .join('\n\n')

  const castBlock = buildCastBlock(args.castSnapshot ?? [])

  console.log('castBlock', castBlock)
  console.log('personaBlock', personaBlock)
  console.log('moodBlock', moodBlock(moodHints))
  console.log('wordTarget', wordTarget)
  console.log('promptVersion?.userPromptTemplate', promptVersion?.userPromptTemplate)
  console.log('DEFAULT_USER_TEMPLATE', DEFAULT_USER_TEMPLATE)
  console.log('args.petName', args.petName)
  console.log('args.petSpecies', args.petSpecies)
  console.log('args.memoryDescription', args.memoryDescription)
  console.log('args.castSnapshot', args.castSnapshot)
  console.log('narrator.textParameters', narrator.textParameters)
  console.log('promptVersion.parameters', promptVersion?.parameters)
  console.log('narrator.textModel', narrator.textModel)
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
  const metadataUserPrompt = DEFAULT_METADATA_USER_TEMPLATE

  console.log('userPrompt', userPrompt)

  const textParameters: TextParameters = {
    temperature:
      narrator.textParameters?.temperature ??
      (typeof promptVersion?.parameters?.temperature === 'number'
        ? promptVersion.parameters.temperature
        : 0.7),
    maxTokens: narrator.textParameters?.maxTokens,
  }

  const imagePromptSuffix = resolveImagePromptSuffix(artStyle, narrator)

  console.log('textParameters', textParameters)
  console.log('imagePromptSuffix', imagePromptSuffix)

  return {
    narratorId: narrator._id,
    narratorSnapshot: narratorSnapshotFromDoc(narrator),
    promptVersionId: promptVersion?._id,
    text: {
      systemPrompt,
      userPrompt,
      streamUserPrompt,
      metadataUserPrompt,
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

export function buildTextPromptFromPlan(plan: GenerationPlan) {
  return `${plan.text.systemPrompt}\n\n${plan.text.userPrompt}`
}

export function buildStreamMessagesFromPlan(plan: GenerationPlan) {
  return {
    systemPrompt: plan.text.systemPrompt,
    userPrompt: plan.text.streamUserPrompt,
    model: plan.text.model,
    parameters: plan.text.parameters,
  }
}

export function buildMetadataPromptFromPlan(
  plan: GenerationPlan,
  vars: {
    petName: string
    memoryDescription: string
    castBlock: string
    personaBlock: string
    moodBlock: string
    bodyMarkdown: string
  },
) {
  const userPrompt = interpolateTemplate(plan.text.metadataUserPrompt, {
    petName: vars.petName,
    memoryDescription: vars.memoryDescription,
    castBlock: vars.castBlock ? `${vars.castBlock}\n` : '',
    personaBlock: vars.personaBlock,
    moodBlock: vars.moodBlock,
    wordTarget: String(plan.text.wordTarget),
    bodyMarkdown: vars.bodyMarkdown,
  })
  return `${plan.text.systemPrompt}\n\n${userPrompt}`
}

export function buildImagePromptsFromPlan(args: {
  plan: GenerationPlan
  textResult: {
    imagePrompt?: string
    title?: string
    excerpt?: string
  }
  petName: string
  memoryDescription: string
  moodHints?: Array<string>
  castSnapshot?: Array<CastSnapshotEntry>
}) {
  const artStyleLabel = args.plan.image.artStyle.name
  const baseImagePrompt = resolveBaseImagePrompt({
    textResult: args.textResult,
    petName: args.petName,
    memoryDescription: args.memoryDescription,
    moodHints: args.moodHints,
  })

  const castSuffix = buildCastVisualSuffix(args.castSnapshot ?? [])
  const withCast = castSuffix ? `${baseImagePrompt} ${castSuffix}` : baseImagePrompt

  const suffix = args.plan.image.promptSuffix
  const styledBase = suffix ? `${withCast} ${suffix}` : withCast

  return imagePromptVariants(
    styledBase,
    artStyleLabel,
    args.plan.image.variantCount,
  )
}
