import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDatabase, migrateDatabase, type AppDatabase } from '../db/client';
import { users } from '../db/schema';
import { requirePageRole, requirePageUser, requireRole, requireUser } from './index';

const { auth, redirect, state } = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT ${to}`);
  }),
  state: { db: undefined as AppDatabase | undefined },
}));
vi.mock('./config', () => ({ auth }));
vi.mock('../db', () => ({ getDb: () => state.db }));
vi.mock('next/navigation', () => ({ redirect }));

const sessionOf = (id: string, sessionVersion = 1) => ({
  user: { id, sessionVersion },
  expires: '',
});

beforeEach(() => {
  const db = createDatabase(':memory:');
  migrateDatabase(db);
  db.insert(users)
    .values([
      { id: 1, name: 'Admin', email: 'a@x.com', passwordHash: 'h', role: 'admin' },
      { id: 2, name: 'Viewer', email: 'v@x.com', passwordHash: 'h', role: 'viewer' },
    ])
    .run();
  state.db = db;
  auth.mockReset();
});

describe('requireUser', () => {
  it('sem sessão → 401', async () => {
    auth.mockResolvedValue(null);

    await expect(requireUser()).rejects.toMatchObject({ status: 401 });
  });

  it('sessão válida → usuário do banco', async () => {
    auth.mockResolvedValue(sessionOf('2'));

    await expect(requireUser()).resolves.toMatchObject({ id: 2, role: 'viewer' });
  });

  it('session_version desatualizado → 401', async () => {
    auth.mockResolvedValue(sessionOf('2', 0));

    await expect(requireUser()).rejects.toMatchObject({ status: 401 });
  });
});

describe('requireRole', () => {
  it('viewer em ação de admin → 403', async () => {
    auth.mockResolvedValue(sessionOf('2'));

    await expect(requireRole('admin')).rejects.toMatchObject({ status: 403 });
  });

  it('admin → usuário', async () => {
    auth.mockResolvedValue(sessionOf('1'));

    await expect(requireRole('admin')).resolves.toMatchObject({ id: 1 });
  });
});

describe('requirePageUser', () => {
  it('sessão inválida → redirect para /login', async () => {
    auth.mockResolvedValue(null);

    await expect(requirePageUser()).rejects.toThrow('REDIRECT /login');
  });
});

describe('requirePageRole', () => {
  it('admin passa', async () => {
    auth.mockResolvedValue(sessionOf('1'));

    await expect(requirePageRole('admin')).resolves.toMatchObject({ id: 1, role: 'admin' });
  });

  it('viewer em página de admin → redireciona para a visão geral', async () => {
    auth.mockResolvedValue(sessionOf('2'));

    await expect(requirePageRole('admin')).rejects.toThrow(/^REDIRECT \/$/);
  });

  it('sem sessão → redireciona para o login', async () => {
    auth.mockResolvedValue(null);

    await expect(requirePageRole('admin')).rejects.toThrow('REDIRECT /login');
  });
});
