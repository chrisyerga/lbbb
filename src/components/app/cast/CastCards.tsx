'use client'

import { Link } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import type { Doc, Id } from '#convex/_generated/dataModel'
import { IconPlus } from '#/components/app/icons'
import { EditableLink, EditHint } from '#/components/app/SharedUi'
import { cn } from '#/lib/utils'

export type RelKind = 'family' | 'friend' | 'pal' | 'neighbor' | 'nemesis'

export type RelatedPet = {
  _id: Id<'pets'>
  name: string
  avatarUrl: string | null
  accentColor: string | null
}

export type CastListMember = Doc<'castMembers'> & {
  avatarUrl: string | null
  linkedPetName: string | null
  relatedPets?: Array<RelatedPet>
  appearanceCount?: number
}

export const REL_COLORS: Record<RelKind, string> = {
  family: '#E0382E',
  friend: '#3CB07A',
  pal: '#F2A02E',
  neighbor: '#C5663B',
  nemesis: '#7E5BFF',
}

function accentForMember(member: Pick<CastListMember, 'relKind' | 'kind' | 'name'>) {
  if (member.relKind) return REL_COLORS[member.relKind]
  if (member.kind === 'person') return REL_COLORS.family
  if (member.kind === 'animal') return REL_COLORS.friend
  return REL_COLORS.pal
}

function relLabel(member: Pick<CastListMember, 'relationship' | 'relKind' | 'kind' | 'linkedPetName'>) {
  if (member.relationship) return member.relationship
  if (member.relKind === 'pal') return 'Park pal'
  if (member.relKind === 'nemesis') return 'The nemesis'
  if (member.relKind) return member.relKind
  if (member.kind === 'pet') return member.linkedPetName ? `Pet · ${member.linkedPetName}` : 'Pet'
  return member.kind
}

export function MiniPetAvatar({ pet, size = 26 }: { pet: RelatedPet; size?: number }) {
  return (
    <span
      className="cast-mini-pet"
      title={pet.name}
      style={{ width: size, height: size, background: pet.accentColor ?? '#F2A02E' }}
    >
      {pet.avatarUrl ? <img src={pet.avatarUrl} alt="" /> : <span>{pet.name.slice(0, 1)}</span>}
    </span>
  )
}

export function CastPhoto({
  member,
  size = 84,
}: {
  member: Pick<CastListMember, 'name' | 'avatarUrl' | 'relKind' | 'kind'>
  size?: number
}) {
  const accent = accentForMember(member)
  return (
    <span className="cast-photo" style={{ width: size, height: size, background: accent }}>
      {member.avatarUrl ? <img src={member.avatarUrl} alt="" /> : <span>{member.name.slice(0, 1)}</span>}
    </span>
  )
}

export function RelPill({ member }: { member: CastListMember }) {
  const accent = accentForMember(member)
  return (
    <span className="cast-rel-pill" style={{ '--rel-accent': accent } as CSSProperties}>
      <span />
      {relLabel(member)}
    </span>
  )
}

export function CastCard({
  member,
  variant = 'full',
}: {
  member: CastListMember
  variant?: 'full' | 'compact'
}) {
  const compact = variant === 'compact'
  const relatedPets = member.relatedPets ?? []
  const kindLine =
    member.kind === 'animal'
      ? [member.species, member.breed].filter(Boolean).join(' · ') || 'Animal'
      : member.kind === 'person'
        ? 'Person'
        : [member.species, member.breed].filter(Boolean).join(' · ') || 'Platform pet'

  return (
    <article className={cn('cast-display-card', compact && 'cast-display-card--compact')}>
      <div className="cast-card-top">
        <EditableLink to={`/app/cast/${member._id}`} title={`Edit ${member.name}`}>
          <CastPhoto member={member} size={compact ? 64 : 84} />
        </EditableLink>
        <div className="min-w-0 flex-1">
          <EditableLink to={`/app/cast/${member._id}`} title={`Edit ${member.name}`}>
            <h3 className="cast-display-name">{member.name}</h3>
          </EditableLink>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RelPill member={member} />
          </div>
          <p className="cast-kind-line">{kindLine}</p>
        </div>
      </div>

      <p className={cn('cast-description', compact && 'is-compact')}>{member.visualDescription}</p>

      <div className="cast-card-meta">
        <span className="cast-appearances">
          ↳ in {member.appearanceCount ?? 0} {(member.appearanceCount ?? 0) === 1 ? 'memory' : 'memories'}
        </span>
        {relatedPets.length > 0 ? (
          <div className="cast-related">
            <span>with</span>
            <div className="cast-related-stack">
              {relatedPets.map((pet, index) => (
                <span key={pet._id} style={{ marginLeft: index ? -8 : 0 }}>
                  <MiniPetAvatar pet={pet} size={26} />
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <EditHint label="click to edit" />
    </article>
  )
}

export function AddCastSlot({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/app/cast/new" className={cn('add-cast-slot', compact && 'is-compact')}>
      <span className="add-cast-icon">
        <IconPlus size={compact ? 22 : 26} stroke={1.6} />
      </span>
      <span>
        <span className="add-cast-title">Add a character</span>
        <span className="add-cast-copy">Photo + a few notes. cafezoe writes them into the story.</span>
      </span>
    </Link>
  )
}

export function CastGrid({
  members,
  withAdd = true,
  minCol = 320,
}: {
  members: Array<CastListMember>
  withAdd?: boolean
  minCol?: number
}) {
  return (
    <div className="cast-grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minCol}px, 1fr))` }}>
      {members.map((member) => (
        <CastCard key={member._id} member={member} />
      ))}
      {withAdd ? <AddCastSlot /> : null}
    </div>
  )
}
