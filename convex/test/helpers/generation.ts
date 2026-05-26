import type { convexTest } from 'convex-test'
import { vi } from 'vitest'
import { internal } from '../../_generated/api'
import type { Id } from '../../_generated/dataModel'
import {
  composePersonaPrompt,
  loadNarratorBundle,
  resolveGenerationPlan,
} from '../../lib/generationPlan'
import { buildCastBlock } from '../../lib/castContext'

type TestContext = ReturnType<typeof convexTest>

export const MOCK_TEXT_OUTPUT = {
  title: 'The Great Squirrel Chase',
  excerpt: 'Mabel spotted a squirrel and the backyard became a racetrack.',
  bodyMarkdown:
    '## A busy afternoon\n\nMabel went full zoomies after a squirrel appeared by the fence.',
  tags: ['squirrel', 'zoomies'],
  imagePrompt: 'A corgi mid-sprint in a sunny backyard chasing a squirrel.',
}

/** 1x1 transparent PNG */
const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

export function stubOpenAIFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, initArg?: RequestInit) => {
      const url = String(input)

      if (url.includes('/v1/responses')) {
        return new Response(
          JSON.stringify({
            output_text: JSON.stringify(MOCK_TEXT_OUTPUT),
            usage: { input_tokens: 100, output_tokens: 200 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url.includes('/v1/chat/completions')) {
        const init = initArg as RequestInit | undefined
        const body =
          typeof init?.body === 'string' ? JSON.parse(init.body) : {}
        if (body.stream) {
          const encoder = new TextEncoder()
          const chunks = ['## A busy afternoon\n\n', 'Mabel went full zoomies.']
          const stream = new ReadableStream({
            start(controller) {
              for (const chunk of chunks) {
                const payload = {
                  choices: [{ delta: { content: chunk } }],
                }
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
                )
              }
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
            },
          })
          return new Response(stream, {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream' },
          })
        }
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    title: MOCK_TEXT_OUTPUT.title,
                    excerpt: MOCK_TEXT_OUTPUT.excerpt,
                    tags: MOCK_TEXT_OUTPUT.tags,
                    imagePrompt: MOCK_TEXT_OUTPUT.imagePrompt,
                  }),
                },
              },
            ],
            usage: { prompt_tokens: 50, completion_tokens: 80 },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url.includes('/v1/images/generations')) {
        return new Response(
          JSON.stringify({
            data: [{ b64_json: TINY_PNG_B64 }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      throw new Error(`Unexpected fetch: ${url}`)
    }),
  )
}

export async function seedCatalog(t: TestContext) {
  await t.mutation(internal.seedNarrators.seedCatalogInternal, {})
}

export async function seedMemoryJob(t: TestContext): Promise<Id<'generationJobs'>> {
  await seedCatalog(t)

  return await t.run(async (ctx) => {
    const now = Date.now()
    const narrator = await ctx.db.query('narrators').first()
    if (!narrator) throw new Error('Catalog seed failed: no narrators')

    const ownerUserId = await ctx.db.insert('users', {})
    const petId = await ctx.db.insert('pets', {
      ownerUserId,
      name: 'Mabel',
      species: 'dog',
      createdAt: now,
      updatedAt: now,
    })

    const castSnapshot: [] = []
    const generationPlan = await resolveGenerationPlan(ctx, {
      narratorId: narrator._id,
      memoryDescription: 'Chased a squirrel across the backyard.',
      petName: 'Mabel',
      petSpecies: 'dog',
      castSnapshot,
    })
    generationPlan.image.variantCount = 1

    const { narrator: narr, traits } = await loadNarratorBundle(ctx, narrator._id)
    const personaBlock = composePersonaPrompt({
      traits,
      specializationPrompt: narr.specializationPrompt,
      systemPromptAddon: narr.systemPromptAddon,
    })
    const moodHints = narr.defaultMoodHints ?? []
    const moodBlock =
      moodHints.length > 0
        ? `Mood and scene tone: ${moodHints.filter(Boolean).join(', ')}`
        : ''

    return await ctx.db.insert('generationJobs', {
      ownerUserId,
      petId,
      narratorId: narrator._id,
      promptVersionId: generationPlan.promptVersionId,
      textModel: generationPlan.text.model,
      imageModel: generationPlan.image.model,
      status: 'queued',
      operation: 'blog_post',
      provider: 'openai',
      inputSnapshot: {
        description: 'Chased a squirrel across the backyard.',
        petName: 'Mabel',
        petSpecies: 'dog',
        narratorId: narrator._id,
        generationPlan,
        castSnapshot,
        promptVars: {
          petName: 'Mabel (dog)',
          memoryDescription: 'Chased a squirrel across the backyard.',
          castBlock: buildCastBlock(castSnapshot),
          personaBlock,
          moodBlock,
        },
      },
      streamStatus: 'idle',
      attempt: 0,
      createdAt: now,
      updatedAt: now,
    })
  })
}
