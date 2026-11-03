import { beforeEach, describe, expect, it } from 'vitest';
import type { OrderStatus } from '@/types/domain';
import { createDatabase, migrateDatabase, type AppDatabase } from '../../db/client';
import { categories, customers, orderItems, orders, products, purchases } from '../../db/schema';
import { getPurchasesMetrics } from './purchases';

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

function purchase(createdAt: string, productId: number, quantity: number, unitCostCents: number) {
  db.insert(purchases)
    .values({ productId, supplier: 'Fornecedor', quantity, unitCostCents, createdAt })
    .run();
}

beforeEach(() => {
  nextOrderId = 1;
  db = createDatabase(':memory:');
  migrateDatabase(db);
  db.insert(categories).values({ id: 1, name: 'Casa' }).run();
  // Custo atual do produto (CMV) difere do custo pago nas compras.
  db.insert(products)
    .values([
      { id: 1, categoryId: 1, name: 'Caneca', sku: 'SKU1', priceCents: 30_00, costCents: 12_00 },
      { id: 2, categoryId: 1, name: 'Prato', sku: 'SKU2', priceCents: 50_00, costCents: 20_00 },
    ])
    .run();
  db.insert(customers).values({ id: 1, name: 'C', email: 'c@x.com', city: 'SP' }).run();
});

describe('getPurchasesMetrics', () => {
  beforeEach(() => {
    purchase('2026-09-02T12:00:00.000Z', 1, 10, 11_00);
    purchase('2026-09-03T02:59:00.000Z', 2, 2, 19_00); // 02/09 23:59 local
    purchase('2026-09-04T15:00:00.000Z', 1, 1, 13_00);
    purchase('2026-09-02T02:59:00.000Z', 1, 99, 1_00); // 01/09 local → fora
    purchase('2026-09-05T03:00:00.000Z', 1, 99, 1_00); // 05/09 local → fora
    order('2026-09-02T12:00:00.000Z', [[1, 2, 30_00]]);
    order('2026-09-04T15:00:00.000Z', [
      [1, 1, 25_00],
      [2, 1, 50_00],
    ]);
    order('2026-09-03T15:00:00.000Z', [[2, 9, 50_00]], 'canceled');
    order('2026-09-04T16:00:00.000Z', [[2, 9, 50_00]], 'refunded');
  });

  it('compras, receita e CMV por dia local, com zero nos dias vazios', () => {
    expect(getPurchasesMetrics(db, period)).toMatchObject({
      granularity: 'day',
      series: [
        { bucket: '2026-09-02', purchaseCents: 148_00, revenueCents: 60_00, cogsCents: 24_00 },
        { bucket: '2026-09-03', purchaseCents: 0, revenueCents: 0, cogsCents: 0 },
        { bucket: '2026-09-04', purchaseCents: 13_00, revenueCents: 75_00, cogsCents: 32_00 },
      ],
      hasData: true,
    });
  });

  it('resumo soma a série e calcula a margem bruta', () => {
    expect(getPurchasesMetrics(db, period).summary).toEqual({
      purchaseCents: 161_00,
      revenueCents: 135_00,
      cogsCents: 56_00,
      grossMargin: (135_00 - 56_00) / 135_00,
    });
  });
});

describe('getPurchasesMetrics — sem vendas', () => {
  it('só compras: margem null, receita e CMV zerados, hasData verdadeiro', () => {
    purchase('2026-09-03T12:00:00.000Z', 1, 1, 10_00);
    order('2026-09-03T15:00:00.000Z', [[1, 1, 30_00]], 'canceled');

    const result = getPurchasesMetrics(db, period);

    expect(result.summary).toEqual({
      purchaseCents: 10_00,
      revenueCents: 0,
      cogsCents: 0,
      grossMargin: null,
    });
    expect(result.hasData).toBe(true);
  });

  it('nada no período: série zerada e hasData falso', () => {
    const result = getPurchasesMetrics(db, period);

    expect(result.series.map((p) => p.purchaseCents + p.revenueCents + p.cogsCents)).toEqual([
      0, 0, 0,
    ]);
    expect(result.hasData).toBe(false);
  });

  it('mês: compra às 02:00Z do dia 1 cai no mês anterior', () => {
    purchase('2026-03-01T02:00:00.000Z', 1, 1, 10_00); // 28/02 local

    const { granularity, series } = getPurchasesMetrics(db, {
      from: '2025-10-01',
      to: '2026-09-30',
    });

    expect(granularity).toBe('month');
    expect(series).toHaveLength(12);
    expect(series.find((p) => p.bucket === '2026-02-01')?.purchaseCents).toBe(10_00);
  });
});
