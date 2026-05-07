import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '#/components/PageShell'

export const Route = createFileRoute('/app/admin/costs')({
  component: AdminCostsPage,
})

function AdminCostsPage() {
  return (
    <PageShell
      eyebrow="Admin"
      title="Provider cost tracking."
      children={
        <p>
          Every OpenAI/OpenRouter call gets a <code>generationCosts</code>{' '}
          record.
        </p>
      }
    />
  )
}
