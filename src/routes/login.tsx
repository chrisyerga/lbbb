import { createFileRoute } from '@tanstack/react-router'
import { useAuthActions } from '@convex-dev/auth/react'
import { PageShell } from '#/components/PageShell'
import { Button } from '#/components/ui/Button'

export const Route = createFileRoute('/login')({
  validateSearch: (raw: Record<string, unknown>) => ({
    redirect: typeof raw.redirect === 'string' ? raw.redirect : undefined,
  }),
  component: LoginPage,
})

function LoginPage() {
  const { signIn } = useAuthActions()
  const { redirect } = Route.useSearch()

  return (
    <PageShell eyebrow="Sign in" title="Sign in to manage your pet blogs.">
      <div className="login-panel-grid grid gap-0 overflow-hidden rounded-2xl border-2 border-[var(--border)] text-sm text-[var(--text-muted)] sm:grid-cols-2">
        <div className="border-b border-[var(--border)] p-6 sm:border-r sm:border-b-0">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Google OAuth</h2>
          <p>Uses Convex Auth and redirects back to the dashboard after Google completes the OAuth flow.</p>
          <Button className="mt-4" onClick={() => void signIn('google', { redirectTo: redirect ?? '/app/' })}>
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
