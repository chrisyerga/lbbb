export function isAdminRoute(pathname: string) {
  return pathname.startsWith('/app/admin')
}
