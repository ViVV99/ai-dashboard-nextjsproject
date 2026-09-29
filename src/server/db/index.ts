import { createDatabase, type AppDatabase } from './client';

// Uma conexão por processo; o cache em globalThis sobrevive ao HMR do `next dev`.
const globalForDb = globalThis as typeof globalThis & { appDb?: AppDatabase };

/** Banco da aplicação (DATABASE_URL, padrão ./data/app.db). Migrations: `yarn db:migrate`. */
export function getDb(): AppDatabase {
  globalForDb.appDb ??= createDatabase(process.env.DATABASE_URL || './data/app.db');
  return globalForDb.appDb;
}
