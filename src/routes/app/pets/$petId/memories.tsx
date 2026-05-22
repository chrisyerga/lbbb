'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'
import { PageShell } from '#/components/PageShell'
import { PetNotFound } from '#/components/NotFoundPanel'
import { PhotoUpload } from '#/components/PhotoUpload'
import { Button } from '#/components/ui/Button'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'
import { parsePetId } from '#/lib/convexIds'

export const Route = createFileRoute('/app/pets/$petId/memories')({
  component: PetMemoriesPage,
})

type PendingPhoto = {
  assetId: Id<'assets'>
  url: string | null
}

function PetMemoriesPage() {
  const { petId } = Route.useParams()
  const parsedPetId = parsePetId(petId)
  const petData = useQuery(
    api.pets.getMineByPetId,
    parsedPetId ? { petId } : 'skip',
  )
  const memories = useQuery(
    api.memories.listByPet,
    parsedPetId ? { petId: parsedPetId } : 'skip',
  )
  const createMemory = useMutation(api.memories.create)
  const removeMemory = useMutation(api.memories.remove)

  const [occurredOn, setOccurredOn] = useState('')
  const [description, setDescription] = useState('')
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onPhotoUploaded(assetId: Id<'assets'>, url: string | null) {
    setPendingPhotos((prev) => [...prev, { assetId, url }])
  }

  function removePendingPhoto(assetId: Id<'assets'>) {
    setPendingPhotos((prev) => prev.filter((p) => p.assetId !== assetId))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createMemory({
        petId: parsedPetId!,
        occurredOn,
        description,
        sourceAssetIds: pendingPhotos.map((p) => p.assetId),
      })
      setOccurredOn('')
      setDescription('')
      setPendingPhotos([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save memory')
    } finally {
      setSubmitting(false)
    }
  }

  if (!parsedPetId) {
    return <PetNotFound petId={petId} />
  }

  if (petData === undefined) {
    return (
      <PageShell eyebrow="Memories" title="Pet memories">
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      </PageShell>
    )
  }

  if (petData === null) {
    return <PetNotFound petId={petId} />
  }

  const { pet } = petData

  return (
    <PageShell
      eyebrow="Memories"
      title={`${pet.name}'s memories`}
      description="Capture daily moments with photos. These feed into blog generation later."
    >
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="panel mb-8 grid gap-4 p-6 text-sm"
      >
        <h2 className="m-0 text-lg font-semibold text-[var(--text-primary)]">
          New memory
        </h2>

        {error ? (
          <p className="alert-error m-0 px-3 py-2">
            {error}
          </p>
        ) : null}

        <label className="grid gap-2 text-[var(--text-primary)]">
          Date
          <input
            type="date"
            value={occurredOn}
            onChange={(e) => setOccurredOn(e.target.value)}
            required
            className="input-field"
          />
        </label>

        <label className="grid gap-2 text-[var(--text-primary)]">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="input-field resize-y"
            placeholder="What happened today?"
          />
        </label>

        <div className="grid gap-2">
          <p className="section-label">Photos</p>
          <PhotoUpload
            petId={pet._id}
            multiple
            label="Add photos"
            onUploaded={onPhotoUploaded}
          />
          {pendingPhotos.length > 0 ? (
            <ul className="m-0 grid list-none grid-cols-3 gap-0 border border-[var(--border)] p-0 sm:grid-cols-4">
              {pendingPhotos.map((photo) =>
                photo.url ? (
                  <li
                    key={photo.assetId}
                    className="relative border-b border-r border-[var(--border)] p-2"
                  >
                    <img
                      src={photo.url}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                    <button
                      type="button"
                      className="mt-1 w-full cursor-pointer border-0 bg-transparent text-xs text-[var(--text-muted)] hover:text-[var(--accent)]"
                      onClick={() => removePendingPhoto(photo.assetId)}
                    >
                      Remove
                    </button>
                  </li>
                ) : null,
              )}
            </ul>
          ) : (
            <p className="m-0 text-[var(--text-muted)]">
              Add at least one photo before saving.
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={
            submitting ||
            !occurredOn ||
            !description.trim() ||
            pendingPhotos.length === 0
          }
        >
          {submitting ? 'Saving…' : 'Save memory'}
        </Button>
      </form>

      {memories === undefined ? (
        <p className="text-sm text-[var(--text-muted)]">Loading memories…</p>
      ) : memories.length === 0 ? (
        <div className="panel p-6 text-sm text-[var(--text-muted)]">
          <p className="m-0">No memories yet.</p>
        </div>
      ) : (
        <ul className="m-0 grid list-none gap-4 p-0">
          {memories.map((memory) => (
            <li key={memory.memoryId} className="panel p-6 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="section-label">{memory.occurredOn}</p>
                  <p className="mt-2 m-0 text-[var(--text-primary)]">
                    {memory.description}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs"
                  onClick={() =>
                    void removeMemory({ memoryId: memory.memoryId })
                  }
                >
                  Delete
                </Button>
              </div>
              {memory.photos.length > 0 ? (
                <ul className="mt-4 grid list-none grid-cols-3 gap-0 border border-[var(--border)] p-0 sm:grid-cols-4 md:grid-cols-6">
                  {memory.photos.map((photo) =>
                    photo.url ? (
                      <li
                        key={photo.assetId}
                        className="border-b border-r border-[var(--border)]"
                      >
                        <img
                          src={photo.url}
                          alt=""
                          className="aspect-square w-full object-cover"
                        />
                      </li>
                    ) : null,
                  )}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-sm">
        <Link
          to="/app/pets/$petId"
          params={{ petId: pet._id }}
          className="font-semibold no-underline"
        >
          ← Back to edit {pet.name}
        </Link>
      </p>
    </PageShell>
  )
}
