import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '#/components/PageShell'

export const Route = createFileRoute('/app/pets/')({ component: PetsPage })

function PetsPage() {
  return (
    <PageShell
      eyebrow="Pets"
      title="Each pet gets a blog identity and stable slug."
    >
      <div className="feature-card rounded-3xl p-5 text-sm text-[var(--sea-ink-soft)]">
        Pet creation will write <code>pets</code> and <code>petBlogs</code>{' '}
        records, including immutable public slug history.
      </div>
    </PageShell>
  )
}
