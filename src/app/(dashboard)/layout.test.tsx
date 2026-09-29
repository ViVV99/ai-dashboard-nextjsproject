import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import DashboardLayout from './layout';

const { requirePageUser, shellProps } = vi.hoisted(() => ({
  requirePageUser: vi.fn().mockResolvedValue({
    id: 1,
    name: 'Ana Admin',
    email: 'ana@exemplo.com',
    role: 'admin',
    sessionVersion: 3,
  }),
  shellProps: vi.fn(),
}));
vi.mock('@/server/auth', () => ({ requirePageUser }));
vi.mock('@/features/layout/app-shell', () => ({
  AppShell: (props: { user: unknown; children: ReactNode }) => {
    shellProps(props.user);
    return <div>{props.children}</div>;
  },
}));

describe('DashboardLayout', () => {
  it('exige sessão e renderiza o conteúdo dentro da casca', async () => {
    render(await DashboardLayout({ children: <p>página</p> }));

    expect(requirePageUser).toHaveBeenCalled();
    expect(screen.getByText('página')).toBeInTheDocument();
  });

  // Regressão: só o necessário cruza para o Client Component (nada de e-mail, id ou versão).
  it('passa ao AppShell apenas nome e perfil', async () => {
    render(await DashboardLayout({ children: null }));

    expect(shellProps).toHaveBeenCalledWith({ name: 'Ana Admin', role: 'admin' });
  });
});
