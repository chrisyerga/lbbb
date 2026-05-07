import { query } from './_generated/server'

export const defaults = query({
  args: {},
  handler: () => ({
    dailyTextGenerations: Number(process.env.DAILY_TEXT_GENERATION_LIMIT ?? 20),
    dailyImageGenerations: Number(
      process.env.DAILY_IMAGE_GENERATION_LIMIT ?? 5,
    ),
    maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024),
    allowedUploadTypes: ['image/jpeg', 'image/png', 'image/webp'],
  }),
})
