'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { PageShell } from '#/components/PageShell'
import { buttonClassName } from '#/components/ui/Button'
import { api } from '#convex/_generated/api'
import { publicRoutes } from '#/lib/product'

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
        <Link to="/app/pets/new" className={buttonClassName('primary')}>
          Add pet
        </Link>
      </div>

      {rows === undefined ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="panel p-6 text-sm text-[var(--text-muted)]">
          <p className="m-0">
            No pets yet. Create one to get a public blog slug and start posting
            memories.
          </p>
        </div>
      ) : (
        <ul className="m-0 grid list-none gap-0 border border-[var(--border)] p-0 sm:grid-cols-2">
          {rows.map(({ pet, blog, avatarUrl }) => (
            <li
              key={pet._id}
              className="panel-interactive border-0 border-b border-r border-[var(--border)] p-5 text-sm last:border-b-0 sm:[&:nth-child(2n)]:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
            >
              <div className="flex gap-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`${pet.name} profile`}
                    className="h-12 w-12 shrink-0 border border-[var(--border)] object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--border)] bg-[var(--bg-input)] text-sm font-bold text-[var(--text-muted)]">
                    {pet.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-lg font-semibold text-[var(--text-primary)]">
                    {pet.name}
                  </p>
                  <p className="mt-1 text-[var(--text-muted)]">
                    {[pet.species, pet.breed].filter(Boolean).join(' · ') ||
                      'No species set'}
                  </p>
                  {blog ? (
                    <p className="mt-2 font-mono text-xs text-[var(--accent)]">
                      /p/{blog.slug}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/app/pets/$petId"
                  params={{ petId: pet._id }}
                  className={buttonClassName('secondary', 'text-xs')}
                >
                  Edit
                </Link>
                {blog ? (
                  <a
                    href={publicRoutes.petBlog(blog.slug)}
                    className={buttonClassName('secondary', 'text-xs')}
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
