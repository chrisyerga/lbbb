import { httpRouter } from 'convex/server'
import { auth } from './auth'
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

export default http
