import type { Role } from '@/types/domain';

// Checagem otimista do proxy (só lê o JWT). A autorização real fica em
// requireUser/requireRole, chamados em cada página, action e handler.

export type RouteDecision = { type: 'next' } | { type: 'redirect'; to: string };

const LOGIN_PATH = '/login';
const HOME_PATH = '/';
const isApi = (pathname: string) => pathname === '/api' || pathname.startsWith('/api/');
const isAdmin = (pathname: string) => pathname === '/admin' || pathname.startsWith('/admin/');

export function routeDecision(pathname: string, claims: { role: Role } | null): RouteDecision {
  if (isApi(pathname)) return { type: 'next' };

  if (pathname === LOGIN_PATH) {
    return claims ? { type: 'redirect', to: HOME_PATH } : { type: 'next' };
  }
  if (!claims) {
    const callbackUrl = encodeURIComponent(pathname);
    return { type: 'redirect', to: `${LOGIN_PATH}?callbackUrl=${callbackUrl}` };
  }
  if (isAdmin(pathname) && claims.role !== 'admin') return { type: 'redirect', to: HOME_PATH };

  return { type: 'next' };
}
