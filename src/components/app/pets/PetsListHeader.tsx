'use client'

import { useEffect, useMemo, useState } from 'react'
import { StickerBtn } from '#/components/landing/primitives/StickerBtn'
import { usePrefersReducedMotion } from '#/components/landing/hooks/usePrefersReducedMotion'

export type PetsListStats = {
  petCount: number
  postCount: number
  imageCount: number
}

const TITLE_VARIATIONS = [
  (n: number) => (n === 1 ? 'One good client.' : `${n} good clients.`),
  (n: number) => (n === 1 ? 'One very good pet.' : `${n} very good pets.`),
  (n: number) => (n === 1 ? 'One star of the show.' : `${n} stars of the show.`),
  (n: number) => (n === 1 ? 'One beloved contributor.' : `${n} beloved contributors.`),
  (n: number) => (n === 1 ? 'One on the roster.' : `${n} on the roster.`),
] as const

const CYCLE_MS = 5000

export function PetsListHeader({ stats }: { stats: PetsListStats }) {
  const reducedMotion = usePrefersReducedMotion()
  const [variationIndex, setVariationIndex] = useState(0)

  const titles = useMemo(() => TITLE_VARIATIONS.map((fn) => fn(stats.petCount)), [stats.petCount])

  useEffect(() => {
    if (stats.petCount === 0 || reducedMotion) return
    const timer = window.setInterval(() => {
      setVariationIndex((i) => (i + 1) % TITLE_VARIATIONS.length)
    }, CYCLE_MS)
    return () => window.clearInterval(timer)
  }, [stats.petCount, reducedMotion])

  useEffect(() => {
    setVariationIndex(0)
  }, [stats.petCount])

  const title = stats.petCount === 0 ? 'Your pets' : titles[variationIndex]

  return (
    <section className="pets-header-band">
      <div className="page-wrap px-4">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="font-mono m-0 text-[11.5px] tracking-[0.2em] text-[var(--landing-accent)] uppercase">
              ↳ Pets · the roster
            </p>
            <h1
              key={title}
              className="font-display pets-header-title m-0 mt-3.5 text-[clamp(2rem,5vw,3.25rem)] leading-[0.95] font-extrabold tracking-tight text-[var(--landing-cream)]"
            >
              {title}
            </h1>
            <p className="mt-4 mb-0 max-w-md text-base leading-normal text-[var(--landing-cream)]/75">
              Manage profiles, blogs, and memories.
            </p>
          </div>

          <div className="pets-header-stats">
            {[
              { v: stats.petCount, l: 'pets active' },
              { v: stats.postCount, l: 'posts filed' },
              { v: stats.imageCount, l: 'art pieces' },
            ].map((s) => (
              <div key={s.l} className="pets-header-stat">
                <div className="font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-none font-extrabold tracking-tight text-[var(--landing-cream)]">
                  {s.v}
                </div>
                <div className="font-mono mt-2 text-[10.5px] tracking-[0.12em] text-[var(--landing-cream)]/60 uppercase">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <StickerBtn bg="var(--landing-primary)" size="md" to="/app/pets/new">
            Add a pet
          </StickerBtn>
        </div>
      </div>
    </section>
  )
}
