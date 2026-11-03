import { and, eq, gte, lt, sql, type SQL } from 'drizzle-orm';
import { bucketKeys, granularityFor } from '@/lib/granularity';
import { toUtcRange } from '@/lib/period';
import type {
  CategoryRevenue,
  Granularity,
  ProductRank,
  RevenuePoint,
  SalesMetrics,
} from '@/types/metrics';
import type { Period } from '@/types/period';
import type { AppDatabase } from '../../db/client';
import { categories, orderItems, orders, products } from '../../db/schema';

const TOP_LIMIT = 10;

// Chave do bucket no fuso da loja (UTC-3 fixo, ver src/lib/dates.ts): dia local,
// segunda-feira da semana ('weekday 0' avança ao domingo; −6 dias volta à segunda) ou dia 1.
const BUCKET_KEY: Record<Granularity, SQL> = {
  day: sql`date(${orders.createdAt}, '-3 hours')`,
  week: sql`date(${orders.createdAt}, '-3 hours', 'weekday 0', '-6 days')`,
  month: sql`date(${orders.createdAt}, '-3 hours', 'start of month')`,
};

function paidInPeriod(period: Period) {
  const { start, end } = toUtcRange(period);
  return and(eq(orders.status, 'paid'), gte(orders.createdAt, start), lt(orders.createdAt, end));
}

function revenueSeries(db: AppDatabase, period: Period, granularity: Granularity) {
  const bucket = BUCKET_KEY[granularity];
  const rows = db
    .select({
      bucket: sql<string>`${bucket}`,
      revenueCents: sql<number>`sum(${orders.totalCents})`,
      orders: sql<number>`count(*)`,
    })
    .from(orders)
    .where(paidInPeriod(period))
    .groupBy(bucket)
    .all();
  const byBucket = new Map(rows.map((row) => [row.bucket, row]));
  return bucketKeys(period, granularity).map(
    (key): RevenuePoint => byBucket.get(key) ?? { bucket: key, revenueCents: 0, orders: 0 },
  );
}

type ProductSales = ProductRank & { categoryId: number; categoryName: string };

function productSales(db: AppDatabase, period: Period): ProductSales[] {
  return db
    .select({
      productId: products.id,
      name: products.name,
      categoryId: categories.id,
      categoryName: categories.name,
      revenueCents: sql<number>`sum(${orderItems.quantity} * ${orderItems.unitPriceCents})`,
      quantity: sql<number>`sum(${orderItems.quantity})`,
    })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(paidInPeriod(period))
    .groupBy(products.id)
    .all();
}

const byName = (a: ProductRank, b: ProductRank) => a.name.localeCompare(b.name, 'pt-BR');

function top(rows: ProductSales[], key: 'revenueCents' | 'quantity'): ProductRank[] {
  return [...rows]
    .sort((a, b) => b[key] - a[key] || byName(a, b))
    .slice(0, TOP_LIMIT)
    .map(({ productId, name, revenueCents, quantity }) => ({
      productId,
      name,
      revenueCents,
      quantity,
    }));
}

function categoryRevenue(rows: ProductSales[]): CategoryRevenue[] {
  const totals = new Map<number, CategoryRevenue>();
  for (const { categoryId, categoryName, revenueCents } of rows) {
    const current = totals.get(categoryId) ?? { categoryId, name: categoryName, revenueCents: 0 };
    totals.set(categoryId, { ...current, revenueCents: current.revenueCents + revenueCents });
  }
  return [...totals.values()].sort((a, b) => a.categoryId - b.categoryId);
}

/** Receita ao longo do tempo, top 10 produtos e receita por categoria (só pedidos pagos). */
export function getSalesMetrics(db: AppDatabase, period: Period): SalesMetrics {
  const granularity = granularityFor(period);
  const revenue = revenueSeries(db, period, granularity);
  const perProduct = productSales(db, period);
  return {
    period,
    granularity,
    revenue,
    topByRevenue: top(perProduct, 'revenueCents'),
    topByQuantity: top(perProduct, 'quantity'),
    byCategory: categoryRevenue(perProduct),
    hasData: perProduct.length > 0,
  };
}
