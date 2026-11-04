import type { AppDatabase } from '../../db/client';

/** Banco ou transação em andamento: services que escrevem em conjunto aceitam os dois. */
export type DbExecutor = AppDatabase | Parameters<Parameters<AppDatabase['transaction']>[0]>[0];
