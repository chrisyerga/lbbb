import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '#/components/PageShell'

export const Route = createFileRoute('/p/$petSlug/posts/$postSlug')({
  component: PublicPost,
})

function PublicPost() {
  const { petSlug, postSlug } = Route.useParams()
  return (
    <PageShell eyebrow={petSlug} title={postSlug.replaceAll('-', ' ')}>
      <p>
        This published post route will render approved generated content and
        canonical SEO metadata.
      </p>
    </PageShell>
  )
}
