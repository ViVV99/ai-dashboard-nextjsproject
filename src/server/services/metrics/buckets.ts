import { sql, type SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { bucketKeys } from '@/lib/granularity';
import type { Granularity } from '@/types/metrics';
import type { Period } from '@/types/period';

// Chave do bucket no fuso da loja (UTC-3 fixo, ver src/lib/dates.ts): dia local,
// segunda-feira da semana ('weekday 0' avança ao domingo; −6 dias volta à segunda) ou dia 1.
const MODIFIERS: Record<Granularity, SQL> = {
  day: sql`'-3 hours'`,
  week: sql`'-3 hours', 'weekday 0', '-6 days'`,
  month: sql`'-3 hours', 'start of month'`,
};

/** Expressão SQL da chave do bucket (YYYY-MM-DD) para uma coluna `created_at` em UTC. */
export function bucketKey(column: SQLiteColumn, granularity: Granularity): SQL<string> {
  return sql<string>`date(${column}, ${MODIFIERS[granularity]})`;
}

/** Um item por bucket do período, em ordem; `empty` preenche os buckets sem linha. */
export function fillBuckets<T extends { bucket: string }>(
  period: Period,
  granularity: Granularity,
  rows: T[],
  empty: (bucket: string) => T,
): T[] {
  const byBucket = new Map(rows.map((row) => [row.bucket, row]));
  return bucketKeys(period, granularity).map((key) => byBucket.get(key) ?? empty(key));
}
