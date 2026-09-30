import { beforeEach, describe, expect, it } from 'vitest';
import type { OrderStatus } from '@/types/domain';
import { createDatabase, migrateDatabase, type AppDatabase } from '../../db/client';
import { categories, customers, orderItems, orders, products } from '../../db/schema';
import { getSalesMetrics } from './sales';

// 02–04/09 (UTC [02 03:00Z, 05 03:00Z)) → granularidade diária.
const period = { from: '2026-09-02', to: '2026-09-04' };
let db: AppDatabase;
let nextOrderId = 1;

type Item = [productId: number, quantity: number, unitPriceCents: number];

function order(createdAt: string, items: Item[], status: OrderStatus = 'paid') {
  const id = nextOrderId++;
  const totalCents = items.reduce((sum, [, qty, price]) => sum + qty * price, 0);
  db.insert(orders).values({ id, customerId: 1, status, totalCents, createdAt }).run();
  for (const [productId, quantity, unitPriceCents] of items) {
    db.insert(orderItems).values({ orderId: id, productId, quantity, unitPriceCents }).run();
  }
}

function product(id: number, categoryId: number, name: string) {
  db.insert(products)
    .values({ id, categoryId, name, sku: `SKU${id}`, priceCents: 1, costCents: 1 })
    .run();
}

beforeEach(() => {
  nextOrderId = 1;
  db = createDatabase(':memory:');
  migrateDatabase(db);
  db.insert(categories)
    .values([
      { id: 1, name: 'Eletrônicos' },
      { id: 2, name: 'Casa' },
      { id: 3, name: 'Livros' },
    ])
    .run();
  product(1, 1, 'Fone');
  product(2, 2, 'Caneca');
  product(3, 1, 'Cabo');
  db.insert(customers).values({ id: 1, name: 'C', email: 'c@x.com', city: 'SP' }).run();
});

describe('getSalesMetrics', () => {
  beforeEach(() => {
    order('2026-09-02T12:00:00.000Z', [[1, 1, 100_00]]);
    order('2026-09-03T02:59:00.000Z', [[2, 5, 10_00]]); // 02/09 23:59 local
    order('2026-09-04T15:00:00.000Z', [
      [1, 1, 80_00],
      [3, 2, 5_00],
    ]); // preço de venda varia
    order('2026-09-02T02:59:00.000Z', [[3, 9, 1_00]]); // 01/09 local → fora
    order('2026-09-05T03:00:00.000Z', [[3, 9, 1_00]]); // 05/09 local → fora
    order('2026-09-03T15:00:00.000Z', [[2, 50, 10_00]], 'canceled');
    order('2026-09-04T16:00:00.000Z', [[3, 50, 10_00]], 'refunded');
  });

  it('receita por dia local, com zero nos dias sem venda', () => {
    expect(getSalesMetrics(db, period)).toMatchObject({
      granularity: 'day',
      revenue: [
        { bucket: '2026-09-02', revenueCents: 150_00, orders: 2 },
        { bucket: '2026-09-03', revenueCents: 0, orders: 0 },
        { bucket: '2026-09-04', revenueCents: 90_00, orders: 1 },
      ],
      hasData: true,
    });
  });

  it('top produtos por receita e por quantidade, só pedidos pagos', () => {
    const result = getSalesMetrics(db, period);

    expect(result.topByRevenue).toEqual([
      { productId: 1, name: 'Fone', revenueCents: 180_00, quantity: 2 },
      { productId: 2, name: 'Caneca', revenueCents: 50_00, quantity: 5 },
      { productId: 3, name: 'Cabo', revenueCents: 10_00, quantity: 2 },
    ]);
    expect(result.topByQuantity.map((p) => p.name)).toEqual(['Caneca', 'Cabo', 'Fone']);
  });

  it('receita por categoria, ordenada por id e sem categorias sem venda', () => {
    expect(getSalesMetrics(db, period).byCategory).toEqual([
      { categoryId: 1, name: 'Eletrônicos', revenueCents: 190_00 },
      { categoryId: 2, name: 'Casa', revenueCents: 50_00 },
    ]);
  });
});

describe('getSalesMetrics — agrupamento e limites', () => {
  it('semana: bucket parcial usa a segunda-feira anterior a `from`', () => {
    const long = { from: '2026-08-05', to: '2026-09-06' }; // 33 dias; 05/08 é quarta
    order('2026-08-05T12:00:00.000Z', [[1, 1, 10_00]]);
    order('2026-08-10T02:00:00.000Z', [[1, 1, 7_00]]); // domingo 09/08 local

    const { granularity, revenue } = getSalesMetrics(db, long);

    expect(granularity).toBe('week');
    expect(revenue[0]).toEqual({ bucket: '2026-08-03', revenueCents: 17_00, orders: 2 });
    expect(revenue).toHaveLength(5);
  });

  it('mês: chave é o dia 1', () => {
    const year = { from: '2025-10-01', to: '2026-09-30' };
    order('2026-03-01T02:00:00.000Z', [[1, 1, 10_00]]); // 28/02 local

    const { granularity, revenue } = getSalesMetrics(db, year);

    expect(granularity).toBe('month');
    expect(revenue).toHaveLength(12);
    expect(revenue.find((p) => p.bucket === '2026-02-01')?.revenueCents).toBe(10_00);
  });

  it('top 10: limita e desempata pelo nome', () => {
    for (let id = 10; id < 22; id++) product(id, 3, `Item ${String(id).padStart(2, '0')}`);
    for (let id = 10; id < 22; id++) order('2026-09-02T12:00:00.000Z', [[id, 1, 5_00]]);

    const top = getSalesMetrics(db, period).topByRevenue;

    expect(top).toHaveLength(10);
    expect(top[0].name).toBe('Item 10');
    expect(top[9].name).toBe('Item 19');
  });

  it('sem vendas: série zerada, listas vazias e hasData falso', () => {
    order('2026-09-03T15:00:00.000Z', [[1, 1, 10_00]], 'canceled');

    const result = getSalesMetrics(db, period);

    expect(result.revenue.map((p) => p.revenueCents)).toEqual([0, 0, 0]);
    expect(result).toMatchObject({
      topByRevenue: [],
      topByQuantity: [],
      byCategory: [],
      hasData: false,
    });
  });
});
