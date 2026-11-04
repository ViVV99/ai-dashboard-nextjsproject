import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createUserAction, updateUserAction } from './actions';
import { ana } from './fixtures';
import { UserFormDialog } from './user-form-dialog';

vi.mock('./actions', () => ({ createUserAction: vi.fn(), updateUserAction: vi.fn() }));
const create = vi.mocked(createUserAction);
const update = vi.mocked(updateUserAction);

beforeEach(() => {
  vi.clearAllMocks();
});

async function fill(label: string, value: string) {
  const field = screen.getByLabelText(label);
  await userEvent.clear(field);
  await userEvent.type(field, value);
}

describe('UserFormDialog — criar', () => {
  it('valida no cliente antes de chamar a action', async () => {
    render(<UserFormDialog open onClose={vi.fn()} onDone={vi.fn()} />);

    await fill('Nome', 'A');
    await userEvent.click(screen.getByRole('button', { name: 'Criar leitor' }));

    expect(
      await screen.findByText('O nome precisa ter pelo menos 2 caracteres.'),
    ).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });

  it('envia e avisa o sucesso', async () => {
    create.mockResolvedValue({ ok: true });
    const onDone = vi.fn();
    render(<UserFormDialog open onClose={vi.fn()} onDone={onDone} />);

    await fill('Nome', 'Bia');
    await fill('E-mail', 'bia@x.com');
    await fill('Senha inicial', 'senha123');
    await userEvent.click(screen.getByRole('button', { name: 'Criar leitor' }));

    expect(create).toHaveBeenCalledWith({ name: 'Bia', email: 'bia@x.com', password: 'senha123' });
    expect(onDone).toHaveBeenCalledWith('Leitor criado.');
  });

  it('e-mail já cadastrado aparece no campo de e-mail', async () => {
    create.mockResolvedValue({
      ok: false,
      error: 'Este e-mail já está cadastrado.',
      fieldErrors: { email: 'Este e-mail já está cadastrado.' },
    });
    render(<UserFormDialog open onClose={vi.fn()} onDone={vi.fn()} />);

    await fill('Nome', 'Bia');
    await fill('E-mail', 'ana@x.com');
    await fill('Senha inicial', 'senha123');
    await userEvent.click(screen.getByRole('button', { name: 'Criar leitor' }));

    expect(await screen.findByLabelText('E-mail')).toHaveAccessibleDescription(
      'Este e-mail já está cadastrado.',
    );
    // Erro de campo fica só no campo (sem repetir no alerta do topo).
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('UserFormDialog — editar', () => {
  it('vem preenchido, sem senha, e envia com o id', async () => {
    update.mockResolvedValue({ ok: true });
    const onDone = vi.fn();
    render(<UserFormDialog open user={ana} onClose={vi.fn()} onDone={onDone} />);

    expect(screen.getByLabelText('Nome')).toHaveValue('Ana Lima');
    expect(screen.queryByLabelText('Senha inicial')).not.toBeInTheDocument();
    await fill('Nome', 'Ana Souza');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    expect(update).toHaveBeenCalledWith({ id: 7, name: 'Ana Souza', email: 'ana@x.com' });
    expect(onDone).toHaveBeenCalledWith('Alterações salvas.');
  });
});
