'use client'

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { PageShell } from '#/components/PageShell'
import { Button } from '#/components/ui/Button'
import { api } from '#convex/_generated/api'
import { cn } from '#/lib/utils'

const linkSecondary =
  'inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5'

export const Route = createFileRoute('/app/pets/new')({
  component: NewPetPage,
})

function NewPetPage() {
  const navigate = useNavigate()
  const createPet = useMutation(api.pets.create)

  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { petId } = await createPet({
        name,
        species: species || undefined,
        breed: breed || undefined,
        visibility: 'public',
      })
      void navigate({ to: '/app/pets/$petId', params: { petId } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell
      eyebrow="New Pet"
      title="Create the pet profile before generating content."
    >
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="feature-card max-w-lg grid gap-4 rounded-3xl p-6 text-sm"
      >
        {error ? (
          <p className="m-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}
        <label className="grid gap-2 text-[var(--sea-ink)]">
          Pet name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3"
            placeholder="Mabel"
          />
        </label>
        <label className="grid gap-2 text-[var(--sea-ink)]">
          Species or breed
          <input
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3"
            placeholder="Dog"
          />
        </label>
        <label className="grid gap-2 text-[var(--sea-ink)]">
          Breed (optional)
          <input
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3"
            placeholder="Corgi"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create pet'}
          </Button>
          <Link to="/app/pets" className={cn(linkSecondary)}>
            Cancel
          </Link>
        </div>
      </form>
    </PageShell>
  )
}
