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
import { artStyleColor, slugify } from '#/lib/adminCatalogUi'

type ArtStyleDoc = Doc<'artStyles'>

function emptyArtStyle(sortOrder: number): ArtStyleDoc {
  return {
    _id: '' as Id<'artStyles'>,
    _creationTime: 0,
    slug: '',
    name: '',
    description: '',
    imagePromptSuffix: '',
    sortOrder,
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function AdminArtStylesPage({ selectedStyleId }: { selectedStyleId: Id<'artStyles'> | null }) {
  const navigate = useNavigate()
  const styles = useQuery(api.adminNarrators.listArtStyles)
  const usage = useQuery(api.adminNarrators.artStyleUsage)
  const account = useQuery(api.accounts.getMine)
  const upsertArtStyle = useMutation(api.adminNarrators.upsertArtStyle)

  const canEdit = account?.capabilities?.isSiteAdmin ?? false

  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<ArtStyleDoc | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!styles) return []
    return styles.filter((s) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.imagePromptSuffix.toLowerCase().includes(q)
      )
    })
  }, [styles, search])

  const effectiveId = selectedStyleId ?? filtered.at(0)?._id ?? null

  useEffect(() => {
    if (isNew) return
    const found = styles?.find((s) => s._id === effectiveId)
    if (found) setDraft({ ...found })
  }, [styles, effectiveId, isNew])

  function selectStyle(id: Id<'artStyles'>) {
    setIsNew(false)
    void navigate({ to: '/app/admin/art-styles', search: { style: id } })
  }

  function startNew() {
    const maxOrder = styles?.reduce((m, s) => Math.max(m, s.sortOrder), 0) ?? 0
    setIsNew(true)
    setDraft(emptyArtStyle(maxOrder + 10))
    void navigate({ to: '/app/admin/art-styles', search: {} })
  }

  async function save() {
    if (!draft || !canEdit) return
    setBusy(true)
    setMessage(null)
    try {
      const slug = draft.slug.trim() || slugify(draft.name)
      const id = await upsertArtStyle({
        artStyleId: isNew ? undefined : draft._id,
        slug,
        name: draft.name.trim(),
        description: draft.description.trim(),
        imagePromptSuffix: draft.imagePromptSuffix.trim(),
        sortOrder: draft.sortOrder,
        status: draft.status,
      })
      setIsNew(false)
      setMessage('Saved')
      void navigate({ to: '/app/admin/art-styles', search: { style: id } })
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const usedBy = draft ? (usage?.[draft._id as string] ?? []) : []

  return (
    <div className="admin-queue-page">
      <header className="admin-catalog-topbar">
        <div>
          <h1 className="admin-catalog-title">Art styles</h1>
          <MonoLabel>Image generation look &amp; prompt suffixes</MonoLabel>
        </div>
        <div className="admin-catalog-topbar-actions">
          {message ? <span className="admin-mono admin-save-message">{message}</span> : null}
          <AdminBtnPrimary onClick={startNew} disabled={!canEdit}>
            New style
          </AdminBtnPrimary>
          <AdminBtnPrimary onClick={() => void save()} disabled={!canEdit || !draft || busy}>
            {busy ? 'Saving…' : 'Save'}
          </AdminBtnPrimary>
        </div>
      </header>

      <div className="admin-catalog-layout">
        <section className="admin-trait-list-panel">
          <div className="admin-queue-list-head">
            <input
              className="admin-queue-search"
              placeholder="Search art styles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="admin-trait-rows">
            {filtered.map((style) => (
              <button
                key={style._id}
                type="button"
                className={style._id === effectiveId && !isNew ? 'admin-trait-row is-active' : 'admin-trait-row'}
                onClick={() => selectStyle(style._id)}
              >
                <span
                  className="admin-art-style-swatch admin-art-style-swatch-sm"
                  style={{ background: artStyleColor(style.slug) }}
                />
                <span className="admin-trait-row-copy">
                  <span className="admin-trait-row-label">{style.name}</span>
                  <span className="admin-mono admin-trait-row-slug">{style.slug}</span>
                </span>
                <CatalogStatusChip status={style.status} />
                <span className="admin-mono admin-trait-row-used">
                  {(usage?.[style._id as string] ?? []).length} narrators
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="admin-inspector-rail admin-inspector-rail-wide">
          {!draft ? (
            <div className="admin-empty-state">Select an art style to edit.</div>
          ) : (
            <>
              <div className="admin-inspector-section">
                <div className="admin-inspector-head">
                  <span
                    className="admin-art-style-swatch admin-art-style-swatch-lg"
                    style={{ background: artStyleColor(draft.slug) }}
                  />
                  <div>
                    <h2 className="admin-inspector-title">{isNew ? 'New art style' : draft.name || 'Untitled'}</h2>
                    {!isNew ? <CatalogStatusChip status={draft.status} /> : null}
                  </div>
                </div>
                {!canEdit ? <p className="admin-readonly-note">Site admin required to edit catalog.</p> : null}
                {!isNew && usedBy.length > 0 && draft.status === 'archived' ? (
                  <p className="admin-readonly-note">
                    Still referenced by {usedBy.length} narrator
                    {usedBy.length === 1 ? '' : 's'}.
                  </p>
                ) : null}
              </div>

              <div className="admin-inspector-section admin-inspector-form">
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
                <AdminField label="Description">
                  <AdminTextarea
                    rows={3}
                    value={draft.description}
                    disabled={!canEdit}
                    onChange={(description) => setDraft({ ...draft, description })}
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
                <AdminField label="Image prompt suffix" helper="appended to scene prompts for image generation">
                  <AdminTextarea
                    rows={6}
                    value={draft.imagePromptSuffix}
                    disabled={!canEdit}
                    onChange={(imagePromptSuffix) => setDraft({ ...draft, imagePromptSuffix })}
                  />
                </AdminField>
              </div>

              {!isNew && usedBy.length > 0 ? (
                <div className="admin-inspector-section">
                  <MonoLabel>Default for narrators</MonoLabel>
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
                    onClick={() => setDraft({ ...draft, status: 'archived' })}
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
