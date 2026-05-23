'use client'

import { createFileRoute } from '@tanstack/react-router'
import type { Id } from '#convex/_generated/dataModel'
import { AdminTraitsPage } from '#/components/admin/traits/AdminTraitsPage'

type TraitsSearch = {
  trait?: string
}

export const Route = createFileRoute('/app/admin/traits')({
  validateSearch: (search: Record<string, unknown>): TraitsSearch => ({
    trait: typeof search.trait === 'string' ? search.trait : undefined,
  }),
  component: AdminTraitsRoute,
})

function AdminTraitsRoute() {
  const { trait } = Route.useSearch()
  const selectedTraitId = (trait as Id<'narratorTraits'> | undefined) ?? null
  return <AdminTraitsPage selectedTraitId={selectedTraitId} />
}
