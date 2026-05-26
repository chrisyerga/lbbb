'use client'

import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
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
import { useMemoryGenerationStream } from '#/hooks/useMemoryGenerationStream'

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
  readOnly,
}: {
  value: string
  onChange: (value: string) => void
  dictating: boolean
  onDictate: () => void
  petId: Id<'pets'>
  onPhotoUploaded: (assetId: Id<'assets'>, url: string | null) => void
  pendingPhotos: Array<PendingPhoto>
  onRemovePhoto: (assetId: Id<'assets'>) => void
  readOnly?: boolean
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
          readOnly={readOnly}
          disabled={readOnly}
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

function GeneratedArtPreview({
  artStyleLabel,
  imageUrls,
}: {
  artStyleLabel: string
  imageUrls: Array<string | null>
}) {
  const palette = getLandingPalette(DEFAULT_PALETTE_KEY)
  const accents = [
    palette.primary,
    palette.accent,
    palette.ink,
    '#3CB07A',
  ] as const

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
            label={artStyleLabel}
            rotate={[-1, 1.2, 0.8, -1.4][i]}
            style={{ aspectRatio: '1', width: '100%' }}
          />
        )
      })}
    </div>
  )
}

function PreviewCard({
  blogSlug,
  description,
  generatedTitle,
  generatedBody,
  imageUrls,
  narratorName,
  artStyleName,
  isGenerating,
  statusHint,
}: {
  blogSlug: string | null
  description: string
  generatedTitle: string | null
  generatedBody: string | null
  imageUrls: Array<string | null>
  narratorName?: string | null
  artStyleName?: string | null
  isGenerating?: boolean
  statusHint?: string | null
}) {
  const palette = getLandingPalette(DEFAULT_PALETTE_KEY)
  const previewMeta =
    narratorName && artStyleName
      ? `${narratorName} · ${artStyleName}`
      : narratorName ?? 'Pick a narrator'
  const previewTitle =
    generatedTitle ||
    (isGenerating
      ? 'Writing your post…'
      : description.trim()
        ? description.trim().slice(0, 48) +
          (description.trim().length > 48 ? '…' : '')
        : 'Your post title')
  const previewParagraphs = generatedBody
    ? generatedBody.split(/\n\n+/).filter(Boolean).slice(0, 3)
    : description.trim()
      ? [description.trim()]
      : [
          'Your story will land here once you generate — keep typing to preview the draft.',
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
            {statusHint ??
              (blogSlug ? `cafezoe.app/p/${blogSlug}/draft` : 'draft preview')}
          </span>
        </div>

        <GeneratedArtPreview
          artStyleLabel={artStyleName ?? 'art preview'}
          imageUrls={imageUrls}
        />

        <div className="memory-preview-meta">
          today · ~3 min · {previewMeta}
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
        {isGenerating
          ? '← generating your post'
          : '← updates live as you write'}
      </p>
    </div>
  )
}

function MemoryHeader({
  petName,
  avatarUrl,
  blogSlug,
}: {
  petName: string
  avatarUrl: string | null
  blogSlug: string | null
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
              Pick a narrator, dump the memory, and we&apos;ll write the post and
              paint the art.
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
  const attachStream = useMutation(api.memoryGenerationStream.attachStreamToJob)

  const [activeJobId, setActiveJobId] = useState<Id<'generationJobs'> | null>(
    null,
  )
  const [streamId, setStreamId] = useState<string | null>(null)
  const [streamDriver, setStreamDriver] = useState(false)

  const generationPreview = useQuery(
    api.jobs.getMineById,
    activeJobId ? { jobId: activeJobId } : 'skip',
  )

  const stream = useMemoryGenerationStream({
    streamId,
    driven: streamDriver,
  })

  const [text, setText] = useState('')
  const castMatches = useQuery(
    api.castMembers.previewMatches,
    text.trim().length > 0 ? { memoryDescription: text } : 'skip',
  )
  const [dictating, setDictating] = useState(false)
  const [selectedNarratorId, setSelectedNarratorId] =
    useState<Id<'narrators'> | null>(null)
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

  useEffect(() => {
    if (generationPreview?.job.error) {
      setError(generationPreview.job.error)
    }
  }, [generationPreview?.job.error])

  function onPhotoUploaded(assetId: Id<'assets'>, url: string | null) {
    setPendingPhotos((prev) => [...prev, { assetId, url }])
  }

  function removePendingPhoto(assetId: Id<'assets'>) {
    setPendingPhotos((prev) => prev.filter((p) => p.assetId !== assetId))
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
      const { memoryId } = await createDraft({
        petId: parsedPetId,
        description: text,
        sourceAssetIds: pendingPhotos.map((p) => p.assetId),
        narratorId: selectedNarratorId,
      })

      const jobId = await startGeneration({
        petId: parsedPetId,
        memoryId,
        narratorId: selectedNarratorId,
        description: text,
        petName: petData.pet.name,
        petSpecies: petData.pet.species,
      })

      const { streamId: newStreamId } = await attachStream({ jobId })
      setActiveJobId(jobId)
      setStreamId(newStreamId)
      setStreamDriver(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setActiveJobId(null)
      setStreamId(null)
      setStreamDriver(false)
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
  const isGenerating =
    submitting ||
    (activeJobId !== null &&
      (generationPreview === undefined ||
        (generationPreview !== null &&
          generationPreview.job.status !== 'awaiting_review' &&
          generationPreview.job.status !== 'failed')))

  const previewStatusHint = (() => {
    if (!activeJobId || !generationPreview) return null
    const status = generationPreview.streamStatus
    if (status === 'streaming_text' || stream.status === 'streaming') {
      return 'Writing…'
    }
    if (status === 'text_done' || status === 'generating_images') {
      const count = generationPreview.imageUrls.filter(Boolean).length
      return `Painting sample art (${count}/4)…`
    }
    if (generationPreview.job.status === 'awaiting_review') {
      return 'Draft ready'
    }
    if (generationPreview.job.error) return 'Generation failed'
    return null
  })()

  const previewBody =
    stream.text &&
    (stream.status === 'streaming' ||
      (stream.status === 'pending' && stream.text.length > 0))
      ? stream.text
      : (generationPreview?.draft?.bodyMarkdown ?? null)

  const previewTitle = generationPreview?.draft?.title ?? null
  const previewImages = generationPreview?.imageUrls ?? []

  const canGenerate =
    text.trim().length > 0 &&
    Boolean(selectedNarratorId) &&
    !submitting &&
    !isGenerating

  return (
    <div className="create-memory-page">
      <MemoryHeader
        petName={pet.name}
        avatarUrl={avatarUrl}
        blogSlug={blog?.slug ?? null}
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
              readOnly={isGenerating}
            />

            <p className="memory-cast-note">
              {castMatches && castMatches.length > 0 ? (
                <>
                  {castMatches.map((match) => match.name).join(' and ')} may
                  appear in your art.{' '}
                </>
              ) : null}
              <Link to="/app/cast" className="font-semibold">
                Manage friends & family
              </Link>{' '}
              so named people and pets match your illustrations.
            </p>

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
              {selectedNarrator
                ? `Narrator: ${selectedNarrator.name} · Art: ${selectedNarrator.defaultArtStyle.name}`
                : 'Pick a narrator to preview style'}
            </p>
          </div>

          <div className="memory-preview-column">
            <StepLabel n={3} title="The post" helper="updates live" />
            <PreviewCard
              blogSlug={blog?.slug ?? null}
              description={text}
              generatedTitle={previewTitle}
              generatedBody={previewBody ?? null}
              imageUrls={previewImages}
              narratorName={selectedNarrator?.name}
              artStyleName={selectedNarrator?.defaultArtStyle.name}
              isGenerating={isGenerating}
              statusHint={previewStatusHint}
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
