import { convexTest } from 'convex-test'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { api, internal } from './_generated/api'
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

test('runMemoryGeneration completes with draft', async () => {
  const t = convexTest(schema, modules)
  stubOpenAIFetch()
  const jobId = await seedMemoryJob(t)

  const result = await t.action(api.generation.runMemoryGeneration, { jobId })

  expect(result).toEqual({ jobId, status: 'awaiting_review' })

  const state = await t.run(async (ctx) => {
    const job = await ctx.db.get(jobId)
    if (!job) throw new Error('Job not found')
    const posts = await ctx.db
      .query('generatedPosts')
      .withIndex('by_pet', (q) => q.eq('petId', job.petId))
      .collect()
    const draft = posts.find((p) => p.jobId === jobId) ?? null
    const costs = await ctx.db
      .query('generationCosts')
      .filter((q) => q.eq(q.field('jobId'), jobId))
      .collect()
    return { job, draft, costs }
  })

  expect(state.job.status).toBe('awaiting_review')
  expect(state.draft).toMatchObject({
    title: MOCK_TEXT_OUTPUT.title,
    excerpt: MOCK_TEXT_OUTPUT.excerpt,
    bodyMarkdown: MOCK_TEXT_OUTPUT.bodyMarkdown,
    status: 'awaiting_moderation',
    jobId,
  })
  expect(state.costs.length).toBeGreaterThanOrEqual(2)
})

test('upsertDraftFromText and runMemoryGenerationImages', async () => {
  const t = convexTest(schema, modules)
  stubOpenAIFetch()
  const jobId = await seedMemoryJob(t)

  await t.mutation(internal.generation.upsertDraftFromText, {
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

  await t.action(internal.memoryGenerationStream.runMemoryGenerationImages, {
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
