import { and, gte, inArray, lt, sql } from 'drizzle-orm';
import { granularityFor } from '@/lib/granularity';
import { toUtcRange } from '@/lib/period';
import { TRAFFIC_SOURCES } from '@/types/domain';
import type {
  AccessMetrics,
  Granularity,
  PageRank,
  SourceViews,
  TrafficPoint,
} from '@/types/metrics';
import type { Period } from '@/types/period';
import type { AppDatabase } from '../../db/client';
import { pageViews, products } from '../../db/schema';
import { bucketKey, fillBuckets } from './buckets';

const TOP_LIMIT = 10;

const views = sql<number>`count(*)`;
const visitors = sql<number>`count(distinct ${pageViews.sessionId})`;

function inPeriod(period: Period) {
  const { start, end } = toUtcRange(period);
  return and(gte(pageViews.createdAt, start), lt(pageViews.createdAt, end));
}

function trafficSeries(db: AppDatabase, period: Period, granularity: Granularity) {
  const bucket = bucketKey(pageViews.createdAt, granularity);
  const rows = db
    .select({ bucket, views, visitors })
    .from(pageViews)
    .where(inPeriod(period))
    .groupBy(bucket)
    .all();
  return fillBuckets<TrafficPoint>(period, granularity, rows, (key) => ({
    bucket: key,
    views: 0,
    visitors: 0,
  }));
}

// Agrega por path antes do join (≤ 10 linhas) e força o índice (path, created_at, product_id):
// o planner escolheria o de created_at e ordenaria ~474 mil linhas em 366 dias.
// Páginas de produto levam o nome do produto; as demais, o próprio path.
function topPages(db: AppDatabase, period: Period): PageRank[] {
  return db.all<PageRank>(sql`
    select t.path as path, coalesce(${products.name}, t.path) as label, t.views as views
    from (
      select ${pageViews.path} as path, max(${pageViews.productId}) as product_id, count(*) as views
      from ${pageViews} indexed by page_views_path_idx
      where ${inPeriod(period)}
      group by ${pageViews.path}
      order by views desc, path
      limit ${TOP_LIMIT}
    ) as t
    left join ${products} on ${products.id} = t.product_id
    order by t.views desc, t.path`);
}

// `source in (...)` casa com o índice (source, created_at): 5 buscas por intervalo, sem ordenar.
function sourceViews(db: AppDatabase, period: Period): SourceViews[] {
  const rows = db
    .select({ source: pageViews.source, views })
    .from(pageViews)
    .where(and(inArray(pageViews.source, TRAFFIC_SOURCES), inPeriod(period)))
    .groupBy(pageViews.source)
    .all();
  const bySource = new Map(rows.map((row) => [row.source, row]));
  // Array.sort é estável: no empate vale a ordem de TRAFFIC_SOURCES.
  return TRAFFIC_SOURCES.map(
    (source): SourceViews => bySource.get(source) ?? { source, views: 0 },
  ).sort((a, b) => b.views - a.views);
}

/** Acessos e visitantes ao longo do tempo, páginas mais vistas e acessos por origem. */
export function getAccessMetrics(db: AppDatabase, period: Period): AccessMetrics {
  const granularity = granularityFor(period);
  const traffic = trafficSeries(db, period, granularity);
  return {
    period,
    granularity,
    traffic,
    topPages: topPages(db, period),
    bySource: sourceViews(db, period),
    hasData: traffic.some((point) => point.views > 0),
  };
}
