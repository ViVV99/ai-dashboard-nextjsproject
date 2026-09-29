import { verify } from '@node-rs/argon2';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDatabase, migrateDatabase, type AppDatabase } from '../client';
import { seedDatabase, type SeedOptions } from './seed';

const OPTIONS: SeedOptions = {
  seed: 42,
  endDay: '2026-09-28',
  days: 7,
  admin: { name: 'Admin', email: 'admin@loja.com', password: 'senhaForte1' },
};

let db: AppDatabase;

const count = (table: string) =>
  (db.$client.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

const users = () =>
  db.$client.prepare('SELECT email, role, status, password_hash FROM users ORDER BY id').all() as {
    email: string;
    role: string;
    status: string;
    password_hash: string;
  }[];

beforeEach(() => {
  db = createDatabase(':memory:');
  migrateDatabase(db);
});

describe('seedDatabase', () => {
  it('é idempotente: rodar duas vezes gera as mesmas contagens', async () => {
    const first = await seedDatabase(db, OPTIONS);
    const second = await seedDatabase(db, OPTIONS);

    expect(first.orders).toBeGreaterThan(0);
    expect(second).toEqual(first);
    expect(count('orders')).toBe(first.orders);
    expect(count('page_views')).toBe(first.pageViews);
  });

  it('cria o admin com hash argon2 que verifica a senha', async () => {
    await seedDatabase(db, OPTIONS);
    const [admin] = users();

    expect(admin).toMatchObject({ email: 'admin@loja.com', role: 'admin', status: 'active' });
    expect(admin?.password_hash).toMatch(/^\$argon2id\$/);
    expect(await verify(admin?.password_hash ?? '', 'senhaForte1')).toBe(true);
  });

  it('normaliza o e-mail do admin (trim + minúsculas)', async () => {
    await seedDatabase(db, { ...OPTIONS, admin: { ...OPTIONS.admin, email: '  Admin@Loja.COM ' } });

    expect(users()[0]?.email).toBe('admin@loja.com');
  });

  it('só cria viewers quando há senha de viewer', async () => {
    await seedDatabase(db, OPTIONS);
    expect(users()).toHaveLength(1);

    await seedDatabase(db, { ...OPTIONS, viewerPassword: 'viewer123' });
    const viewers = users().filter((user) => user.role === 'viewer');

    expect(viewers).toHaveLength(3);
    expect(viewers.filter((viewer) => viewer.status === 'blocked')).toHaveLength(1);
  });

  it('falha no meio do seed sem apagar os dados anteriores (transação)', async () => {
    const before = await seedDatabase(db, OPTIONS);

    // Nome com 1 caractere viola o CHECK de users depois que as tabelas foram limpas.
    await expect(
      seedDatabase(db, { ...OPTIONS, admin: { ...OPTIONS.admin, name: 'A' } }),
    ).rejects.toThrow(/CHECK constraint failed/);
    expect(count('orders')).toBe(before.orders);
    expect(users()[0]?.email).toBe('admin@loja.com');
  });
});
