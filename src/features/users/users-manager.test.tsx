import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setUserStatusAction } from './actions';
import { ana } from './fixtures';
import { UsersManager } from './users-manager';

vi.mock('./actions', () => ({
  createUserAction: vi.fn(),
  updateUserAction: vi.fn(),
  setUserStatusAction: vi.fn(),
  resetPasswordAction: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/admin/usuarios',
}));

const list = (total: number, page = 1) => ({ items: [ana], total, page, pageSize: 20 });
const query = { q: 'ana', status: 'active', page: 1 } as const;

beforeEach(() => {
  vi.mocked(setUserStatusAction).mockReset().mockResolvedValue({ ok: true });
});

describe('UsersManager', () => {
  it('abre o diálogo da ação e, ao concluir, fecha e avisa', async () => {
    render(<UsersManager list={list(1)} query={query} />);

    await userEvent.click(screen.getByRole('button', { name: 'Bloquear Ana Lima' }));
    const dialog = screen.getByRole('dialog', { name: 'Bloquear Ana Lima?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Bloquear' }));

    expect(await screen.findByText('Acesso de Ana Lima bloqueado.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Bloquear Ana Lima?' })).not.toBeInTheDocument();
  });

  it('abre o formulário de novo leitor', async () => {
    render(<UsersManager list={list(1)} query={query} />);

    await userEvent.click(screen.getByRole('button', { name: 'Novo leitor' }));

    expect(screen.getByRole('dialog', { name: 'Novo leitor' })).toBeInTheDocument();
  });

  it('paginação mantém os filtros na URL e informa o total', () => {
    render(<UsersManager list={list(45, 2)} query={{ ...query, page: 2 }} />);

    expect(screen.getByText('45 usuários')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para a página 3' })).toHaveAttribute(
      'href',
      '/admin/usuarios?q=ana&status=active&page=3',
    );
  });

  it('uma página só: sem paginação', () => {
    render(<UsersManager list={list(1)} query={query} />);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByText('1 usuário')).toBeInTheDocument();
  });
});
