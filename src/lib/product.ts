export const productName = 'Little Bestiary Blog Builder'
export const productShortName = 'LBBB'

export const defaultQuotas = {
  dailyTextGenerations: 20,
  dailyImageGenerations: 5,
  maxUploadBytes: 10 * 1024 * 1024,
} as const

export const allowedUploadTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const publicRoutes = {
  petBlog: (petSlug: string) => `/p/${petSlug}`,
  petPost: (petSlug: string, postSlug: string) =>
    `/p/${petSlug}/posts/${postSlug}`,
} as const
