import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '#/components/PageShell'

export const Route = createFileRoute('/p/$petSlug/archive')({
  component: PublicPetArchive,
})

function PublicPetArchive() {
  const { petSlug } = Route.useParams()
  return (
    <PageShell
      eyebrow="Archive"
      title={`All posts from ${petSlug}`}
      children={<p>Chronological public post archive.</p>}
    />
  )
}
