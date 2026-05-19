'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { PageShell } from '#/components/PageShell'
import { Button } from '#/components/ui/Button'
import { PetAvatarSection } from '#/components/PetAvatarSection'
import { PetNotFound } from '#/components/NotFoundPanel'
import { api } from '#convex/_generated/api'
import { parsePetId } from '#/lib/convexIds'
import { publicRoutes } from '#/lib/product'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/app/pets/$petId')({
  component: EditPetPage,
})

function EditPetPage() {
  const { petId } = Route.useParams()
  const parsedPetId = parsePetId(petId)
  const data = useQuery(
    api.pets.getMineByPetId,
    parsedPetId ? { petId } : 'skip',
  )
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

  if (!parsedPetId) {
    return <PetNotFound petId={petId} />
  }

  if (data === undefined) {
    return (
      <PageShell eyebrow="Pets" title="Edit pet">
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      </PageShell>
    )
  }

  if (data === null) {
    return <PetNotFound petId={petId} />
  }

  const { pet, blog, avatarUrl } = data
  const publicUrl = blog ? publicRoutes.petBlog(blog.slug) : null

  return (
    <PageShell
      eyebrow="Pets"
      title={`Edit ${pet.name}`}
      description="Pet name and bio are yours; the public URL slug stays stable."
    >
      <PetAvatarSection
        petId={pet._id}
        petName={pet.name}
        avatarUrl={avatarUrl}
        avatarAssetId={pet.avatarAssetId}
      />

      <p className="mb-8 text-sm">
        <Link
          to="/app/pets/$petId/memories"
          params={{ petId: pet._id }}
          className="font-semibold no-underline"
        >
          Manage memories →
        </Link>
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={(e) => void onSavePet(e)}
          className="panel grid gap-4 p-6 text-sm"
        >
          <h2 className="m-0 text-lg font-semibold text-[var(--text-primary)]">
            Pet profile
          </h2>
          <label className="grid gap-2 text-[var(--text-primary)]">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-field"
            />
          </label>
          <label className="grid gap-2 text-[var(--text-primary)]">
            Species
            <input
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="input-field"
              placeholder="Dog"
            />
          </label>
          <label className="grid gap-2 text-[var(--text-primary)]">
            Breed
            <input
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="input-field"
              placeholder="Corgi"
            />
          </label>
          <label className="grid gap-2 text-[var(--text-primary)]">
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="input-field resize-y"
            />
          </label>
          <Button type="submit" disabled={savingPet}>
            {savingPet ? 'Saving…' : 'Save pet'}
          </Button>
        </form>

        <form
          onSubmit={(e) => void onSaveBlog(e)}
          className="panel grid gap-4 p-6 text-sm"
        >
          <h2 className="m-0 text-lg font-semibold text-[var(--text-primary)]">
            Public blog
          </h2>
          {blog ? (
            <>
              <div className="grid gap-1">
                <p className="section-label">URL slug (read-only)</p>
                <code className="block bg-[var(--bg-input)] px-3 py-2 text-[var(--accent)]">
                  {blog.slug}
                </code>
                {publicUrl ? (
                  <a href={publicUrl} className="font-semibold no-underline">
                    View public blog
                  </a>
                ) : null}
              </div>
              <label className="grid gap-2 text-[var(--text-primary)]">
                Blog description
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="input-field resize-y"
                  placeholder="Shown on the public blog home…"
                />
              </label>
              <label className="grid gap-2 text-[var(--text-primary)]">
                Visibility
                <select
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(
                      e.target.value as 'private' | 'public' | 'unlisted',
                    )
                  }
                  className="input-field"
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
            <p className="text-[var(--text-muted)]">
              No blog row for this pet.
            </p>
          )}
        </form>
      </div>

      <p className="mt-8 text-sm">
        <Link to="/app/pets" className="font-semibold no-underline">
          ← All pets
        </Link>
      </p>
    </PageShell>
  )
}
