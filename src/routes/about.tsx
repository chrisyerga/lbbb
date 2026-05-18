import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutRedirect,
})

function AboutRedirect() {
  return <Navigate to="/app" />
}
