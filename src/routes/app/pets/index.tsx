'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { PageShell } from '#/components/PageShell'
import { api } from '#convex/_generated/api'
import { publicRoutes } from '#/lib/product'
import { cn } from '#/lib/utils'

const linkPrimary =
  'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold no-underline transition hover:-translate-y-0.5 bg-[var(--sea-ink)] text-white hover:bg-[var(--lagoon-deep)]'

const linkSecondary =
  'inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold no-underline transition hover:-translate-y-0.5 border border-[var(--line)] bg-[var(--surface-strong)] text-[var(--sea-ink)]'

export const Route = createFileRoute('/app/pets/')({ component: PetsPage })

function PetsPage() {
  const rows = useQuery(api.pets.listMine)

  return (
    <PageShell
      eyebrow="Pets"
      title="Each pet gets a blog identity and stable slug."
      description="Rename pets anytime; the public URL slug does not change."
    >
      <div className="mb-6">
        <Link to="/app/pets/new" className={cn(linkPrimary)}>
          Add pet
        </Link>
      </div>

      {rows === undefined ? (
        <p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="feature-card rounded-3xl p-6 text-sm text-[var(--sea-ink-soft)]">
          <p className="m-0">
            No pets yet. Create one to get a public blog slug and start posting
            memories.
          </p>
        </div>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {rows.map(({ pet, blog }) => (
            <li
              key={pet._id}
              className="feature-card rounded-3xl p-5 text-sm"
            >
              <p className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
                {pet.name}
              </p>
              <p className="mt-1 text-[var(--sea-ink-soft)]">
                {[pet.species, pet.breed].filter(Boolean).join(' · ') ||
                  'No species set'}
              </p>
              {blog ? (
                <p className="mt-2 font-mono text-xs text-[var(--lagoon-deep)]">
                  /p/{blog.slug}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/app/pets/$petId"
                  params={{ petId: pet._id }}
                  className={linkSecondary}
                >
                  Edit
                </Link>
                {blog ? (
                  <a
                    href={publicRoutes.petBlog(blog.slug)}
                    className={linkSecondary}
                  >
                    Public blog
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
