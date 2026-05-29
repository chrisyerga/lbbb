'use client'

import { useState } from 'react'
import { getSiteUrl } from '#/lib/siteMeta'

type SlugStampProps = {
  slug: string
}

export function SlugStamp({ slug }: SlugStampProps) {
  const [copied, setCopied] = useState(false)
  const host = getSiteUrl().replace(/^https?:\/\//, '')
  const path = `/p/${slug}`
  const fullUrl = `${getSiteUrl()}${path}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  return (
    <button type="button" onClick={() => void copy()} className="slug-stamp">
      <span className="font-mono text-[13px] font-medium tracking-wide text-[var(--landing-primary)]">
        {host}
        <b className="text-[var(--landing-ink)]">{path}</b>
      </span>
      <span className={copied ? 'slug-stamp-copy is-copied' : 'slug-stamp-copy'}>{copied ? '✓ copied' : 'copy'}</span>
    </button>
  )
}
