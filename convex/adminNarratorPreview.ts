import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { components } from './_generated/api'
import { PersistentTextStreaming } from '@convex-dev/persistent-text-streaming'
import { requireStaff } from './lib/requireAccount'
import { requireUser } from './lib/requireUser'
import {
  buildMetadataPromptFromPlan,
  composePersonaPrompt,
  loadNarratorBundleForAdmin,
  moodBlock,
  resolveGenerationPlanForAdmin,
} from './lib/generationPlan'
import type { NarratorPreviewInputSnapshot } from './lib/generation/types'
import { isNarratorPreviewInputSnapshot, parsePreviewInputsForDisplay } from './lib/generation/previewSnapshot'

const persistentTextStreaming = new PersistentTextStreaming(components.persistentTextStreaming)

export const startTextPreview = mutation({
  args: {
    narratorId: v.id('narrators'),
    memoryDescription: v.string(),
    petName: v.optional(v.string()),
    petSpecies: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const user = await requireUser(ctx)

    const memoryDescription = args.memoryDescription.trim()
    if (memoryDescription.length < 10) {
      throw new Error('Sample story must be at least 10 characters')
    }

    const petName = (args.petName?.trim() || 'Rex').slice(0, 80)
    const petSpecies = args.petSpecies?.trim() || undefined

    const generationPlan = await resolveGenerationPlanForAdmin(ctx, {
      narratorId: args.narratorId,
      memoryDescription,
      petName,
      petSpecies,
    })

    const { narrator, traits } = await loadNarratorBundleForAdmin(ctx, args.narratorId)
    const personaBlock = composePersonaPrompt({
      traits,
      specializationPrompt: narrator.specializationPrompt,
      systemPromptAddon: narrator.systemPromptAddon,
    })
    const moodHints = narrator.defaultMoodHints ?? []

    const promptVars = {
      petName: `${petName}${petSpecies ? ` (${petSpecies})` : ''}`,
      memoryDescription,
      castBlock: '',
      personaBlock,
      moodBlock: moodBlock(moodHints),
    }

    const inputSnapshot: NarratorPreviewInputSnapshot = {
      memoryDescription,
      petName,
      petSpecies,
      generationPlan,
      promptVars,
    }

    const streamId = await persistentTextStreaming.createStream(ctx)
    const now = Date.now()

    const previewId = await ctx.db.insert('narratorTextPreviews', {
      staffUserId: user._id,
      narratorId: args.narratorId,
      streamId,
      inputSnapshot,
      streamStatus: 'idle',
      createdAt: now,
      updatedAt: now,
    })

    return { previewId, streamId }
  },
})

export const getTextPreview = query({
  args: { previewId: v.id('narratorTextPreviews') },
  handler: async (ctx, args) => {
    await requireStaff(ctx)
    const user = await requireUser(ctx)

    const preview = await ctx.db.get(args.previewId)
    if (!preview || preview.staffUserId !== user._id) {
      return null
    }

    const inputs = parsePreviewInputsForDisplay(preview.inputSnapshot)
    let metadataPromptPreview: string | null = null
    if (isNarratorPreviewInputSnapshot(preview.inputSnapshot) && preview.streamBody) {
      metadataPromptPreview = buildMetadataPromptFromPlan(preview.inputSnapshot.generationPlan, {
        ...preview.inputSnapshot.promptVars,
        bodyMarkdown: preview.streamBody,
      })
    }

    return {
      previewId: preview._id,
      streamId: preview.streamId,
      streamStatus: preview.streamStatus,
      streamBody: preview.streamBody ?? null,
      title: preview.title ?? null,
      excerpt: preview.excerpt ?? null,
      tags: preview.tags ?? null,
      error: preview.error ?? null,
      inputs,
      metadataPromptPreview,
    }
  },
})
