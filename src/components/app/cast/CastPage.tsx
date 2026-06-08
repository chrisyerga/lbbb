'use client'

import { useMutation, useQuery } from 'convex/react'
import { useEffect, useMemo, useState } from 'react'
import { CastGrid } from './CastCards'
import type { CastListMember, RelKind } from './CastCards'
import { IconPlus, LogoPaw } from '#/components/app/icons'
import { StickerBtn } from '#/components/landing/primitives/StickerBtn'
import { SunBurst } from '#/components/landing/primitives/SunBurst'
import { api } from '#convex/_generated/api'

export function CastPage() {
  const members = useQuery(api.castMembers.listMine)
  const ensureSynced = useMutation(api.castMembers.ensureSyncedFromPets)
  const [synced, setSynced] = useState(false)
  const [filter, setFilter] = useState<'all' | RelKind>('all')

  useEffect(() => {
    if (synced) return
    void ensureSynced({}).then(() => setSynced(true))
  }, [ensureSynced, synced])

  const sortedMembers = useMemo<Array<CastListMember>>(() => {
    const rows = members ?? []
    if (filter === 'all') return rows
    return rows.filter((member) => member.relKind === filter)
  }, [filter, members])

  const stats = useMemo(() => {
    const rows = members ?? []
    return {
      characters: rows.length,
      appearances: rows.reduce((n, member) => n + (member.appearanceCount ?? 0), 0),
      family: rows.filter((member) => member.relKind === 'family').length,
    }
  }, [members])

  return (
    <div className="cast-page">
      <section className="cast-header-band">
        <LogoPaw
          size={260}
          fg="rgba(251,241,222,.05)"
          style={{ position: 'absolute', top: -50, right: -40, transform: 'rotate(-22deg)' }}
        />
        <SunBurst color="rgba(242,160,46,.15)" size={140} rays={14} className="cast-header-sun" />

        <div className="page-wrap cast-header-grid px-4">
          <div>
            <p className="cast-header-eyebrow">↳ Cast · friends & family</p>
            <h1 className="cast-header-title">
              The supporting
              <br />
              <span>cast.</span>
            </h1>
            <p className="cast-header-lede">
              The people, pups, and park regulars who turn up in your pets&apos; stories. Add a photo and a few notes so
              cafezoe can reference them by name.
            </p>
          </div>

          <div className="pets-header-stats">
            {[
              { v: stats.characters, l: 'characters' },
              { v: stats.appearances, l: 'appearances' },
              { v: stats.family, l: 'family' },
            ].map((stat) => (
              <div key={stat.l} className="pets-header-stat">
                <div className="font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-none font-extrabold tracking-tight text-(--landing-cream)">
                  {stat.v}
                </div>
                <div className="font-mono mt-2 text-[10.5px] tracking-[0.12em] text-(--landing-cream)/60 uppercase">
                  {stat.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="page-wrap cast-header-toolbar px-4">
          <div className="cast-filter-row">
            <span>Filter</span>
            {[
              ['all', 'Everyone'],
              ['family', 'Family'],
              ['friend', 'Friends'],
              ['pal', 'Park pals'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filter === value ? 'is-active' : ''}
                onClick={() => setFilter(value as 'all' | RelKind)}
              >
                {label}
              </button>
            ))}
          </div>
          <StickerBtn bg="var(--landing-primary)" size="md" to="/app/cast/new">
            <IconPlus size={16} stroke={2.4} /> Add a character
          </StickerBtn>
        </div>
      </section>

      <main className="page-wrap px-4 py-10">
      {members === undefined ? (
        <p className="text-sm text-(--text-muted)">Loading…</p>
      ) : sortedMembers.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-(--text-muted)">
          <p className="m-0 text-(--text-primary)">Add the people and pets who show up in your stories</p>
          <p className="mt-2 mb-0">
            Your platform pets will appear here automatically. Add family, friends, and neighbor pets so memories
            mentioning them get accurate art.
          </p>
        </div>
      ) : (
        <CastGrid members={sortedMembers} />
      )}
      </main>
    </div>
  )
}
