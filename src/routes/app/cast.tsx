'use client'

import { createFileRoute } from '@tanstack/react-router'
import { CastPage } from '#/components/app/cast/CastPage'

export const Route = createFileRoute('/app/cast')({
  component: CastPage,
})
