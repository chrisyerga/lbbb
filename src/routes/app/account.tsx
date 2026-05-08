'use client'

import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { PageShell } from '#/components/PageShell'
import { Button } from '#/components/ui/Button'
import { api } from '#convex/_generated/api'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/app/account')({
  component: AccountPage,
})

function AccountPage() {
  const data = useQuery(api.profiles.getMine)
  const updateProfile = useMutation(api.profiles.update)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    if (!data) return
    setDisplayName(data.profile?.displayName ?? data.user.name ?? '')
    setBio(data.profile?.bio ?? '')
  }, [data])

  console.error('data', data)
  console.error('displayName', displayName)
  console.error('bio', bio)
  console.error('saving', saving)
  console.error('savedAt', savedAt)
  console.error('updateProfile', updateProfile)
  console.error('displayName.trim()', displayName.trim())
  console.error('bio.trim()', bio.trim())
  console.error('displayName.trim() || undefined', displayName.trim() || undefined)
  
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSavedAt(null)
    try {
      await updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
      })
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  if (data === undefined) {
    return (
      <PageShell eyebrow="Account" title="Your profile">
        <p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>
      </PageShell>
    )
  }

  if (data === null) {
    return (
      <PageShell eyebrow="Account" title="Your profile">
        <p className="text-sm text-[var(--sea-ink-soft)]">
          Sign in to manage your profile.
        </p>
      </PageShell>
    )
  }

  const { user, profile } = data

  return (
    <PageShell
      eyebrow="Account"
      title="Your profile"
      description="How you appear on LBBB. Pet names are edited per pet."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="feature-card grid gap-4 rounded-3xl p-6 text-sm"
        >
          <div className="grid gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
              Email
            </p>
            <p className="m-0 text-[var(--sea-ink)]">{user.email ?? '—'}</p>
            <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
              Email comes from your sign-in provider and isn’t editable here.
            </p>
          </div>

          <label className="grid gap-2 text-[var(--sea-ink)]">
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3"
              placeholder={user.name ?? 'Your name'}
              autoComplete="name"
            />
          </label>

          <label className="grid gap-2 text-[var(--sea-ink)]">
            Bio
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="resize-y rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3"
              placeholder="A short line about you…"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </Button>
            {savedAt !== null ? (
              <span className="text-xs text-[var(--lagoon-deep)]">Saved.</span>
            ) : null}
          </div>
        </form>

        <div className="feature-card rounded-3xl p-6 text-sm text-[var(--sea-ink-soft)]">
          <p className="mt-0 text-[var(--sea-ink)]">
            Convex stores an optional profile row for{' '}
            <code className="text-[var(--lagoon-deep)]">displayName</code> and{' '}
            <code className="text-[var(--lagoon-deep)]">bio</code>
            {profile ? ' (you have one).' : ' — save the form to create yours).'}
          </p>
          <p>
            To rename pets, open{' '}
            <Link to="/app/pets" className="font-semibold text-[var(--lagoon-deep)]">
              Pets
            </Link>
            .
          </p>
        </div>
      </div>
    </PageShell>
  )
}
