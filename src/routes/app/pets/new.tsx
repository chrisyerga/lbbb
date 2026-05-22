'use client'

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { PageShell } from '#/components/PageShell'
import { Button, buttonClassName } from '#/components/ui/Button'
import { api } from '#convex/_generated/api'

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
        className="panel max-w-lg grid gap-4 p-6 text-sm"
      >
        {error ? (
          <p className="alert-error m-0 px-3 py-2">
            {error}
          </p>
        ) : null}
        <label className="grid gap-2 text-[var(--text-primary)]">
          Pet name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input-field"
            placeholder="Mabel"
          />
        </label>
        <label className="grid gap-2 text-[var(--text-primary)]">
          Species or breed
          <input
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="input-field"
            placeholder="Dog"
          />
        </label>
        <label className="grid gap-2 text-[var(--text-primary)]">
          Breed (optional)
          <input
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="input-field"
            placeholder="Corgi"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create pet'}
          </Button>
          <Link to="/app/pets" className={buttonClassName('secondary')}>
            Cancel
          </Link>
        </div>
      </form>
    </PageShell>
  )
}
