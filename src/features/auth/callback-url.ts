const FALLBACK = '/';

/**
 * Aceita só caminhos internos para o redirect pós-login (evita open redirect).
 * Rejeita URLs absolutas, `//host`, `/\host`, a própria página de login e rotas de API.
 */
export function safeCallbackUrl(url: string | undefined): string {
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) {
    return FALLBACK;
  }
  const { pathname, origin } = new URL(url, 'http://local');
  const isApi = pathname === '/api' || pathname.startsWith('/api/');
  if (origin !== 'http://local' || pathname === '/login' || isApi) return FALLBACK;
  return url;
}
