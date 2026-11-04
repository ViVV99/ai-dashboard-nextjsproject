import { beforeEach, describe, expect, it } from 'vitest';
import type { SessionUser } from '@/types/auth';
import { createDatabase, migrateDatabase, type AppDatabase } from '../../db/client';
import { auditLogs, users } from '../../db/schema';
import { loadSessionUser } from '../../auth/session';
import { createRateLimiter } from '../../auth/rate-limit';
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
const limiter = () => createRateLimiter({ limit: 5, windowMs: 60_000 });

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
      changeOwnPassword(db, me, { ...input, currentPassword: 'errada12' }, verify, hash, limiter()),
    ).rejects.toMatchObject({ status: 422, code: 'wrong_password' });
    expect(row()).toMatchObject({ passwordHash: 'hash:velha123', sessionVersion: 1 });
  });

  it('troca o hash, incrementa session_version e a sessão antiga deixa de valer', async () => {
    const result = await changeOwnPassword(db, me, input, verify, hash, limiter());

    expect(result).toEqual({ sessionVersion: 2 });
    expect(row()).toMatchObject({ passwordHash: 'hash:nova1234', sessionVersion: 2 });
    expect(await loadSessionUser(db, { userId: 3, sessionVersion: 1 })).toBeNull();
    expect(await loadSessionUser(db, { userId: 3, sessionVersion: 2 })).not.toBeNull();
  });

  it('sessão revogada no meio (session_version mudou) → 401, sem trocar a senha', async () => {
    db.update(users).set({ sessionVersion: 5 }).run();

    await expect(changeOwnPassword(db, me, input, verify, hash, limiter())).rejects.toMatchObject({
      status: 401,
    });
    expect(row()?.passwordHash).toBe('hash:velha123');
  });
});

describe('changeOwnPassword — limite de tentativas (força bruta com sessão roubada)', () => {
  it('a 6ª tentativa em 15 min é recusada com 429 sem rodar o verify', async () => {
    const attempts = limiter();
    const wrong = { ...input, currentPassword: 'errada12' };
    for (let n = 0; n < 5; n++) {
      await expect(changeOwnPassword(db, me, wrong, verify, hash, attempts)).rejects.toMatchObject({
        code: 'wrong_password',
      });
    }
    let verified = false;
    const spy = async (h: string, p: string) => ((verified = true), verify(h, p));

    await expect(changeOwnPassword(db, me, input, spy, hash, attempts)).rejects.toMatchObject({
      status: 429,
      code: 'too_many_attempts',
    });
    expect(verified).toBe(false);
    expect(row()?.passwordHash).toBe('hash:velha123');
  });

  it('acerto zera o contador', async () => {
    const attempts = limiter();
    const wrong = { ...input, currentPassword: 'errada12' };
    for (let n = 0; n < 4; n++) {
      await changeOwnPassword(db, me, wrong, verify, hash, attempts).catch(() => {});
    }
    await changeOwnPassword(db, me, input, verify, hash, attempts);

    expect(attempts.hit('3').allowed).toBe(true);
  });
});
