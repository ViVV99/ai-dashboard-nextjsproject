import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersToolbar } from './users-toolbar';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/admin/usuarios',
}));

beforeEach(() => {
  push.mockClear();
});

describe('UsersToolbar', () => {
  it('aplica busca e status na URL, voltando para a página 1', async () => {
    render(<UsersToolbar q="" status="all" onCreate={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Buscar por nome ou e-mail'), 'ana');
    await userEvent.click(screen.getByRole('combobox', { name: 'Status' }));
    await userEvent.click(screen.getByRole('option', { name: 'Bloqueados' }));
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }));

    expect(push).toHaveBeenCalledWith('/admin/usuarios?q=ana&status=blocked');
  });

  it('sem filtros volta para a URL limpa', async () => {
    render(<UsersToolbar q="ana" status="all" onCreate={vi.fn()} />);

    await userEvent.clear(screen.getByLabelText('Buscar por nome ou e-mail'));
    await userEvent.click(screen.getByRole('button', { name: 'Filtrar' }));

    expect(push).toHaveBeenCalledWith('/admin/usuarios');
  });

  it('botão de novo leitor', async () => {
    const onCreate = vi.fn();
    render(<UsersToolbar q="" status="all" onCreate={onCreate} />);

    await userEvent.click(screen.getByRole('button', { name: 'Novo leitor' }));

    expect(onCreate).toHaveBeenCalled();
  });
});
