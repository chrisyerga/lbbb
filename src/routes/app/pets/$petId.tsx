'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { PageShell } from '#/components/PageShell'
import { Button } from '#/components/ui/Button'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'
import { publicRoutes } from '#/lib/product'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/app/pets/$petId')({
  component: EditPetPage,
})

function EditPetPage() {
  const { petId } = Route.useParams() as { petId: string }
  const data = useQuery(api.pets.getMineByPetId, {
    petId: petId as Id<'pets'>,
  })
  const updatePet = useMutation(api.pets.update)
  const updateBlog = useMutation(api.pets.updateBlogMeta)

  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [bio, setBio] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<
    'private' | 'public' | 'unlisted'
  >('public')
  const [savingPet, setSavingPet] = useState(false)
  const [savingBlog, setSavingBlog] = useState(false)

  useEffect(() => {
    if (!data) return
    setName(data.pet.name)
    setSpecies(data.pet.species ?? '')
    setBreed(data.pet.breed ?? '')
    setBio(data.pet.bio ?? '')
    if (data.blog) {
      setDescription(data.blog.description ?? '')
      setVisibility(data.blog.visibility)
    }
  }, [data])

  async function onSavePet(e: React.FormEvent) {
    e.preventDefault()
    if (!data) return
    setSavingPet(true)
    try {
      await updatePet({
        petId: data.pet._id,
        name,
        species: species || undefined,
        breed: breed || undefined,
        bio: bio || undefined,
      })
    } finally {
      setSavingPet(false)
    }
  }

  async function onSaveBlog(e: React.FormEvent) {
    e.preventDefault()
    if (!data) return
    setSavingBlog(true)
    try {
      await updateBlog({
        petId: data.pet._id,
        description: description || undefined,
        visibility,
      })
    } finally {
      setSavingBlog(false)
    }
  }

  if (data === undefined) {
    return (
      <PageShell eyebrow="Pets" title="Edit pet">
        <p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>
      </PageShell>
    )
  }

  if (data === null) {
    return (
      <PageShell eyebrow="Pets" title="Edit pet">
        <p className="text-sm text-[var(--sea-ink-soft)]">
          Pet not found or you don’t have access.
        </p>
        <Link
          to="/app/pets"
          className="mt-4 inline-block font-semibold text-[var(--lagoon-deep)]"
        >
          Back to pets
        </Link>
      </PageShell>
    )
  }

  const { pet, blog } = data
  const publicUrl = blog ? publicRoutes.petBlog(blog.slug) : null

  return (
    <PageShell
      eyebrow="Pets"
      title={`Edit ${pet.name}`}
      description="Pet name and bio are yours; the public URL slug stays stable."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={(e) => void onSavePet(e)}
          className="feature-card grid gap-4 rounded-3xl p-6 text-sm"
        >
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Pet profile
          </h2>
          <label className="grid gap-2 text-[var(--sea-ink)]">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3"
            />
          </label>
          <label className="grid gap-2 text-[var(--sea-ink)]">
            Species
            <input
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3"
              placeholder="Dog"
            />
          </label>
          <label className="grid gap-2 text-[var(--sea-ink)]">
            Breed
            <input
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3"
              placeholder="Corgi"
            />
          </label>
          <label className="grid gap-2 text-[var(--sea-ink)]">
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="resize-y rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3"
            />
          </label>
          <Button type="submit" disabled={savingPet}>
            {savingPet ? 'Saving…' : 'Save pet'}
          </Button>
        </form>

        <form
          onSubmit={(e) => void onSaveBlog(e)}
          className="feature-card grid gap-4 rounded-3xl p-6 text-sm"
        >
          <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
            Public blog
          </h2>
          {blog ? (
            <>
              <div className="grid gap-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
                  URL slug (read-only)
                </p>
                <code className="rounded-xl bg-[var(--surface-strong)] px-3 py-2 text-[var(--lagoon-deep)]">
                  {blog.slug}
                </code>
                {publicUrl ? (
                  <a
                    href={publicUrl}
                    className="font-semibold text-[var(--lagoon-deep)] no-underline hover:underline"
                  >
                    View public blog
                  </a>
                ) : null}
              </div>
              <label className="grid gap-2 text-[var(--sea-ink)]">
                Blog description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="resize-y rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3"
                  placeholder="Shown on the public blog home…"
                />
              </label>
              <label className="grid gap-2 text-[var(--sea-ink)]">
                Visibility
                <select
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(
                      e.target.value as 'private' | 'public' | 'unlisted',
                    )
                  }
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3"
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <Button type="submit" disabled={savingBlog}>
                {savingBlog ? 'Saving…' : 'Save blog settings'}
              </Button>
            </>
          ) : (
            <p className="text-[var(--sea-ink-soft)]">No blog row for this pet.</p>
          )}
        </form>
      </div>

      <p className="mt-8 text-sm">
        <Link
          to="/app/pets"
          className="font-semibold text-[var(--lagoon-deep)] no-underline hover:underline"
        >
          ← All pets
        </Link>
      </p>
    </PageShell>
  )
}
