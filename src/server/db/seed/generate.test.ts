import { describe, expect, it } from 'vitest';
import { generateDataset } from './generate';
import { createRandom } from './random';

const PERIOD = { endDay: '2026-09-28', days: 30 };
const PERIOD_DAYS = new Set(
  Array.from({ length: 30 }, (_, i) =>
    new Date(Date.UTC(2026, 7, 30 + i)).toISOString().slice(0, 10),
  ),
);

/** Dia local (UTC-3) de um timestamp ISO — derivado à mão, sem o código testado. */
const localDay = (iso: string) =>
  new Date(Date.parse(iso) - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

const dataset = generateDataset(createRandom(20260928), PERIOD);

describe('generateDataset', () => {
  it('gera o mesmo dataset para a mesma seed', () => {
    expect(generateDataset(createRandom(20260928), PERIOD)).toEqual(dataset);
  });

  it('gera datasets diferentes para seeds diferentes', () => {
    expect(generateDataset(createRandom(1), PERIOD).orders).not.toEqual(dataset.orders);
  });

  it('o total do pedido é a soma dos itens', () => {
    for (const order of dataset.orders) {
      const items = dataset.orderItems.filter((item) => item.orderId === order.id);
      const sum = items.reduce((acc, item) => acc + item.quantity * item.unitPriceCents, 0);
      expect(items.length).toBeGreaterThan(0);
      expect(order.totalCents).toBe(sum);
    }
  });

  it('cerca de 90% dos pedidos estão pagos', () => {
    const paid = dataset.orders.filter((order) => order.status === 'paid').length;

    expect(paid / dataset.orders.length).toBeGreaterThan(0.85);
    expect(paid / dataset.orders.length).toBeLessThan(0.95);
  });

  it('o custo de cada produto fica entre 50% e 70% do preço', () => {
    for (const product of dataset.products) {
      expect(product.costCents).toBeGreaterThanOrEqual(Math.floor(product.priceCents * 0.5));
      expect(product.costCents).toBeLessThanOrEqual(Math.ceil(product.priceCents * 0.7));
    }
  });

  it('todas as datas de eventos caem dentro do período local', () => {
    const events = [...dataset.orders, ...dataset.purchases, ...dataset.pageViews];

    expect(events.length).toBeGreaterThan(0);
    for (const event of events) expect(PERIOD_DAYS.has(localDay(event.createdAt))).toBe(true);
  });

  it('acessos a páginas de produto têm product_id e path /produtos/{id}', () => {
    const productViews = dataset.pageViews.filter((view) => view.productId !== null);
    const otherViews = dataset.pageViews.filter((view) => view.productId === null);

    expect(productViews.length).toBeGreaterThan(0);
    expect(otherViews.length).toBeGreaterThan(0);
    for (const view of productViews) expect(view.path).toBe(`/produtos/${view.productId}`);
    for (const view of otherViews) expect(view.path).not.toMatch(/^\/produtos\/\d+$/);
  });

  it('todas as referências apontam para linhas existentes', () => {
    const ids = <T extends { id: number }>(rows: T[]) => new Set(rows.map((row) => row.id));
    const [orders, products, customers, categories] = [
      ids(dataset.orders),
      ids(dataset.products),
      ids(dataset.customers),
      ids(dataset.categories),
    ];

    expect(dataset.products.every((p) => categories.has(p.categoryId))).toBe(true);
    expect(dataset.orders.every((o) => customers.has(o.customerId))).toBe(true);
    expect(
      dataset.orderItems.every((i) => orders.has(i.orderId) && products.has(i.productId)),
    ).toBe(true);
    expect(dataset.purchases.every((p) => products.has(p.productId))).toBe(true);
  });
});
