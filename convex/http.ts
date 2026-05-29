import { httpRouter } from 'convex/server'
import { auth } from './auth'
import { streamNarratorTextPreview } from './adminNarratorPreviewStream'
import { streamMemoryGeneration } from './memoryGenerationStream'

const http = httpRouter()

auth.addHttpRoutes(http)

http.route({
  path: '/memory-generation/stream',
  method: 'POST',
  handler: streamMemoryGeneration,
})

http.route({
  path: '/memory-generation/stream',
  method: 'OPTIONS',
  handler: streamMemoryGeneration,
})

http.route({
  path: '/admin/narrator-preview/stream',
  method: 'POST',
  handler: streamNarratorTextPreview,
})

http.route({
  path: '/admin/narrator-preview/stream',
  method: 'OPTIONS',
  handler: streamNarratorTextPreview,
})

export default http
