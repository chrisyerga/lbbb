'use client'

import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import type { Id } from '#convex/_generated/dataModel'
import { api } from '#convex/_generated/api'
import {
  AdminBtnPrimary,
  AdminField,
  AdminTextarea,
  ModerationStatusChip,
} from '#/components/admin/form'
import { MonoLabel } from '#/components/admin/jobs/primitives'
import { hashColor, narratorInitials, MODERATION_STATUS_TAX } from '#/lib/adminCatalogUi'
import { relTime } from '#/lib/adminJobsUi'

type ModFilter = 'all' | 'pending' | 'flagged'

export function AdminModerationPage({
  selectedPostId,
  selectedAssetId,
}: {
  selectedPostId: Id<'generatedPosts'> | null
  selectedAssetId: Id<'assets'> | null
}) {
  const navigate = useNavigate()
  const rows = useQuery(api.adminModeration.queueList, { limit: 100 })
  const resolve = useMutation(api.adminModeration.resolve)

  const [filter, setFilter] = useState<ModFilter>('pending')
  const [search, setSearch] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const effectiveSelection = useMemo(() => {
    if (selectedPostId) return { postId: selectedPostId, assetId: null }
    if (selectedAssetId) return { postId: null, assetId: selectedAssetId }
    const first = rows?.[0]
    if (!first) return { postId: null, assetId: null }
    if (first.kind === 'post' && first.postId) {
      return { postId: first.postId, assetId: null }
    }
    if (first.kind === 'asset' && first.assetId) {
      return { postId: null, assetId: first.assetId }
    }
    return { postId: null, assetId: null }
  }, [selectedPostId, selectedAssetId, rows])

  const detail = useQuery(
    api.adminModeration.queueDetail,
    effectiveSelection.postId || effectiveSelection.assetId
      ? {
          postId: effectiveSelection.postId ?? undefined,
          assetId: effectiveSelection.assetId ?? undefined,
        }
      : 'skip',
  )

  const filteredRows = useMemo(() => {
    if (!rows) return []
    return rows.filter((row) => {
      if (filter !== 'all' && row.status !== filter) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        row.petName.toLowerCase().includes(q) ||
        row.ownerEmail.toLowerCase().includes(q) ||
        row.title.toLowerCase().includes(q) ||
        (row.excerpt?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [rows, filter, search])

  const counts = useMemo(() => {
    const base = { all: rows?.length ?? 0, pending: 0, flagged: 0 }
    for (const row of rows ?? []) {
      if (row.status === 'pending') base.pending++
      if (row.status === 'flagged') base.flagged++
    }
    return base
  }, [rows])

  function selectItem(item: NonNullable<typeof rows>[number]) {
    void navigate({
      to: '/app/admin/moderation',
      search:
        item.kind === 'post' && item.postId
          ? { post: item.postId }
          : item.assetId
            ? { asset: item.assetId }
            : {},
    })
  }

  async function decide(
    decision: 'approved' | 'flagged' | 'rejected',
  ) {
    if (!effectiveSelection.postId && !effectiveSelection.assetId) return
    setBusy(true)
    try {
      await resolve({
        postId: effectiveSelection.postId ?? undefined,
        assetId: effectiveSelection.assetId ?? undefined,
        decision,
        reason: reason.trim() || undefined,
      })
      setReason('')
    } finally {
      setBusy(false)
    }
  }

  const activeId = effectiveSelection.postId
    ? `post:${effectiveSelection.postId}`
    : effectiveSelection.assetId
      ? `asset:${effectiveSelection.assetId}`
      : null

  return (
    <div className="admin-queue-page">
      <header className="admin-catalog-topbar">
        <div>
          <h1 className="admin-catalog-title">Moderation</h1>
          <MonoLabel>Review generated posts &amp; images</MonoLabel>
        </div>
        <div className="admin-catalog-topbar-stats">
          <span className="admin-mono admin-top-stat-sub">
            {counts.pending} pending · {counts.flagged} flagged
          </span>
        </div>
      </header>

      <div className="admin-queue-layout">
        <aside className="admin-queue-list">
          <div className="admin-queue-list-head">
            <input
              className="admin-queue-search"
              placeholder="Search pet, owner, title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="admin-filter-chips">
              {(
                [
                  ['all', counts.all],
                  ['pending', counts.pending],
                  ['flagged', counts.flagged],
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
            {filteredRows.length === 0 ? (
              <div className="admin-empty-state">Queue is clear.</div>
            ) : (
              filteredRows.map((row) => {
                const color = hashColor(row.petName)
                const isActive = row.id === activeId
                return (
                  <button
                    key={row.id}
                    type="button"
                    className={
                      isActive
                        ? 'admin-queue-row is-active'
                        : 'admin-queue-row'
                    }
                    onClick={() => selectItem(row)}
                  >
                    <span
                      className="admin-pet-dot"
                      style={{ background: color }}
                    >
                      {row.petName[0]}
                    </span>
                    <span className="admin-queue-row-body">
                      <span className="admin-queue-row-title">
                        {row.title}
                      </span>
                      <span className="admin-queue-row-meta">
                        {row.petName} · {row.ownerEmail}
                      </span>
                      <span className="admin-queue-row-foot">
                        <ModerationStatusChip status={row.status} />
                        <span className="admin-mono admin-queue-row-time">
                          {row.kind} · {relTime(row.createdAt)}
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <main className="admin-queue-main admin-moderation-main">
          {!detail ? (
            <div className="admin-empty-state">Select an item to review.</div>
          ) : detail.kind === 'post' ? (
            <div className="admin-moderation-viewer">
              <header className="admin-moderation-header">
                <div className="admin-moderation-header-main">
                  <span
                    className="admin-pet-dot is-lg"
                    style={{
                      background: hashColor(detail.pet?.name ?? 'pet'),
                    }}
                  >
                    {narratorInitials(detail.pet?.name ?? '?')[0]}
                  </span>
                  <div>
                    <h2 className="admin-output-title">{detail.post.title}</h2>
                    <p className="admin-moderation-sub">
                      {detail.pet?.name} · {detail.ownerEmail}
                    </p>
                  </div>
                </div>
                <ModerationStatusChip
                  status={detail.post.moderationStatus}
                  size="lg"
                />
              </header>

              {detail.post.excerpt ? (
                <p className="admin-moderation-excerpt">{detail.post.excerpt}</p>
              ) : null}

              <article className="admin-output-body admin-moderation-body">
                {detail.post.bodyMarkdown}
              </article>

              {detail.imageUrls.length > 0 ? (
                <div className="admin-output-images">
                  {detail.imageUrls.map(
                    (url, i) =>
                      url && (
                        <div key={i} className="admin-output-image">
                          <img src={url} alt="" />
                        </div>
                      ),
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="admin-moderation-viewer">
              <header className="admin-moderation-header">
                <div className="admin-moderation-header-main">
                  <span
                    className="admin-pet-dot is-lg"
                    style={{
                      background: hashColor(detail.pet?.name ?? 'asset'),
                    }}
                  >
                    {narratorInitials(detail.pet?.name ?? '?')[0]}
                  </span>
                  <div>
                    <h2 className="admin-output-title">
                      {detail.asset.kind.replace('_', ' ')}
                    </h2>
                    <p className="admin-moderation-sub">
                      {detail.pet?.name ?? 'No pet'} · {detail.ownerEmail}
                    </p>
                  </div>
                </div>
                <ModerationStatusChip
                  status={detail.asset.moderationStatus}
                  size="lg"
                />
              </header>
              {detail.imageUrl ? (
                <div className="admin-moderation-image-wrap">
                  <img src={detail.imageUrl} alt="" />
                </div>
              ) : (
                <div className="admin-output-placeholder">No preview</div>
              )}
            </div>
          )}
        </main>

        <aside className="admin-inspector-rail">
          <div className="admin-inspector-section">
            <MonoLabel>Resolution</MonoLabel>
            <AdminField label="Reason / notes" helper="optional audit trail">
              <AdminTextarea
                rows={4}
                value={reason}
                placeholder="Why approve, flag, or reject…"
                onChange={setReason}
              />
            </AdminField>
            <div className="admin-moderation-actions">
              <AdminBtnPrimary disabled={busy || !detail} onClick={() => decide('approved')}>
                Approve
              </AdminBtnPrimary>
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={busy || !detail}
                onClick={() => decide('flagged')}
              >
                Flag
              </button>
              <button
                type="button"
                className="admin-btn-secondary admin-btn-danger"
                disabled={busy || !detail}
                onClick={() => decide('rejected')}
              >
                Reject
              </button>
            </div>
          </div>

          {detail && detail.events.length > 0 ? (
            <div className="admin-inspector-section">
              <MonoLabel>Event history</MonoLabel>
              <ul className="admin-event-history">
                {detail.events.map((ev) => {
                  const tax = MODERATION_STATUS_TAX[ev.status]
                  return (
                    <li key={ev._id} className="admin-event-history-row">
                      <span
                        className="admin-status-dot"
                        style={{ background: tax.dot }}
                      />
                      <span className="admin-event-history-copy">
                        <span className="admin-mono">{ev.status}</span>
                        {ev.reason ? (
                          <span className="admin-event-history-reason">
                            {ev.reason}
                          </span>
                        ) : null}
                        <span className="admin-mono admin-event-history-time">
                          {relTime(ev.createdAt)}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
