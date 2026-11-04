import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ProfilePage from './page';

vi.mock('@/server/auth', () => ({
  requirePageUser: vi.fn(async () => ({
    id: 3,
    name: 'Bia',
    email: 'bia@x.com',
    role: 'viewer',
    sessionVersion: 1,
  })),
}));
vi.mock('@/features/profile/actions', () => ({}));

type Page = (props: { searchParams: Promise<Record<string, string>> }) => Promise<ReactElement>;
const renderable = (params: Record<string, string> = {}) =>
  (ProfilePage as Page)({ searchParams: Promise.resolve(params) });

describe('página de perfil', () => {
  it('mostra e-mail e perfil (só leitura) e os formulários com o nome atual', async () => {
    render(await renderable());

    expect(screen.getByRole('heading', { level: 1, name: 'Meu perfil' })).toBeInTheDocument();
    expect(screen.getByText('bia@x.com')).toBeInTheDocument();
    expect(screen.getByText('Leitor')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toHaveValue('Bia');
    expect(screen.getByRole('button', { name: 'Trocar senha' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('?senha=alterada mostra o aviso da troca', async () => {
    render(await renderable({ senha: 'alterada', v: '4' }));

    expect(screen.getByRole('status')).toHaveTextContent('Senha alterada.');
  });
});
