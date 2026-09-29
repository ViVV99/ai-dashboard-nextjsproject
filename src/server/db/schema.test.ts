import { beforeEach, describe, expect, it } from 'vitest';
import { createDatabase, migrateDatabase, type AppDatabase } from './client';

// As constraints vivem no banco, então os testes usam SQL cru: é o que protege
// os dados mesmo quando alguém escreve fora da camada tipada do Drizzle.
let db: AppDatabase;

const exec = (statement: string, ...params: unknown[]) =>
  db.$client.prepare(statement).run(...params);

const insertUser = (email: string, role = 'viewer') =>
  exec(
    `INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, 'hash', ?, 'active')`,
    'Ana',
    email,
    role,
  );

const insertCatalog = () => {
  exec(`INSERT INTO categories (id, name) VALUES (1, 'Livros')`);
  exec(
    `INSERT INTO products (id, category_id, name, sku, price_cents, cost_cents)
     VALUES (1, 1, 'Clean Code', 'SKU-1', 8990, 5000)`,
  );
  exec(`INSERT INTO customers (id, name, email, city) VALUES (1, 'Ana', 'a@x.com', 'Recife')`);
};

const insertOrder = (status = 'paid') =>
  exec(
    `INSERT INTO orders (id, customer_id, status, total_cents, created_at)
     VALUES (1, 1, ?, 8990, '2026-09-28T12:00:00.000Z')`,
    status,
  );

beforeEach(() => {
  db = createDatabase(':memory:');
  migrateDatabase(db);
});

describe('schema', () => {
  it('aceita um pedido completo e válido', () => {
    insertUser('ana@x.com');
    insertCatalog();
    insertOrder();
    exec(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents) VALUES (1, 1, 1, 8990)`,
    );

    expect(db.$client.prepare('SELECT COUNT(*) AS n FROM order_items').get()).toEqual({ n: 1 });
  });

  it('rejeita role fora de ROLES', () => {
    expect(() => insertUser('ana@x.com', 'superadmin')).toThrow(/CHECK constraint failed/);
  });

  it('rejeita e-mail duplicado', () => {
    insertUser('ana@x.com');

    expect(() => insertUser('ana@x.com')).toThrow(/UNIQUE constraint failed: users.email/);
  });

  it('rejeita status de pedido inválido', () => {
    insertCatalog();

    expect(() => insertOrder('shipped')).toThrow(/CHECK constraint failed/);
  });

  it('rejeita quantidade menor ou igual a zero', () => {
    insertCatalog();
    insertOrder();

    expect(() =>
      exec(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents) VALUES (1, 1, 0, 8990)`,
      ),
    ).toThrow(/CHECK constraint failed/);
  });

  it('rejeita preço negativo', () => {
    exec(`INSERT INTO categories (id, name) VALUES (1, 'Livros')`);

    expect(() =>
      exec(
        `INSERT INTO products (category_id, name, sku, price_cents, cost_cents)
         VALUES (1, 'X', 'SKU-X', -1, 0)`,
      ),
    ).toThrow(/CHECK constraint failed/);
  });

  it('rejeita item com pedido inexistente (FK)', () => {
    insertCatalog();

    expect(() =>
      exec(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents) VALUES (99, 1, 1, 8990)`,
      ),
    ).toThrow(/FOREIGN KEY constraint failed/);
  });
});
