import { describe, expect, it } from 'vitest';
import { routeDecision } from './routing';

const viewer = { role: 'viewer' } as const;
const admin = { role: 'admin' } as const;

describe('routeDecision', () => {
  it('anônimo em / → /login com callbackUrl', () => {
    expect(routeDecision('/', null)).toEqual({ type: 'redirect', to: '/login?callbackUrl=%2F' });
  });

  it('anônimo em rota interna preserva o caminho no callbackUrl', () => {
    expect(routeDecision('/vendas', null)).toEqual({
      type: 'redirect',
      to: '/login?callbackUrl=%2Fvendas',
    });
  });

  it('anônimo em /login → next', () => {
    expect(routeDecision('/login', null)).toEqual({ type: 'next' });
  });

  it('logado em /login → /', () => {
    expect(routeDecision('/login', viewer)).toEqual({ type: 'redirect', to: '/' });
  });

  it('viewer em /admin/usuarios → /', () => {
    expect(routeDecision('/admin/usuarios', viewer)).toEqual({ type: 'redirect', to: '/' });
  });

  it('viewer em /admin → /', () => {
    expect(routeDecision('/admin', viewer)).toEqual({ type: 'redirect', to: '/' });
  });

  it('admin em /admin/usuarios → next', () => {
    expect(routeDecision('/admin/usuarios', admin)).toEqual({ type: 'next' });
  });

  it('viewer em rota que só começa com "admin" → next', () => {
    expect(routeDecision('/administracao', viewer)).toEqual({ type: 'next' });
  });

  it.each([null, viewer])('/api/* → next (handlers respondem 401/403 em JSON)', (claims) => {
    expect(routeDecision('/api/users', claims)).toEqual({ type: 'next' });
  });
});
