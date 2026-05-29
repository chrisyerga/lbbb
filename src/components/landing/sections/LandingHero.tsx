'use client'

import { Pill } from '../primitives/Pill'
import { Squiggle } from '../primitives/Squiggle'
import { Star } from '../primitives/Star'
import { SunBurst } from '../primitives/SunBurst'
import { StickerBtn } from '../primitives/StickerBtn'
import { Tape } from '../primitives/Tape'
import { LANDING_HEADLINE } from '../landingContent'
import { useLandingCtaLabel, useLandingCtaTo } from '../hooks/useLandingCta'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

export function LandingHero() {
  const lines = LANDING_HEADLINE.split('/')
  const ctaTo = useLandingCtaTo()
  const ctaLabel = useLandingCtaLabel()
  const reducedMotion = usePrefersReducedMotion()

  return (
    <section className="relative px-4 pt-6 pb-16 sm:px-8 sm:pb-24 lg:px-14 lg:pb-[100px]">
      <SunBurst
        color="var(--landing-accent)"
        size={150}
        className={`absolute top-8 right-8 opacity-80 sm:right-[60px] ${!reducedMotion ? 'animate-v1-spin' : ''}`}
      />
      <Star color="var(--landing-primary)" size={28} className="absolute top-[220px] left-9 -rotate-12 max-sm:hidden" />
      <Star color="var(--landing-ink)" size={18} className="absolute top-[410px] left-[320px] max-lg:hidden" />

      <div className="relative z-[2] grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
        <div>
          <Pill bg="var(--landing-soft)" color="var(--landing-ink)" className="mb-5">
            <span className="inline-block h-2 w-2 rounded-full bg-[var(--landing-primary)]" />
            New · Now open for early access
          </Pill>

          <h1 className="font-display m-0 text-[clamp(2.75rem,8vw,4.875rem)] leading-[0.94] font-extrabold tracking-tight text-[var(--landing-ink)]">
            {lines[0]} <br />
            <span className="relative inline-block">
              <span className="text-[var(--landing-primary)]">{lines[1]}</span>
              <Squiggle color="var(--landing-accent)" width={320} className="absolute -bottom-4 left-0 max-w-full" />
            </span>
            <br />
            {lines[2]}
          </h1>

          <p className="mt-7 max-w-[480px] text-[17px] leading-[1.45] text-[var(--landing-ink)]/80 sm:text-[19px]">
            Drop in a photo. Scribble what they got up to today. cafezoe writes the blog post & paints the social art —
            so your good dog gets the press they deserve.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-[18px]">
            <StickerBtn bg="var(--landing-primary)" to={ctaTo}>
              {ctaLabel}
            </StickerBtn>
            <a
              href="#examples"
              className="text-[15px] font-semibold text-[var(--landing-ink)] underline underline-offset-4"
            >
              see an example post →
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3.5 text-[13.5px] text-[var(--landing-ink)]/70">
            <div className="flex">
              {['#E0382E', '#F2A02E', '#3CB07A', '#7E5BFF'].map((c, i) => (
                <div
                  key={c}
                  className="h-7 w-7 rounded-full border-2 border-[var(--landing-cream)]"
                  style={{
                    background: c,
                    marginLeft: i ? -8 : 0,
                  }}
                />
              ))}
            </div>
            <span>
              <b className="text-[var(--landing-ink)]">2,140</b> very good pets already onboarded
            </span>
          </div>
        </div>

        <div className="relative mx-auto h-[420px] w-full max-w-[520px] sm:h-[540px]">
          <div className="absolute inset-0 rotate-[2deg] rounded-3xl border-2 border-[#14100E] bg-[var(--landing-soft)]" />
          <Tape color="var(--landing-accent)" w={120} rotate={-8} className="absolute -top-3 left-[32%]" />
          <Tape
            color="var(--landing-cream)"
            w={90}
            rotate={14}
            className="absolute top-[100px] -right-2.5 max-sm:hidden"
          />
          <img
            src="/images/zoe-smile.png"
            alt="Zoe, the Cafe Zoe mascot"
            className={`absolute top-7 left-6 w-[calc(100%-48px)] -rotate-[3deg] ${!reducedMotion ? 'animate-v1-bob' : ''}`}
          />
          <div className="absolute right-7 bottom-6 max-w-[220px] rotate-[3deg] rounded-[18px] border-2 border-[#14100E] bg-white px-[18px] py-3">
            <div className="font-hand text-[22px] leading-tight text-[var(--landing-ink)]">
              &ldquo;I&apos;m basically a content creator now.&rdquo;
            </div>
            <div className="mt-1 text-[11px] text-[var(--landing-ink)]/60">— Zoe, age 4</div>
          </div>
        </div>
      </div>
    </section>
  )
}
