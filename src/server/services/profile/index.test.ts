import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthError } from '../../auth/errors';
import { changePassword, updateProfile } from './index';

const m = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getDb: vi.fn(() => 'db'),
  signIn: vi.fn(async () => '/'),
  updateOwnName: vi.fn(() => ({ name: 'Bia' })),
  changeOwnPassword: vi.fn(async () => ({ sessionVersion: 2 })),
}));
vi.mock('../../auth', () => ({ requireUser: m.requireUser }));
vi.mock('../../auth/config', () => ({ signIn: m.signIn }));
vi.mock('../../db', () => ({ getDb: m.getDb }));
vi.mock('@node-rs/argon2', () => ({ hash: vi.fn(), verify: vi.fn() }));
vi.mock('./profile', () => ({
  updateOwnName: m.updateOwnName,
  changeOwnPassword: m.changeOwnPassword,
}));

const me = { id: 3, email: 'bia@x.com', role: 'viewer', sessionVersion: 1 };
const input = { currentPassword: 'velha123', newPassword: 'nova1234', confirmPassword: 'nova1234' };

beforeEach(() => {
  vi.clearAllMocks();
  m.requireUser.mockResolvedValue(me);
});

describe('fachada de perfil', () => {
  it('sem sessão → 401 sem tocar o banco', async () => {
    m.requireUser.mockRejectedValue(new AuthError('unauthorized'));

    await expect(updateProfile({ name: 'Bia' })).rejects.toMatchObject({ status: 401 });
    await expect(changePassword(input)).rejects.toMatchObject({ status: 401 });
    expect(m.getDb).not.toHaveBeenCalled();
    expect(m.signIn).not.toHaveBeenCalled();
  });

  it('troca de senha renova a sessão atual com a nova senha (as outras caem)', async () => {
    await expect(changePassword(input)).resolves.toEqual({ renewed: true, sessionVersion: 2 });

    expect(m.changeOwnPassword).toHaveBeenCalledWith(
      'db',
      me,
      input,
      expect.any(Function),
      expect.any(Function),
    );
    expect(m.signIn).toHaveBeenCalledWith('credentials', {
      email: 'bia@x.com',
      password: 'nova1234',
      redirect: false,
    });
  });

  it('senha atual errada não renova a sessão', async () => {
    m.changeOwnPassword.mockRejectedValueOnce(new Error('wrong_password'));

    await expect(changePassword(input)).rejects.toThrow();
    expect(m.signIn).not.toHaveBeenCalled();
  });

  it('falha ao renovar (ex.: rate limit) não desfaz a troca; o usuário só precisa entrar de novo', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    m.signIn.mockRejectedValueOnce(new Error('rate_limited'));

    await expect(changePassword(input)).resolves.toEqual({ renewed: false, sessionVersion: 2 });
  });
});
