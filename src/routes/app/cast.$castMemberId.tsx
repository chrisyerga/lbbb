'use client'

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useMemo, useState } from 'react'
import { CastPhotoUpload } from '#/components/CastPhotoUpload'
import { CastCard, CastPhoto, MiniPetAvatar } from '#/components/app/cast/CastCards'
import type { CastListMember, RelKind } from '#/components/app/cast/CastCards'
import {
  ChipMultiSelect,
  DangerZone,
  EditField,
  EditInput,
  EditSection,
  EditTextArea,
  EditTopHeader,
  SaveBar,
  SegmentPicker,
} from '#/components/app/edit'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'

export const Route = createFileRoute('/app/cast/$castMemberId')({
  component: CastEditPage,
})

const REL_OPTIONS: Array<{ value: RelKind; label: string; color: string }> = [
  { value: 'family', label: 'Family', color: '#E0382E' },
  { value: 'friend', label: 'Friend', color: '#3CB07A' },
  { value: 'pal', label: 'Park pal', color: '#F2A02E' },
  { value: 'neighbor', label: 'Neighbor', color: '#C5663B' },
  { value: 'nemesis', label: 'Nemesis', color: '#7E5BFF' },
]

function parseAliases(value: string) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function CastEditPage() {
  const { castMemberId } = Route.useParams()
  const id = castMemberId as Id<'castMembers'>
  const navigate = useNavigate()
  const detail = useQuery(api.castMembers.getById, { castMemberId: id })
  const pets = useQuery(api.pets.listMine)
  const updateMember = useMutation(api.castMembers.update)
  const archiveMember = useMutation(api.castMembers.archive)
  const removePhoto = useMutation(api.castMembers.removeReferencePhoto)

  const [name, setName] = useState('')
  const [aliases, setAliases] = useState('')
  const [relKind, setRelKind] = useState<RelKind>('family')
  const [relationship, setRelationship] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [visualDescription, setVisualDescription] = useState('')
  const [relatedPetIds, setRelatedPetIds] = useState<Array<string>>([])
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!detail) return
    setName(detail.name)
    setAliases(detail.aliases.join(', '))
    setRelKind(detail.relKind ?? (detail.kind === 'person' ? 'family' : 'pal'))
    setRelationship(detail.relationship ?? '')
    setSpecies(detail.species ?? '')
    setBreed(detail.breed ?? '')
    setVisualDescription(detail.visualDescription)
    setRelatedPetIds(detail.relatedPetIds ?? [])
    setSavedSnapshot(
      JSON.stringify({
        name: detail.name,
        aliases: detail.aliases.join(', '),
        relKind: detail.relKind ?? (detail.kind === 'person' ? 'family' : 'pal'),
        relationship: detail.relationship ?? '',
        species: detail.species ?? '',
        breed: detail.breed ?? '',
        visualDescription: detail.visualDescription,
        relatedPetIds: detail.relatedPetIds ?? [],
      }),
    )
    setError(null)
  }, [detail])

  const currentSnapshot = JSON.stringify({
    name,
    aliases,
    relKind,
    relationship,
    species,
    breed,
    visualDescription,
    relatedPetIds,
  })
  const dirty = currentSnapshot !== savedSnapshot

  function onDiscard() {
    if (!detail) return
    setName(detail.name)
    setAliases(detail.aliases.join(', '))
    setRelKind(detail.relKind ?? (detail.kind === 'person' ? 'family' : 'pal'))
    setRelationship(detail.relationship ?? '')
    setSpecies(detail.species ?? '')
    setBreed(detail.breed ?? '')
    setVisualDescription(detail.visualDescription)
    setRelatedPetIds(detail.relatedPetIds ?? [])
    setError(null)
  }

  const petOptions = useMemo(
    () =>
      (pets ?? []).map((row) => ({
        value: row.pet._id,
        label: row.pet.name,
        node: (
          <MiniPetAvatar
            pet={{
              _id: row.pet._id,
              name: row.pet.name,
              avatarUrl: row.avatarUrl,
              accentColor: row.pet.accentColor ?? null,
            }}
            size={22}
          />
        ),
      })),
    [pets],
  )

  const relatedPets = useMemo(() => {
    return (pets ?? [])
      .filter((row) => relatedPetIds.includes(row.pet._id))
      .map((row) => ({
        _id: row.pet._id,
        name: row.pet.name,
        avatarUrl: row.avatarUrl,
        accentColor: row.pet.accentColor ?? null,
      }))
  }, [pets, relatedPetIds])

  async function onSave() {
    if (!detail) return
    setSaving(true)
    setError(null)
    try {
      await updateMember({
        castMemberId: detail._id,
        name: detail.linkedPetId ? undefined : name,
        aliases: parseAliases(aliases),
        relKind,
        relationship,
        relatedPetIds: relatedPetIds as Array<Id<'pets'>>,
        species: detail.linkedPetId ? undefined : species,
        breed: detail.linkedPetId ? undefined : breed,
        visualDescription,
      })
      setSavedSnapshot(currentSnapshot)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function onArchive() {
    if (!detail || detail.linkedPetId) return
    if (!window.confirm(`Remove ${detail.name} from your cast?`)) return
    setSaving(true)
    setError(null)
    try {
      await archiveMember({ castMemberId: detail._id })
      await navigate({ to: '/app/cast' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed')
      setSaving(false)
    }
  }

  if (detail === undefined) {
    return <div className="page-wrap px-4 py-12 text-sm text-(--text-muted)">Loading...</div>
  }

  if (detail === null) {
    return (
      <div className="page-wrap px-4 py-12 text-sm text-(--text-muted)">
        Cast member not found. <Link to="/app/cast">Back to cast</Link>
      </div>
    )
  }

  const isLinkedPet = Boolean(detail.linkedPetId)
  const previewMember: CastListMember = {
    ...detail,
    name: name || 'Unnamed',
    aliases: parseAliases(aliases),
    relKind,
    relationship: relationship || undefined,
    species: species || undefined,
    breed: breed || undefined,
    visualDescription,
    relatedPetIds: relatedPetIds as Array<Id<'pets'>>,
    relatedPets,
  }

  return (
    <div>
      <EditTopHeader
        breadcrumb={`Cast · ${detail.name}`}
        title="Edit"
        accentWord={name || 'character'}
        onBack={() => void navigate({ to: '/app/cast' })}
        photoNode={<CastPhoto member={previewMember} size={64} />}
      />

      <main className="edit-page-main page-wrap px-4">
        <div>
          {isLinkedPet ? (
            <p className="mb-5 rounded-xl border-2 border-[#14100E] bg-(--landing-accent)/20 px-3 py-2 text-xs text-(--text-primary)">
              Synced from{' '}
              <Link to="/app/pets/$petId" params={{ petId: detail.linkedPetId! }} className="font-semibold">
                {detail.linkedPetName}
              </Link>
              . Name and species update from the pet profile.
            </p>
          ) : null}

          <EditSection n={1} title="Photo & name" helper="who is this?">
            <div className="grid gap-5 sm:grid-cols-2">
              <EditField label="Name" required>
                <EditInput value={name} onChange={setName} locked={isLinkedPet} />
              </EditField>
              <EditField label="Aliases" hint="comma-separated">
                <EditInput value={aliases} onChange={setAliases} placeholder="Mom, Grandma Jo, Biscuit" />
              </EditField>
              {!isLinkedPet && detail.kind !== 'person' ? (
                <>
                  <EditField label="Species">
                    <EditInput value={species} onChange={setSpecies} />
                  </EditField>
                  <EditField label="Breed / type">
                    <EditInput value={breed} onChange={setBreed} />
                  </EditField>
                </>
              ) : null}
            </div>
          </EditSection>

          <EditSection n={2} title="Relationship" helper="colors the badge">
            <div className="grid gap-5">
              <EditField label="Relationship type">
                <SegmentPicker value={relKind} onChange={(value) => setRelKind(value as RelKind)} options={REL_OPTIONS} />
              </EditField>
              <EditField label="Badge text">
                <EditInput value={relationship} onChange={setRelationship} placeholder="Zoe's park best friend" />
              </EditField>
            </div>
          </EditSection>

          <EditSection n={3} title={`About ${name || 'them'}`} helper="context for the writing">
            <EditField label="Visual description" required>
              <EditTextArea value={visualDescription} onChange={setVisualDescription} rows={4} />
            </EditField>
          </EditSection>

          <EditSection n={4} title="Appears with" helper="which pets share scenes">
            <ChipMultiSelect values={relatedPetIds} onChange={setRelatedPetIds} options={petOptions} />
          </EditSection>

          <EditSection n={5} title="Reference photos" helper="for generated art">
            <div className="cast-photo-grid">
              {detail.referencePhotos.map((photo) => (
                <div key={photo.assetId} className="cast-photo-item">
                  {photo.url ? <img src={photo.url} alt="" className="cast-photo-thumb" /> : null}
                  <button
                    type="button"
                    className="cast-photo-remove"
                    onClick={() => void removePhoto({ castMemberId: detail._id, assetId: photo.assetId })}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <CastPhotoUpload castMemberId={detail._id} onUploaded={() => {}} multiple />
            </div>
          </EditSection>

          <DangerZone
            items={[
              {
                label: 'Remove from cast',
                helper: isLinkedPet
                  ? 'Linked pets are managed from the Pets page.'
                  : "This character won't be suggested for new memories. Existing posts keep their mentions.",
                action: 'Remove',
                onClick: () => void onArchive(),
                disabled: isLinkedPet || saving,
              },
            ]}
          />

          {error ? <p className="alert-error px-3 py-2">{error}</p> : null}
        </div>

        <aside className="edit-preview-column">
          <span className="edit-live-label">Live preview</span>
          <CastCard member={previewMember} />
          <div className="memory-preview-note">↑ updates as you type</div>
        </aside>
      </main>

      <SaveBar dirty={dirty} saving={saving} entity="character changes" onSave={() => void onSave()} onDiscard={onDiscard} />
    </div>
  )
}
