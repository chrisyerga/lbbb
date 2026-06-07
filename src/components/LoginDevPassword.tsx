'use client'

import { useAuthActions } from '@convex-dev/auth/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '#/components/ui/Button'
import { getDevAuthCredentials, isLocalConvexBackend, signInWithDevPassword } from '#/lib/localConvex'

export function LoginDevPassword({ redirectTo }: { redirectTo: string }) {
  const { signIn } = useAuthActions()
  const preset = getDevAuthCredentials()
  const [email, setEmail] = useState(preset?.email ?? '')
  const [password, setPassword] = useState(preset?.password ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!import.meta.env.DEV || !isLocalConvexBackend()) return null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const creds = { email: email.trim(), password }
      if (!creds.email) {
        setError('Email is required.')
        return
      }
      await signInWithDevPassword(signIn, creds)
      window.location.assign(redirectTo)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="space-y-3" onSubmit={(event) => void handleSubmit(event)}>
      <p>
        Local Convex backend: sign in with email and password (no OAuth). Set{' '}
        <code className="text-[var(--text-primary)]">VITE_DEV_AUTH_EMAIL</code> in{' '}
        <code className="text-[var(--text-primary)]">.env.local</code> to auto sign-in on load.
      </p>
      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Email
        </span>
        <input
          className="w-full rounded-lg border-2 border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)]"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Password
        </span>
        <input
          className="w-full rounded-lg border-2 border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[var(--text-primary)]"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in locally'}
      </Button>
    </form>
  )
}
