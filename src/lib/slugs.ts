const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'archive',
  'assets',
  'feed',
  'login',
  'new',
  'posts',
  'settings',
  'sitemap',
])

export function slugify(value: string) {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')

  return slug || 'untitled'
}

export function petSlug(name: string) {
  const slug = slugify(name)
  return RESERVED_SLUGS.has(slug) ? `${slug}-pet` : slug
}

export function postSlug(title: string, date = new Date()) {
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}-${slugify(title)}`
}

export function uniqueSlug(baseSlug: string, existingSlugs: ReadonlySet<string>) {
  if (!existingSlugs.has(baseSlug)) return baseSlug

  let suffix = 2
  let nextSlug = `${baseSlug}-${suffix}`
  while (existingSlugs.has(nextSlug)) {
    suffix += 1
    nextSlug = `${baseSlug}-${suffix}`
  }

  return nextSlug
}
