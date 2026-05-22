export type VibeHints = {
  mood: Array<string>
  style: Array<string>
  voice: Array<string>
  length: Array<string>
  custom: Array<string>
}

export const TAG_LABELS: Record<string, string> = {
  sporty: 'sporty',
  scary: 'scary',
  cozy: 'cozy',
  dramatic: 'dramatic',
  silly: 'silly',
  tender: 'tender',
  chaotic: 'chaotic',
  proud: 'proud',
  watercolor: 'watercolor',
  comic: 'comic strip',
  polaroid: 'polaroid',
  anime: 'anime',
  oil: 'oil paint',
  sticker: 'sticker book',
  earnest: 'earnest pet-mom',
  wry: 'wry essayist',
  wes: 'full Wes Anderson',
  sport: 'sports announcer',
  kidbook: "kid's book",
  quick: 'quick · ~50 words',
  short: 'short · ~200 words',
  long: 'long · ~500 words',
}

const LENGTH_WORD_TARGETS: Record<string, number> = {
  quick: 50,
  short: 200,
  long: 500,
}

export function resolveTagLabels(ids: Array<string>) {
  return ids.map((id) => TAG_LABELS[id] ?? id)
}

export function buildStyleDescription(vibe: VibeHints) {
  const parts: Array<string> = []
  if (vibe.mood.length) {
    parts.push(`Mood: ${resolveTagLabels(vibe.mood).join(', ')}`)
  }
  if (vibe.style.length) {
    parts.push(`Art style: ${resolveTagLabels(vibe.style).join(', ')}`)
  }
  if (vibe.voice.length) {
    parts.push(`Voice: ${resolveTagLabels(vibe.voice).join(', ')}`)
  }
  if (vibe.length.length) {
    parts.push(`Length: ${resolveTagLabels(vibe.length).join(', ')}`)
  }
  if (vibe.custom.length) {
    parts.push(`Custom hints: ${vibe.custom.join(', ')}`)
  }
  return parts.join('\n')
}

export function wordTargetForVibe(vibe: VibeHints) {
  const lengthId = vibe.length[0]
  if (!lengthId) return 200
  return LENGTH_WORD_TARGETS[lengthId] ?? 200
}

export function buildMemoryPrompt(args: {
  petName: string
  petSpecies?: string
  memoryDescription: string
  vibe: VibeHints
}) {
  const styleDescription = buildStyleDescription(args.vibe)
  const wordTarget = wordTargetForVibe(args.vibe)

  return [
    `Pet: ${args.petName}${args.petSpecies ? ` (${args.petSpecies})` : ''}`,
    `Memory description from the owner:\n${args.memoryDescription.trim()}`,
    styleDescription ? `Creative direction:\n${styleDescription}` : '',
    `Write a public blog post of about ${wordTarget} words.`,
    'Return JSON with exactly these keys: title, excerpt, bodyMarkdown, tags (string array), imagePrompt.',
    'imagePrompt must be a vivid single-scene description for an illustration of this memory (who, where, what is happening).',
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function imagePromptVariants(basePrompt: string, artStyle: string, count = 4) {
  const styleHint = artStyle ? ` Style: ${artStyle}.` : ''
  const angles = [
    'Wide establishing shot.',
    'Close-up emotional moment.',
    'Playful action beat.',
    'Quiet detail or aftermath.',
  ]
  return angles.slice(0, count).map((angle, i) => {
    return `${basePrompt.trim()}${styleHint} ${angle} Variation ${i + 1}. No text in image.`
  })
}

/** Scene description for image gen — LLM output first, then composed from memory. */
export function resolveBaseImagePrompt(args: {
  textResult: {
    imagePrompt?: string
    title?: string
    excerpt?: string
  }
  petName: string
  memoryDescription: string
  vibe: VibeHints
}) {
  const fromModel = args.textResult.imagePrompt?.trim()
  if (fromModel) return fromModel

  const mood = resolveTagLabels(args.vibe.mood).join(', ')
  const title = args.textResult.title?.trim()
  const excerpt = args.textResult.excerpt?.trim()
  const scene = excerpt || args.memoryDescription.trim()

  return [
    `Illustration for ${args.petName}'s pet blog.`,
    title ? `Post: "${title}".` : '',
    scene ? `Scene: ${scene}` : '',
    mood ? `Mood: ${mood}.` : '',
    args.vibe.custom.length
      ? `Notes: ${args.vibe.custom.join(', ')}.`
      : '',
  ]
    .filter(Boolean)
    .join(' ')
}
