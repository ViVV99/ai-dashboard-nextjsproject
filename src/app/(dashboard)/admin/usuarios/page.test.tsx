import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsersPage from './page';

const m = vi.hoisted(() => ({ requirePageRole: vi.fn(), loadUsers: vi.fn() }));
vi.mock('@/server/auth', () => ({ requirePageRole: m.requirePageRole }));
vi.mock('@/server/services/users', () => ({ loadUsers: m.loadUsers }));
vi.mock('@/features/users/actions', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/admin/usuarios',
}));

type Page = (props: {
  searchParams: Promise<Record<string, string | string[]>>;
}) => Promise<ReactElement>;
const renderPage = async (params: Record<string, string | string[]> = {}) =>
  render(await (UsersPage as Page)({ searchParams: Promise.resolve(params) }));

beforeEach(() => {
  vi.clearAllMocks();
  m.loadUsers.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
});

describe('página de usuários', () => {
  it('exige admin e carrega a lista com os filtros da URL', async () => {
    await renderPage({ q: 'ana', status: 'blocked', page: '2' });

    expect(m.requirePageRole).toHaveBeenCalledWith('admin');
    expect(m.loadUsers).toHaveBeenCalledWith({ q: 'ana', status: 'blocked', page: 2 });
    expect(screen.getByRole('heading', { level: 1, name: 'Usuários' })).toBeInTheDocument();
  });

  it('filtros inválidos ou repetidos caem no padrão', async () => {
    await renderPage({ status: 'deleted', page: ['1', '2'] });

    expect(m.loadUsers).toHaveBeenCalledWith({ q: '', status: 'all', page: 1 });
  });
});
