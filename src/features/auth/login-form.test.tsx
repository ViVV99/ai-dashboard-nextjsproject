import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOGIN_ERROR_MESSAGE } from './messages';
import { LoginForm } from './login-form';

const loginAction = vi.hoisted(() => vi.fn());
vi.mock('./actions', () => ({ loginAction }));

beforeEach(() => {
  loginAction.mockReset();
});

async function fill(email: string, password: string) {
  const user = userEvent.setup();
  if (email) await user.type(screen.getByLabelText(/e-mail/i), email);
  if (password) await user.type(screen.getByLabelText(/senha/i), password);
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('LoginForm', () => {
  it('mostra erros de validação sem chamar a action', async () => {
    render(<LoginForm callbackUrl="/" />);

    await fill('nao-e-email', '');

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument();
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument();
    expect(loginAction).not.toHaveBeenCalled();
  });

  it('envia e-mail normalizado, senha e callbackUrl', async () => {
    loginAction.mockResolvedValue(undefined);
    render(<LoginForm callbackUrl="/vendas" />);

    await fill(' Admin@Exemplo.com', 'senhaForte1');

    expect(loginAction).toHaveBeenCalledWith(
      { email: 'admin@exemplo.com', password: 'senhaForte1' },
      '/vendas',
    );
  });

  it('exibe o erro genérico retornado pela action', async () => {
    loginAction.mockResolvedValue({ error: LOGIN_ERROR_MESSAGE });
    render(<LoginForm callbackUrl="/" />);

    await fill('admin@exemplo.com', 'errada123');

    expect(await screen.findByRole('alert')).toHaveTextContent(LOGIN_ERROR_MESSAGE);
  });

  it('desabilita o botão enquanto envia', async () => {
    let resolve: (value: undefined) => void = () => {};
    loginAction.mockReturnValue(new Promise((r) => (resolve = r)));
    render(<LoginForm callbackUrl="/" />);

    await fill('admin@exemplo.com', 'senhaForte1');

    expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled();
    resolve(undefined);
  });
});
