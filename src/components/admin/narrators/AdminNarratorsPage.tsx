'use client'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import type { Doc, Id } from '#convex/_generated/dataModel'
import { api } from '#convex/_generated/api'
import {
  AdminBtnPrimary,
  AdminField,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  AdminToggle,
  NarratorStatusChip,
} from '#/components/admin/form'
import { MonoLabel } from '#/components/admin/jobs/primitives'
import {
  TRAIT_CATEGORIES,
  artStyleColor,
  hashColor,
  narratorInitials,
  slugify,
  type NarratorStatus,
} from '#/lib/adminCatalogUi'
import { relTime } from '#/lib/adminJobsUi'

type NarratorDoc = Doc<'narrators'>
type EditorTab = 'identity' | 'traits' | 'generation'

function buildDraft(
  base: Partial<NarratorDoc> & {
    defaultArtStyleId: Id<'artStyles'>
  },
): NarratorDoc {
  const now = Date.now()
  return {
    _id: base._id ?? ('' as Id<'narrators'>),
    _creationTime: 0,
    slug: base.slug ?? '',
    name: base.name ?? 'New narrator',
    tagline: base.tagline ?? '',
    description: base.description,
    exampleExcerpt: base.exampleExcerpt,
    avatarAssetId: base.avatarAssetId,
    traitIds: base.traitIds ?? [],
    specializationPrompt: base.specializationPrompt ?? '',
    promptVersionKey: base.promptVersionKey ?? 'narrator.custom',
    systemPromptAddon: base.systemPromptAddon,
    defaultMoodHints: base.defaultMoodHints ?? [],
    wordTarget: base.wordTarget ?? 280,
    textModel: base.textModel,
    textParameters: base.textParameters,
    defaultArtStyleId: base.defaultArtStyleId,
    imageModel: base.imageModel,
    imagePromptSuffix: base.imagePromptSuffix,
    generationStrategy: base.generationStrategy ?? 'single_shot',
    speechProfile: base.speechProfile,
    public: base.public ?? false,
    featured: base.featured ?? false,
    minPlanTier: base.minPlanTier,
    sortOrder: base.sortOrder ?? 999,
    status: base.status ?? 'draft',
    createdAt: base.createdAt ?? now,
    updatedAt: base.updatedAt ?? now,
  }
}

export function AdminNarratorsPage({
  selectedNarratorId,
}: {
  selectedNarratorId: Id<'narrators'> | null
}) {
  const navigate = useNavigate()
  const narrators = useQuery(api.adminNarrators.listAll)
  const traits = useQuery(api.adminNarrators.listTraits)
  const artStyles = useQuery(api.adminNarrators.listArtStyles)
  const account = useQuery(api.accounts.getMine)
  const upsertNarrator = useMutation(api.adminNarrators.upsertNarrator)

  const canEdit = account?.capabilities?.isSiteAdmin ?? false

  const [filter, setFilter] = useState<NarratorStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<EditorTab>('identity')
  const [draft, setDraft] = useState<NarratorDoc | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [moodInput, setMoodInput] = useState('')

  const defaultArtStyleId = artStyles?.[0]?._id

  const filtered = useMemo(() => {
    if (!narrators) return []
    return narrators.filter((n) => {
      if (filter !== 'all' && n.status !== filter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        n.name.toLowerCase().includes(q) ||
        n.tagline.toLowerCase().includes(q) ||
        n.slug.toLowerCase().includes(q)
      )
    })
  }, [narrators, filter, search])

  const counts = useMemo(() => {
    const c = { all: narrators?.length ?? 0, published: 0, draft: 0, archived: 0 }
    for (const n of narrators ?? []) c[n.status]++
    return c
  }, [narrators])

  const effectiveId = selectedNarratorId ?? filtered[0]?._id ?? null

  useEffect(() => {
    if (isNew || !defaultArtStyleId) return
    const found = narrators?.find((n) => n._id === effectiveId)
    if (found) setDraft({ ...found })
  }, [narrators, effectiveId, isNew, defaultArtStyleId])

  const traitMap = useMemo(() => {
    const map = new Map<string, Doc<'narratorTraits'>>()
    for (const t of traits ?? []) map.set(t._id, t)
    return map
  }, [traits])

  function selectNarrator(id: Id<'narrators'>) {
    setIsNew(false)
    void navigate({ to: '/app/admin/narrators', search: { narrator: id } })
  }

  function startNew() {
    if (!defaultArtStyleId) return
    setIsNew(true)
    setTab('identity')
    setDraft(
      buildDraft({
        defaultArtStyleId,
        sortOrder: (narrators?.length ?? 0) * 10 + 10,
      }),
    )
    void navigate({ to: '/app/admin/narrators', search: {} })
  }

  function toggleTrait(traitId: Id<'narratorTraits'>) {
    if (!draft) return
    const has = draft.traitIds.includes(traitId)
    setDraft({
      ...draft,
      traitIds: has
        ? draft.traitIds.filter((id) => id !== traitId)
        : [...draft.traitIds, traitId],
    })
  }

  function addMoodHint() {
    if (!draft) return
    const v = moodInput.trim()
    if (!v || draft.defaultMoodHints?.includes(v)) return
    setDraft({
      ...draft,
      defaultMoodHints: [...(draft.defaultMoodHints ?? []), v],
    })
    setMoodInput('')
  }

  async function save() {
    if (!draft || !canEdit) return
    setBusy(true)
    setMessage(null)
    try {
      const slug = draft.slug.trim() || slugify(draft.name)
      const id = await upsertNarrator({
        narratorId: isNew ? undefined : draft._id,
        slug,
        name: draft.name.trim(),
        tagline: draft.tagline.trim(),
        description: draft.description?.trim() || undefined,
        exampleExcerpt: draft.exampleExcerpt?.trim() || undefined,
        traitIds: draft.traitIds,
        specializationPrompt: draft.specializationPrompt.trim(),
        promptVersionKey: draft.promptVersionKey.trim(),
        systemPromptAddon: draft.systemPromptAddon?.trim() || undefined,
        defaultMoodHints: draft.defaultMoodHints,
        wordTarget: draft.wordTarget,
        textModel: draft.textModel?.trim() || undefined,
        defaultArtStyleId: draft.defaultArtStyleId,
        imagePromptSuffix: draft.imagePromptSuffix?.trim() || undefined,
        generationStrategy: draft.generationStrategy,
        public: draft.public,
        featured: draft.featured,
        minPlanTier: draft.minPlanTier,
        sortOrder: draft.sortOrder,
        status: draft.status,
      })
      setIsNew(false)
      setMessage('Saved')
      void navigate({ to: '/app/admin/narrators', search: { narrator: id } })
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const previewTraits = draft?.traitIds
    .map((id) => traitMap.get(id))
    .filter(Boolean) as Doc<'narratorTraits'>[] | undefined

  const previewStyle = artStyles?.find(
    (s) => s._id === draft?.defaultArtStyleId,
  )

  return (
    <div className="admin-queue-page">
      <header className="admin-catalog-topbar">
        <div>
          <h1 className="admin-catalog-title">Narrators</h1>
          <MonoLabel>AI post-generation personas</MonoLabel>
        </div>
        <div className="admin-catalog-topbar-actions">
          {message ? (
            <span className="admin-mono admin-save-message">{message}</span>
          ) : null}
          <AdminBtnPrimary onClick={startNew} disabled={!canEdit || !defaultArtStyleId}>
            New narrator
          </AdminBtnPrimary>
          <AdminBtnPrimary
            onClick={() => void save()}
            disabled={!canEdit || !draft || busy}
          >
            {busy ? 'Saving…' : 'Save'}
          </AdminBtnPrimary>
        </div>
      </header>

      <div className="admin-catalog-layout">
        <aside className="admin-narrator-list">
          <div className="admin-queue-list-head">
            <input
              className="admin-queue-search"
              placeholder="Search narrators…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="admin-filter-chips">
              {(
                [
                  ['all', counts.all],
                  ['published', counts.published],
                  ['draft', counts.draft],
                  ['archived', counts.archived],
                ] as const
              ).map(([id, n]) => (
                <button
                  key={id}
                  type="button"
                  className={
                    filter === id
                      ? 'admin-filter-chip is-active'
                      : 'admin-filter-chip'
                  }
                  onClick={() => setFilter(id)}
                >
                  {id} ({n})
                </button>
              ))}
            </div>
          </div>
          <div className="admin-queue-rows">
            {filtered.map((n) => {
              const color = hashColor(n.slug)
              const active = n._id === effectiveId && !isNew
              return (
                <button
                  key={n._id}
                  type="button"
                  className={
                    active ? 'admin-narrator-row is-active' : 'admin-narrator-row'
                  }
                  onClick={() => selectNarrator(n._id)}
                >
                  <span className="admin-pet-dot" style={{ background: color }}>
                    {narratorInitials(n.name)}
                  </span>
                  <span className="admin-narrator-row-copy">
                    <span className="admin-narrator-row-title">
                      {n.name}
                      {n.featured ? ' ★' : ''}
                    </span>
                    <span className="admin-narrator-row-tagline">{n.tagline}</span>
                    <span className="admin-narrator-row-foot">
                      <NarratorStatusChip status={n.status} />
                      <span className="admin-mono">
                        {n.traitIds.length} traits
                        {!n.public ? ' · internal' : ''}
                      </span>
                      <span className="admin-mono admin-narrator-row-time">
                        {relTime(n.updatedAt)}
                      </span>
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <main className="admin-editor-panel">
          {!draft ? (
            <div className="admin-empty-state">Select a narrator to edit.</div>
          ) : (
            <>
              <div className="admin-editor-tabs">
                {(
                  [
                    ['identity', 'Identity'],
                    ['traits', 'Traits & prompt'],
                    ['generation', 'Generation'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={
                      tab === id
                        ? 'admin-editor-tab is-active'
                        : 'admin-editor-tab'
                    }
                    onClick={() => setTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {!canEdit ? (
                <p className="admin-readonly-note">
                  Site admin required to edit catalog.
                </p>
              ) : null}

              {tab === 'identity' ? (
                <div className="admin-editor-form">
                  <AdminField label="Name">
                    <AdminInput
                      value={draft.name}
                      disabled={!canEdit}
                      onChange={(name) => setDraft({ ...draft, name })}
                    />
                  </AdminField>
                  <AdminField label="Slug">
                    <AdminInput
                      value={draft.slug}
                      disabled={!canEdit}
                      placeholder={slugify(draft.name)}
                      onChange={(slug) => setDraft({ ...draft, slug })}
                    />
                  </AdminField>
                  <AdminField label="Tagline">
                    <AdminInput
                      value={draft.tagline}
                      disabled={!canEdit}
                      onChange={(tagline) => setDraft({ ...draft, tagline })}
                    />
                  </AdminField>
                  <AdminField label="Description">
                    <AdminTextarea
                      rows={3}
                      value={draft.description ?? ''}
                      disabled={!canEdit}
                      onChange={(description) =>
                        setDraft({ ...draft, description })
                      }
                    />
                  </AdminField>
                  <AdminField label="Example excerpt">
                    <AdminTextarea
                      rows={3}
                      value={draft.exampleExcerpt ?? ''}
                      disabled={!canEdit}
                      onChange={(exampleExcerpt) =>
                        setDraft({ ...draft, exampleExcerpt })
                      }
                    />
                  </AdminField>
                  <div className="admin-editor-row">
                    <AdminField label="Status">
                      <AdminSelect
                        value={draft.status}
                        disabled={!canEdit}
                        options={[
                          { value: 'draft', label: 'draft' },
                          { value: 'published', label: 'published' },
                          { value: 'archived', label: 'archived' },
                        ]}
                        onChange={(status) => setDraft({ ...draft, status })}
                      />
                    </AdminField>
                    <AdminField label="Sort order">
                      <AdminInput
                        value={String(draft.sortOrder)}
                        disabled={!canEdit}
                        onChange={(v) =>
                          setDraft({
                            ...draft,
                            sortOrder: Number.parseInt(v, 10) || 0,
                          })
                        }
                      />
                    </AdminField>
                  </div>
                  <AdminToggle
                    value={draft.public}
                    disabled={!canEdit}
                    label="Public catalog"
                    helper="visible to users when published"
                    onChange={(public_) => setDraft({ ...draft, public: public_ })}
                  />
                  <AdminToggle
                    value={draft.featured}
                    disabled={!canEdit}
                    label="Featured"
                    helper="surfaces in narrator picker"
                    onChange={(featured) => setDraft({ ...draft, featured })}
                  />
                  <AdminField label="Minimum plan">
                    <AdminSelect
                      value={draft.minPlanTier ?? 'pup'}
                      disabled={!canEdit}
                      options={[
                        { value: 'pup', label: 'pup' },
                        { value: 'top_dog', label: 'top_dog' },
                        { value: 'the_pack', label: 'the_pack' },
                      ]}
                      onChange={(minPlanTier) =>
                        setDraft({ ...draft, minPlanTier })
                      }
                    />
                  </AdminField>
                </div>
              ) : null}

              {tab === 'traits' ? (
                <div className="admin-editor-form">
                  {TRAIT_CATEGORIES.filter((c) => c.id !== 'all').map(
                    (category) => {
                      const group =
                        traits?.filter((t) => t.category === category.id) ?? []
                      const selected = group.filter((t) =>
                        draft.traitIds.includes(t._id),
                      ).length
                      return (
                        <div key={category.id} className="admin-trait-group">
                          <div className="admin-trait-group-head">
                            <span className="admin-trait-group-title">
                              {category.label}
                            </span>
                            <MonoLabel>{category.helper}</MonoLabel>
                            <span className="admin-mono admin-trait-group-count">
                              {selected} selected
                            </span>
                          </div>
                          <div className="admin-trait-pills">
                            {group.map((trait) => {
                              const on = draft.traitIds.includes(trait._id)
                              return (
                                <button
                                  key={trait._id}
                                  type="button"
                                  disabled={!canEdit}
                                  className={
                                    on
                                      ? 'admin-trait-pill is-selected'
                                      : 'admin-trait-pill'
                                  }
                                  onClick={() => toggleTrait(trait._id)}
                                >
                                  {trait.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    },
                  )}
                  <AdminField
                    label="Specialization prompt"
                    helper="core persona instruction"
                  >
                    <AdminTextarea
                      rows={6}
                      value={draft.specializationPrompt}
                      disabled={!canEdit}
                      onChange={(specializationPrompt) =>
                        setDraft({ ...draft, specializationPrompt })
                      }
                    />
                  </AdminField>
                  <AdminField label="System prompt addon">
                    <AdminTextarea
                      rows={3}
                      value={draft.systemPromptAddon ?? ''}
                      disabled={!canEdit}
                      onChange={(systemPromptAddon) =>
                        setDraft({ ...draft, systemPromptAddon })
                      }
                    />
                  </AdminField>
                  <AdminField label="Prompt version key">
                    <AdminInput
                      value={draft.promptVersionKey}
                      disabled={!canEdit}
                      onChange={(promptVersionKey) =>
                        setDraft({ ...draft, promptVersionKey })
                      }
                    />
                  </AdminField>
                </div>
              ) : null}

              {tab === 'generation' ? (
                <div className="admin-editor-form">
                  <AdminField label="Word target">
                    <AdminInput
                      value={String(draft.wordTarget)}
                      disabled={!canEdit}
                      onChange={(v) =>
                        setDraft({
                          ...draft,
                          wordTarget: Number.parseInt(v, 10) || 280,
                        })
                      }
                    />
                  </AdminField>
                  <AdminField label="Text model">
                    <AdminInput
                      value={draft.textModel ?? ''}
                      disabled={!canEdit}
                      placeholder="gpt-4o"
                      onChange={(textModel) =>
                        setDraft({ ...draft, textModel })
                      }
                    />
                  </AdminField>
                  <AdminField label="Generation strategy">
                    <AdminSelect
                      value={draft.generationStrategy}
                      disabled={!canEdit}
                      options={[
                        { value: 'single_shot', label: 'single_shot' },
                        { value: 'draft_critique', label: 'draft_critique' },
                      ]}
                      onChange={(generationStrategy) =>
                        setDraft({ ...draft, generationStrategy })
                      }
                    />
                  </AdminField>
                  <AdminField label="Default art style">
                    <div className="admin-art-style-grid">
                      {(artStyles ?? []).map((style) => (
                        <button
                          key={style._id}
                          type="button"
                          disabled={!canEdit}
                          className={
                            draft.defaultArtStyleId === style._id
                              ? 'admin-art-style-card is-selected'
                              : 'admin-art-style-card'
                          }
                          onClick={() =>
                            setDraft({
                              ...draft,
                              defaultArtStyleId: style._id,
                            })
                          }
                        >
                          <span
                            className="admin-art-style-swatch"
                            style={{
                              background: artStyleColor(style.slug),
                            }}
                          />
                          <span className="admin-art-style-name">
                            {style.name}
                          </span>
                          <span className="admin-mono admin-art-style-slug">
                            {style.slug}
                          </span>
                        </button>
                      ))}
                    </div>
                  </AdminField>
                  <AdminField label="Image prompt suffix">
                    <AdminTextarea
                      rows={3}
                      value={draft.imagePromptSuffix ?? ''}
                      disabled={!canEdit}
                      onChange={(imagePromptSuffix) =>
                        setDraft({ ...draft, imagePromptSuffix })
                      }
                    />
                  </AdminField>
                  <AdminField label="Default mood hints">
                    <div className="admin-mood-editor">
                      {(draft.defaultMoodHints ?? []).map((hint) => (
                        <span key={hint} className="admin-mood-chip">
                          {hint}
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() =>
                              setDraft({
                                ...draft,
                                defaultMoodHints:
                                  draft.defaultMoodHints?.filter(
                                    (h) => h !== hint,
                                  ),
                              })
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        className="admin-mood-input"
                        value={moodInput}
                        disabled={!canEdit}
                        placeholder="sporty, cozy…"
                        onChange={(e) => setMoodInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addMoodHint()
                          }
                        }}
                      />
                    </div>
                  </AdminField>
                </div>
              ) : null}
            </>
          )}
        </main>

        <aside className="admin-preview-rail">
          {!draft ? (
            <div className="admin-empty-state">Preview</div>
          ) : (
            <>
              <MonoLabel>Preview</MonoLabel>
              <div className="admin-preview-card">
                <span
                  className="admin-pet-dot is-lg"
                  style={{ background: hashColor(draft.slug) }}
                >
                  {narratorInitials(draft.name)}
                </span>
                <h3 className="admin-preview-name">{draft.name}</h3>
                <p className="admin-preview-tagline">{draft.tagline}</p>
                {draft.exampleExcerpt ? (
                  <blockquote className="admin-preview-excerpt">
                    {draft.exampleExcerpt}
                  </blockquote>
                ) : null}
                <div className="admin-preview-meta">
                  <NarratorStatusChip status={draft.status} />
                  {previewStyle ? (
                    <span className="admin-mono">{previewStyle.name}</span>
                  ) : null}
                </div>
                {previewTraits && previewTraits.length > 0 ? (
                  <div className="admin-preview-traits">
                    {previewTraits.map((t) => (
                      <span key={t._id} className="admin-trait-pill is-compact">
                        {t.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
