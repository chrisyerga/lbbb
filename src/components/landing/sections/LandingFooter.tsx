'use client'

import { useState } from 'react'
import { FOOTER_LINKS } from '../landingContent'
import { Star } from '../primitives/Star'
import { StickerBtn } from '../primitives/StickerBtn'
import { SunBurst } from '../primitives/SunBurst'

export function LandingFooter() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <section className="relative overflow-hidden border-t-2 border-[#14100E] bg-[var(--landing-primary)] px-4 py-16 text-white sm:px-8 sm:py-20 lg:px-14">
      <SunBurst
        color="rgba(255,255,255,.2)"
        size={300}
        rays={20}
        className="absolute -top-[100px] -right-20 max-sm:hidden"
      />
      <Star
        color="var(--landing-accent)"
        size={48}
        className="absolute top-[60px] right-[240px] rotate-[15deg] max-lg:hidden"
      />

      <div className="relative max-w-[720px]">
        <h2 className="font-display m-0 text-[clamp(2.75rem,7vw,4.5rem)] leading-[0.9] font-extrabold tracking-tight">
          Get one good
          <br />
          post a week.
        </h2>
        <p className="mt-[18px] max-w-[460px] text-[17px] opacity-90">
          Sample blog posts (from real pets), AI portrait drops, and product
          updates. No spam — Zoe&apos;s a strict editor.
        </p>

        {submitted ? (
          <p className="mt-7 text-[15px] font-semibold">
            Thanks — newsletter coming soon.
          </p>
        ) : (
          <form
            className="mt-7 flex max-w-[460px] flex-col gap-2.5 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault()
              setSubmitted(true)
            }}
          >
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 rounded-[14px] border-2 border-[#14100E] bg-white px-[18px] py-4 text-[15px] text-[var(--landing-ink)] outline-none"
            />
            <StickerBtn bg="var(--landing-ink)" type="submit">
              Subscribe
            </StickerBtn>
          </form>
        )}
      </div>

      <div className="relative mt-16 flex flex-col gap-6 border-t border-white/30 pt-7 sm:mt-20 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-display text-4xl font-extrabold tracking-tight">
            cafezoe
          </div>
          <div className="mt-1 text-xs opacity-80">
            © {new Date().getFullYear()} · Made with paws in Brooklyn
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-[13.5px]">
          {FOOTER_LINKS.map((l) => (
            <a
              key={l}
              href="#"
              className="text-white/90 no-underline"
              onClick={(e) => e.preventDefault()}
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
