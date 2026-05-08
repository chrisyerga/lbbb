'use client'

import { createFileRoute } from '@tanstack/react-router'
import { publicRoutes } from '#/lib/product'
import { useQuery } from 'convex/react'
import { api } from '#convex/_generated/api'

export const Route = createFileRoute('/p/$petSlug/')({
  component: PublicPetBlog,
})

function PublicPetBlog() {
  const { petSlug } = Route.useParams()
  const data = useQuery(api.pets.getPublicBlogBySlug, { slug: petSlug })
  const examplePost = publicRoutes.petPost(
    petSlug,
    '2026-05-07-the-great-squirrel-standoff',
  )

  if (data === undefined) {
    return (
      <main className="page-wrap px-4 pb-12 pt-12">
        <p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>
      </main>
    )
  }

  if (data === null) {
    return (
      <main className="page-wrap px-4 pb-12 pt-12">
        <article className="island-shell rounded-[2.5rem] p-8">
          <p className="island-kicker mb-3">Public Pet Blog</p>
          <h1 className="display-title m-0 text-5xl font-bold text-[var(--sea-ink)]">
            Not found
          </h1>
          <p className="max-w-2xl text-[var(--sea-ink-soft)]">
            No public blog exists for <code>{petSlug}</code>, or it is set to
            private.
          </p>
        </article>
      </main>
    )
  }

  const { pet, blog } = data

  return (
    <main className="page-wrap px-4 pb-12 pt-12">
      <article className="island-shell rounded-[2.5rem] p-8">
        <p className="island-kicker mb-3">Public Pet Blog</p>
        <h1 className="display-title m-0 text-5xl font-bold text-[var(--sea-ink)]">
          {blog.title}
        </h1>
        <p className="mt-2 text-xl text-[var(--sea-ink)]">{pet.name}</p>
        {blog.description ? (
          <p className="max-w-2xl text-[var(--sea-ink-soft)]">{blog.description}</p>
        ) : (
          <p className="max-w-2xl text-[var(--sea-ink-soft)]">
            Stories and memories from {pet.name}
            {pet.species ? ` (${pet.species})` : ''}.
          </p>
        )}
        {pet.bio ? (
          <p className="max-w-2xl text-sm text-[var(--sea-ink-soft)]">{pet.bio}</p>
        ) : null}
        <a href={examplePost} className="mt-6 inline-flex font-semibold">
          Example post route (placeholder)
        </a>
      </article>
    </main>
  )
}
