import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthError } from '../../auth/errors';
import {
  blockUser,
  createUser,
  loadAudit,
  loadUsers,
  resetUserPassword,
  unblockUser,
  updateUser,
} from './index';

const m = vi.hoisted(() => ({
  requireRole: vi.fn(),
  getDb: vi.fn(() => 'db'),
  hash: vi.fn(async () => 'argon'),
  listUsers: vi.fn(() => 'lista'),
  createViewer: vi.fn(async () => 'criado'),
  updateViewer: vi.fn(() => 'editado'),
  setViewerStatus: vi.fn(() => 'status'),
  resetViewerPassword: vi.fn(async () => 'reset'),
  listAudit: vi.fn(() => 'auditoria'),
}));
vi.mock('../../auth', () => ({ requireRole: m.requireRole }));
vi.mock('../../db', () => ({ getDb: m.getDb }));
vi.mock('@node-rs/argon2', () => ({ hash: m.hash }));
vi.mock('./users', () => ({
  listUsers: m.listUsers,
  createViewer: m.createViewer,
  updateViewer: m.updateViewer,
  setViewerStatus: m.setViewerStatus,
  resetViewerPassword: m.resetViewerPassword,
}));
vi.mock('./audit', () => ({ listAudit: m.listAudit }));

const admin = { id: 1, role: 'admin' };
const query = { q: '', status: 'all', page: 1 } as const;
const input = { name: 'Ana', email: 'ana@x.com', password: 'senha123' };

const calls: [string, () => Promise<unknown>, ReturnType<typeof vi.fn>][] = [
  ['loadUsers', () => loadUsers(query), m.listUsers],
  ['createUser', () => createUser(input), m.createViewer],
  ['updateUser', () => updateUser(3, { name: 'Ana', email: 'ana@x.com' }), m.updateViewer],
  ['blockUser', () => blockUser(3), m.setViewerStatus],
  ['unblockUser', () => unblockUser(3), m.setViewerStatus],
  ['resetUserPassword', () => resetUserPassword(3, 'senha123'), m.resetViewerPassword],
  ['loadAudit', () => loadAudit(1), m.listAudit],
];

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue(admin);
});

describe.each(calls)('%s', (_, call, service) => {
  it('viewer → 403 sem consultar o banco', async () => {
    m.requireRole.mockRejectedValue(new AuthError('forbidden'));

    await expect(call()).rejects.toMatchObject({ status: 403 });
    expect(m.requireRole).toHaveBeenCalledWith('admin');
    expect(service).not.toHaveBeenCalled();
    expect(m.getDb).not.toHaveBeenCalled();
  });
});

describe('com admin', () => {
  it('repassa o ator, o banco e o hash argon2 aos services', async () => {
    await createUser(input);
    await blockUser(3);
    await unblockUser(4);
    await resetUserPassword(3, 'senha123');

    const hash = (m.createViewer.mock.calls[0] as unknown[] | undefined)?.[3] as (
      p: string,
    ) => Promise<string>;
    expect(m.createViewer).toHaveBeenCalledWith('db', admin, input, expect.any(Function));
    expect(await hash('x')).toBe('argon');
    expect(m.setViewerStatus).toHaveBeenNthCalledWith(1, 'db', admin, 3, 'blocked');
    expect(m.setViewerStatus).toHaveBeenNthCalledWith(2, 'db', admin, 4, 'active');
    expect(m.resetViewerPassword).toHaveBeenCalledWith(
      'db',
      admin,
      3,
      'senha123',
      expect.any(Function),
    );
  });
});
