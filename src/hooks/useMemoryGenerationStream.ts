'use client'

import { useStream } from '@convex-dev/persistent-text-streaming/react'
import type { StreamId } from '@convex-dev/persistent-text-streaming'
import { useAuthToken } from '@convex-dev/auth/react'
import { useMemo } from 'react'
import { api } from '#convex/_generated/api'
import { getConvexSiteUrl } from '#/lib/convexSiteUrl'

export function useMemoryGenerationStream(args: {
  streamId: string | null | undefined
  driven: boolean
}) {
  const authToken = useAuthToken()
  const streamUrl = useMemo(() => {
    const site = getConvexSiteUrl()
    if (!site) return null
    return new URL(`${site}/memory-generation/stream`)
  }, [])

  const body = useStream(
    api.memoryGenerationStream.getStreamBody,
    streamUrl ?? new URL('http://localhost/memory-generation/stream'),
    args.driven && Boolean(streamUrl),
    args.streamId ? (args.streamId as StreamId) : undefined,
    { authToken },
  )

  return {
    text: body.text,
    status: body.status,
    streamUrl,
  }
}
