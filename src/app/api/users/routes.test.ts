// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthError } from '@/server/auth/errors';
import { PATCH as mePATCH } from '../me/route';
import { POST as passwordPOST } from '../me/password/route';
import { POST as blockPOST } from './[id]/block/route';
import { POST as resetPOST } from './[id]/reset-password/route';
import { PATCH as userPATCH } from './[id]/route';
import { POST as unblockPOST } from './[id]/unblock/route';
import { GET as usersGET, POST as usersPOST } from './route';

const m = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireRole: vi.fn(),
  loadUsers: vi.fn(async () => 'lista'),
  createUser: vi.fn(async () => 'criado'),
  updateUser: vi.fn(async () => 'editado'),
  blockUser: vi.fn(async () => 'bloqueado'),
  unblockUser: vi.fn(async () => 'desbloqueado'),
  resetUserPassword: vi.fn(async () => 'reset'),
  updateProfile: vi.fn(async () => 'perfil'),
  changePassword: vi.fn(async () => ({ renewed: true, sessionVersion: 2 })),
}));
vi.mock('@/server/auth', () => ({ requireUser: m.requireUser, requireRole: m.requireRole }));
vi.mock('@/server/services/users', () => ({
  loadUsers: m.loadUsers,
  createUser: m.createUser,
  updateUser: m.updateUser,
  blockUser: m.blockUser,
  unblockUser: m.unblockUser,
  resetUserPassword: m.resetUserPassword,
}));
vi.mock('@/server/services/profile', () => ({
  updateProfile: m.updateProfile,
  changePassword: m.changePassword,
}));

const url = 'http://localhost/api';
const json = (method: string, body: unknown, path = '/x') =>
  new Request(`${url}${path}`, {
    method,
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
const id = (value: string) => ({ params: Promise.resolve({ id: value }) });
const viewer = { name: 'Ana', email: 'ana@x.com' };

beforeEach(() => {
  vi.clearAllMocks();
  m.requireUser.mockResolvedValue({ id: 3 });
  m.requireRole.mockResolvedValue({ id: 1 });
});

describe('/api/users', () => {
  it('GET lista com os filtros da query', async () => {
    const response = await usersGET(new Request(`${url}/users?q=ana&status=blocked&page=2`), {});

    expect(response.status).toBe(200);
    expect(m.loadUsers).toHaveBeenCalledWith({ q: 'ana', status: 'blocked', page: 2 });
  });

  it('POST cria viewer → 201', async () => {
    const response = await usersPOST(json('POST', { ...viewer, password: 'senha123' }), {});

    expect(response.status).toBe(201);
    expect(m.createUser).toHaveBeenCalledWith({ ...viewer, password: 'senha123' });
  });

  it('POST de viewer → 403 antes de validar o corpo', async () => {
    m.requireRole.mockRejectedValue(new AuthError('forbidden'));

    const response = await usersPOST(json('POST', {}), {});

    expect(response.status).toBe(403);
    expect(m.createUser).not.toHaveBeenCalled();
  });
});

describe('/api/users/:id', () => {
  it('PATCH edita nome e e-mail do id da rota', async () => {
    const response = await userPATCH(json('PATCH', viewer), id('7'));

    expect(response.status).toBe(200);
    expect(m.updateUser).toHaveBeenCalledWith(7, viewer);
  });

  it('id inválido → 404 sem chamar o service', async () => {
    const response = await userPATCH(json('PATCH', viewer), id('abc'));

    expect(response.status).toBe(404);
    expect(m.updateUser).not.toHaveBeenCalled();
  });

  it.each([
    ['block', blockPOST, m.blockUser],
    ['unblock', unblockPOST, m.unblockUser],
  ] as const)('POST %s chama a fachada certa', async (_, POST, facade) => {
    const response = await POST(
      new Request(`${url}/users/7/x`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      }),
      id('7'),
    );

    expect(response.status).toBe(200);
    expect(facade).toHaveBeenCalledWith(7);
  });

  it('POST reset-password valida a senha nova', async () => {
    expect((await resetPOST(json('POST', { password: 'curta' }), id('7'))).status).toBe(400);
    expect((await resetPOST(json('POST', { password: 'senha123' }), id('7'))).status).toBe(200);
    expect(m.resetUserPassword).toHaveBeenCalledWith(7, 'senha123');
  });
});

describe('/api/me', () => {
  it('PATCH atualiza o próprio nome', async () => {
    const response = await mePATCH(json('PATCH', { name: 'Bia' }), {});

    expect(response.status).toBe(200);
    expect(m.updateProfile).toHaveBeenCalledWith({ name: 'Bia' });
  });

  it('POST /password troca a senha e informa se a sessão foi renovada', async () => {
    const input = {
      currentPassword: 'velha123',
      newPassword: 'nova1234',
      confirmPassword: 'nova1234',
    };

    const response = await passwordPOST(json('POST', input), {});

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ renewed: true, sessionVersion: 2 });
    expect(m.changePassword).toHaveBeenCalledWith(input);
  });
});
