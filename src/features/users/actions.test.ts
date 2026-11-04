import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createUserAction,
  resetPasswordAction,
  setUserStatusAction,
  updateUserAction,
} from './actions';

const m = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  createUser: vi.fn(async () => ({})),
  updateUser: vi.fn(async () => ({})),
  blockUser: vi.fn(async () => ({})),
  unblockUser: vi.fn(async () => ({})),
  resetUserPassword: vi.fn(async () => ({})),
}));
vi.mock('next/cache', () => ({ revalidatePath: m.revalidatePath }));
vi.mock('@/server/services/users', () => ({
  createUser: m.createUser,
  updateUser: m.updateUser,
  blockUser: m.blockUser,
  unblockUser: m.unblockUser,
  resetUserPassword: m.resetUserPassword,
}));

const PATHS = ['/admin/usuarios', '/admin/auditoria'];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('actions de usuários', () => {
  it('criar normaliza a entrada e revalida lista e auditoria', async () => {
    const result = await createUserAction({
      name: ' Ana ',
      email: 'ANA@x.com',
      password: 'senha123',
    });

    expect(result).toEqual({ ok: true });
    expect(m.createUser).toHaveBeenCalledWith({
      name: 'Ana',
      email: 'ana@x.com',
      password: 'senha123',
    });
    expect(m.revalidatePath.mock.calls.map(([path]) => path)).toEqual(PATHS);
  });

  it('editar repassa o id e só nome/e-mail', async () => {
    await updateUserAction({ id: 7, name: 'Ana', email: 'ana@x.com', role: 'admin' });

    expect(m.updateUser).toHaveBeenCalledWith(7, { name: 'Ana', email: 'ana@x.com' });
  });

  it.each([
    ['blocked', m.blockUser],
    ['active', m.unblockUser],
  ] as const)('status %s chama a fachada certa', async (status, facade) => {
    await setUserStatusAction({ id: 7, status });

    expect(facade).toHaveBeenCalledWith(7);
  });

  it('redefinir senha repassa id e senha', async () => {
    await resetPasswordAction({ id: 7, password: 'senha123' });

    expect(m.resetUserPassword).toHaveBeenCalledWith(7, 'senha123');
  });

  it.each([
    ['id inválido', () => setUserStatusAction({ id: -1, status: 'blocked' })],
    ['status inválido', () => setUserStatusAction({ id: 7, status: 'deleted' })],
    ['senha fraca', () => resetPasswordAction({ id: 7, password: 'curta' })],
  ])('%s → erro sem chamar a fachada', async (_, call) => {
    await expect(call()).resolves.toMatchObject({ ok: false });
    expect(m.blockUser).not.toHaveBeenCalled();
    expect(m.resetUserPassword).not.toHaveBeenCalled();
  });
});
