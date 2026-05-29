import type { GenericQueryCtx } from 'convex/server'
import type { DataModel, Doc } from '../_generated/dataModel'
import type { CastSnapshotEntry } from './narratorTypes'

type Ctx = GenericQueryCtx<DataModel>

const CAST_SNAPSHOT_CAP = 8

export function nameMatchesMemory(memoryDescription: string, name: string, aliases: Array<string>): boolean {
  const text = memoryDescription.trim()
  if (!text) return false

  const terms = [name, ...aliases].filter((term) => term.trim().length > 0)
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(text)) return true
  }
  return false
}

function toSnapshotEntry(member: Doc<'castMembers'>, matchedInMemory: boolean): CastSnapshotEntry {
  return {
    castMemberId: member._id,
    name: member.name,
    kind: member.kind,
    visualDescription: member.visualDescription,
    matchedInMemory,
    referenceAssetIds: member.referenceAssetIds,
  }
}

export function buildCastBlock(castSnapshot: Array<CastSnapshotEntry>): string {
  if (!castSnapshot.length) return ''

  const lines = castSnapshot.map((entry) => `- ${entry.name} (${entry.kind}): ${entry.visualDescription.trim()}`)

  return [
    'Cast (use these exact people/pets — do not substitute generic strangers):',
    ...lines,
    '',
    'When writing imagePrompt, depict the specific cast members above, not generic dogs or people.',
  ].join('\n')
}

export function buildCastVisualSuffix(castSnapshot: Array<CastSnapshotEntry>): string {
  const parts = castSnapshot
    .filter((entry) => entry.matchedInMemory)
    .map((entry) => {
      if (entry.kind === 'person') {
        return `${entry.name}: ${entry.visualDescription.trim()}`
      }
      return `Depict ${entry.name} as ${entry.visualDescription.trim()}`
    })

  return parts.join(' ')
}

export async function resolveCastSnapshot(
  ctx: Ctx,
  args: {
    ownerUserId: Doc<'castMembers'>['ownerUserId']
    subjectPetId: Doc<'pets'>['_id']
    memoryDescription: string
  },
): Promise<Array<CastSnapshotEntry>> {
  const members = await ctx.db
    .query('castMembers')
    .withIndex('by_owner_status', (q) => q.eq('ownerUserId', args.ownerUserId).eq('status', 'active'))
    .collect()

  const subjectMember = members.find((member) => member.linkedPetId === args.subjectPetId)

  const results: Array<CastSnapshotEntry> = []
  const seen = new Set<string>()

  function add(entry: CastSnapshotEntry) {
    if (seen.has(entry.castMemberId)) return
    seen.add(entry.castMemberId)
    results.push(entry)
  }

  if (subjectMember) {
    add(toSnapshotEntry(subjectMember, true))
  }

  for (const member of members) {
    if (member.linkedPetId === args.subjectPetId) continue
    const matched = nameMatchesMemory(args.memoryDescription, member.name, member.aliases)
    if (matched) {
      add(toSnapshotEntry(member, true))
    }
  }

  return results.slice(0, CAST_SNAPSHOT_CAP)
}
