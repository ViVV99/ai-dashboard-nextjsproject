const FALLBACK = '/';

/**
 * Aceita só caminhos internos para o redirect pós-login (evita open redirect).
 * Rejeita URLs absolutas, `//host`, `/\host` e a própria página de login.
 */
export function safeCallbackUrl(url: string | undefined): string {
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) {
    return FALLBACK;
  }
  const { pathname, origin } = new URL(url, 'http://local');
  if (origin !== 'http://local' || pathname === '/login') return FALLBACK;
  return url;
}
