import { beforeEach, describe, expect, it } from 'vitest';
import type { SessionUser } from '@/types/auth';
import { createDatabase, migrateDatabase, type AppDatabase } from '../../db/client';
import { auditLogs, users } from '../../db/schema';
import { loadSessionUser } from '../../auth/session';
import { changeOwnPassword, updateOwnName } from './profile';

const hash = async (password: string) => `hash:${password}`;
const verify = async (hashed: string, password: string) => hashed === `hash:${password}`;
const me: SessionUser = {
  id: 3,
  name: 'Bia',
  email: 'bia@x.com',
  role: 'viewer',
  sessionVersion: 1,
};
const input = { currentPassword: 'velha123', newPassword: 'nova1234', confirmPassword: 'nova1234' };
let db: AppDatabase;

const row = () =>
  db
    .select()
    .from(users)
    .all()
    .find((u) => u.id === me.id);

beforeEach(() => {
  db = createDatabase(':memory:');
  migrateDatabase(db);
  db.insert(users)
    .values({
      id: 3,
      name: 'Bia',
      email: 'bia@x.com',
      passwordHash: 'hash:velha123',
      role: 'viewer',
    })
    .run();
});

describe('updateOwnName', () => {
  it('troca só o nome, sem auditoria (não é ação administrativa)', () => {
    expect(updateOwnName(db, me, { name: 'Bia Souza' })).toEqual({ name: 'Bia Souza' });
    expect(row()).toMatchObject({ name: 'Bia Souza', sessionVersion: 1 });
    expect(db.select().from(auditLogs).all()).toEqual([]);
  });
});

describe('changeOwnPassword', () => {
  it('senha atual errada → 422 wrong_password, sem mudança', async () => {
    await expect(
      changeOwnPassword(db, me, { ...input, currentPassword: 'errada12' }, verify, hash),
    ).rejects.toMatchObject({ status: 422, code: 'wrong_password' });
    expect(row()).toMatchObject({ passwordHash: 'hash:velha123', sessionVersion: 1 });
  });

  it('troca o hash, incrementa session_version e a sessão antiga deixa de valer', async () => {
    const result = await changeOwnPassword(db, me, input, verify, hash);

    expect(result).toEqual({ sessionVersion: 2 });
    expect(row()).toMatchObject({ passwordHash: 'hash:nova1234', sessionVersion: 2 });
    expect(await loadSessionUser(db, { userId: 3, sessionVersion: 1 })).toBeNull();
    expect(await loadSessionUser(db, { userId: 3, sessionVersion: 2 })).not.toBeNull();
  });

  it('sessão revogada no meio (session_version mudou) → 401, sem trocar a senha', async () => {
    db.update(users).set({ sessionVersion: 5 }).run();

    await expect(changeOwnPassword(db, me, input, verify, hash)).rejects.toMatchObject({
      status: 401,
    });
    expect(row()?.passwordHash).toBe('hash:velha123');
  });
});
