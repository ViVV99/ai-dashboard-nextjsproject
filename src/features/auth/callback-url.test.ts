import { describe, expect, it } from 'vitest';
import { safeCallbackUrl } from './callback-url';

describe('safeCallbackUrl', () => {
  it.each(['/vendas', '/admin/usuarios?page=2', '/'])('aceita caminho interno %s', (url) => {
    expect(safeCallbackUrl(url)).toBe(url);
  });

  it.each([
    ['ausente', undefined],
    ['vazio', ''],
    ['URL absoluta', 'https://evil.com'],
    ['protocol-relative', '//evil.com'],
    ['barra invertida', '/\\evil.com'],
    ['sem barra inicial', 'vendas'],
    ['javascript:', 'javascript:alert(1)'],
    ['a própria página de login', '/login'],
    // Regressão: rota de API não é página; o login a tomaria por falha de configuração.
    ['rota de API do Auth.js', '/api/auth/session'],
    ['outra rota de API', '/api/metrics/overview?from=2026-01-01'],
  ])('%s → /', (_, url) => {
    expect(safeCallbackUrl(url)).toBe('/');
  });
});
