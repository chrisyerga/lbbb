import { useRouterState } from '@tanstack/react-router'
import { NotFoundPanel } from '#/components/NotFoundPanel'

export function NotFound() {
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  })

  return (
    <NotFoundPanel
      title="Not found"
      description="That page doesn't exist or may have moved. Check the URL, or head back to the app."
      subject={pathname}
      actions={[
        { label: 'Back to dashboard', to: '/app', variant: 'primary' },
        { label: 'View pets', to: '/app/pets', variant: 'secondary' },
      ]}
    />
  )
}
