export function isV1AppRoute(pathname: string) {
  return pathname === '/login' || pathname.startsWith('/app')
}
