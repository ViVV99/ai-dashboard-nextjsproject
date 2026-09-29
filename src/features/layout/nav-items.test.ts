import { describe, expect, it } from 'vitest';
import { isActivePath, navItemsFor } from './nav-items';

const hrefs = (role: 'admin' | 'viewer') => navItemsFor(role).map((item) => item.href);

describe('navItemsFor', () => {
  it('viewer vê só as páginas comuns', () => {
    expect(hrefs('viewer')).toEqual(['/', '/vendas', '/compras', '/acessos', '/perfil']);
  });

  it('admin vê também usuários e auditoria', () => {
    expect(hrefs('admin')).toEqual([
      '/',
      '/vendas',
      '/compras',
      '/acessos',
      '/perfil',
      '/admin/usuarios',
      '/admin/auditoria',
    ]);
  });
});

describe('isActivePath', () => {
  it('a visão geral só fica ativa na raiz', () => {
    expect(isActivePath('/', '/')).toBe(true);
    expect(isActivePath('/', '/vendas')).toBe(false);
  });

  it('sub-rotas ativam o item pai, mas prefixos parecidos não', () => {
    expect(isActivePath('/admin/usuarios', '/admin/usuarios/12')).toBe(true);
    expect(isActivePath('/vendas', '/vendas-antigas')).toBe(false);
  });
});
