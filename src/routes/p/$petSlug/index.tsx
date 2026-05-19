'use client'

import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { PetBlogNotFound } from '#/components/NotFoundPanel'
import { api } from '#convex/_generated/api'
import { publicRoutes } from '#/lib/product'

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
      <main className="page-wrap px-4 pb-12 pt-8">
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      </main>
    )
  }

  if (data === null) {
    return <PetBlogNotFound petSlug={petSlug} />
  }

  const { pet, blog } = data

  return (
    <main className="page-wrap px-4 pb-12 pt-8">
      <article className="panel p-8">
        <p className="section-label mb-3">Public Pet Blog</p>
        <h1 className="m-0 text-4xl font-bold text-[var(--text-primary)]">
          {blog.title}
        </h1>
        <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">
          {pet.name}
        </p>
        {blog.description ? (
          <p className="max-w-2xl text-[var(--text-muted)]">{blog.description}</p>
        ) : (
          <p className="max-w-2xl text-[var(--text-muted)]">
            Stories and memories from {pet.name}
            {pet.species ? ` (${pet.species})` : ''}.
          </p>
        )}
        {pet.bio ? (
          <p className="max-w-2xl text-sm text-[var(--text-muted)]">{pet.bio}</p>
        ) : null}
        <a href={examplePost} className="mt-6 inline-flex font-semibold">
          Example post route (placeholder)
        </a>
      </article>
    </main>
  )
}
