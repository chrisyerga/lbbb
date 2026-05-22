export type VibeTag = { id: string; label: string }

export type VibeTagGroup = {
  id: keyof Omit<VibeSelection, 'custom'>
  label: string
  helper: string
  single?: boolean
  tags: Array<VibeTag>
}

export type VibeSelection = {
  mood: Array<string>
  style: Array<string>
  voice: Array<string>
  length: Array<string>
  custom: Array<string>
}

export const VIBE_TAG_GROUPS: Array<VibeTagGroup> = [
  {
    id: 'mood',
    label: 'Mood',
    helper: 'one or two',
    tags: [
      { id: 'sporty', label: 'sporty' },
      { id: 'scary', label: 'scary' },
      { id: 'cozy', label: 'cozy' },
      { id: 'dramatic', label: 'dramatic' },
      { id: 'silly', label: 'silly' },
      { id: 'tender', label: 'tender' },
      { id: 'chaotic', label: 'chaotic' },
      { id: 'proud', label: 'proud' },
    ],
  },
  {
    id: 'style',
    label: 'Art style',
    helper: 'pick one',
    single: true,
    tags: [
      { id: 'watercolor', label: 'watercolor' },
      { id: 'comic', label: 'comic strip' },
      { id: 'polaroid', label: 'polaroid' },
      { id: 'anime', label: 'anime' },
      { id: 'oil', label: 'oil paint' },
      { id: 'sticker', label: 'sticker book' },
    ],
  },
  {
    id: 'voice',
    label: 'Voice',
    helper: 'how it sounds',
    single: true,
    tags: [
      { id: 'earnest', label: 'earnest pet-mom' },
      { id: 'wry', label: 'wry essayist' },
      { id: 'wes', label: 'full Wes Anderson' },
      { id: 'sport', label: 'sports announcer' },
      { id: 'kidbook', label: "kid's book" },
    ],
  },
  {
    id: 'length',
    label: 'Length',
    helper: 'word target',
    single: true,
    tags: [
      { id: 'quick', label: 'quick · 50w' },
      { id: 'short', label: 'short · 200w' },
      { id: 'long', label: 'long · 500w' },
    ],
  },
]

export const DEFAULT_VIBE_SELECTION: VibeSelection = {
  mood: ['sporty', 'proud'],
  style: ['watercolor'],
  voice: ['earnest'],
  length: ['short'],
  custom: [],
}

export function countSelectedTags(selection: VibeSelection) {
  return (
    selection.mood.length +
    selection.style.length +
    selection.voice.length +
    selection.length.length +
    selection.custom.length
  )
}

export function toggleVibeTag(
  selection: VibeSelection,
  groupId: keyof Omit<VibeSelection, 'custom'>,
  tagId: string,
  single: boolean,
): VibeSelection {
  const current = selection[groupId]
  const has = current.includes(tagId)
  const next = single
    ? has
      ? []
      : [tagId]
    : has
      ? current.filter((id) => id !== tagId)
      : [...current, tagId]
  return { ...selection, [groupId]: next }
}

export function artStyleLabel(selection: VibeSelection) {
  const styleId = selection.style[0]
  const group = VIBE_TAG_GROUPS.find((g) => g.id === 'style')
  return group?.tags.find((t) => t.id === styleId)?.label ?? 'watercolor'
}

const STYLE_TILE_LABELS: Record<string, string> = {
  watercolor: 'wash · soft · jpg',
  comic: 'panels · dot · png',
  polaroid: 'square · grain · jpg',
  anime: 'cel · line · png',
  oil: 'thick · impasto · jpg',
  sticker: 'die-cut · png',
}

export function artTileLabel(styleId: string | undefined) {
  if (!styleId) return 'render · png'
  return STYLE_TILE_LABELS[styleId] ?? 'render · png'
}

export function moodSummary(selection: VibeSelection) {
  const moodGroup = VIBE_TAG_GROUPS.find((g) => g.id === 'mood')
  const labels = selection.mood
    .map((id) => moodGroup?.tags.find((t) => t.id === id)?.label ?? id)
    .concat(selection.custom)
  return labels.join(' · ') || 'no mood yet'
}

export function paragraphCountForLength(selection: VibeSelection) {
  const lengthMap: Record<string, number> = { quick: 1, short: 2, long: 3 }
  return lengthMap[selection.length[0] ?? 'short'] ?? 2
}

export function vibeSelectionToHints(selection: VibeSelection) {
  return {
    mood: selection.mood,
    style: selection.style,
    voice: selection.voice,
    length: selection.length,
    custom: selection.custom,
  }
}
