import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDatabase, migrateDatabase, type AppDatabase } from '../db/client';
import { users } from '../db/schema';
import {
  authorizeCredentials,
  jwtCallback,
  RateLimitedSignin,
  SESSION_MAX_AGE_S,
  sessionCallback,
} from './callbacks';

const request = (xff = '6.6.6.6, 10.0.0.1') =>
  new Request('http://local/api/auth/callback/credentials', {
    headers: { 'x-forwarded-for': xff },
  });
const sessionUser = {
  id: 1,
  name: 'Ana',
  email: 'ana@x.com',
  role: 'admin',
  sessionVersion: 1,
} as const;

describe('authorizeCredentials', () => {
  it('entrada inválida → null sem chamar o verificador', async () => {
    const verify = vi.fn();

    expect(
      await authorizeCredentials({ email: 'x', password: '' }, request(), verify, 1),
    ).toBeNull();
    expect(verify).not.toHaveBeenCalled();
  });

  it('sucesso → User com id string, usando o IP do proxy confiável', async () => {
    const verify = vi.fn().mockResolvedValue({ ok: true, user: sessionUser });

    const user = await authorizeCredentials(
      { email: 'ana@x.com', password: 'p' },
      request(),
      verify,
      1,
    );

    expect(user).toEqual({ ...sessionUser, id: '1' });
    expect(verify).toHaveBeenCalledWith({ email: 'ana@x.com', password: 'p' }, '10.0.0.1');
  });

  it('credenciais inválidas → null', async () => {
    const verify = vi.fn().mockResolvedValue({ ok: false, reason: 'invalid' });

    expect(
      await authorizeCredentials({ email: 'ana@x.com', password: 'p' }, request(), verify, 1),
    ).toBeNull();
  });

  it('rate limit → lança RateLimitedSignin', async () => {
    const verify = vi.fn().mockResolvedValue({ ok: false, reason: 'rate_limited' });

    await expect(
      authorizeCredentials({ email: 'ana@x.com', password: 'p' }, request(), verify, 1),
    ).rejects.toBeInstanceOf(RateLimitedSignin);
  });
});

describe('jwtCallback', () => {
  let db: AppDatabase;
  const NOW = 1_000_000_000_000;

  beforeEach(() => {
    db = createDatabase(':memory:');
    migrateDatabase(db);
    db.insert(users)
      .values({ id: 1, name: 'Ana Nova', email: 'ana@x.com', passwordHash: 'h', role: 'viewer' })
      .run();
  });

  it('no login grava sub, role, sessionVersion e loginAt', async () => {
    const token = await jwtCallback(db, { token: {}, user: { ...sessionUser, id: '1' } }, NOW);

    expect(token).toMatchObject({ sub: '1', role: 'admin', sessionVersion: 1, loginAt: NOW });
  });

  it('nas leituras seguintes atualiza nome e perfil a partir do banco', async () => {
    const token = { sub: '1', role: 'admin', sessionVersion: 1, loginAt: NOW } as const;

    expect(await jwtCallback(db, { token }, NOW + 1000)).toMatchObject({
      name: 'Ana Nova',
      role: 'viewer',
    });
  });

  it('versão divergente → null', async () => {
    const token = { sub: '1', role: 'viewer', sessionVersion: 2, loginAt: NOW } as const;

    expect(await jwtCallback(db, { token }, NOW)).toBeNull();
  });

  it('passadas 8 h do login → null, mesmo com uso contínuo', async () => {
    const token = { sub: '1', role: 'viewer', sessionVersion: 1, loginAt: NOW } as const;

    expect(await jwtCallback(db, { token }, NOW + SESSION_MAX_AGE_S * 1000)).toBeNull();
  });

  it('token sem loginAt → null', async () => {
    expect(await jwtCallback(db, { token: { sub: '1', sessionVersion: 1 } }, NOW)).toBeNull();
  });
});

describe('sessionCallback', () => {
  it('copia id, role e sessionVersion do token para session.user', () => {
    const session = { user: { name: 'Ana', email: 'ana@x.com' }, expires: '' };
    const token = { sub: '1', role: 'admin', sessionVersion: 3 } as const;

    expect(sessionCallback({ session, token }).user).toMatchObject({
      id: '1',
      role: 'admin',
      sessionVersion: 3,
    });
  });
});
