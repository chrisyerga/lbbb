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
  moodHints?: Array<string>
}) {
  const fromModel = args.textResult.imagePrompt?.trim()
  if (fromModel) return fromModel

  const mood = args.moodHints?.filter(Boolean).join(', ')
  const title = args.textResult.title?.trim()
  const excerpt = args.textResult.excerpt?.trim()
  const scene = excerpt || args.memoryDescription.trim()

  return [
    `Illustration for ${args.petName}'s pet blog.`,
    title ? `Post: "${title}".` : '',
    scene ? `Scene: ${scene}` : '',
    mood ? `Mood: ${mood}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
}
