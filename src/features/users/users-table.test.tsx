import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { admin, ana, caio } from './fixtures';
import { UsersTable } from './users-table';

describe('UsersTable', () => {
  it('mostra nome, e-mail, perfil, status e data de criação', () => {
    render(<UsersTable users={[ana]} onAction={vi.fn()} />);

    const row = screen.getByRole('row', { name: /Ana Lima/ });
    expect(row).toHaveTextContent('ana@x.com');
    expect(row).toHaveTextContent('Leitor');
    expect(row).toHaveTextContent('Ativo');
    expect(row).toHaveTextContent('03/09/2026');
  });

  it('ações só nas linhas de viewer; admin mostra só o status', () => {
    render(<UsersTable users={[admin, ana]} onAction={vi.fn()} />);

    const adminRow = screen.getByRole('row', { name: /Admin/ });
    expect(within(adminRow).queryByRole('button')).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('row', { name: /Ana Lima/ })).getAllByRole('button'),
    ).toHaveLength(3);
  });

  it('cada botão avisa a ação com o usuário; bloqueado oferece desbloquear', async () => {
    const onAction = vi.fn();
    render(<UsersTable users={[ana, caio]} onAction={onAction} />);

    await userEvent.click(screen.getByRole('button', { name: 'Editar Ana Lima' }));
    await userEvent.click(screen.getByRole('button', { name: 'Redefinir senha de Ana Lima' }));
    await userEvent.click(screen.getByRole('button', { name: 'Bloquear Ana Lima' }));
    await userEvent.click(screen.getByRole('button', { name: 'Desbloquear Caio' }));

    expect(onAction.mock.calls).toEqual([
      ['edit', ana],
      ['reset', ana],
      ['status', ana],
      ['status', caio],
    ]);
  });

  it('lista vazia mostra o estado vazio', () => {
    render(<UsersTable users={[]} onAction={vi.fn()} />);

    expect(screen.getByText('Nenhum usuário encontrado com esses filtros.')).toBeInTheDocument();
  });
});
