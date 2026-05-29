'use client'

import { createFileRoute } from '@tanstack/react-router'
import type { Id } from '#convex/_generated/dataModel'
import { AdminNarratorsPage } from '#/components/admin/narrators/AdminNarratorsPage'

type NarratorsSearch = {
  narrator?: string
}

export const Route = createFileRoute('/app/admin/narrators')({
  validateSearch: (search: Record<string, unknown>): NarratorsSearch => ({
    narrator: typeof search.narrator === 'string' ? search.narrator : undefined,
  }),
  component: AdminNarratorsRoute,
})

function AdminNarratorsRoute() {
  const { narrator } = Route.useSearch()
  const selectedNarratorId = (narrator as Id<'narrators'> | undefined) ?? null
  return <AdminNarratorsPage selectedNarratorId={selectedNarratorId} />
}
