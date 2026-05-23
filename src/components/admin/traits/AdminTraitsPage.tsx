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
  CatalogStatusChip,
} from '#/components/admin/form'
import { MonoLabel } from '#/components/admin/jobs/primitives'
import {
  TRAIT_CATEGORIES,
  slugify
} from '#/lib/adminCatalogUi'

import type { TraitCategory } from '#/lib/adminCatalogUi'

type TraitDoc = Doc<'narratorTraits'>

function emptyTrait(category: TraitCategory, sortOrder: number): TraitDoc {
  return {
    _id: '' as Id<'narratorTraits'>,
    _creationTime: 0,
    slug: '',
    label: '',
    category,
    promptFragment: '',
    sortOrder,
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function AdminTraitsPage({
  selectedTraitId,
}: {
  selectedTraitId: Id<'narratorTraits'> | null
}) {
  const navigate = useNavigate()
  const traits = useQuery(api.adminNarrators.listTraits)
  const usage = useQuery(api.adminNarrators.traitUsage)
  const account = useQuery(api.accounts.getMine)
  const upsertTrait = useMutation(api.adminNarrators.upsertTrait)

  const canEdit = account?.capabilities?.isSiteAdmin ?? false

  const [category, setCategory] = useState<TraitCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<TraitDoc | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!traits) return []
    return traits.filter((t) => {
      if (category !== 'all' && t.category !== category) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        t.label.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        t.promptFragment.toLowerCase().includes(q)
      )
    })
  }, [traits, category, search])

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: traits?.length ?? 0 }
    for (const cat of TRAIT_CATEGORIES) {
      if (cat.id === 'all') continue
      map[cat.id] = traits?.filter((t) => t.category === cat.id).length ?? 0
    }
    return map
  }, [traits])

  if (!selectedTraitId) {
    console.log('selectedTraitId is null, setting to first filtered trait. how dafuq')
    const first = filtered.at(0)
    if (first) selectedTraitId = first._id
  }
  const effectiveId = selectedTraitId;

  useEffect(() => {
    if (isNew) return
    const found = traits?.find((t) => t._id === effectiveId)
    if (found) setDraft({ ...found })
  }, [traits, effectiveId, isNew])

  function selectTrait(id: Id<'narratorTraits'>) {
    setIsNew(false)
    void navigate({ to: '/app/admin/traits', search: { trait: id } })
  }

  function startNew() {
    const cat = category === 'all' ? 'personality' : category
    const maxOrder =
      traits?.reduce((m, t) => Math.max(m, t.sortOrder), 0) ?? 0
    setIsNew(true)
    setDraft(emptyTrait(cat, maxOrder + 10))
    void navigate({ to: '/app/admin/traits', search: {} })
  }

  async function save() {
    if (!draft || !canEdit) return
    setBusy(true)
    setMessage(null)
    try {
      const slug = draft.slug.trim() || slugify(draft.label)
      const id = await upsertTrait({
        traitId: isNew ? undefined : draft._id,
        slug,
        label: draft.label.trim(),
        category: draft.category,
        promptFragment: draft.promptFragment.trim(),
        sortOrder: draft.sortOrder,
        status: draft.status,
      })
      setIsNew(false)
      setMessage('Saved')
      void navigate({ to: '/app/admin/traits', search: { trait: id } })
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  async function archive() {
    if (!draft || !canEdit || isNew) return
    setDraft({ ...draft, status: 'archived' })
  }

  const usedBy = draft ? (usage?.[draft._id as string] ?? []) : []

  return (
    <div className="admin-queue-page">
      <header className="admin-catalog-topbar">
        <div>
          <h1 className="admin-catalog-title">Narrator traits</h1>
          <MonoLabel>Voice fragments for persona composition</MonoLabel>
        </div>
        <div className="admin-catalog-topbar-actions">
          {message ? (
            <span className="admin-mono admin-save-message">{message}</span>
          ) : null}
          <AdminBtnPrimary onClick={startNew} disabled={!canEdit}>
            New trait
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
        <aside className="admin-category-rail">
          {TRAIT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={
                category === cat.id
                  ? 'admin-category-item is-active'
                  : 'admin-category-item'
              }
              style={
                category === cat.id
                  ? { borderLeftColor: cat.color }
                  : undefined
              }
              onClick={() => setCategory(cat.id)}
            >
              <span className="admin-category-dot" style={{ background: cat.color }} />
              <span className="admin-category-label">{cat.label}</span>
              <span className="admin-mono admin-category-count">
                {counts[cat.id] ?? 0}
              </span>
              {cat.helper ? (
                <span className="admin-mono admin-category-helper">
                  {cat.helper}
                </span>
              ) : null}
            </button>
          ))}
        </aside>

        <section className="admin-trait-list-panel">
          <div className="admin-queue-list-head">
            <input
              className="admin-queue-search"
              placeholder="Search traits…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="admin-trait-rows">
            {filtered.map((trait) => (
              <button
                key={trait._id}
                type="button"
                className={
                  trait._id === effectiveId && !isNew
                    ? 'admin-trait-row is-active'
                    : 'admin-trait-row'
                }
                onClick={() => selectTrait(trait._id)}
              >
                <span
                  className="admin-category-dot"
                  style={{
                    background:
                      TRAIT_CATEGORIES.find((c) => c.id === trait.category)
                        ?.color ?? '#666',
                  }}
                />
                <span className="admin-trait-row-copy">
                  <span className="admin-trait-row-label">{trait.label}</span>
                  <span className="admin-mono admin-trait-row-slug">
                    {trait.slug}
                  </span>
                </span>
                <CatalogStatusChip status={trait.status} />
                <span className="admin-mono admin-trait-row-used">
                  {(usage?.[trait._id as string] ?? []).length} narrators
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="admin-inspector-rail">
          {!draft ? (
            <div className="admin-empty-state">Select a trait to inspect.</div>
          ) : (
            <>
              <div className="admin-inspector-section">
                <div className="admin-inspector-head">
                  <h2 className="admin-inspector-title">
                    {isNew ? 'New trait' : draft.label || 'Untitled'}
                  </h2>
                  {!isNew ? <CatalogStatusChip status={draft.status} /> : null}
                </div>
                {!canEdit ? (
                  <p className="admin-readonly-note">
                    Site admin required to edit catalog.
                  </p>
                ) : null}
              </div>

              <div className="admin-inspector-section admin-inspector-form">
                <AdminField label="Label">
                  <AdminInput
                    value={draft.label}
                    disabled={!canEdit}
                    onChange={(label) => setDraft({ ...draft, label })}
                  />
                </AdminField>
                <AdminField label="Slug">
                  <AdminInput
                    value={draft.slug}
                    disabled={!canEdit}
                    placeholder={slugify(draft.label)}
                    onChange={(slug) => setDraft({ ...draft, slug })}
                  />
                </AdminField>
                <AdminField label="Category">
                  <AdminSelect
                    value={draft.category}
                    disabled={!canEdit}
                    options={TRAIT_CATEGORIES.filter(
                      (c) => c.id !== 'all',
                    ).map((c) => ({
                      value: c.id as TraitCategory,
                      label: c.label,
                    }))}
                    onChange={(selectedCategory) => setDraft({ ...draft, category: selectedCategory })}
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
                <AdminField label="Status">
                  <AdminSelect
                    value={draft.status}
                    disabled={!canEdit}
                    options={[
                      { value: 'active', label: 'active' },
                      { value: 'archived', label: 'archived' },
                    ]}
                    onChange={(status) => setDraft({ ...draft, status })}
                  />
                </AdminField>
                <AdminField
                  label="Prompt fragment"
                  helper="injected into narrator persona"
                >
                  <AdminTextarea
                    rows={8}
                    value={draft.promptFragment}
                    disabled={!canEdit}
                    onChange={(promptFragment) =>
                      setDraft({ ...draft, promptFragment })
                    }
                  />
                </AdminField>
              </div>

              {!isNew && usedBy.length > 0 ? (
                <div className="admin-inspector-section">
                  <MonoLabel>Used by narrators</MonoLabel>
                  <ul className="admin-used-by-list">
                    {usedBy.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {!isNew && canEdit ? (
                <div className="admin-inspector-section">
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => void archive()}
                  >
                    Mark archived
                  </button>
                </div>
              ) : null}
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
