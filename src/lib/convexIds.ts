import type { Id } from '#convex/_generated/dataModel'

/** Convex document IDs are lowercase alphanumeric strings; slugs like "bad-id" are not valid. */
const PET_ID_RE = /^[a-z0-9]{10,64}$/

export function parsePetId(raw: string): Id<'pets'> | null {
  const value = raw.trim()
  if (!PET_ID_RE.test(value)) {
    return null
  }
  return value as Id<'pets'>
}
