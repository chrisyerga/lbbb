import { createFileRoute } from '@tanstack/react-router'
import { useAuthActions } from '@convex-dev/auth/react'
import { LoginDevPassword } from '#/components/LoginDevPassword'
import { PageShell } from '#/components/PageShell'
import { Button } from '#/components/ui/Button'
import { isLocalConvexBackend } from '#/lib/localConvex'

export const Route = createFileRoute('/login')({
  validateSearch: (raw: Record<string, unknown>) => ({
    redirect: typeof raw.redirect === 'string' ? raw.redirect : undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const { signIn } = useAuthActions()
  const { redirect } = Route.useSearch()
  const redirectTo = redirect ?? '/app/'
  const localBackend = import.meta.env.DEV && isLocalConvexBackend()

  return (
    <PageShell eyebrow="Sign in" title="Sign in to manage your pet blogs.">
      <div
        className={`login-panel-grid grid gap-0 overflow-hidden rounded-2xl border-2 border-[var(--border)] text-sm text-[var(--text-muted)] ${localBackend ? 'lg:grid-cols-3' : 'sm:grid-cols-2'}`}
      >
        {localBackend ? (
          <div className="border-b border-[var(--border)] p-6 lg:border-r lg:border-b-0">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Local dev</h2>
            <LoginDevPassword redirectTo={redirectTo} />
          </div>
        ) : null}
        <div className="border-b border-[var(--border)] p-6 sm:border-r sm:border-b-0">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Google OAuth</h2>
          <p>Uses Convex Auth and redirects back to the dashboard after Google completes the OAuth flow.</p>
          <Button className="mt-4" onClick={() => void signIn('google', { redirectTo })}>
            Continue with Google
          </Button>
        </div>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Magic Link</h2>
          <p>Email sign-in is planned for the same Convex Auth surface once an email sender is selected.</p>
          <Button className="mt-4" variant="secondary" disabled>
            Email me a link
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
