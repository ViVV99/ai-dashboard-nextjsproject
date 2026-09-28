import { hash } from '@node-rs/argon2';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import type { UserStatus } from '../../../types/domain';
import type { AppDatabase } from '../client';
import {
  auditLogs,
  categories,
  customers,
  orderItems,
  orders,
  pageViews,
  products,
  purchases,
  users,
} from '../schema';
import { generateDataset, type Dataset, type DatasetOptions } from './generate';
import { createRandom } from './random';

export type SeedOptions = DatasetOptions & {
  seed: number;
  admin: { name: string; email: string; password: string };
  viewerPassword?: string | undefined;
};

export type SeedSummary = Record<keyof Dataset | 'users', number>;

type Transaction = Parameters<Parameters<AppDatabase['transaction']>[0]>[0];
type UserRow = typeof users.$inferInsert;

const CHUNK_SIZE = 500;

const DEMO_VIEWERS: readonly { name: string; email: string; status: UserStatus }[] = [
  { name: 'Viewer Um', email: 'viewer1@exemplo.com', status: 'active' },
  { name: 'Viewer Dois', email: 'viewer2@exemplo.com', status: 'active' },
  { name: 'Viewer Bloqueado', email: 'viewer3@exemplo.com', status: 'blocked' },
];

// Ordem de limpeza respeita as FKs: filhos antes dos pais.
const TABLES_TO_CLEAR = [
  auditLogs,
  orderItems,
  orders,
  purchases,
  pageViews,
  products,
  categories,
  customers,
  users,
] as const;

const normalizeEmail = (email: string) => email.trim().toLowerCase();

async function buildUsers(options: SeedOptions): Promise<UserRow[]> {
  const admin: UserRow = {
    id: 1,
    name: options.admin.name,
    email: normalizeEmail(options.admin.email),
    passwordHash: await hash(options.admin.password),
    role: 'admin',
    status: 'active',
  };
  const { viewerPassword } = options;
  if (!viewerPassword) return [admin];

  const viewers = await Promise.all(
    DEMO_VIEWERS.map(async (viewer, index) => ({
      ...viewer,
      id: index + 2,
      passwordHash: await hash(viewerPassword),
      role: 'viewer' as const,
    })),
  );
  return [admin, ...viewers];
}

function insertInChunks<T extends SQLiteTable>(
  tx: Transaction,
  table: T,
  rows: T['$inferInsert'][],
) {
  for (let start = 0; start < rows.length; start += CHUNK_SIZE) {
    tx.insert(table)
      .values(rows.slice(start, start + CHUNK_SIZE))
      .run();
  }
}

/** Limpa e repopula o banco numa única transação: ou tudo entra, ou nada muda. */
export async function seedDatabase(db: AppDatabase, options: SeedOptions): Promise<SeedSummary> {
  // Hash (lento) e geração acontecem antes da transação para mantê-la curta.
  const userRows = await buildUsers(options);
  const data = generateDataset(createRandom(options.seed), options);

  db.transaction((tx) => {
    for (const table of TABLES_TO_CLEAR) tx.delete(table).run();
    insertInChunks(tx, users, userRows);
    insertInChunks(tx, categories, data.categories);
    insertInChunks(tx, products, data.products);
    insertInChunks(tx, customers, data.customers);
    insertInChunks(tx, orders, data.orders);
    insertInChunks(tx, orderItems, data.orderItems);
    insertInChunks(tx, purchases, data.purchases);
    insertInChunks(tx, pageViews, data.pageViews);
  });

  const counts = Object.fromEntries(
    Object.entries(data).map(([table, rows]) => [table, rows.length]),
  ) as Record<keyof Dataset, number>;
  return { ...counts, users: userRows.length };
}
