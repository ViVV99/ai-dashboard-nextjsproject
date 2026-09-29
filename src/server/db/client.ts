import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';

export type AppDatabase = BetterSQLite3Database<typeof schema> & {
  $client: Database.Database;
};

const MIGRATIONS_FOLDER = path.join(process.cwd(), 'drizzle');

/** Abre o SQLite em `url` (arquivo ou `:memory:`) com FKs ligadas. */
export function createDatabase(url: string): AppDatabase {
  const inMemory = url === ':memory:';
  if (!inMemory) mkdirSync(path.dirname(url), { recursive: true });

  const sqlite = new Database(url);
  sqlite.pragma('foreign_keys = ON');
  if (!inMemory) sqlite.pragma('journal_mode = WAL');

  return drizzle({ client: sqlite, schema });
}

export function migrateDatabase(db: AppDatabase): void {
  migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}
