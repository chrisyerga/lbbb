import type { Doc } from '#convex/_generated/dataModel'

export type TraitCategory = Doc<'narratorTraits'>['category']
export type CatalogStatus = Doc<'narratorTraits'>['status']
export type NarratorStatus = Doc<'narrators'>['status']
export type ModerationStatus = Doc<'generatedPosts'>['moderationStatus']

export const TRAIT_CATEGORIES: Array<{
  id: TraitCategory | 'all'
  label: string
  helper: string
  color: string
}> = [
  {
    id: 'all',
    label: 'All traits',
    helper: 'full catalog',
    color: '#e0382e',
  },
  {
    id: 'personality',
    label: 'Personality',
    helper: 'core dispositional traits',
    color: '#e0382e',
  },
  {
    id: 'tone',
    label: 'Tone',
    helper: 'emotional temperature',
    color: '#f2a02e',
  },
  {
    id: 'register',
    label: 'Register',
    helper: 'formality & voice',
    color: '#5fa8e0',
  },
  {
    id: 'cultural',
    label: 'Cultural',
    helper: 'reference points',
    color: '#a788e8',
  },
  {
    id: 'pacing',
    label: 'Pacing',
    helper: 'rhythm & sentence shape',
    color: '#3cb07a',
  },
]

export const NARRATOR_STATUS_TAX: Record<
  NarratorStatus,
  { label: string; dot: string; bg: string; ring: string }
> = {
  draft: {
    label: 'draft',
    dot: 'rgba(251,241,222,0.42)',
    bg: 'rgba(251,241,222,0.05)',
    ring: '#3a3027',
  },
  published: {
    label: 'published',
    dot: '#3cb07a',
    bg: 'rgba(60,176,122,0.10)',
    ring: 'rgba(60,176,122,0.35)',
  },
  archived: {
    label: 'archived',
    dot: 'rgba(251,241,222,0.22)',
    bg: 'rgba(251,241,222,0.04)',
    ring: '#2a231d',
  },
}

export const CATALOG_STATUS_TAX: Record<
  CatalogStatus,
  { label: string; dot: string; bg: string; ring: string }
> = {
  active: {
    label: 'active',
    dot: '#3cb07a',
    bg: 'rgba(60,176,122,0.10)',
    ring: 'rgba(60,176,122,0.35)',
  },
  archived: {
    label: 'archived',
    dot: 'rgba(251,241,222,0.22)',
    bg: 'rgba(251,241,222,0.03)',
    ring: '#2a231d',
  },
}

export const MODERATION_STATUS_TAX: Record<
  ModerationStatus,
  { label: string; dot: string; bg: string; ring: string }
> = {
  pending: {
    label: 'pending review',
    dot: '#f2a02e',
    bg: 'rgba(242,160,46,0.10)',
    ring: 'rgba(242,160,46,0.4)',
  },
  approved: {
    label: 'approved',
    dot: '#3cb07a',
    bg: 'rgba(60,176,122,0.10)',
    ring: 'rgba(60,176,122,0.35)',
  },
  flagged: {
    label: 'flagged',
    dot: '#e25d5d',
    bg: 'rgba(226,93,93,0.10)',
    ring: 'rgba(226,93,93,0.45)',
  },
  rejected: {
    label: 'rejected',
    dot: 'rgba(251,241,222,0.42)',
    bg: 'rgba(251,241,222,0.05)',
    ring: '#3a3027',
  },
}

const ART_STYLE_COLORS: Record<string, string> = {
  watercolor: '#7ab6a0',
  comic: '#f2a02e',
  polaroid: '#d67bb0',
  anime: '#5fa8e0',
  oil: '#e08b5f',
  sticker: '#e0382e',
}

const PALETTE = [
  '#d67bb0',
  '#f2a02e',
  '#5fa8e0',
  '#7ab6a0',
  '#e08b5f',
  '#a788e8',
  '#3cb07a',
  '#9c7b5c',
]

export function artStyleColor(slug: string): string {
  return ART_STYLE_COLORS[slug] ?? hashColor(slug)
}

export function hashColor(input: string): string {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(h) % PALETTE.length]
}

export function narratorInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
