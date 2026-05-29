import type { GenericQueryCtx } from 'convex/server'
import type { DataModel, Doc, Id } from '../../_generated/dataModel'
import { buildCastVisualSuffix, resolveCastSnapshot } from '../castContext'
import { resolveImagePromptSuffix } from './buildSnapshot'
import { resolveBaseImagePrompt } from '../imagePrompt'
import { buildImagePromptsFromPlan } from './prompts'
import type { GenerationPlan } from './types'
import { artStyleSnapshotFromDoc, narratorSnapshotFromDoc } from './types'

type Ctx = GenericQueryCtx<DataModel>

const DEFAULT_TEXT_STUB = {
  systemPrompt: '',
  userPrompt: '',
  streamUserPrompt: '',
  metadataUserPrompt: '',
  model: '',
  parameters: {},
  wordTarget: 0,
  strategy: 'single_shot' as const,
}

function buildDryRunPlan(args: {
  artStyle: Doc<'artStyles'>
  narrator?: Doc<'narrators'>
  promptSuffix: string
  imageModel: string
}): GenerationPlan {
  return {
    narratorId: args.narrator?._id ?? ('' as Id<'narrators'>),
    narratorSnapshot: args.narrator
      ? narratorSnapshotFromDoc(args.narrator)
      : {
          slug: 'dry-run',
          name: 'Dry run',
          tagline: '',
          wordTarget: 0,
          generationStrategy: 'single_shot',
        },
    text: DEFAULT_TEXT_STUB,
    image: {
      artStyle: artStyleSnapshotFromDoc(args.artStyle),
      promptSuffix: args.promptSuffix,
      model: args.imageModel,
      variantCount: 4,
    },
  }
}

export async function computeArtStyleImageDryRun(
  ctx: Ctx,
  args: {
    artStyle: Doc<'artStyles'>
    pet: Doc<'pets'>
    memoryDescription: string
    imagePrompt?: string
    title?: string
    excerpt?: string
    narrator?: Doc<'narrators'>
  },
) {
  const memoryDescription = args.memoryDescription.trim()
  const petName = args.pet.name
  const petSpecies = args.pet.species

  const castSnapshot = await resolveCastSnapshot(ctx, {
    ownerUserId: args.pet.ownerUserId,
    subjectPetId: args.pet._id,
    memoryDescription,
  })

  const promptSuffix = resolveImagePromptSuffix(args.artStyle, args.narrator)
  const imageModel = args.narrator?.imageModel ?? process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2'

  const plan = buildDryRunPlan({
    artStyle: args.artStyle,
    narrator: args.narrator,
    promptSuffix,
    imageModel,
  })

  const textResult = {
    imagePrompt: args.imagePrompt?.trim() || undefined,
    title: args.title?.trim() || undefined,
    excerpt: args.excerpt?.trim() || undefined,
  }

  const baseImagePrompt = resolveBaseImagePrompt({
    textResult,
    petName,
    memoryDescription,
  })

  const castVisualSuffix = buildCastVisualSuffix(castSnapshot)
  const withCast = castVisualSuffix ? `${baseImagePrompt} ${castVisualSuffix}` : baseImagePrompt
  const styledBasePrompt = promptSuffix ? `${withCast} ${promptSuffix}` : withCast

  const imagePrompts = buildImagePromptsFromPlan({
    plan,
    textResult,
    petName,
    memoryDescription,
    castSnapshot,
  })

  return {
    testInputs: {
      petId: args.pet._id,
      petName,
      petSpecies,
      memoryDescription,
      imagePrompt: textResult.imagePrompt,
      title: textResult.title,
      excerpt: textResult.excerpt,
      narratorId: args.narrator?._id,
    },
    artStyle: {
      name: args.artStyle.name,
      slug: args.artStyle.slug,
      imagePromptSuffix: args.artStyle.imagePromptSuffix,
      status: args.artStyle.status,
    },
    narrator: args.narrator
      ? {
          name: args.narrator.name,
          slug: args.narrator.slug,
          imagePromptSuffix: args.narrator.imagePromptSuffix,
          imageModel: args.narrator.imageModel,
        }
      : undefined,
    castSnapshot,
    castVisualSuffix,
    baseImagePrompt,
    styledBasePrompt,
    promptSuffix,
    imageModel,
    imagePrompts,
    variantCount: plan.image.variantCount,
  }
}
