import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { bucketKeys, granularityFor } from '@/lib/granularity';
import { ratio } from '@/lib/kpi-math';
import { toUtcRange } from '@/lib/period';
import type {
  Granularity,
  PurchasesMetrics,
  PurchasesPoint,
  PurchasesSummary,
} from '@/types/metrics';
import type { Period } from '@/types/period';
import type { AppDatabase } from '../../db/client';
import { orderItems, orders, products, purchases } from '../../db/schema';
import { bucketKey } from './buckets';
import { paidInPeriod } from './sales';

function purchaseCost(db: AppDatabase, period: Period, granularity: Granularity) {
  const { start, end } = toUtcRange(period);
  const bucket = bucketKey(purchases.createdAt, granularity);
  return db
    .select({
      bucket,
      purchaseCents: sql<number>`sum(${purchases.quantity} * ${purchases.unitCostCents})`,
    })
    .from(purchases)
    .where(and(gte(purchases.createdAt, start), lt(purchases.createdAt, end)))
    .groupBy(bucket)
    .all();
}

// Receita e CMV dos itens de pedidos pagos; o CMV usa o custo atual do produto (spec).
function revenueAndCogs(db: AppDatabase, period: Period, granularity: Granularity) {
  const bucket = bucketKey(orders.createdAt, granularity);
  return db
    .select({
      bucket,
      revenueCents: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitPriceCents})`,
      cogsCents: sql<number>`sum(${orderItems.quantity} * ${products.costCents})`,
    })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(paidInPeriod(period))
    .groupBy(bucket)
    .all();
}

const byBucket = <T extends { bucket: string }>(rows: T[]) =>
  new Map(rows.map((row) => [row.bucket, row]));

function summarize(series: PurchasesPoint[]): PurchasesSummary {
  const sum = (key: 'purchaseCents' | 'revenueCents' | 'cogsCents') =>
    series.reduce((total, point) => total + point[key], 0);
  const revenueCents = sum('revenueCents');
  const cogsCents = sum('cogsCents');
  return {
    purchaseCents: sum('purchaseCents'),
    revenueCents,
    cogsCents,
    grossMargin: ratio(revenueCents - cogsCents, revenueCents),
  };
}

/** Custo de compras, receita × CMV e margem bruta do período (vendas só de pedidos pagos). */
export function getPurchasesMetrics(db: AppDatabase, period: Period): PurchasesMetrics {
  const granularity = granularityFor(period);
  const cost = purchaseCost(db, period, granularity);
  const sales = revenueAndCogs(db, period, granularity);
  const costBy = byBucket(cost);
  const salesBy = byBucket(sales);
  const series = bucketKeys(period, granularity).map((bucket): PurchasesPoint => ({
    bucket,
    purchaseCents: costBy.get(bucket)?.purchaseCents ?? 0,
    revenueCents: salesBy.get(bucket)?.revenueCents ?? 0,
    cogsCents: salesBy.get(bucket)?.cogsCents ?? 0,
  }));
  return {
    period,
    granularity,
    series,
    summary: summarize(series),
    hasData: cost.length > 0 || sales.length > 0,
  };
}
