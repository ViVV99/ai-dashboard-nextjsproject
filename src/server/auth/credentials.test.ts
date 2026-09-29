import { hash, verify } from '@node-rs/argon2';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Role, UserStatus } from '@/types/domain';
import { createDatabase, migrateDatabase, type AppDatabase } from '../db/client';
import { users } from '../db/schema';
import { createCredentialsVerifier } from './credentials';

const PASSWORD = 'senhaForte1';
let passwordHash: string;
let db: AppDatabase;

function insertUser(id: number, email: string, role: Role, status: UserStatus = 'active') {
  db.insert(users)
    .values({ id, name: `User ${id}`, email, passwordHash, role, status })
    .run();
}

beforeAll(async () => {
  passwordHash = await hash(PASSWORD);
});

beforeEach(() => {
  db = createDatabase(':memory:');
  migrateDatabase(db);
  insertUser(1, 'admin@exemplo.com', 'admin');
  insertUser(2, 'bloqueado@exemplo.com', 'viewer', 'blocked');
});

const login = (email: string, password = PASSWORD) => ({ email, password });

describe('createCredentialsVerifier', () => {
  it('login válido retorna o usuário sem hash', async () => {
    const result = await createCredentialsVerifier(db)(login('admin@exemplo.com'), '1.1.1.1');

    expect(result).toEqual({
      ok: true,
      user: { id: 1, name: 'User 1', email: 'admin@exemplo.com', role: 'admin', sessionVersion: 1 },
    });
  });

  it('senha errada → invalid', async () => {
    const result = await createCredentialsVerifier(db)(
      login('admin@exemplo.com', 'errada123'),
      'ip',
    );

    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  it('e-mail inexistente → invalid, verificando contra hash fictício', async () => {
    const verifyPassword = vi.fn(verify);
    const check = createCredentialsVerifier(db, { verifyPassword });

    const result = await check(login('ninguem@exemplo.com'), 'ip');

    expect(result).toEqual({ ok: false, reason: 'invalid' });
    expect(verifyPassword).toHaveBeenCalledOnce();
    expect(verifyPassword.mock.calls[0][0]).toMatch(/^\$argon2id\$/);
  });

  it('usuário bloqueado com senha certa → invalid', async () => {
    const result = await createCredentialsVerifier(db)(login('bloqueado@exemplo.com'), 'ip');

    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  it('normaliza o e-mail antes de buscar', async () => {
    const result = await createCredentialsVerifier(db)(login(' Admin@Exemplo.com '), 'ip');

    expect(result.ok).toBe(true);
  });

  it('6ª tentativa no mesmo e-mail+IP → rate_limited, mesmo com senha certa', async () => {
    const check = createCredentialsVerifier(db);
    for (let i = 0; i < 5; i++) await check(login('admin@exemplo.com', 'errada123'), 'ip');

    expect(await check(login('admin@exemplo.com'), 'ip')).toEqual({
      ok: false,
      reason: 'rate_limited',
    });
  });

  it('21ª tentativa do IP com e-mails variados → rate_limited', async () => {
    const check = createCredentialsVerifier(db);
    for (let i = 0; i < 20; i++) await check(login(`u${i}@exemplo.com`), 'ip');

    expect(await check(login('admin@exemplo.com'), 'ip')).toEqual({
      ok: false,
      reason: 'rate_limited',
    });
  });

  it('sucesso zera o contador de e-mail+IP', async () => {
    const check = createCredentialsVerifier(db);
    for (let i = 0; i < 4; i++) await check(login('admin@exemplo.com', 'errada123'), 'ip');
    await check(login('admin@exemplo.com'), 'ip');
    for (let i = 0; i < 4; i++) await check(login('admin@exemplo.com', 'errada123'), 'ip');

    expect((await check(login('admin@exemplo.com'), 'ip')).ok).toBe(true);
  });
});
