'use client'

import { createFileRoute } from '@tanstack/react-router'
import type { Id } from '#convex/_generated/dataModel'
import { AdminModerationPage } from '#/components/admin/moderation/AdminModerationPage'

type ModerationSearch = {
  post?: string
  asset?: string
}

export const Route = createFileRoute('/app/admin/moderation')({
  validateSearch: (search: Record<string, unknown>): ModerationSearch => ({
    post: typeof search.post === 'string' ? search.post : undefined,
    asset: typeof search.asset === 'string' ? search.asset : undefined,
  }),
  component: AdminModerationRoute,
})

function AdminModerationRoute() {
  const { post, asset } = Route.useSearch()
  return (
    <AdminModerationPage
      selectedPostId={(post as Id<'generatedPosts'> | undefined) ?? null}
      selectedAssetId={(asset as Id<'assets'> | undefined) ?? null}
    />
  )
}
