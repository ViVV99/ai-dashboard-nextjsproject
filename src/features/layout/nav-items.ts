import type { Role } from '@/types/domain';

// Dados puros (serializáveis): o ícone é uma chave resolvida no client (nav-list.tsx).
export type NavIcon = 'overview' | 'sales' | 'purchases' | 'access' | 'profile' | 'users' | 'audit';

export type NavItem = { href: string; label: string; icon: NavIcon; adminOnly?: boolean };

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'Visão geral', icon: 'overview' },
  { href: '/vendas', label: 'Vendas', icon: 'sales' },
  { href: '/compras', label: 'Compras', icon: 'purchases' },
  { href: '/acessos', label: 'Acessos', icon: 'access' },
  { href: '/perfil', label: 'Meu perfil', icon: 'profile' },
  { href: '/admin/usuarios', label: 'Usuários', icon: 'users', adminOnly: true },
  { href: '/admin/auditoria', label: 'Auditoria', icon: 'audit', adminOnly: true },
];

/** Itens visíveis para o perfil. Só esconde; a autorização real fica em cada página. */
export function navItemsFor(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.adminOnly || role === 'admin');
}

export function isActivePath(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
