'use client'

import {
  BLOG_PARAGRAPHS,
  BLOG_TITLE,
  DIARY_TEXT,
} from '../landingContent'
import { Pill } from '../primitives/Pill'
import { StickerBtn } from '../primitives/StickerBtn'
import { useTypewriter } from '../hooks/useTypewriter'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

export function LandingDemo() {
  const reducedMotion = usePrefersReducedMotion()
  const text = useTypewriter(DIARY_TEXT, {
    speed: 26,
    loop: !reducedMotion,
    pause: 4500,
  })
  const progress = reducedMotion ? 1 : text.length / DIARY_TEXT.length
  const headlineShown = progress > 0.35
  const blogShown = progress > 0.65
  const artShown = progress > 0.82

  return (
    <section className="relative bg-[var(--landing-soft)] px-4 py-16 sm:px-8 sm:py-24 lg:px-14 lg:pb-[120px]">
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-6">
        <div>
          <Pill bg="#fff" color="var(--landing-ink)" className="mb-4">
            Live · type-along demo
          </Pill>
          <h2 className="font-display m-0 text-[clamp(2rem,5vw,3.5rem)] leading-none font-extrabold tracking-tight text-[var(--landing-ink)]">
            Watch a draft
            <br />
            materialize.
          </h2>
        </div>
        <p className="m-0 max-w-[320px] text-[15px] leading-normal text-[var(--landing-ink)]/75">
          Six-word diary → polished post & six AI portraits. Editable to the
          last comma.
        </p>
      </div>

      <div className="grid overflow-hidden rounded-2xl border border-[#14100E] bg-white lg:grid-cols-[0.85fr_1.15fr]">
        <div className="border-b border-[#14100E] bg-[var(--landing-cream)] p-7 lg:border-r lg:border-b-0">
          <div className="mb-[18px] flex items-center justify-between">
            <div className="font-mono text-[11px] tracking-[0.18em] text-[var(--landing-primary)] uppercase">
              Diary · mar 14
            </div>
            <span className="font-mono text-[11px] text-[var(--landing-ink)]/50">
              {text.length}/220
            </span>
          </div>
          <div className="font-mono min-h-[240px] text-[15px] leading-relaxed whitespace-pre-wrap text-[var(--landing-ink)]">
            {text}
            <span className="animate-v1-blink ml-0.5 inline-block h-4 w-[7px] bg-[var(--landing-primary)] align-middle" />
          </div>
          <div className="mt-[22px] h-px bg-[#14100E22]" />
          <div className="mt-[18px] flex flex-wrap gap-2">
            {['+ photo', '+ location', '+ weather', '+ voice'].map((t) => (
              <span
                key={t}
                className="font-mono rounded-full border border-[#14100E33] px-2.5 py-1.5 text-[11px] text-[var(--landing-ink)]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="relative p-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="font-mono text-[11px] tracking-[0.18em] text-[var(--landing-accent)] uppercase">
              ↳ preview · cafezoe.app/zoe/mar-14
            </div>
            <StickerBtn
              bg="var(--landing-primary)"
              size="md"
              className="px-3.5 py-2 text-[12.5px]"
            >
              Publish ↑
            </StickerBtn>
          </div>

          <div
            className="relative mb-[18px] aspect-[16/7] overflow-hidden rounded-xl border border-[#14100E] transition-opacity duration-500"
            style={{
              background:
                'linear-gradient(135deg, var(--landing-primary), var(--landing-accent))',
              opacity: artShown ? 1 : 0.3,
            }}
          >
            <img
              src="/images/zoe-smile.png"
              alt=""
              className="absolute -right-5 -bottom-2.5 h-[140%] max-w-none"
            />
          </div>

          <h3 className="font-display m-0 min-h-[34px] text-[clamp(1.5rem,3vw,1.875rem)] leading-tight font-extrabold tracking-tight text-[var(--landing-ink)]">
            {headlineShown ? BLOG_TITLE : <span className="opacity-30">—</span>}
          </h3>
          <div className="font-mono mt-2 text-[11px] tracking-[0.08em] text-[var(--landing-ink)]/55 uppercase">
            mar 14 · 2 min · walk / friend / zoomies
          </div>
          <div
            className="mt-3.5 text-sm leading-normal text-[var(--landing-ink)] transition-opacity duration-400"
            style={{ opacity: blogShown ? 1 : 0.3 }}
          >
            {BLOG_PARAGRAPHS.slice(0, blogShown ? 2 : 1).map((p, i) => (
              <p key={i} className="mb-2">
                {p}
              </p>
            ))}
            {!blogShown && (
              <div className="mt-2.5 flex flex-col gap-1.5">
                {[90, 78, 60].map((w, i) => (
                  <div
                    key={w}
                    className="animate-v1-pulse h-1.5 rounded-full bg-[var(--landing-soft)]"
                    style={{
                      width: `${w}%`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
