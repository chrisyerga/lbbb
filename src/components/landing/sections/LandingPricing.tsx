'use client'

import { PRICING_TIERS } from '../landingContent'
import { Pill } from '../primitives/Pill'
import { StickerBtn } from '../primitives/StickerBtn'
import { useLandingCtaLabel, useLandingCtaTo } from '../hooks/useLandingCta'

const ROTATIONS = [-1.5, 0, 1.2] as const

function tierBg(bg: (typeof PRICING_TIERS)[number]['bg']) {
  if (bg === 'primary') return 'var(--landing-primary)'
  if (bg === 'cream') return 'var(--landing-cream)'
  return bg
}

function tierAccent(accent: string | 'ink') {
  return accent === 'ink' ? 'var(--landing-ink)' : accent
}

export function LandingPricing() {
  const ctaTo = useLandingCtaTo()
  const ctaLabel = useLandingCtaLabel('Start free trial')

  return (
    <section
      id="pricing"
      className="relative border-y-2 border-[#14100E] bg-[var(--landing-ink)] px-4 py-16 text-[var(--landing-cream)] sm:px-8 sm:py-24 lg:px-14 lg:py-[120px]"
    >
      <div className="mb-12 text-center sm:mb-16">
        <Pill bg="var(--landing-cream)" color="var(--landing-ink)" className="mb-4">
          Pick a plan
        </Pill>
        <h2 className="font-display m-0 text-[clamp(2.25rem,6vw,4rem)] font-extrabold tracking-tight text-[var(--landing-cream)]">
          Treats for every budget.
        </h2>
      </div>

      <div className="grid gap-5 md:grid-cols-3 md:gap-[22px]">
        {PRICING_TIERS.map((t, i) => {
          const bg = tierBg(t.bg)
          const color = tierAccent(t.accent)
          const isFeatured = t.featured

          return (
            <div
              key={t.name}
              className="relative rounded-[18px] border-2 border-[#14100E] p-[30px] max-md:translate-y-0 max-md:rotate-0"
              style={{
                background: bg,
                color,
                transform: `rotate(${ROTATIONS[i]}deg) translateY(${isFeatured ? -16 : 0}px)`,
              }}
            >
              {isFeatured && (
                <div className="absolute -top-4 right-[18px] rounded-full border-2 border-[#14100E] bg-[var(--landing-accent)] px-3 py-1.5 text-xs font-extrabold tracking-wide text-[#14100E] uppercase">
                  ★ most loved
                </div>
              )}
              <div className="font-display text-[30px] font-extrabold tracking-tight">
                {t.name}
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="font-display text-[64px] leading-none font-extrabold tracking-tight">
                  ${t.price}
                </span>
                <span className="text-sm opacity-70">{t.sub}</span>
              </div>
              <ul className="my-6 mb-7 list-none p-0 text-[14.5px]">
                {t.items.map((li) => (
                  <li
                    key={li}
                    className="flex items-center gap-2 border-t border-dashed py-2.5"
                    style={{
                      borderColor: isFeatured
                        ? 'rgba(255,255,255,.3)'
                        : 'rgba(20,16,14,.18)',
                    }}
                  >
                    <span>→</span>
                    {li}
                  </li>
                ))}
              </ul>
              <StickerBtn
                bg={isFeatured ? '#fff' : 'var(--landing-primary)'}
                color={isFeatured ? 'var(--landing-ink)' : '#fff'}
                size="md"
                to={ctaTo}
                className="w-full justify-center"
              >
                {isFeatured ? ctaLabel : 'Choose plan'}
              </StickerBtn>
            </div>
          )
        })}
      </div>
    </section>
  )
}
