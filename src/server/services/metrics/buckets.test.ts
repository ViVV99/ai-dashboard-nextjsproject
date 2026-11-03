import { beforeEach, describe, expect, it } from 'vitest';
import type { Granularity } from '@/types/metrics';
import { createDatabase, migrateDatabase, type AppDatabase } from '../../db/client';
import { categories, products, purchases } from '../../db/schema';
import { bucketKey, fillBuckets } from './buckets';

let db: AppDatabase;

beforeEach(() => {
  db = createDatabase(':memory:');
  migrateDatabase(db);
  db.insert(categories).values({ id: 1, name: 'Casa' }).run();
  db.insert(products)
    .values({ id: 1, categoryId: 1, name: 'Caneca', sku: 'SKU1', priceCents: 1, costCents: 1 })
    .run();
});

function keyOf(createdAt: string, granularity: Granularity) {
  db.delete(purchases).run();
  db.insert(purchases)
    .values({ productId: 1, supplier: 'F', quantity: 1, unitCostCents: 1, createdAt })
    .run();
  const rows = db
    .select({ key: bucketKey(purchases.createdAt, granularity) })
    .from(purchases)
    .all();
  return rows[0]?.key;
}

describe('bucketKey', () => {
  it('dia local da loja: 02:59Z ainda é o dia anterior', () => {
    expect(keyOf('2026-09-03T02:59:00.000Z', 'day')).toBe('2026-09-02');
    expect(keyOf('2026-09-03T03:00:00.000Z', 'day')).toBe('2026-09-03');
  });

  it('semana usa a segunda-feira (domingo local volta 6 dias)', () => {
    expect(keyOf('2026-09-07T02:59:00.000Z', 'week')).toBe('2026-08-31'); // dom 06/09 local
    expect(keyOf('2026-09-07T03:00:00.000Z', 'week')).toBe('2026-09-07'); // seg 07/09 local
  });

  it('mês usa o dia 1 do mês local', () => {
    expect(keyOf('2026-10-01T02:59:00.000Z', 'month')).toBe('2026-09-01');
  });
});

describe('fillBuckets', () => {
  it('um item por bucket do período, na ordem, com o vazio onde faltou dado', () => {
    const rows = [{ bucket: '2026-09-03', total: 5 }];

    expect(
      fillBuckets({ from: '2026-09-02', to: '2026-09-04' }, 'day', rows, (bucket) => ({
        bucket,
        total: 0,
      })),
    ).toEqual([
      { bucket: '2026-09-02', total: 0 },
      { bucket: '2026-09-03', total: 5 },
      { bucket: '2026-09-04', total: 0 },
    ]);
  });
});
