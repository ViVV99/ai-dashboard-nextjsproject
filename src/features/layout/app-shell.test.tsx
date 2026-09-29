import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { theme } from '@/theme/theme';
import { AppShell, type ShellUser } from './app-shell';

const { logoutAction, pathname } = vi.hoisted(() => ({
  logoutAction: vi.fn(),
  pathname: { current: '/' },
}));
vi.mock('@/features/auth/actions', () => ({ logoutAction }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));

const admin: ShellUser = { name: 'Ana Admin', email: 'ana@exemplo.com', role: 'admin' };
const viewer: ShellUser = { name: 'Vitor Viewer', email: 'vitor@exemplo.com', role: 'viewer' };

function renderShell(user: ShellUser, children: ReactNode = <p>conteúdo</p>) {
  return render(
    <ThemeProvider theme={theme}>
      <AppShell user={user}>{children}</AppShell>
    </ThemeProvider>,
  );
}

const sidebar = () => within(screen.getByRole('navigation', { name: 'Menu principal' }));

beforeEach(() => {
  pathname.current = '/';
  logoutAction.mockReset();
});

describe('AppShell', () => {
  it('renderiza o conteúdo da página', () => {
    renderShell(viewer);

    expect(screen.getByText('conteúdo')).toBeInTheDocument();
  });

  it('viewer não vê os itens de admin', () => {
    renderShell(viewer);

    expect(sidebar().getByRole('link', { name: 'Vendas' })).toBeInTheDocument();
    expect(sidebar().queryByRole('link', { name: 'Usuários' })).not.toBeInTheDocument();
  });

  it('admin vê os itens de admin', () => {
    renderShell(admin);

    expect(sidebar().getByRole('link', { name: 'Usuários' })).toHaveAttribute(
      'href',
      '/admin/usuarios',
    );
    expect(sidebar().getByRole('link', { name: 'Auditoria' })).toBeInTheDocument();
  });

  it('marca o item da rota atual com aria-current, inclusive em sub-rotas', () => {
    pathname.current = '/admin/usuarios/7';
    renderShell(admin);

    expect(sidebar().getByRole('link', { name: 'Usuários' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(sidebar().getByRole('link', { name: 'Visão geral' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('mostra o usuário e o botão de sair, que chama a action de logout', async () => {
    renderShell(viewer);

    expect(screen.getByText('Vitor Viewer')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sair' }));

    expect(logoutAction).toHaveBeenCalled();
  });

  it('o botão de menu abre a gaveta (mobile), que fecha ao navegar', async () => {
    renderShell(viewer);
    const user = userEvent.setup();
    const copies = () => screen.queryAllByRole('link', { name: 'Vendas', hidden: true });
    expect(copies()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(copies()).toHaveLength(2);

    // Com a gaveta aberta, o resto da página fica aria-hidden: só o link da gaveta é acessível.
    await user.click(screen.getByRole('link', { name: 'Vendas' }));
    await waitFor(() => expect(copies()).toHaveLength(1));
  });

  it('alterna entre tema claro e escuro', async () => {
    renderShell(viewer);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Ativar tema escuro' }));
    expect(screen.getByRole('button', { name: 'Ativar tema claro' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ativar tema claro' }));
    expect(screen.getByRole('button', { name: 'Ativar tema escuro' })).toBeInTheDocument();
  });
});
