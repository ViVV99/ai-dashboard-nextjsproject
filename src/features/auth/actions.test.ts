import { CredentialsSignin } from 'next-auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RateLimitedSignin } from '@/server/auth/callbacks';
import { loginAction } from './actions';
import { LOGIN_ERROR_MESSAGE, LOGIN_UNAVAILABLE_MESSAGE, RATE_LIMIT_MESSAGE } from './messages';

const { signIn, redirect } = vi.hoisted(() => ({
  signIn: vi.fn(),
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT ${to}`);
  }),
}));
vi.mock('@/server/auth/config', () => ({ signIn, signOut: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect }));

const input = { email: 'ana@x.com', password: 'senhaForte1' };

beforeEach(() => {
  signIn.mockReset();
  redirect.mockClear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('loginAction', () => {
  it('chama signIn sem redirect automático e redireciona ao callbackUrl seguro', async () => {
    signIn.mockResolvedValue('http://localhost:3000/');

    await expect(loginAction(input, '//evil.com')).rejects.toThrow('REDIRECT /');

    expect(signIn).toHaveBeenCalledWith('credentials', {
      ...input,
      redirectTo: '/',
      redirect: false,
    });
  });

  it('sucesso redireciona ao callbackUrl interno informado', async () => {
    signIn.mockResolvedValue('http://localhost:3000/relatorios?x=1');

    await expect(loginAction(input, '/relatorios?x=1')).rejects.toThrow('REDIRECT /relatorios?x=1');
  });

  // Regressão: sem AUTH_SECRET o Auth.js devolve a própria URL de /api/auth/* e o
  // navegador ia para uma rota de API (page not found).
  it('Auth.js devolvendo URL de /api/auth → erro no formulário, sem redirect', async () => {
    signIn.mockResolvedValue('http://localhost:3000/api/auth/callback/credentials?');

    expect(await loginAction(input, '/')).toEqual({ error: LOGIN_UNAVAILABLE_MESSAGE });
    expect(redirect).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it('credenciais inválidas → mensagem genérica', async () => {
    signIn.mockRejectedValue(new CredentialsSignin());

    expect(await loginAction(input, '/')).toEqual({ error: LOGIN_ERROR_MESSAGE });
  });

  it('rate limit → mensagem de muitas tentativas', async () => {
    signIn.mockRejectedValue(new RateLimitedSignin());

    expect(await loginAction(input, '/')).toEqual({ error: RATE_LIMIT_MESSAGE });
  });

  it('repassa erros inesperados', async () => {
    const unexpected = new Error('boom');
    signIn.mockRejectedValue(unexpected);

    await expect(loginAction(input, '/')).rejects.toBe(unexpected);
  });

  it('entrada inválida → mensagem genérica sem chamar signIn', async () => {
    expect(await loginAction({ email: 'x', password: '' }, '/')).toEqual({
      error: LOGIN_ERROR_MESSAGE,
    });
    expect(signIn).not.toHaveBeenCalled();
  });
});
