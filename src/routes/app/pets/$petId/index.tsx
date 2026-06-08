'use client'

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useEffect, useState } from 'react'
import { PetAvatarSection } from '#/components/PetAvatarSection'
import { PetNotFound } from '#/components/NotFoundPanel'
import {
  ArtStyleSwatches,
  DangerZone,
  EditField,
  EditInput,
  EditSection,
  EditSelect,
  EditTextArea,
  EditTopHeader,
  PhotoSlot,
  SaveBar,
  SegmentPicker,
  TagInput,
  VoicePicker,
} from '#/components/app/edit'
import { PetPhoto } from '#/components/app/pets/PetPhoto'
import { PetRowCard } from '#/components/app/pets/PetRowCard'
import type { PetListRow } from '#/components/app/pets/PetRowCard'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'
import { parsePetId } from '#/lib/convexIds'
import { publicRoutes } from '#/lib/product'

export const Route = createFileRoute('/app/pets/$petId/')({
  component: EditPetPage,
})

function EditPetPage() {
  const { petId } = Route.useParams()
  const navigate = useNavigate()
  const parsedPetId = parsePetId(petId)
  const data = useQuery(api.pets.getMineByPetId, parsedPetId ? { petId } : 'skip')
  const petRows = useQuery(api.pets.listMine)
  const narrators = useQuery(api.narrators.listPublished)
  const artStyles = useQuery(api.artStyles.listActive)
  const updatePet = useMutation(api.pets.update)
  const updateBlog = useMutation(api.pets.updateBlogMeta)

  const [name, setName] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [bio, setBio] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'public' | 'unlisted'>('public')
  const [accentColor, setAccentColor] = useState('#E0382E')
  const [traits, setTraits] = useState<Array<string>>([])
  const [featured, setFeatured] = useState('false')
  const [defaultNarratorId, setDefaultNarratorId] = useState<Id<'narrators'> | null>(null)
  const [defaultArtStyleId, setDefaultArtStyleId] = useState<Id<'artStyles'> | null>(null)
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return
    setName(data.pet.name)
    setSpecies(data.pet.species ?? '')
    setBreed(data.pet.breed ?? '')
    setBio(data.pet.bio ?? '')
    setAccentColor(data.pet.accentColor ?? '#E0382E')
    setTraits(data.pet.traits ?? [])
    setFeatured(data.pet.featured ? 'true' : 'false')
    setDefaultNarratorId(data.pet.defaultNarratorId ?? null)
    setDefaultArtStyleId(data.pet.defaultArtStyleId ?? null)
    if (data.blog) {
      setDescription(data.blog.description ?? '')
      setVisibility(data.blog.visibility)
    }
    setSavedSnapshot(
      JSON.stringify({
        name: data.pet.name,
        species: data.pet.species ?? '',
        breed: data.pet.breed ?? '',
        bio: data.pet.bio ?? '',
        accentColor: data.pet.accentColor ?? '#E0382E',
        traits: data.pet.traits ?? [],
        featured: data.pet.featured ? 'true' : 'false',
        defaultNarratorId: data.pet.defaultNarratorId ?? null,
        defaultArtStyleId: data.pet.defaultArtStyleId ?? null,
        description: data.blog?.description ?? '',
        visibility: data.blog?.visibility ?? 'public',
      }),
    )
    setError(null)
  }, [data])

  const currentSnapshot = JSON.stringify({
    name,
    species,
    breed,
    bio,
    accentColor,
    traits,
    featured,
    defaultNarratorId,
    defaultArtStyleId,
    description,
    visibility,
  })
  const dirty = currentSnapshot !== savedSnapshot

  async function onSave() {
    if (!data) return
    setSaving(true)
    setError(null)
    try {
      await updatePet({
        petId: data.pet._id,
        name,
        species: species || undefined,
        breed: breed || undefined,
        bio: bio || undefined,
        accentColor,
        traits,
        featured: featured === 'true',
        defaultNarratorId: defaultNarratorId || undefined,
        defaultArtStyleId: defaultArtStyleId || undefined,
      })
      if (data.blog) {
        await updateBlog({
          petId: data.pet._id,
          description: description || undefined,
          visibility,
        })
      }
      setSavedSnapshot(currentSnapshot)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function onDiscard() {
    if (!data) return
    setName(data.pet.name)
    setSpecies(data.pet.species ?? '')
    setBreed(data.pet.breed ?? '')
    setBio(data.pet.bio ?? '')
    setAccentColor(data.pet.accentColor ?? '#E0382E')
    setTraits(data.pet.traits ?? [])
    setFeatured(data.pet.featured ? 'true' : 'false')
    setDefaultNarratorId(data.pet.defaultNarratorId ?? null)
    setDefaultArtStyleId(data.pet.defaultArtStyleId ?? null)
    setDescription(data.blog?.description ?? '')
    setVisibility(data.blog?.visibility ?? 'public')
    setError(null)
  }

  if (!parsedPetId) {
    return <PetNotFound petId={petId} />
  }

  if (data === undefined) {
    return (
      <main className="page-wrap px-4 py-12">
        <p className="text-sm text-(--text-muted)">Loading…</p>
      </main>
    )
  }

  if (data === null) {
    return <PetNotFound petId={petId} />
  }

  const { pet, blog, avatarUrl } = data
  const publicUrl = blog ? publicRoutes.petBlog(blog.slug) : null
  const rowFromList = petRows?.find((row) => row.pet._id === pet._id)
  const selectedNarrator = narrators?.find((narrator) => narrator._id === defaultNarratorId)
  const selectedArtStyle = artStyles?.find((style) => style._id === defaultArtStyleId)
  const basePreviewRow: PetListRow = rowFromList ?? {
    pet,
    blog,
    avatarUrl,
    postCount: 0,
    imageCount: 0,
    memoryCount: 0,
    defaultNarrator: data.defaultNarrator,
    defaultArtStyle: data.defaultArtStyle,
    latestPost: null,
  }
  const previewRow: PetListRow = {
    ...basePreviewRow,
    pet: {
      ...basePreviewRow.pet,
      name: name || 'Unnamed',
      species: species || undefined,
      breed: breed || undefined,
      bio: bio || undefined,
      accentColor,
      traits,
      featured: featured === 'true',
      defaultNarratorId: defaultNarratorId ?? undefined,
      defaultArtStyleId: defaultArtStyleId ?? undefined,
    },
    defaultNarrator: selectedNarrator ? { name: selectedNarrator.name } : basePreviewRow.defaultNarrator,
    defaultArtStyle: selectedArtStyle ? { name: selectedArtStyle.name } : basePreviewRow.defaultArtStyle,
  }

  return (
    <div>
      <EditTopHeader
        breadcrumb={`Pets · ${pet.name}`}
        title="Edit"
        accentWord={name || 'pet'}
        onBack={() => void navigate({ to: '/app/pets' })}
        photoNode={<PetPhoto name={name || pet.name} imageUrl={avatarUrl} accentColor={accentColor} size={64} />}
      />

      <main className="edit-page-main page-wrap px-4">
        <div>
          <EditSection n={1} title="Photo & identity" helper="the basics">
            <div className="grid items-start gap-5 lg:grid-cols-[auto_1fr]">
              <PhotoSlot img={avatarUrl} monogram={(name || pet.name).slice(0, 1)} accent={accentColor} size={140} label="square, ~512px" />
              <div className="grid gap-5 sm:grid-cols-2">
                <EditField label="Name" required>
                  <EditInput value={name} onChange={setName} placeholder="e.g. Zoe" />
                </EditField>
                <EditField label="Species">
                  <EditSelect
                    value={species}
                    onChange={setSpecies}
                    options={[
                      { value: '', label: 'No species set' },
                      ...['Dog', 'Cat', 'Rabbit', 'Bird', 'Human', 'Other'].map((value) => ({ value, label: value })),
                    ]}
                  />
                </EditField>
                <EditField label="Breed / type" hint="optional">
                  <EditInput value={breed} onChange={setBreed} placeholder="e.g. Terrier" />
                </EditField>
                <EditField label="Card color" hint="used when there's no photo">
                  <SegmentPicker
                    value={accentColor}
                    onChange={setAccentColor}
                    options={[
                      { value: '#E0382E', label: 'Tomato', color: '#E0382E' },
                      { value: '#F2A02E', label: 'Amber', color: '#F2A02E' },
                      { value: '#3CB07A', label: 'Mint', color: '#3CB07A' },
                      { value: '#5FA8E0', label: 'Sky', color: '#5FA8E0' },
                    ]}
                  />
                </EditField>
              </div>
            </div>
            <div className="mt-5">
              <PetAvatarSection petId={pet._id} petName={pet.name} avatarUrl={avatarUrl} avatarAssetId={pet.avatarAssetId} />
            </div>
          </EditSection>

          <EditSection n={2} title={`About ${name || 'them'}`} helper="context for the writing">
            <div className="grid gap-5">
              <EditField label="Bio" hint="cafezoe uses this in every post" required>
                <EditTextArea value={bio} onChange={setBio} placeholder="Age, personality, the things they love and fear..." />
              </EditField>
              <EditField label="Personality & quirks" hint="press enter to add">
                <TagInput tags={traits} onChange={setTraits} placeholder="loves tennis balls, hates the vacuum..." />
              </EditField>
            </div>
          </EditSection>

          <EditSection n={3} title="Default voice & art" helper="overridable per memory">
            <div className="grid gap-5">
              <EditField label="Narrator voice" hint="the writing style">
                {narrators === undefined ? (
                  <p className="text-sm text-(--text-muted)">Loading narrators...</p>
                ) : (
                  <VoicePicker
                    value={defaultNarratorId}
                    onChange={(value) => setDefaultNarratorId(value as Id<'narrators'>)}
                    narrators={narrators}
                  />
                )}
              </EditField>
              <EditField label="Art style">
                {artStyles === undefined ? (
                  <p className="text-sm text-(--text-muted)">Loading art styles...</p>
                ) : (
                  <ArtStyleSwatches
                    value={defaultArtStyleId}
                    onChange={(value) => setDefaultArtStyleId(value as Id<'artStyles'>)}
                    styles={artStyles}
                  />
                )}
              </EditField>
            </div>
          </EditSection>

          <EditSection n={4} title="Blog & privacy" helper="who can see the page">
            {blog ? (
              <div className="grid gap-5">
                <EditField label="Visibility">
                  <SegmentPicker
                    value={visibility}
                    onChange={(value) => setVisibility(value as 'private' | 'public' | 'unlisted')}
                    options={[
                      { value: 'public', label: 'Public', color: '#3CB07A' },
                      { value: 'unlisted', label: 'Unlisted', color: '#F2A02E' },
                      { value: 'private', label: 'Private', color: '#14100E' },
                    ]}
                  />
                </EditField>
                <EditField label="Public address" hint="locked — shared links never break">
                  <EditInput value={blog.slug} prefix="cafezoe.app/p/" mono locked />
                </EditField>
                <EditField label="Blog description">
                  <EditTextArea value={description} onChange={setDescription} rows={3} placeholder="Shown on the public blog home..." />
                </EditField>
                {publicUrl ? (
                  <a href={publicUrl} className="font-semibold no-underline">
                    View public blog →
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-(--text-muted)">No blog row for this pet.</p>
            )}
          </EditSection>

          <EditSection n={5} title="Featured" helper="roster treatment">
            <SegmentPicker
              value={featured}
              onChange={setFeatured}
              options={[
                { value: 'false', label: 'Standard card', color: '#14100E' },
                { value: 'true', label: 'Featured tape', color: '#F2A02E' },
              ]}
            />
          </EditSection>

          <DangerZone
            items={[
              {
                label: `Archive ${pet.name}`,
                helper: 'Hide the page and pause new posts. Reversible support flow coming soon.',
                action: 'Archive',
                disabled: true,
              },
              {
                label: `Delete ${pet.name}`,
                helper: 'Permanently removing pets is intentionally not exposed yet.',
                action: 'Delete',
                disabled: true,
              },
            ]}
          />

          {error ? <p className="alert-error px-3 py-2">{error}</p> : null}

          <p className="mt-8 text-sm">
            <Link to="/app/pets/$petId/memories" params={{ petId: pet._id }} className="font-semibold no-underline">
              Manage memories →
            </Link>
          </p>
        </div>

        <aside className="edit-preview-column">
          <span className="edit-live-label">Live preview</span>
          <PetRowCard row={previewRow} variant="compact" />
          <div className="memory-preview-card">
            <div className="memory-preview-head">
              <span className="memory-preview-live">
                <span className="memory-preview-dot" />
                public page
              </span>
            </div>
            <p className="m-0 font-mono text-[13px] text-(--landing-ink)">
              cafezoe.app/p/<b>{blog?.slug ?? 'slug'}</b>
            </p>
            <p className="mt-3 mb-0 text-sm leading-relaxed text-(--landing-ink)/70">
              {description || bio || 'Add a bio and blog description to shape the public page.'}
            </p>
          </div>
          <div className="memory-preview-note">↑ updates as you type</div>
        </aside>
      </main>

      <SaveBar dirty={dirty} saving={saving} entity="pet changes" onSave={() => void onSave()} onDiscard={onDiscard} />
    </div>
  )
}
