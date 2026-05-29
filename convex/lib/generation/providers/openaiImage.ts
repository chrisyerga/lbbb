export async function callOpenAIImage(
  prompt: string,
  modelOverride?: string,
): Promise<{
  blob: Blob
  providerRequestId?: string
}> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const model = modelOverride ?? process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2'
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: '1024x1024',
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`OpenAI image generation failed: ${response.status} ${detail.slice(0, 200)}`)
  }

  const json = await response.json()
  const item = json.data?.[0]
  if (!item) throw new Error('OpenAI image generation returned no data')

  let blob: Blob
  if (item.b64_json) {
    const binary = atob(item.b64_json)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    blob = new Blob([bytes], { type: 'image/png' })
  } else if (item.url) {
    const imageResponse = await fetch(item.url)
    if (!imageResponse.ok) {
      throw new Error('Failed to download generated image')
    }
    blob = await imageResponse.blob()
  } else {
    throw new Error('OpenAI image generation returned no image payload')
  }

  return {
    blob,
    providerRequestId: response.headers.get('x-request-id') ?? undefined,
  }
}
