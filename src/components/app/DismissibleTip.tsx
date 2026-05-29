'use client'

import { useEffect, useState } from 'react'
import { cn } from '#/lib/utils'

type DismissibleTipProps = {
  storageKey: string
  title: string
  body: string
  action?: { label: string; href: string }
  className?: string
}

export function DismissibleTip({ storageKey, title, body, action, className }: DismissibleTipProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(storageKey)
      setVisible(dismissed !== '1')
    } catch {
      setVisible(true)
    }
  }, [storageKey])

  if (!visible) return null

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, '1')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  return (
    <div className={cn('dismissible-tip', className)}>
      <div className="dismissible-tip-icon" aria-hidden>
        ✦
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display m-0 text-lg font-extrabold tracking-tight text-[var(--landing-ink)]">{title}</p>
        <p className="mt-1 mb-0 text-sm leading-normal text-[var(--landing-ink)]/70">{body}</p>
        {action ? (
          <a
            href={action.href}
            className="mt-2 inline-block text-sm font-semibold text-[var(--landing-ink)] underline underline-offset-3"
          >
            {action.label}
          </a>
        ) : null}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="font-mono shrink-0 cursor-pointer border-0 bg-transparent p-1 text-[11px] tracking-wide text-[var(--landing-ink)]/55 uppercase hover:text-[var(--landing-ink)]"
        aria-label="Dismiss tip"
      >
        Dismiss
      </button>
    </div>
  )
}
