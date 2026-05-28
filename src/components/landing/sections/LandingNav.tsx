'use client'

import { Link } from '@tanstack/react-router'
import { StickerBtn } from '../primitives/StickerBtn'
import { useLandingCtaLabel, useLandingCtaTo } from '../hooks/useLandingCta'

export function LandingNav() {
  const ctaTo = useLandingCtaTo()
  const ctaLabel = useLandingCtaLabel('Try for free →')

  return (
    <nav className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-8 lg:px-14">
      <Link to="/" className="flex items-center gap-3 no-underline">
        <div className="flex h-11 w-11 -rotate-[4deg] items-center justify-center rounded-xl border-2 border-[#140e12] bg-[var(--landing-primary)]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <circle cx="8" cy="9" r="2.5" fill="#fff" />
            <circle cx="16" cy="9" r="2.5" fill="#fff" />
            <circle cx="5" cy="14" r="2" fill="#fff" />
            <circle cx="19" cy="14" r="2" fill="#fff" />
            <ellipse cx="12" cy="17" rx="4.5" ry="3.5" fill="#fff" />
          </svg>
        </div>
        <span className="font-display text-2xl font-extrabold tracking-tight text-[var(--landing-ink)]">
          cafe<span className="text-[var(--landing-primary)]">zoe</span>
        </span>
      </Link>

      <div className="flex flex-wrap items-center gap-5 text-sm font-semibold sm:gap-7">
        <a href="#how-it-works" className="text-[var(--landing-ink)] no-underline">
          How it works
        </a>
        <a href="#examples" className="hidden text-[var(--landing-ink)] no-underline sm:inline">
          Examples
        </a>
        <a href="#pricing" className="text-[var(--landing-ink)] no-underline">
          Pricing
        </a>
        <Link
          to="/login"
          search={{ redirect: undefined }}
          className="hidden text-[var(--landing-ink)] no-underline sm:inline"
        >
          Sign in
        </Link>
        <StickerBtn bg="var(--landing-primary)" size="md" to={ctaTo}>
          {ctaLabel}
        </StickerBtn>
      </div>
    </nav>
  )
}
