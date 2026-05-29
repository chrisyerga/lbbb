import type { TextGenerationResult } from '../types'

function normalizeTextResult(raw: Record<string, unknown>): TextGenerationResult {
  const imagePrompt =
    typeof raw.imagePrompt === 'string'
      ? raw.imagePrompt
      : typeof raw.image_prompt === 'string'
        ? raw.image_prompt
        : undefined

  return {
    title: String(raw.title ?? ''),
    excerpt: String(raw.excerpt ?? ''),
    bodyMarkdown: String(raw.bodyMarkdown ?? raw.body_markdown ?? ''),
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === 'string') : [],
    imagePrompt,
  }
}

export async function callOpenAIText(prompt: string): Promise<TextGenerationResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const model = process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.4-mini'
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: prompt,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`OpenAI text generation failed: ${response.status} ${detail.slice(0, 200)}`)
  }

  const json = await response.json()
  const outputText = json.output_text ?? '{}'
  const parsed = normalizeTextResult(JSON.parse(outputText) as Record<string, unknown>)

  return {
    ...parsed,
    usage: {
      inputTokens: json.usage?.input_tokens,
      outputTokens: json.usage?.output_tokens,
    },
    providerRequestId: response.headers.get('x-request-id') ?? undefined,
  }
}

export async function streamOpenAIMarkdown(
  args: {
    systemPrompt: string
    userPrompt: string
    model: string
  },
  onChunk: (text: string) => Promise<void>,
): Promise<{ providerRequestId?: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: args.model,
      stream: true,
      messages: [
        { role: 'system', content: args.systemPrompt },
        { role: 'user', content: args.userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`OpenAI stream failed: ${response.status} ${detail.slice(0, 200)}`)
  }

  if (!response.body) throw new Error('OpenAI stream returned no body')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) await onChunk(delta)
      } catch {
        // Ignore malformed SSE lines.
      }
    }
  }

  return {
    providerRequestId: response.headers.get('x-request-id') ?? undefined,
  }
}

export async function callOpenAIMetadata(prompt: string): Promise<{
  title: string
  excerpt: string
  tags: Array<string>
  imagePrompt?: string
  usage?: { inputTokens?: number; outputTokens?: number }
  providerRequestId?: string
}> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const model = process.env.OPENAI_TEXT_MODEL ?? 'gpt-5.4-mini'
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`OpenAI metadata failed: ${response.status} ${detail.slice(0, 200)}`)
  }

  const json = await response.json()
  const content = json.choices?.[0]?.message?.content ?? '{}'
  const raw = JSON.parse(content) as Record<string, unknown>
  const imagePrompt =
    typeof raw.imagePrompt === 'string'
      ? raw.imagePrompt
      : typeof raw.image_prompt === 'string'
        ? raw.image_prompt
        : undefined

  return {
    title: String(raw.title ?? ''),
    excerpt: String(raw.excerpt ?? ''),
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === 'string') : [],
    imagePrompt,
    usage: {
      inputTokens: json.usage?.prompt_tokens,
      outputTokens: json.usage?.completion_tokens,
    },
    providerRequestId: response.headers.get('x-request-id') ?? undefined,
  }
}
