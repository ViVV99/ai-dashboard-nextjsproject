import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetPasswordAction } from './actions';
import { ana } from './fixtures';
import { ResetPasswordDialog } from './reset-password-dialog';

vi.mock('./actions', () => ({ resetPasswordAction: vi.fn() }));
const reset = vi.mocked(resetPasswordAction);

beforeEach(() => {
  vi.clearAllMocks();
  reset.mockResolvedValue({ ok: true });
});

describe('ResetPasswordDialog', () => {
  it('senha fraca não chega à action', async () => {
    render(<ResetPasswordDialog user={ana} onClose={vi.fn()} onDone={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Nova senha'), 'semnumero');
    await userEvent.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(
      await screen.findByText('A senha precisa ter pelo menos um número.'),
    ).toBeInTheDocument();
    expect(reset).not.toHaveBeenCalled();
  });

  it('avisa que as sessões caem e envia com o id', async () => {
    const onDone = vi.fn();
    render(<ResetPasswordDialog user={ana} onClose={vi.fn()} onDone={onDone} />);

    expect(screen.getByRole('dialog')).toHaveTextContent('sessões abertas');
    await userEvent.type(screen.getByLabelText('Nova senha'), 'senha123');
    await userEvent.click(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(reset).toHaveBeenCalledWith({ id: 7, password: 'senha123' });
    expect(onDone).toHaveBeenCalledWith('Senha de Ana Lima redefinida.');
  });
});
