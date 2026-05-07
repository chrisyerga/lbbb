import { createFileRoute } from '@tanstack/react-router'
import { publicRoutes } from '#/lib/product'

export const Route = createFileRoute('/p/$petSlug/')({
  component: PublicPetBlog,
})

function PublicPetBlog() {
  const { petSlug } = Route.useParams()
  const examplePost = publicRoutes.petPost(
    petSlug,
    '2026-05-07-the-great-squirrel-standoff',
  )

  return (
    <main className="page-wrap px-4 pb-12 pt-12">
      <article className="island-shell rounded-[2.5rem] p-8">
        <p className="island-kicker mb-3">Public Pet Blog</p>
        <h1 className="display-title m-0 text-5xl font-bold text-[var(--sea-ink)]">
          {petSlug}
        </h1>
        <p className="max-w-2xl text-[var(--sea-ink-soft)]">
          This route is anonymous, indexable, and intentionally centered on the
          pet identity.
        </p>
        <a href={examplePost} className="mt-6 inline-flex font-semibold">
          Read an example post route
        </a>
      </article>
    </main>
  )
}
