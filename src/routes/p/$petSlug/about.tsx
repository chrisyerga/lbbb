import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '#/components/PageShell'

export const Route = createFileRoute('/p/$petSlug/about')({
  component: PublicPetAbout,
})

function PublicPetAbout() {
  const { petSlug } = Route.useParams()
  return (
    <PageShell
      eyebrow="About"
      title={`About ${petSlug}`}
      children={<p>Public profile metadata for the pet blog.</p>}
    />
  )
}
