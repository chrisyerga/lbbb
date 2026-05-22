'use client'

import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/pets/$petId')({
  component: PetLayout,
})

function PetLayout() {
  return <Outlet />
}
