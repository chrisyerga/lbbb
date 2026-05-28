import { convexTest } from 'convex-test'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { internal } from './_generated/api'
import schema from './schema'
import { modules } from './test.setup'
import {
  MOCK_TEXT_OUTPUT,
  seedMemoryJob,
  stubOpenAIFetch,
} from './test/helpers/generation'

beforeEach(() => {
  process.env.OPENAI_API_KEY = 'test-key'
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('upsertDraftFromText and runMemoryGenerationImages', async () => {
  const t = convexTest(schema, modules)
  stubOpenAIFetch()
  const jobId = await seedMemoryJob(t)

  await t.mutation(internal.generationState.upsertDraftFromText, {
    jobId,
    title: MOCK_TEXT_OUTPUT.title,
    excerpt: MOCK_TEXT_OUTPUT.excerpt,
    bodyMarkdown: MOCK_TEXT_OUTPUT.bodyMarkdown,
    outputSnapshot: {
      tags: MOCK_TEXT_OUTPUT.tags,
      imagePrompt: MOCK_TEXT_OUTPUT.imagePrompt,
    },
    textCost: {
      model: 'gpt-test',
      inputTokens: 10,
      outputTokens: 20,
      estimatedCostUsd: 0.001,
    },
  })

  await t.action(internal.generationWorkflow.runMemoryGenerationImages, {
    jobId,
  })

  const state = await t.run(async (ctx) => {
    const job = await ctx.db.get(jobId)
    const draft = await ctx.db
      .query('generatedPosts')
      .withIndex('by_job', (q) => q.eq('jobId', jobId))
      .first()
    return { job, draft }
  })

  expect(state.job?.status).toBe('awaiting_review')
  expect(state.job?.streamStatus).toBe('done')
  expect(state.draft?.imageAssetIds.length).toBe(1)
})
