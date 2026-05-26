/** HTTP actions are served on the `.convex.site` host, not `.convex.cloud`. */
export function getConvexSiteUrl(): string | null {
  const cloud = import.meta.env.VITE_CONVEX_URL as string | undefined
  if (!cloud) return null
  if (cloud.includes('.convex.site')) return cloud.replace(/\/$/, '')
  return cloud.replace('.convex.cloud', '.convex.site').replace(/\/$/, '')
}
