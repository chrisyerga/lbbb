'use client'

import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/pets/$petId/memories')({
  component: PetMemoriesLayout,
})

function PetMemoriesLayout() {
  return <Outlet />
}
