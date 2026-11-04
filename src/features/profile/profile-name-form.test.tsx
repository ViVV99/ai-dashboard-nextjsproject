import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateNameAction } from './actions';
import { ProfileNameForm } from './profile-name-form';

vi.mock('./actions', () => ({ updateNameAction: vi.fn() }));
const update = vi.mocked(updateNameAction);

beforeEach(() => {
  update.mockReset().mockResolvedValue({ ok: true });
});

describe('ProfileNameForm', () => {
  it('vem com o nome atual, salva e confirma', async () => {
    render(<ProfileNameForm name="Bia" />);
    const field = screen.getByLabelText('Nome');
    expect(field).toHaveValue('Bia');

    await userEvent.clear(field);
    await userEvent.type(field, 'Bia Souza');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nome' }));

    expect(update).toHaveBeenCalledWith({ name: 'Bia Souza' });
    expect(await screen.findByRole('status')).toHaveTextContent('Nome atualizado.');
  });

  it('nome curto não chega à action', async () => {
    render(<ProfileNameForm name="Bia" />);

    await userEvent.clear(screen.getByLabelText('Nome'));
    await userEvent.type(screen.getByLabelText('Nome'), 'B');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar nome' }));

    expect(
      await screen.findByText('O nome precisa ter pelo menos 2 caracteres.'),
    ).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });
});
