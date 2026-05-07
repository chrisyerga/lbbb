import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '#/components/PageShell'

export const Route = createFileRoute('/app/pets/new')({ component: NewPetPage })

function NewPetPage() {
  return (
    <PageShell
      eyebrow="New Pet"
      title="Create the pet profile before generating content."
    >
      <form className="grid gap-4 text-sm">
        <label className="grid gap-2 text-[var(--sea-ink)]">
          Pet name
          <input
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3"
            placeholder="Mabel"
          />
        </label>
        <label className="grid gap-2 text-[var(--sea-ink)]">
          Species or breed
          <input
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3"
            placeholder="Corgi"
          />
        </label>
      </form>
    </PageShell>
  )
}
