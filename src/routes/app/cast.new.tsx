'use client'

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useMemo, useState } from 'react'
import { CastPhoto, MiniPetAvatar } from '#/components/app/cast/CastCards'
import type { RelKind } from '#/components/app/cast/CastCards'
import {
  ChipMultiSelect,
  EditField,
  EditInput,
  EditSection,
  EditTextArea,
  EditTopHeader,
  SegmentPicker,
} from '#/components/app/edit'
import { StickerBtn } from '#/components/landing/primitives/StickerBtn'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'

export const Route = createFileRoute('/app/cast/new')({
  component: NewCastPage,
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

function NewCastPage() {
  const navigate = useNavigate()
  const pets = useQuery(api.pets.listMine)
  const createMember = useMutation(api.castMembers.create)
  const [kind, setKind] = useState<'person' | 'animal'>('person')
  const [name, setName] = useState('')
  const [aliases, setAliases] = useState('')
  const [relKind, setRelKind] = useState<RelKind>('family')
  const [relationship, setRelationship] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [visualDescription, setVisualDescription] = useState('')
  const [relatedPetIds, setRelatedPetIds] = useState<Array<string>>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  async function onCreate() {
    setSaving(true)
    setError(null)
    try {
      const { castMemberId } = await createMember({
        name,
        kind,
        aliases: parseAliases(aliases),
        relKind,
        relationship: relationship || undefined,
        relatedPetIds: relatedPetIds as Array<Id<'pets'>>,
        species: kind === 'animal' ? species || undefined : undefined,
        breed: kind === 'animal' ? breed || undefined : undefined,
        visualDescription,
      })
      await navigate({ to: '/app/cast/$castMemberId', params: { castMemberId } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const rel = REL_OPTIONS.find((option) => option.value === relKind) ?? REL_OPTIONS[0]
  const previewMember = {
    name: name || 'Unnamed',
    avatarUrl: null,
    relKind,
    kind,
  }

  return (
    <div>
      <EditTopHeader
        breadcrumb="Cast · new character"
        title="Add"
        accentWord={name || 'character'}
        onBack={() => void navigate({ to: '/app/cast' })}
        photoNode={<CastPhoto member={previewMember} size={64} />}
      />

      <main className="edit-page-main page-wrap px-4">
        <div>
          <EditSection n={1} title="Photo & name" helper="who is this?">
            <div className="grid gap-5 sm:grid-cols-2">
              <EditField label="Name" required>
                <EditInput value={name} onChange={setName} placeholder="e.g. Biscuit" />
              </EditField>
              <EditField label="Kind">
                <SegmentPicker
                  value={kind}
                  onChange={(value) => setKind(value as 'person' | 'animal')}
                  options={[
                    { value: 'person', label: 'Person', color: '#E0382E' },
                    { value: 'animal', label: 'Animal', color: '#3CB07A' },
                  ]}
                />
              </EditField>
              <EditField label="Aliases" hint="comma-separated">
                <EditInput value={aliases} onChange={setAliases} placeholder="Mom, Grandma Jo, Biscuit" />
              </EditField>
              <EditField label="Role / type">
                <EditInput
                  value={kind === 'animal' ? species : relationship}
                  onChange={kind === 'animal' ? setSpecies : setRelationship}
                  placeholder={kind === 'animal' ? 'Golden Retriever' : 'grandmother, neighbor, friend'}
                />
              </EditField>
            </div>
          </EditSection>

          <EditSection n={2} title="Relationship" helper="colors the badge">
            <div className="grid gap-5">
              <EditField label="Relationship type">
                <SegmentPicker value={relKind} onChange={(value) => setRelKind(value as RelKind)} options={REL_OPTIONS} />
              </EditField>
              <EditField label="Badge text" hint={`default: ${rel.label}`}>
                <EditInput value={relationship} onChange={setRelationship} placeholder="Zoe's park best friend" />
              </EditField>
              {kind === 'animal' ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  <EditField label="Species">
                    <EditInput value={species} onChange={setSpecies} placeholder="Dog" />
                  </EditField>
                  <EditField label="Breed / type">
                    <EditInput value={breed} onChange={setBreed} placeholder="Golden Retriever" />
                  </EditField>
                </div>
              ) : null}
            </div>
          </EditSection>

          <EditSection n={3} title={`About ${name || 'them'}`} helper="context for the writing">
            <EditField label="Visual description" required>
              <EditTextArea
                value={visualDescription}
                onChange={setVisualDescription}
                placeholder="Who they are, how they act, what they mean to your pet..."
              />
            </EditField>
          </EditSection>

          <EditSection n={4} title="Appears with" helper="which pets share scenes">
            <ChipMultiSelect values={relatedPetIds} onChange={setRelatedPetIds} options={petOptions} />
          </EditSection>

          {error ? <p className="alert-error px-3 py-2">{error}</p> : null}

          <StickerBtn bg="var(--landing-primary)" size="md" onClick={() => void onCreate()} disabled={saving || !name.trim()}>
            {saving ? 'Adding...' : 'Add to cast'}
          </StickerBtn>
        </div>
      </main>
    </div>
  )
}
