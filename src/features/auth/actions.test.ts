import { CredentialsSignin } from 'next-auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RateLimitedSignin } from '@/server/auth/callbacks';
import { loginAction } from './actions';
import { LOGIN_ERROR_MESSAGE, RATE_LIMIT_MESSAGE } from './messages';

const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock('@/server/auth/config', () => ({ signIn, signOut: vi.fn() }));

const input = { email: 'ana@x.com', password: 'senhaForte1' };

beforeEach(() => {
  signIn.mockReset();
});

describe('loginAction', () => {
  it('chama signIn com as credenciais e o callbackUrl seguro', async () => {
    signIn.mockResolvedValue(undefined);

    await loginAction(input, '//evil.com');

    expect(signIn).toHaveBeenCalledWith('credentials', { ...input, redirectTo: '/' });
  });

  it('credenciais inválidas → mensagem genérica', async () => {
    signIn.mockRejectedValue(new CredentialsSignin());

    expect(await loginAction(input, '/')).toEqual({ error: LOGIN_ERROR_MESSAGE });
  });

  it('rate limit → mensagem de muitas tentativas', async () => {
    signIn.mockRejectedValue(new RateLimitedSignin());

    expect(await loginAction(input, '/')).toEqual({ error: RATE_LIMIT_MESSAGE });
  });

  it('repassa outros erros (ex.: o redirect do Next em caso de sucesso)', async () => {
    const redirect = new Error('NEXT_REDIRECT');
    signIn.mockRejectedValue(redirect);

    await expect(loginAction(input, '/')).rejects.toBe(redirect);
  });

  it('entrada inválida → mensagem genérica sem chamar signIn', async () => {
    expect(await loginAction({ email: 'x', password: '' }, '/')).toEqual({
      error: LOGIN_ERROR_MESSAGE,
    });
    expect(signIn).not.toHaveBeenCalled();
  });
});
