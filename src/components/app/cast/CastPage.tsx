'use client'

import { Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useMemo, useState } from 'react'
import { CastPhotoUpload } from '#/components/CastPhotoUpload'
import { PageShell } from '#/components/PageShell'
import { Button, buttonClassName } from '#/components/ui/Button'
import { api } from '#convex/_generated/api'
import type { Doc, Id } from '#convex/_generated/dataModel'

type CastMember = Doc<'castMembers'> & {
  avatarUrl: string | null
  linkedPetName: string | null
}

type EditorKind = 'person' | 'animal'

const KIND_LABELS: Record<CastMember['kind'], string> = {
  pet: 'Pet',
  person: 'Person',
  animal: 'Animal',
}

function kindBadgeClass(kind: CastMember['kind']) {
  if (kind === 'person') return 'cast-kind-badge cast-kind-badge--person'
  if (kind === 'animal') return 'cast-kind-badge cast-kind-badge--animal'
  return 'cast-kind-badge cast-kind-badge--pet'
}

function parseAliases(value: string) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function CastMemberCard({
  member,
  selected,
  onSelect,
}: {
  member: CastMember
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={
        selected ? 'cast-card cast-card--selected' : 'cast-card'
      }
      onClick={onSelect}
    >
      {member.avatarUrl ? (
        <img src={member.avatarUrl} alt="" className="cast-card-avatar" />
      ) : (
        <div className="cast-card-avatar cast-card-avatar--empty" />
      )}
      <div className="cast-card-body">
        <div className="cast-card-head">
          <span className="cast-card-name">{member.name}</span>
          <span className={kindBadgeClass(member.kind)}>
            {KIND_LABELS[member.kind]}
          </span>
        </div>
        {member.relationship ? (
          <p className="cast-card-relationship">{member.relationship}</p>
        ) : null}
        {member.linkedPetId ? (
          <p className="cast-card-sync">Synced from {member.linkedPetName}</p>
        ) : null}
        <p className="cast-card-description">{member.visualDescription}</p>
      </div>
    </button>
  )
}

function CastEditor({
  memberId,
  onClose,
  onArchived,
}: {
  memberId: Id<'castMembers'> | null
  onClose: () => void
  onArchived: () => void
}) {
  const detail = useQuery(
    api.castMembers.getById,
    memberId ? { castMemberId: memberId } : 'skip',
  )
  const updateMember = useMutation(api.castMembers.update)
  const archiveMember = useMutation(api.castMembers.archive)
  const removePhoto = useMutation(api.castMembers.removeReferencePhoto)

  const [name, setName] = useState('')
  const [aliases, setAliases] = useState('')
  const [relationship, setRelationship] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [visualDescription, setVisualDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    if (!detail) return
    setName(detail.name)
    setAliases(detail.aliases.join(', '))
    setRelationship(detail.relationship ?? '')
    setSpecies(detail.species ?? '')
    setBreed(detail.breed ?? '')
    setVisualDescription(detail.visualDescription)
    setError(null)
    setSavedAt(null)
  }, [detail])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!memberId) return
    setSaving(true)
    setError(null)
    setSavedAt(null)
    try {
      await updateMember({
        castMemberId: memberId,
        name: detail?.linkedPetId ? undefined : name,
        aliases: parseAliases(aliases),
        relationship,
        species: detail?.linkedPetId ? undefined : species,
        breed: detail?.linkedPetId ? undefined : breed,
        visualDescription,
      })
      setSavedAt(Date.now())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function onArchive() {
    if (!memberId || !detail) return
    if (detail.linkedPetId) return
    if (!window.confirm(`Remove ${detail.name} from your cast?`)) return
    setSaving(true)
    setError(null)
    try {
      await archiveMember({ castMemberId: memberId })
      onArchived()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Remove failed')
    } finally {
      setSaving(false)
    }
  }

  if (!memberId) {
    return (
      <div className="cast-editor cast-editor--empty panel p-6 text-sm text-[var(--text-muted)]">
        Select someone from your cast to edit their details and reference photos.
      </div>
    )
  }

  if (detail === undefined) {
    return (
      <div className="cast-editor panel p-6 text-sm text-[var(--text-muted)]">
        Loading…
      </div>
    )
  }

  const isLinkedPet = Boolean(detail.linkedPetId)

  return (
    <form
      onSubmit={(e) => void onSave(e)}
      className="cast-editor panel grid gap-4 p-6 text-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-label m-0">Edit cast member</p>
          <h2 className="font-display m-0 mt-1 text-xl font-extrabold text-[var(--text-primary)]">
            {detail.name}
          </h2>
        </div>
        <button
          type="button"
          className="nav-link cursor-pointer border-0 bg-transparent p-0"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      {isLinkedPet ? (
        <p className="m-0 rounded-xl border-2 border-[#14100E] bg-[var(--landing-accent)]/20 px-3 py-2 text-xs text-[var(--text-primary)]">
          Synced from{' '}
          <Link
            to="/app/pets/$petId"
            params={{ petId: detail.linkedPetId! }}
            className="font-semibold"
          >
            {detail.linkedPetName}
          </Link>
          . Name and species update from the pet profile.
        </p>
      ) : null}

      {!isLinkedPet ? (
        <label className="grid gap-2 text-[var(--text-primary)]">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            required
          />
        </label>
      ) : null}

      <label className="grid gap-2 text-[var(--text-primary)]">
        Aliases
        <input
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
          className="input-field"
          placeholder="Mom, my wife, Biscuit's friend"
        />
        <span className="text-xs text-[var(--text-muted)]">
          Comma-separated nicknames we match in your memory text.
        </span>
      </label>

      <label className="grid gap-2 text-[var(--text-primary)]">
        Relationship
        <input
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="input-field"
          placeholder="my husband, Zoe's dog friend"
        />
      </label>

      {!isLinkedPet && detail.kind !== 'person' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-[var(--text-primary)]">
            Species
            <input
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="input-field"
              placeholder="dog, cat, horse"
            />
          </label>
          <label className="grid gap-2 text-[var(--text-primary)]">
            Breed
            <input
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="input-field"
            />
          </label>
        </div>
      ) : null}

      <label className="grid gap-2 text-[var(--text-primary)]">
        Visual description
        <textarea
          value={visualDescription}
          onChange={(e) => setVisualDescription(e.target.value)}
          rows={4}
          className="input-field resize-y"
          required
          placeholder="Coat color, hair, age, distinguishing features — used in generated art."
        />
      </label>

      <div className="grid gap-3">
        <p className="section-label m-0">Reference photos</p>
        <div className="cast-photo-grid">
          {detail.referencePhotos.map((photo) => (
            <div key={photo.assetId} className="cast-photo-item">
              {photo.url ? (
                <img src={photo.url} alt="" className="cast-photo-thumb" />
              ) : (
                <div className="cast-photo-thumb cast-photo-thumb--empty" />
              )}
              <button
                type="button"
                className="cast-photo-remove"
                onClick={() =>
                  void removePhoto({
                    castMemberId: memberId,
                    assetId: photo.assetId,
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <CastPhotoUpload
          castMemberId={memberId}
          onUploaded={() => {
            /* query refreshes */
          }}
          multiple
        />
      </div>

      {error ? <p className="alert-error m-0 px-3 py-2">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        {savedAt !== null ? (
          <span className="text-xs text-[var(--accent)]">Saved.</span>
        ) : null}
        {!isLinkedPet ? (
          <button
            type="button"
            className="nav-link cursor-pointer border-0 bg-transparent p-0 text-red-500"
            disabled={saving}
            onClick={() => void onArchive()}
          >
            Remove from cast
          </button>
        ) : null}
      </div>
    </form>
  )
}

function NewCastForm({ onCreated }: { onCreated: (id: Id<'castMembers'>) => void }) {
  const createMember = useMutation(api.castMembers.create)
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<EditorKind>('person')
  const [name, setName] = useState('')
  const [aliases, setAliases] = useState('')
  const [relationship, setRelationship] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [visualDescription, setVisualDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { castMemberId } = await createMember({
        name,
        kind,
        aliases: parseAliases(aliases),
        relationship: relationship || undefined,
        species: kind === 'animal' ? species || undefined : undefined,
        breed: kind === 'animal' ? breed || undefined : undefined,
        visualDescription,
      })
      setOpen(false)
      setName('')
      setAliases('')
      setRelationship('')
      setSpecies('')
      setBreed('')
      setVisualDescription('')
      onCreated(castMemberId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className={buttonClassName('secondary')}
        onClick={() => setOpen(true)}
      >
        Add person or animal
      </button>
    )
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="panel grid gap-4 p-6 text-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="section-label m-0">New cast member</p>
        <button
          type="button"
          className="nav-link cursor-pointer border-0 bg-transparent p-0"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['person', 'animal'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={
              kind === option
                ? `${buttonClassName('primary')} cast-kind-picker`
                : `${buttonClassName('secondary')} cast-kind-picker`
            }
            onClick={() => setKind(option)}
          >
            {option === 'person' ? 'Person' : 'Off-platform animal'}
          </button>
        ))}
      </div>

      <label className="grid gap-2 text-[var(--text-primary)]">
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          required
        />
      </label>

      <label className="grid gap-2 text-[var(--text-primary)]">
        Aliases
        <input
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
          className="input-field"
          placeholder="Mom, neighbor's terrier"
        />
      </label>

      <label className="grid gap-2 text-[var(--text-primary)]">
        Relationship
        <input
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="input-field"
        />
      </label>

      {kind === 'animal' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-[var(--text-primary)]">
            Species
            <input
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              className="input-field"
            />
          </label>
          <label className="grid gap-2 text-[var(--text-primary)]">
            Breed
            <input
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="input-field"
            />
          </label>
        </div>
      ) : null}

      <label className="grid gap-2 text-[var(--text-primary)]">
        Visual description
        <textarea
          value={visualDescription}
          onChange={(e) => setVisualDescription(e.target.value)}
          rows={3}
          className="input-field resize-y"
          required
        />
      </label>

      {error ? <p className="alert-error m-0 px-3 py-2">{error}</p> : null}

      <Button type="submit" disabled={saving}>
        {saving ? 'Adding…' : 'Add to cast'}
      </Button>
    </form>
  )
}

export function CastPage() {
  const members = useQuery(api.castMembers.listMine)
  const ensureSynced = useMutation(api.castMembers.ensureSyncedFromPets)
  const [selectedId, setSelectedId] = useState<Id<'castMembers'> | null>(null)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (synced) return
    void ensureSynced({}).then(() => setSynced(true))
  }, [ensureSynced, synced])

  const sortedMembers = useMemo(() => members ?? [], [members])

  return (
    <PageShell
      eyebrow="Story cast"
      title="Friends & family"
      description="Add the people and pets who show up in your stories. We use these details so generated art matches your real crew — not generic strangers."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <NewCastForm onCreated={(id) => setSelectedId(id)} />
      </div>

      {members === undefined ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : sortedMembers.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-[var(--text-muted)]">
          <p className="m-0 text-[var(--text-primary)]">
            Add the people and pets who show up in your stories
          </p>
          <p className="mt-2 mb-0">
            Your platform pets will appear here automatically. Add family,
            friends, and neighbor pets so memories mentioning them get accurate
            art.
          </p>
        </div>
      ) : (
        <div className="cast-layout">
          <div className="cast-list">
            {sortedMembers.map((member) => (
              <CastMemberCard
                key={member._id}
                member={member}
                selected={selectedId === member._id}
                onSelect={() => setSelectedId(member._id)}
              />
            ))}
          </div>
          <CastEditor
            memberId={selectedId}
            onClose={() => setSelectedId(null)}
            onArchived={() => setSelectedId(null)}
          />
        </div>
      )}
    </PageShell>
  )
}
