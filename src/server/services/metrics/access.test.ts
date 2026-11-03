import { beforeEach, describe, expect, it } from 'vitest';
import type { TrafficSource } from '@/types/domain';
import { createDatabase, migrateDatabase, type AppDatabase } from '../../db/client';
import { categories, pageViews, products } from '../../db/schema';
import { getAccessMetrics } from './access';

// 02–04/09 (UTC [02 03:00Z, 05 03:00Z)) → granularidade diária.
const period = { from: '2026-09-02', to: '2026-09-04' };
let db: AppDatabase;

function view(createdAt: string, sessionId: string, path = '/', source: TrafficSource = 'direct') {
  const productId = path.startsWith('/produtos/') ? Number(path.split('/')[2]) : null;
  db.insert(pageViews).values({ path, productId, source, sessionId, createdAt }).run();
}

beforeEach(() => {
  db = createDatabase(':memory:');
  migrateDatabase(db);
  db.insert(categories).values({ id: 1, name: 'Casa' }).run();
  db.insert(products)
    .values({ id: 7, categoryId: 1, name: 'Caneca', sku: 'SKU7', priceCents: 1, costCents: 1 })
    .run();
});

describe('getAccessMetrics', () => {
  beforeEach(() => {
    view('2026-09-02T12:00:00.000Z', 'a', '/', 'organic');
    view('2026-09-02T13:00:00.000Z', 'a', '/produtos/7', 'organic');
    view('2026-09-03T02:59:00.000Z', 'b', '/produtos/7', 'social'); // 02/09 23:59 local
    view('2026-09-04T15:00:00.000Z', 'a', '/carrinho', 'organic'); // mesma sessão, outro dia
    view('2026-09-02T02:59:00.000Z', 'z', '/sobre', 'ads'); // 01/09 local → fora
    view('2026-09-05T03:00:00.000Z', 'z', '/sobre', 'ads'); // 05/09 local → fora
  });

  it('acessos e visitantes por dia local, com zero nos dias sem acesso', () => {
    expect(getAccessMetrics(db, period)).toMatchObject({
      granularity: 'day',
      traffic: [
        { bucket: '2026-09-02', views: 3, visitors: 2 },
        { bucket: '2026-09-03', views: 0, visitors: 0 },
        { bucket: '2026-09-04', views: 1, visitors: 1 },
      ],
      hasData: true,
    });
  });

  it('páginas mais vistas: nome do produto ou o path, desempate pelo path', () => {
    expect(getAccessMetrics(db, period).topPages).toEqual([
      { path: '/produtos/7', label: 'Caneca', views: 2 },
      { path: '/', label: '/', views: 1 },
      { path: '/carrinho', label: '/carrinho', views: 1 },
    ]);
  });

  it('origens: as 5 sempre presentes, por acessos e na ordem fixa no empate', () => {
    expect(getAccessMetrics(db, period).bySource).toEqual([
      { source: 'organic', views: 3 },
      { source: 'social', views: 1 },
      { source: 'direct', views: 0 },
      { source: 'ads', views: 0 },
      { source: 'email', views: 0 },
    ]);
  });
});

describe('getAccessMetrics — agrupamento e limites', () => {
  it('semana: a mesma sessão em dois dias conta uma vez no bucket', () => {
    view('2026-08-05T12:00:00.000Z', 'a');
    view('2026-08-06T12:00:00.000Z', 'a');

    const { granularity, traffic } = getAccessMetrics(db, { from: '2026-08-05', to: '2026-09-06' });

    expect(granularity).toBe('week');
    expect(traffic[0]).toEqual({ bucket: '2026-08-03', views: 2, visitors: 1 });
  });

  it('top 10: limita aos 10 mais vistos', () => {
    for (let n = 0; n < 12; n++) {
      for (let k = 0; k <= n; k++) view('2026-09-02T12:00:00.000Z', `s${n}-${k}`, `/p${n}`);
    }

    const top = getAccessMetrics(db, period).topPages;

    expect(top).toHaveLength(10);
    expect(top[0]).toEqual({ path: '/p11', label: '/p11', views: 12 });
    expect(top[9]?.path).toBe('/p2');
  });

  it('sem acessos: série zerada, top vazio, origens zeradas e hasData falso', () => {
    const result = getAccessMetrics(db, period);

    expect(result.traffic.map((p) => p.views + p.visitors)).toEqual([0, 0, 0]);
    expect(result.topPages).toEqual([]);
    expect(result.bySource.map((s) => [s.source, s.views])).toEqual([
      ['direct', 0],
      ['organic', 0],
      ['social', 0],
      ['ads', 0],
      ['email', 0],
    ]);
    expect(result.hasData).toBe(false);
  });
});

describe('índices de acessos', () => {
  // Sem eles, 366 dias no seed levam ~1,5 s (ordenações temporárias em ~474 mil linhas).
  it('origem e página têm índices que evitam ordenar no GROUP BY', () => {
    const columns = (name: string) =>
      db.$client
        .prepare('select name from pragma_index_info(?) order by seqno')
        .all(name)
        .map((row) => (row as { name: string }).name);

    expect(columns('page_views_source_created_at_idx')).toEqual(['source', 'created_at']);
    expect(columns('page_views_path_idx')).toEqual(['path', 'created_at', 'product_id']);
  });
});
