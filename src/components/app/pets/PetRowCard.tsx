'use client'

import { Link } from '@tanstack/react-router'
import type { Doc } from '#convex/_generated/dataModel'
import { StickerBtn } from '#/components/landing/primitives/StickerBtn'
import { formatRelativeTime } from '#/lib/formatRelativeTime'
import { PetPhoto } from './PetPhoto'
import { SlugStamp } from './SlugStamp'
import { StatusBadge } from './StatusBadge'

export type PetListRow = {
  pet: Doc<'pets'>
  blog: Doc<'petBlogs'> | null
  avatarUrl: string | null
  postCount: number
  imageCount: number
  latestPost: { title: string; updatedAt: number } | null
}

function StatChip({ value, label }: { value: number; label: string }) {
  return (
    <span className="stat-chip">
      <span className="font-display text-base font-extrabold tracking-tight text-[var(--landing-ink)]">{value}</span>
      <span className="font-mono text-[10.5px] tracking-wide text-[var(--landing-ink)]/60 uppercase">{label}</span>
    </span>
  )
}

export function PetRowCard({ row }: { row: PetListRow }) {
  const { pet, blog, avatarUrl, postCount, imageCount, latestPost } = row
  const speciesLine = [pet.species, pet.breed].filter(Boolean).join(' · ') || 'No species set'

  return (
    <article className="pet-row-card">
      <PetPhoto name={pet.name} imageUrl={avatarUrl} />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-display m-0 text-[clamp(1.75rem,4vw,2.375rem)] leading-none font-extrabold tracking-tight text-[var(--landing-ink)]">
            {pet.name}
          </h3>
          {blog ? <StatusBadge visibility={blog.visibility} /> : null}
        </div>
        <p className="font-mono mt-2.5 text-[11.5px] tracking-wide text-[var(--landing-ink)]/60 uppercase">
          {speciesLine}
        </p>
        {blog ? (
          <div className="mt-3.5">
            <SlugStamp slug={blog.slug} />
          </div>
        ) : null}
      </div>

      <div className="min-w-0">
        <p className="font-mono m-0 text-[10.5px] tracking-wide text-[var(--landing-primary)] uppercase">
          ↳ Latest filed
          {latestPost ? ` · ${formatRelativeTime(latestPost.updatedAt)}` : ''}
        </p>
        <p className="font-display mt-2 text-[17px] leading-snug font-semibold tracking-tight text-[var(--landing-ink)]">
          {latestPost ? `"${latestPost.title}"` : '— no posts yet —'}
        </p>
        <div className="mt-3.5 flex flex-wrap gap-2">
          <StatChip value={postCount} label="posts" />
          <StatChip value={imageCount} label="art" />
        </div>
      </div>

      <div className="flex min-w-[150px] flex-col gap-2.5">
        <StickerBtn
          bg="#fff"
          color="var(--landing-ink)"
          size="md"
          to={`/app/pets/${pet._id}`}
          className="w-full justify-center"
        >
          Edit
        </StickerBtn>
        <StickerBtn
          bg="var(--landing-primary)"
          size="md"
          to={`/app/pets/${pet._id}/memories/new`}
          className="w-full justify-center"
        >
          Add memory
        </StickerBtn>
        <Link
          to="/app/pets/$petId/memories"
          params={{ petId: pet._id }}
          className="font-mono text-center text-[10.5px] tracking-wide text-[var(--landing-ink)]/55 uppercase no-underline hover:text-[var(--landing-primary)]"
        >
          Memories
        </Link>
      </div>
    </article>
  )
}
