import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRuleError } from '@/server/services/users/errors';
import { changePasswordAction, updateNameAction } from './actions';

const m = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  redirect: vi.fn(() => {
    throw Object.assign(new Error('NEXT_REDIRECT'), {
      digest: 'NEXT_REDIRECT;replace;/login;307;',
    });
  }),
  updateProfile: vi.fn(async () => ({ name: 'Bia' })),
  changePassword: vi.fn(async () => ({ renewed: true, sessionVersion: 4 })),
}));
vi.mock('next/cache', () => ({ revalidatePath: m.revalidatePath }));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  redirect: m.redirect,
}));
vi.mock('@/server/services/profile', () => ({
  updateProfile: m.updateProfile,
  changePassword: m.changePassword,
}));

const input = { currentPassword: 'velha123', newPassword: 'nova1234', confirmPassword: 'nova1234' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('updateNameAction', () => {
  it('salva o nome e revalida a casca inteira (nome no topo)', async () => {
    await expect(updateNameAction({ name: ' Bia ' })).resolves.toEqual({ ok: true });
    expect(m.updateProfile).toHaveBeenCalledWith({ name: 'Bia' });
    expect(m.revalidatePath).toHaveBeenCalledWith('/', 'layout');
  });
});

describe('changePasswordAction', () => {
  // O cookie novo só vale no próximo request: re-renderizar na resposta da action usaria o
  // cookie antigo (session_version velho) e mandaria para o login. Por isso o redirect.
  it('troca a senha e recarrega o perfil com o aviso (cookie novo em novo request)', async () => {
    await expect(changePasswordAction(input)).rejects.toThrow('NEXT_REDIRECT');
    expect(m.changePassword).toHaveBeenCalledWith(input);
    // `v` muda a cada troca: a página remonta o formulário (limpo, com o aviso).
    expect(m.redirect).toHaveBeenCalledWith('/perfil?senha=alterada&v=4');
  });

  it('senha atual errada → erro no campo da senha atual', async () => {
    m.changePassword.mockRejectedValueOnce(new UserRuleError('wrong_password'));

    await expect(changePasswordAction(input)).resolves.toMatchObject({
      ok: false,
      fieldErrors: { currentPassword: 'A senha atual não confere.' },
    });
  });

  it('sessão não renovada → manda para o login', async () => {
    m.changePassword.mockResolvedValueOnce({ renewed: false, sessionVersion: 4 });

    await expect(changePasswordAction(input)).rejects.toThrow('NEXT_REDIRECT');
    expect(m.redirect).toHaveBeenCalledWith('/login');
  });
});
