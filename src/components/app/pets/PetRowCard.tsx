'use client'

import { Link } from '@tanstack/react-router'
import type { Doc } from '#convex/_generated/dataModel'
import { IconArrowRight, IconPalette, IconPlus, IconRss } from '#/components/app/icons'
import { EditableLink, EditHint } from '#/components/app/SharedUi'
import { Tape } from '#/components/landing/primitives/Tape'
import { StickerBtn } from '#/components/landing/primitives/StickerBtn'
import { formatRelativeTime } from '#/lib/formatRelativeTime'
import { cn } from '#/lib/utils'
import { PetPhoto } from './PetPhoto'
import { SlugStamp } from './SlugStamp'
import { StatusBadge } from './StatusBadge'

export type PetListRow = {
  pet: Doc<'pets'>
  blog: Doc<'petBlogs'> | null
  avatarUrl: string | null
  postCount: number
  imageCount: number
  memoryCount?: number
  defaultNarrator?: { name: string } | null
  defaultArtStyle?: { name: string } | null
  latestPost: { title: string; updatedAt: number } | null
}

function StatChip({ value, label, icon }: { value: number; label: string; icon?: 'posts' | 'art' }) {
  return (
    <span className="stat-chip">
      {icon === 'art' ? <IconPalette size={16} stroke={1.75} /> : null}
      <span className="font-display text-base font-extrabold tracking-tight text-(--landing-ink)">{value}</span>
      <span className="font-mono text-[10.5px] tracking-wide text-(--landing-ink)/60 uppercase">{label}</span>
    </span>
  )
}

function PetActions({ petId, compact, blogSlug }: { petId: string; compact: boolean; blogSlug?: string }) {
  return (
    <div className={cn('pet-row-actions', compact && 'is-compact')}>
      <StickerBtn
        bg="var(--landing-primary)"
        size="md"
        to={`/app/pets/${petId}/memories/new`}
        className="w-full justify-center"
      >
        <IconPlus size={15} stroke={2.4} /> Add memory
      </StickerBtn>
      <StickerBtn bg="#fff" color="var(--landing-ink)" size="md" to={`/app/pets/${petId}`} className="w-full justify-center">
        Edit
      </StickerBtn>
      {!compact ? (
        <>
          {blogSlug ? (
            <a href={`/p/${blogSlug}`} className="pet-row-blog-link">
              <IconRss size={14} /> Blog <IconArrowRight size={14} stroke={2.4} />
            </a>
          ) : null}
          <Link to="/app/pets/$petId/memories" params={{ petId }} className="pet-row-memories-link">
            Memories
          </Link>
        </>
      ) : null}
    </div>
  )
}

export function PetRowCard({ row, variant = 'full' }: { row: PetListRow; variant?: 'full' | 'compact' }) {
  const { pet, blog, avatarUrl, postCount, imageCount, latestPost, defaultNarrator, defaultArtStyle } = row
  const speciesLine = [pet.species, pet.breed].filter(Boolean).join(' · ') || 'No species set'
  const compact = variant === 'compact'
  const voiceLine = defaultNarrator?.name ?? defaultArtStyle?.name ?? 'No default style set'

  return (
    <article className={cn('pet-row-card', compact && 'pet-row-card--compact')}>
      {pet.featured ? <Tape color="var(--landing-accent)" w={compact ? 72 : 88} rotate={-9} className="pet-row-tape" /> : null}

      <EditableLink to={`/app/pets/${pet._id}`} title={`Edit ${pet.name}`}>
        <PetPhoto name={pet.name} imageUrl={avatarUrl} accentColor={pet.accentColor} size={compact ? 96 : 132} />
      </EditableLink>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <EditableLink to={`/app/pets/${pet._id}`} title={`Edit ${pet.name}`}>
            <h3 className="font-display pet-row-name m-0 leading-none font-extrabold tracking-tight text-(--landing-ink)">
              {pet.name}
            </h3>
          </EditableLink>
          {blog ? <StatusBadge visibility={blog.visibility} /> : null}
        </div>
        <EditHint />
        <p className="font-mono mt-2.5 text-[11.5px] tracking-wide text-(--landing-ink)/60 uppercase">
          {speciesLine} <span className="text-(--landing-ink)/25">|</span> voice = &quot;{voiceLine}&quot;
        </p>
        {blog && !compact ? (
          <div className="mt-3.5">
            <SlugStamp slug={blog.slug} />
          </div>
        ) : null}
      </div>

      <div className={cn('min-w-0', compact && 'pet-row-latest-compact')}>
        <p className="font-mono m-0 text-[10.5px] tracking-wide text-(--landing-primary) uppercase">
          ↳ Latest filed
          {latestPost ? ` · ${formatRelativeTime(latestPost.updatedAt)}` : ''}
        </p>
        <p className="font-display mt-2 text-[17px] leading-snug font-semibold tracking-tight text-(--landing-ink)">
          {latestPost ? `"${latestPost.title}"` : '— no posts yet —'}
        </p>
        {!compact ? (
          <div className="mt-3.5 flex flex-wrap gap-2">
            <StatChip value={postCount} label="posts" />
            <StatChip value={imageCount} label="art" icon="art" />
          </div>
        ) : null}
      </div>

      {compact ? (
        <div className="pet-row-compact-footer">
          <PetActions petId={pet._id} compact />
        </div>
      ) : (
        <PetActions petId={pet._id} compact={false} blogSlug={blog?.slug} />
      )}
    </article>
  )
}
