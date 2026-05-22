'use client'

import { createFileRoute } from '@tanstack/react-router'
import { CreateMemoryPage } from '#/components/app/memories/CreateMemoryPage'

export const Route = createFileRoute('/app/pets/$petId/memories/new')({
  component: NewMemoryRoute,
})

function NewMemoryRoute() {
  const { petId } = Route.useParams()
  return <CreateMemoryPage petId={petId} />
}
