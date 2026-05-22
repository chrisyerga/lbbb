export const siteMeta = {
  name: 'Cafe Zoe',
  title: 'Cafe Zoe · A diary studio for very good pets',
  description:
    'Upload a photo. Jot a sentence about today. Cafe Zoe writes a beautifully-edited blog post and paints social art — so your pet has the archive they deserve.',
  themeColor: '#E0382E',
  backgroundColor: '#FBF1DE',
  ogImagePath: '/og-image.jpg',
} as const

export function getSiteUrl() {
  const configured = import.meta.env.VITE_SITE_URL as string | undefined
  const base = configured?.trim() || 'http://localhost:3000'
  return base.replace(/\/$/, '')
}

export function absoluteUrl(path: string) {
  return `${getSiteUrl()}${path.startsWith('/') ? path : `/${path}`}`
}
