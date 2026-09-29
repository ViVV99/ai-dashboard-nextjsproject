import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { ratio, variation } from '@/lib/kpi-math';
import { previousPeriod, toUtcRange } from '@/lib/period';
import type { Kpi, KpiFormat, KpiId, OverviewMetrics } from '@/types/metrics';
import type { Period } from '@/types/period';
import type { AppDatabase } from '../../db/client';
import { orders, pageViews } from '../../db/schema';

type Totals = { revenueCents: number; orders: number; pageViews: number; visitors: number };
type Window = { start: string; split: string; end: string };

/** Agregação sem GROUP BY sempre devolve uma linha; o tipo do Drizzle admite `undefined`. */
function single<T>(row: T | undefined): T {
  if (row === undefined) throw new Error('Consulta agregada não retornou linha.');
  return row;
}

// Os dois períodos são contíguos: uma varredura por tabela (índice em created_at) com
// agregação condicional — antes de `split` é o anterior, a partir dele é o atual.
function orderTotals(db: AppDatabase, { start, split, end }: Window) {
  const current = sql`${orders.createdAt} >= ${split}`;
  return db
    .select({
      revenue: sql<number>`coalesce(sum(case when ${current} then ${orders.totalCents} end), 0)`,
      count: sql<number>`count(case when ${current} then 1 end)`,
      prevRevenue: sql<number>`coalesce(sum(case when not ${current} then ${orders.totalCents} end), 0)`,
      prevCount: sql<number>`count(case when not ${current} then 1 end)`,
    })
    .from(orders)
    .where(and(eq(orders.status, 'paid'), gte(orders.createdAt, start), lt(orders.createdAt, end)))
    .get();
}

function accessTotals(db: AppDatabase, { start, split, end }: Window) {
  const current = sql`${pageViews.createdAt} >= ${split}`;
  return db
    .select({
      views: sql<number>`count(case when ${current} then 1 end)`,
      visitors: sql<number>`count(distinct case when ${current} then ${pageViews.sessionId} end)`,
      prevViews: sql<number>`count(case when not ${current} then 1 end)`,
      prevVisitors: sql<number>`count(distinct case when not ${current} then ${pageViews.sessionId} end)`,
    })
    .from(pageViews)
    .where(and(gte(pageViews.createdAt, start), lt(pageViews.createdAt, end)))
    .get();
}

const kpi = (
  id: KpiId,
  label: string,
  format: KpiFormat,
  value: number | null,
  previous: number | null,
  hint?: string,
): Kpi => ({ id, label, format, value, previous, variation: variation(value, previous), hint });

function buildKpis(current: Totals, previous: Totals): Kpi[] {
  const ticket = (t: Totals) => ratio(t.revenueCents, t.orders);
  const conversion = (t: Totals) => ratio(t.orders, t.visitors);
  return [
    kpi('revenue', 'Receita', 'currency', current.revenueCents, previous.revenueCents),
    kpi('orders', 'Pedidos', 'integer', current.orders, previous.orders),
    kpi('averageTicket', 'Ticket médio', 'currency', ticket(current), ticket(previous)),
    kpi('pageViews', 'Acessos', 'integer', current.pageViews, previous.pageViews),
    kpi('visitors', 'Visitantes únicos', 'integer', current.visitors, previous.visitors),
    kpi(
      'conversion',
      'Taxa de conversão',
      'percent',
      conversion(current),
      conversion(previous),
      'Aproximação: pedidos pagos ÷ visitantes únicos.',
    ),
  ];
}

/** KPIs da visão geral do período, com variação vs. o período anterior de mesma duração. */
export function getOverviewMetrics(db: AppDatabase, period: Period): OverviewMetrics {
  const previous = previousPeriod(period);
  const range = toUtcRange(period);
  const window = { start: toUtcRange(previous).start, split: range.start, end: range.end };
  const o = single(orderTotals(db, window));
  const a = single(accessTotals(db, window));
  const current = {
    revenueCents: o.revenue,
    orders: o.count,
    pageViews: a.views,
    visitors: a.visitors,
  };
  const before = {
    revenueCents: o.prevRevenue,
    orders: o.prevCount,
    pageViews: a.prevViews,
    visitors: a.prevVisitors,
  };
  return {
    period,
    previousPeriod: previous,
    kpis: buildKpis(current, before),
    hasData: current.orders > 0 || current.pageViews > 0,
  };
}
