/** True when the Vite app targets a Convex backend on this machine. */
export function isLocalConvexBackend(): boolean {
  const url = import.meta.env.VITE_CONVEX_URL ?? ''
  return /localhost|127\.0\.0\.1/.test(url)
}

export function getDevAuthCredentials(): { email: string; password: string } | null {
  if (!import.meta.env.DEV || !isLocalConvexBackend()) return null

  const email = (import.meta.env.VITE_DEV_AUTH_EMAIL as string | undefined)?.trim()
  if (!email) return null

  const password =
    (import.meta.env.VITE_DEV_AUTH_PASSWORD as string | undefined)?.trim() || 'devpassword123'

  return { email, password }
}

type PasswordSignIn = (
  provider: 'password',
  params: { email: string; password: string; flow: 'signIn' | 'signUp' },
) => Promise<unknown>

/** Sign in with the dev password provider; creates the account on first use. */
export async function signInWithDevPassword(signIn: PasswordSignIn, creds: { email: string; password: string }) {
  try {
    await signIn('password', { ...creds, flow: 'signIn' })
  } catch {
    await signIn('password', { ...creds, flow: 'signUp' })
  }
}
