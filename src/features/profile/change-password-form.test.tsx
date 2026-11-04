import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { changePasswordAction } from './actions';
import { ChangePasswordForm } from './change-password-form';

vi.mock('./actions', () => ({ changePasswordAction: vi.fn() }));
const change = vi.mocked(changePasswordAction);

async function fillAll(current: string, next: string, confirm: string) {
  await userEvent.type(screen.getByLabelText('Senha atual'), current);
  await userEvent.type(screen.getByLabelText('Nova senha'), next);
  await userEvent.type(screen.getByLabelText('Confirme a nova senha'), confirm);
  await userEvent.click(screen.getByRole('button', { name: 'Trocar senha' }));
}

beforeEach(() => {
  change.mockReset().mockResolvedValue({ ok: true });
});

describe('ChangePasswordForm', () => {
  it('confirmação diferente não chega à action', async () => {
    render(<ChangePasswordForm />);

    await fillAll('velha123', 'nova1234', 'outra123');

    expect(
      await screen.findByText('A confirmação não confere com a nova senha.'),
    ).toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
  });

  it('envia os três campos para a action', async () => {
    render(<ChangePasswordForm />);

    await fillAll('velha123', 'nova1234', 'nova1234');

    expect(change).toHaveBeenCalledWith({
      currentPassword: 'velha123',
      newPassword: 'nova1234',
      confirmPassword: 'nova1234',
    });
  });

  it('depois da troca (changed) avisa que os outros dispositivos saíram', () => {
    render(<ChangePasswordForm changed />);

    expect(screen.getByRole('status')).toHaveTextContent('outros dispositivos');
  });

  it('senha atual errada aparece no campo', async () => {
    change.mockResolvedValue({
      ok: false,
      error: 'A senha atual não confere.',
      fieldErrors: { currentPassword: 'A senha atual não confere.' },
    });
    render(<ChangePasswordForm />);

    await fillAll('errada12', 'nova1234', 'nova1234');

    expect(await screen.findByLabelText('Senha atual')).toHaveAccessibleDescription(
      'A senha atual não confere.',
    );
  });
});
