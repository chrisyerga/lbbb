import type { Doc } from '../../_generated/dataModel'
import { buildCastBlock, buildCastVisualSuffix } from '../castContext'
import { imagePromptVariants, resolveBaseImagePrompt } from '../imagePrompt'
import type { CastSnapshotEntry, GenerationPlan } from './types'

const DEFAULT_SYSTEM_PROMPT =
  'You write warm, specific, non-cringey pet blog posts. Preserve the owner voice, avoid baby talk, and keep posts suitable for public indexing.'

export const DEFAULT_USER_TEMPLATE = [
  'Pet: {{petName}}',
  'Memory: {{memoryDescription}}',
  '{{castBlock}}',
  '{{personaBlock}}',
  '{{moodBlock}}',
  'Write a public blog post of about {{wordTarget}} words.',
  'Return JSON with exactly these keys: title, excerpt, bodyMarkdown, tags (string array), imagePrompt.',
  'imagePrompt must be a vivid single-scene description for an illustration of this memory.',
].join('\n')

export const DEFAULT_STREAM_USER_TEMPLATE = [
  'Pet: {{petName}}',
  'Memory: {{memoryDescription}}',
  '{{castBlock}}',
  '{{personaBlock}}',
  '{{moodBlock}}',
  'Write a public blog post of about {{wordTarget}} words in Markdown.',
  'Output only the post body in Markdown (headings and paragraphs). Do not include JSON or a title line.',
].join('\n')

export const DEFAULT_METADATA_USER_TEMPLATE = [
  'Pet: {{petName}}',
  'Memory: {{memoryDescription}}',
  'Blog post body (Markdown):',
  '{{bodyMarkdown}}',
  'Return JSON with exactly these keys: title, excerpt, tags (string array), imagePrompt.',
  'imagePrompt must be a vivid single-scene description for an illustration of this memory.',
].join('\n')

export function defaultSystemPrompt() {
  return DEFAULT_SYSTEM_PROMPT
}

export function interpolateTemplate(template: string, vars: Record<string, string>): string {
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

export function moodBlock(moodHints: Array<string>) {
  const all = moodHints.filter(Boolean)
  if (!all.length) return ''
  return `Mood and scene tone: ${all.join(', ')}`
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

  return imagePromptVariants(styledBase, artStyleLabel, args.plan.image.variantCount)
}

export { buildCastBlock }
