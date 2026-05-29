'use client'

import { useState } from 'react'
import { FAQ_ITEMS } from '../landingContent'
import { Pill } from '../primitives/Pill'

export function LandingFAQ() {
  const [open, setOpen] = useState(0)

  return (
    <section className="px-4 py-10 sm:px-8 sm:py-16 lg:px-14 lg:pb-[120px]">
      <div className="grid items-start gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
        <div>
          <Pill bg="var(--landing-cream)" color="var(--landing-ink)" className="mb-4">
            FAQ
          </Pill>
          <h2 className="font-display m-0 text-[clamp(2rem,5vw,3.5rem)] leading-[0.95] font-extrabold tracking-tight text-[var(--landing-ink)]">
            Common
            <br />
            questions.
          </h2>
          <p className="mt-[18px] text-[15.5px] leading-normal text-[var(--landing-ink)]/75">
            Still curious?{' '}
            <a href="mailto:hello@lidabidabodabutt.com" className="font-bold text-[var(--landing-primary)] no-underline">
              email us
            </a>{' '}
            — a real human (and Zoe) reads every one.
          </p>
        </div>

        <div className="overflow-hidden rounded-[18px] border-2 border-[#14100E] bg-white">
          {FAQ_ITEMS.map((f, i) => (
            <div
              key={f.q}
              role="button"
              tabIndex={0}
              onClick={() => setOpen(open === i ? -1 : i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setOpen(open === i ? -1 : i)
                }
              }}
              className="cursor-pointer px-[26px] py-[22px]"
              style={{
                borderTop: i ? '1.5px solid #14100E' : 'none',
                background: open === i ? 'var(--landing-soft)' : 'transparent',
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-display text-xl font-extrabold tracking-tight text-[var(--landing-ink)]">
                  {f.q}
                </span>
                <span
                  className="font-display text-2xl font-extrabold text-[var(--landing-primary)] transition-transform duration-200"
                  style={{
                    transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}
                >
                  +
                </span>
              </div>
              {open === i && (
                <p className="mt-3 mb-0 max-w-[580px] text-[15px] leading-normal text-[var(--landing-ink)]/85">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
