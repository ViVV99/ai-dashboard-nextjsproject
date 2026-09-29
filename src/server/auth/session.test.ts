import { beforeEach, describe, expect, it } from 'vitest';
import { createDatabase, migrateDatabase, type AppDatabase } from '../db/client';
import { users } from '../db/schema';
import { loadSessionUser, tokenClaims } from './session';

let db: AppDatabase;

beforeEach(() => {
  db = createDatabase(':memory:');
  migrateDatabase(db);
  db.insert(users)
    .values([
      {
        id: 1,
        name: 'Ana',
        email: 'ana@exemplo.com',
        passwordHash: 'h',
        role: 'viewer',
        sessionVersion: 2,
      },
      {
        id: 2,
        name: 'Bia',
        email: 'bia@exemplo.com',
        passwordHash: 'h',
        role: 'viewer',
        status: 'blocked',
      },
    ])
    .run();
});

describe('loadSessionUser', () => {
  it('claims null → null', async () => {
    expect(await loadSessionUser(db, null)).toBeNull();
  });

  it('versão divergente → null', async () => {
    expect(await loadSessionUser(db, { userId: 1, sessionVersion: 1 })).toBeNull();
  });

  it('bloqueado → null', async () => {
    expect(await loadSessionUser(db, { userId: 2, sessionVersion: 1 })).toBeNull();
  });

  it('usuário inexistente → null', async () => {
    expect(await loadSessionUser(db, { userId: 99, sessionVersion: 1 })).toBeNull();
  });

  it('ativo com versão igual → SessionUser sem hash', async () => {
    expect(await loadSessionUser(db, { userId: 1, sessionVersion: 2 })).toEqual({
      id: 1,
      name: 'Ana',
      email: 'ana@exemplo.com',
      role: 'viewer',
      sessionVersion: 2,
    });
  });
});

describe('tokenClaims', () => {
  it('converte sub e sessionVersion em claims', () => {
    expect(tokenClaims({ sub: '7', sessionVersion: 3 })).toEqual({ userId: 7, sessionVersion: 3 });
  });

  it.each([
    ['sem sub', { sessionVersion: 1 }],
    ['sub não numérico', { sub: 'abc', sessionVersion: 1 }],
    ['sem sessionVersion', { sub: '1' }],
  ])('%s → null', (_, token) => {
    expect(tokenClaims(token)).toBeNull();
  });
});
