import { beforeEach, describe, expect, it } from 'vitest';
import type { OrderStatus } from '@/types/domain';
import type { Kpi, KpiId } from '@/types/metrics';
import { createDatabase, migrateDatabase, type AppDatabase } from '../../db/client';
import { categories, customers, orders, pageViews, products } from '../../db/schema';
import { getOverviewMetrics } from './overview';

// Atual: 02–03/09 (UTC [02 03:00Z, 04 03:00Z)); anterior: 31/08–01/09.
const period = { from: '2026-09-02', to: '2026-09-03' };
let db: AppDatabase;

function order(totalCents: number, createdAt: string, status: OrderStatus = 'paid') {
  db.insert(orders).values({ customerId: 1, status, totalCents, createdAt }).run();
}

function view(sessionId: string, createdAt: string) {
  db.insert(pageViews).values({ path: '/', source: 'direct', sessionId, createdAt }).run();
}

const kpi = (id: KpiId) =>
  getOverviewMetrics(db, period).kpis.find((item) => item.id === id) as Kpi;

beforeEach(() => {
  db = createDatabase(':memory:');
  migrateDatabase(db);
  db.insert(categories).values({ id: 1, name: 'Geral' }).run();
  db.insert(products)
    .values({ id: 1, categoryId: 1, name: 'P', sku: 'P1', priceCents: 1000, costCents: 500 })
    .run();
  db.insert(customers).values({ id: 1, name: 'C', email: 'c@x.com', city: 'SP' }).run();
});

describe('getOverviewMetrics', () => {
  beforeEach(() => {
    order(100_00, '2026-09-02T12:00:00.000Z'); // atual
    order(50_00, '2026-09-04T02:59:00.000Z'); // 03/09 23:59 local → atual
    order(30_00, '2026-09-02T02:59:00.000Z'); // 01/09 23:59 local → anterior
    order(70_00, '2026-08-31T10:00:00.000Z'); // anterior
    order(10_00, '2026-09-04T03:00:00.000Z'); // 04/09 local → fora
    order(999_00, '2026-09-02T15:00:00.000Z', 'canceled');
    order(888_00, '2026-09-03T15:00:00.000Z', 'refunded');

    view('s1', '2026-09-02T10:00:00.000Z');
    view('s1', '2026-09-03T10:00:00.000Z');
    view('s2', '2026-09-02T11:00:00.000Z');
    view('s3', '2026-09-04T02:00:00.000Z');
    view('s1', '2026-09-01T10:00:00.000Z'); // anterior (s1 também visitou no atual)
    view('s4', '2026-08-31T04:00:00.000Z');
    view('s9', '2026-08-31T02:59:00.000Z'); // 30/08 local → fora
  });

  it('devolve os KPIs na ordem da spec', () => {
    expect(getOverviewMetrics(db, period).kpis.map((item) => item.id)).toEqual([
      'revenue',
      'orders',
      'averageTicket',
      'pageViews',
      'visitors',
      'conversion',
    ]);
  });

  it('receita e pedidos: só pagos, respeitando o fuso da loja', () => {
    expect(kpi('revenue')).toMatchObject({ value: 150_00, previous: 100_00, variation: 0.5 });
    expect(kpi('orders')).toMatchObject({ value: 2, previous: 2, variation: 0 });
  });

  it('ticket médio = receita ÷ pedidos', () => {
    expect(kpi('averageTicket')).toMatchObject({ value: 75_00, previous: 50_00, variation: 0.5 });
  });

  it('visitante presente nos dois períodos conta uma vez em cada', () => {
    expect(kpi('pageViews')).toMatchObject({ value: 4, previous: 2, variation: 1 });
    expect(kpi('visitors')).toMatchObject({ value: 3, previous: 2, variation: 0.5 });
  });

  it('conversão = pedidos ÷ visitantes únicos', () => {
    const conversion = kpi('conversion');
    expect(conversion.value).toBeCloseTo(2 / 3);
    expect(conversion.previous).toBe(1);
    expect(conversion.variation).toBeCloseTo(-1 / 3);
  });

  it('informa os períodos comparados e que há dados', () => {
    expect(getOverviewMetrics(db, period)).toMatchObject({
      period,
      previousPeriod: { from: '2026-08-31', to: '2026-09-01' },
      hasData: true,
    });
  });
});

describe('getOverviewMetrics sem movimento', () => {
  it('sem linhas: zeros, razões nulas e hasData falso', () => {
    const result = getOverviewMetrics(db, period);

    expect(result.hasData).toBe(false);
    expect(kpi('revenue')).toMatchObject({ value: 0, previous: 0, variation: null });
    expect(kpi('averageTicket')).toMatchObject({ value: null, previous: null, variation: null });
    expect(kpi('conversion')).toMatchObject({ value: null, variation: null });
  });

  it('atual sem pedidos e anterior com pedidos → −100%', () => {
    order(40_00, '2026-08-31T12:00:00.000Z');

    expect(kpi('revenue')).toMatchObject({ value: 0, previous: 40_00, variation: -1 });
    expect(getOverviewMetrics(db, period).hasData).toBe(false);
  });
});
