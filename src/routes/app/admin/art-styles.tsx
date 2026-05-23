'use client'

import { createFileRoute } from '@tanstack/react-router'
import type { Id } from '#convex/_generated/dataModel'
import { AdminArtStylesPage } from '#/components/admin/artStyles/AdminArtStylesPage'

type ArtStylesSearch = {
  style?: string
}

export const Route = createFileRoute('/app/admin/art-styles')({
  validateSearch: (search: Record<string, unknown>): ArtStylesSearch => ({
    style: typeof search.style === 'string' ? search.style : undefined,
  }),
  component: AdminArtStylesRoute,
})

function AdminArtStylesRoute() {
  const { style } = Route.useSearch()
  const selectedStyleId = (style as Id<'artStyles'> | undefined) ?? null
  return <AdminArtStylesPage selectedStyleId={selectedStyleId} />
}
