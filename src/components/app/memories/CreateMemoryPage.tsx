'use client'

import { Link, useNavigate } from '@tanstack/react-router'
import { useAction, useMutation, useQuery } from 'convex/react'
import { useEffect, useMemo, useState } from 'react'
import { PhotoUpload } from '#/components/PhotoUpload'
import { ArtTile } from '#/components/landing/primitives/ArtTile'
import { Squiggle } from '#/components/landing/primitives/Squiggle'
import { StickerBtn } from '#/components/landing/primitives/StickerBtn'
import { SunBurst } from '#/components/landing/primitives/SunBurst'
import { Tape } from '#/components/landing/primitives/Tape'
import {
  DEFAULT_PALETTE_KEY,
  getLandingPalette,
} from '#/components/landing/landingPalette'
import {
  IconArrowRight,
  IconComment,
  IconHeart,
  IconSparkle,
  LogoPaw,
} from '#/components/app/icons'
import { PetNotFound } from '#/components/NotFoundPanel'
import { api } from '#convex/_generated/api'
import type { Id } from '#convex/_generated/dataModel'
import { parsePetId } from '#/lib/convexIds'
import {
  DEFAULT_VIBE_SELECTION,
  VIBE_TAG_GROUPS,
  artStyleLabel,
  artTileLabel,
  countSelectedTags,
  moodSummary,
  paragraphCountForLength,
  toggleVibeTag,
  vibeSelectionToHints,
} from '#/lib/vibeTags'
import type { VibeSelection } from '#/lib/vibeTags'

type PendingPhoto = {
  assetId: Id<'assets'>
  url: string | null
}

function StepLabel({
  n,
  title,
  helper,
}: {
  n: number
  title: string
  helper?: string
}) {
  return (
    <div className="memory-step-label">
      <span className="memory-step-num">0{n}</span>
      <span className="memory-step-title">{title}</span>
      {helper ? <span className="memory-step-helper">↳ {helper}</span> : null}
    </div>
  )
}

function TagPill({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={selected ? 'memory-tag-pill is-selected' : 'memory-tag-pill'}
    >
      {selected ? <span className="memory-tag-check">✓</span> : null}
      {label}
    </button>
  )
}

function NarratorPicker({
  narrators,
  selectedId,
  onSelect,
}: {
  narrators: Array<{
    _id: Id<'narrators'>
    name: string
    tagline: string
    exampleExcerpt?: string
    avatarUrl: string | null
    defaultArtStyle: { name: string }
  }>
  selectedId: Id<'narrators'> | null
  onSelect: (id: Id<'narrators'>) => void
}) {
  return (
    <div className="memory-narrator-grid">
      {narrators.map((narrator) => {
        const selected = selectedId === narrator._id
        return (
          <button
            key={narrator._id}
            type="button"
            className={
              selected ? 'memory-narrator-card is-selected' : 'memory-narrator-card'
            }
            onClick={() => onSelect(narrator._id)}
          >
            <div className="memory-narrator-avatar">
              {narrator.avatarUrl ? (
                <img src={narrator.avatarUrl} alt="" />
              ) : (
                <span>{narrator.name.slice(0, 1)}</span>
              )}
            </div>
            <div className="memory-narrator-copy">
              <span className="memory-narrator-name">{narrator.name}</span>
              <span className="memory-narrator-tagline">{narrator.tagline}</span>
              {narrator.exampleExcerpt ? (
                <span className="memory-narrator-excerpt">
                  “{narrator.exampleExcerpt}”
                </span>
              ) : null}
              <span className="memory-narrator-art">
                Art: {narrator.defaultArtStyle.name}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function TagGroup({
  group,
  selected,
  onToggle,
}: {
  group: (typeof VIBE_TAG_GROUPS)[number]
  selected: Array<string>
  onToggle: (tagId: string) => void
}) {
  return (
    <div className="memory-tag-group">
      <div className="memory-tag-group-head">
        <span className="memory-tag-group-title">{group.label}</span>
        <span className="memory-tag-group-helper">
          {group.helper}
          {group.single ? ' · radio' : ''}
        </span>
      </div>
      <div className="memory-tag-row">
        {group.tags.map((tag) => (
          <TagPill
            key={tag.id}
            label={tag.label}
            selected={selected.includes(tag.id)}
            onClick={() => onToggle(tag.id)}
          />
        ))}
      </div>
    </div>
  )
}

function Waveform({ active }: { active: boolean }) {
  return (
    <div className={active ? 'memory-waveform is-active' : 'memory-waveform'}>
      {Array.from({ length: 22 }).map((_, i) => (
        <span
          key={i}
          className="memory-waveform-bar"
          style={{
            height: active ? undefined : 4 + (i % 3) * 2,
            animationDelay: `${i * 0.04}s`,
            animationName: active ? `memory-wave-${i % 4}` : undefined,
          }}
        />
      ))}
    </div>
  )
}

function Composer({
  value,
  onChange,
  dictating,
  onDictate,
  petId,
  onPhotoUploaded,
  pendingPhotos,
  onRemovePhoto,
}: {
  value: string
  onChange: (value: string) => void
  dictating: boolean
  onDictate: () => void
  petId: Id<'pets'>
  onPhotoUploaded: (assetId: Id<'assets'>, url: string | null) => void
  pendingPhotos: Array<PendingPhoto>
  onRemovePhoto: (assetId: Id<'assets'>) => void
}) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0

  return (
    <div className="memory-composer-wrap">
      <Tape
        color="var(--landing-accent)"
        w={110}
        rotate={-7}
        className="absolute -top-3 left-9 z-[2]"
      />
      <Tape
        color="var(--landing-soft)"
        w={70}
        rotate={9}
        className="absolute -top-2.5 right-20 z-[2]"
      />

      <div className="memory-composer">
        <div className="memory-composer-rules" aria-hidden />

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Today Zoe and I walked to the bakery and she made a new friend — a golden named Biscuit..."
          className="memory-composer-input"
          rows={8}
        />

        <p className="memory-composer-marginalia">just dump it →</p>

        <div className="memory-composer-footer">
          <div className="memory-composer-tools">
            <button
              type="button"
              onClick={onDictate}
              className={
                dictating
                  ? 'memory-dictate-btn is-active'
                  : 'memory-dictate-btn'
              }
              aria-label="Toggle dictation"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
            </button>
            <Waveform active={dictating} />
            {dictating ? (
              <span className="memory-dictate-status">
                <span className="memory-dictate-dot" />
                listening
              </span>
            ) : null}
          </div>

          <div className="memory-composer-meta">
            <PhotoUpload
              petId={petId}
              multiple
              label="Attach photo"
              onUploaded={onPhotoUploaded}
            />
            <span className="memory-word-count">
              {wordCount} word{wordCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {pendingPhotos.length > 0 ? (
          <ul className="memory-attached-photos">
            {pendingPhotos.map((photo) =>
              photo.url ? (
                <li key={photo.assetId}>
                  <img src={photo.url} alt="" />
                  <button
                    type="button"
                    onClick={() => onRemovePhoto(photo.assetId)}
                  >
                    Remove
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        ) : null}
      </div>
    </div>
  )
}

function CustomVibeInput({
  customHints,
  onAdd,
  onRemove,
}: {
  customHints: Array<string>
  onAdd: (hint: string) => void
  onRemove: (hint: string) => void
}) {
  const [draft, setDraft] = useState('')

  function submitHint() {
    const hint = draft.trim()
    if (!hint) return
    onAdd(hint)
    setDraft('')
  }

  return (
    <div className="memory-custom-vibes">
      <div className="memory-tag-group-head">
        <span className="memory-tag-group-title">Your hints</span>
        <span className="memory-tag-group-helper">add your own</span>
      </div>
      <div className="memory-custom-vibes-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submitHint()
            }
          }}
          placeholder="e.g. rainy afternoon, vet visit, birthday..."
          className="memory-custom-vibes-input"
        />
        <button
          type="button"
          className="memory-custom-vibes-add"
          onClick={submitHint}
          disabled={!draft.trim()}
        >
          Add
        </button>
      </div>
      {customHints.length > 0 ? (
        <div className="memory-tag-row">
          {customHints.map((hint) => (
            <TagPill
              key={hint}
              label={hint}
              selected
              onClick={() => onRemove(hint)}
            />
          ))}
        </div>
      ) : null}
      {customHints.length > 0 ? (
        <p className="memory-custom-vibes-note">
          Tap a custom hint to remove it.
        </p>
      ) : null}
    </div>
  )
}

function GeneratedArtPreview({
  styleId,
  imageUrls,
}: {
  styleId: string | undefined
  imageUrls: Array<string | null>
}) {
  const palette = getLandingPalette(DEFAULT_PALETTE_KEY)
  const accents = [
    palette.primary,
    palette.accent,
    palette.ink,
    '#3CB07A',
  ] as const
  const label = artTileLabel(styleId)

  return (
    <div className="memory-art-grid">
      {[0, 1, 2, 3].map((i) => {
        const url = imageUrls[i]
        if (url) {
          return (
            <div
              key={i}
              className="memory-art-photo"
              style={{ transform: `rotate(${[-1, 1.2, 0.8, -1.4][i]}deg)` }}
            >
              <img src={url} alt="" />
            </div>
          )
        }
        return (
          <ArtTile
            key={i}
            palette={palette}
            accent={accents[i]}
            label={label}
            rotate={[-1, 1.2, 0.8, -1.4][i]}
            style={{ aspectRatio: '1', width: '100%' }}
          />
        )
      })}
    </div>
  )
}

function PreviewCard({
  selection,
  blogSlug,
  description,
  generatedTitle,
  generatedBody,
  imageUrls,
  narratorName,
  artStyleName,
}: {
  selection: VibeSelection
  blogSlug: string | null
  description: string
  generatedTitle: string | null
  generatedBody: string | null
  imageUrls: Array<string | null>
  narratorName?: string | null
  artStyleName?: string | null
}) {
  const palette = getLandingPalette(DEFAULT_PALETTE_KEY)
  const styleId = selection.style[0]
  const paraCount = paragraphCountForLength(selection)
  const previewMeta = narratorName
    ? `${narratorName}${artStyleName ? ` · ${artStyleName}` : ''}`
    : moodSummary(selection)
  const previewTitle =
    generatedTitle ||
    (description.trim()
      ? description.trim().slice(0, 48) +
        (description.trim().length > 48 ? '…' : '')
      : 'Your post title')
  const previewParagraphs = generatedBody
    ? generatedBody.split(/\n\n+/).filter(Boolean).slice(0, paraCount)
    : description.trim()
      ? [description.trim()]
      : [
          'Your story will land here once you generate — or keep typing to see the vibe shift.',
        ]

  return (
    <div className="memory-preview-wrap">
      <Tape
        color={palette.primary}
        w={84}
        rotate={-8}
        className="absolute -top-2.5 left-9 z-[2]"
      />
      <Tape
        color={palette.accent}
        w={66}
        rotate={11}
        className="absolute -top-2.5 right-12 z-[2]"
      />

      <div className="memory-preview-card">
        <div className="memory-preview-head">
          <span className="memory-preview-live">
            <span className="memory-preview-dot" />
            live preview
          </span>
          <span className="memory-preview-url">
            {blogSlug ? `cafezoe.app/p/${blogSlug}/draft` : 'draft preview'}
          </span>
        </div>

        <GeneratedArtPreview styleId={styleId} imageUrls={imageUrls} />

        <div className="memory-preview-meta">
          today · {Math.round(paraCount * 1.5)} min · {previewMeta}
        </div>

        <h3 className="memory-preview-title">{previewTitle}</h3>

        <div className="memory-preview-body">
          {previewParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="memory-preview-foot">
          <span>
            <IconHeart size={14} /> —
          </span>
          <span>
            <IconComment size={14} /> —
          </span>
          <span className="memory-preview-draft">
            draft · not published <IconArrowRight size={13} />
          </span>
        </div>
      </div>

      <p className="memory-preview-note">
        ← updates live as you {narratorName ? 'write' : 'tag'}
      </p>
    </div>
  )
}

function MemoryHeader({
  petName,
  avatarUrl,
  blogSlug,
  advancedMode,
}: {
  petName: string
  avatarUrl: string | null
  blogSlug: string | null
  advancedMode: boolean
}) {
  const palette = getLandingPalette(DEFAULT_PALETTE_KEY)

  return (
    <section className="memory-header-band">
      <SunBurst
        color="rgba(242,160,46,.18)"
        size={120}
        rays={14}
        className="memory-header-sun"
      />
      <LogoPaw
        size={220}
        fg="rgba(251,241,222,.04)"
        style={{
          position: 'absolute',
          bottom: -50,
          right: -30,
          transform: 'rotate(12deg)',
        }}
      />

      <div className="page-wrap px-4">
        <div className="memory-header-grid">
          <div>
            <p className="memory-header-eyebrow">
              ↳ Pets · {petName} · new memory
            </p>
            <h1 className="memory-header-title">
              What happened
              <br />
              <span className="memory-header-accent-wrap">
                <span className="memory-header-accent">today?</span>
                <Squiggle
                  color={palette.primary}
                  width={170}
                  className="memory-header-squiggle"
                />
              </span>
            </h1>
            <p className="memory-header-lede">
              {advancedMode
                ? "Advanced mode — fine-tune mood, art, and length on top of your narrator."
                : "Pick a narrator, dump the memory, and we'll write the post and paint the art."}
            </p>
          </div>

          <div className="memory-pet-chip">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="memory-pet-chip-photo" />
            ) : (
              <div className="memory-pet-chip-photo memory-pet-chip-photo--empty" />
            )}
            <span className="memory-pet-chip-label">filing for</span>
            <span className="memory-pet-chip-name">{petName}</span>
            {blogSlug ? (
              <span className="memory-pet-chip-slug">/{blogSlug}</span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

export function CreateMemoryPage({ petId }: { petId: string }) {
  const navigate = useNavigate()
  const parsedPetId = parsePetId(petId)
  const petData = useQuery(
    api.pets.getMineByPetId,
    parsedPetId ? { petId } : 'skip',
  )
  const narrators = useQuery(api.narrators.listPublished)
  const usage = useQuery(api.quotas.usageToday)

  const createDraft = useMutation(api.memories.createDraft)
  const startGeneration = useMutation(api.jobs.startMemoryGeneration)
  const runGeneration = useAction(api.generation.runMemoryGeneration)

  const [text, setText] = useState('')
  const [dictating, setDictating] = useState(false)
  const [advancedMode, setAdvancedMode] = useState(false)
  const [selectedNarratorId, setSelectedNarratorId] =
    useState<Id<'narrators'> | null>(null)
  const [selection, setSelection] = useState<VibeSelection>(
    DEFAULT_VIBE_SELECTION,
  )
  const [pendingPhotos, setPendingPhotos] = useState<Array<PendingPhoto>>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!narrators?.length || selectedNarratorId) return
    const featured = narrators.find((n) => n.featured) ?? narrators[0]
    setSelectedNarratorId(featured._id)
  }, [narrators, selectedNarratorId])

  const selectedNarrator = useMemo(
    () => narrators?.find((n) => n._id === selectedNarratorId) ?? null,
    [narrators, selectedNarratorId],
  )

  const tagCount = useMemo(() => countSelectedTags(selection), [selection])

  function onPhotoUploaded(assetId: Id<'assets'>, url: string | null) {
    setPendingPhotos((prev) => [...prev, { assetId, url }])
  }

  function removePendingPhoto(assetId: Id<'assets'>) {
    setPendingPhotos((prev) => prev.filter((p) => p.assetId !== assetId))
  }

  function onToggleTag(
    groupId: keyof Omit<VibeSelection, 'custom'>,
    tagId: string,
    single?: boolean,
  ) {
    setSelection((current) =>
      toggleVibeTag(current, groupId, tagId, Boolean(single)),
    )
  }

  function addCustomHint(hint: string) {
    setSelection((current) => {
      if (current.custom.includes(hint)) return current
      return { ...current, custom: [...current.custom, hint] }
    })
  }

  function removeCustomHint(hint: string) {
    setSelection((current) => ({
      ...current,
      custom: current.custom.filter((h) => h !== hint),
    }))
  }

  async function onSaveDraft() {
    if (!petData || !parsedPetId || !text.trim() || !selectedNarratorId) return
    setError(null)
    setSubmitting(true)
    try {
      await createDraft({
        petId: parsedPetId,
        description: text,
        sourceAssetIds: pendingPhotos.map((p) => p.assetId),
        narratorId: selectedNarratorId,
        vibeHints: advancedMode ? vibeSelectionToHints(selection) : undefined,
      })
      await navigate({
        to: '/app/pets/$petId/memories',
        params: { petId: petData.pet._id },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft')
    } finally {
      setSubmitting(false)
    }
  }

  async function onGenerate() {
    if (!petData || !parsedPetId || !selectedNarratorId) return
    setError(null)
    setSubmitting(true)
    try {
      const vibeHints = advancedMode ? vibeSelectionToHints(selection) : undefined
      const { memoryId } = await createDraft({
        petId: parsedPetId,
        description: text,
        sourceAssetIds: pendingPhotos.map((p) => p.assetId),
        narratorId: selectedNarratorId,
        vibeHints,
      })

      const jobId = await startGeneration({
        petId: parsedPetId,
        memoryId,
        narratorId: selectedNarratorId,
        description: text,
        petName: petData.pet.name,
        petSpecies: petData.pet.species,
        vibeHints,
      })

      void runGeneration({ jobId }).catch(() => {
        // Job page will surface failure state.
      })

      await navigate({
        to: '/app/generations/$jobId',
        params: { jobId },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!parsedPetId) {
    return <PetNotFound petId={petId} />
  }

  if (petData === undefined) {
    return (
      <div className="page-wrap px-4 py-12 text-sm text-[var(--text-muted)]">
        Loading…
      </div>
    )
  }

  if (petData === null) {
    return <PetNotFound petId={petId} />
  }

  const { pet, blog, avatarUrl } = petData
  const rendersRemaining = usage?.rendersRemaining
  const canGenerate =
    text.trim().length > 0 && Boolean(selectedNarratorId) && !submitting

  return (
    <div className="create-memory-page">
      <MemoryHeader
        petName={pet.name}
        avatarUrl={avatarUrl}
        blogSlug={blog?.slug ?? null}
        advancedMode={advancedMode}
      />

      <main className="memory-main page-wrap px-4">
        <div className="memory-main-grid">
          <div>
            <StepLabel n={1} title="Narrator" helper="who tells the story" />
            {narrators === undefined ? (
              <p className="text-sm text-[var(--text-muted)]">Loading narrators…</p>
            ) : narrators.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                No narrators published yet. Ask an admin to seed the catalog.
              </p>
            ) : (
              <NarratorPicker
                narrators={narrators}
                selectedId={selectedNarratorId}
                onSelect={setSelectedNarratorId}
              />
            )}

            <div className="memory-section-gap" />

            <StepLabel n={2} title="The story" helper="type or dictate" />
            <Composer
              value={text}
              onChange={setText}
              dictating={dictating}
              onDictate={() => setDictating((d) => !d)}
              petId={pet._id}
              onPhotoUploaded={onPhotoUploaded}
              pendingPhotos={pendingPhotos}
              onRemovePhoto={removePendingPhoto}
            />

            <div className="memory-advanced-toggle-row">
              <button
                type="button"
                className="memory-advanced-toggle"
                onClick={() => setAdvancedMode((mode) => !mode)}
              >
                {advancedMode ? 'Hide advanced options' : 'Advanced options'}
              </button>
            </div>

            {advancedMode ? (
              <>
                <div className="memory-section-gap" />
                <StepLabel
                  n={3}
                  title="Overrides"
                  helper={`${tagCount} tags`}
                />
                <div className="memory-vibe-panel">
                  {VIBE_TAG_GROUPS.map((group) => (
                    <TagGroup
                      key={group.id}
                      group={group}
                      selected={selection[group.id]}
                      onToggle={(tagId) =>
                        onToggleTag(group.id, tagId, group.single)
                      }
                    />
                  ))}
                  <CustomVibeInput
                    customHints={selection.custom}
                    onAdd={addCustomHint}
                    onRemove={removeCustomHint}
                  />
                </div>
              </>
            ) : null}

            {error ? <p className="alert-error mt-4 px-3 py-2">{error}</p> : null}

            <div className="memory-generate-row">
              <div className="memory-generate-btn-wrap">
                <SunBurst
                  color="var(--landing-accent)"
                  size={92}
                  rays={12}
                  className="memory-generate-sun"
                />
                <StickerBtn
                  bg="var(--landing-primary)"
                  size="lg"
                  className="memory-generate-btn"
                  onClick={() => void onGenerate()}
                  disabled={!canGenerate}
                >
                  <IconSparkle size={20} />{' '}
                  {submitting ? 'Generating…' : 'Generate post + art'}
                </StickerBtn>
              </div>

              <button
                type="button"
                className="memory-save-draft-link"
                onClick={() => void onSaveDraft()}
                disabled={!text.trim() || submitting}
              >
                save as draft
              </button>

              {usage ? (
                <span className="memory-quota-note">
                  {rendersRemaining} of {usage.rendersLimit} renders left today
                </span>
              ) : null}
            </div>

            <p className="memory-style-note">
              {advancedMode
                ? `Art style preview: ${artStyleLabel(selection)}`
                : selectedNarrator
                  ? `Narrator: ${selectedNarrator.name} · Art: ${selectedNarrator.defaultArtStyle.name}`
                  : 'Pick a narrator to preview style'}
            </p>
          </div>

          <div className="memory-preview-column">
            <StepLabel n={advancedMode ? 4 : 3} title="The post" helper="updates live" />
            <PreviewCard
              selection={selection}
              blogSlug={blog?.slug ?? null}
              description={text}
              generatedTitle={null}
              generatedBody={null}
              imageUrls={[]}
              narratorName={advancedMode ? null : selectedNarrator?.name}
              artStyleName={
                advancedMode ? null : selectedNarrator?.defaultArtStyle.name
              }
            />
          </div>
        </div>

        <p className="memory-back-link">
          <Link
            to="/app/pets/$petId"
            params={{ petId: pet._id }}
            className="font-semibold no-underline"
          >
            ← Back to edit {pet.name}
          </Link>
        </p>
      </main>
    </div>
  )
}
