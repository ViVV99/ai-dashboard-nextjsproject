# F5 — Vendas: plano de implementação

> **Para agentes:** execute com superpowers:executing-plans (TDD em cada passo).

**Objetivo:** página de vendas com receita ao longo do tempo, top 10 produtos e receita por categoria.
**Arquitetura:** igual à F4 — granularidade e buckets puros em `src/lib`; agregação SQL num service
puro (`getSalesMetrics(db, period)`) testado com SQLite `:memory:`; fachada `loadSales` com
`requireUser()` + `getDb()`. Gráficos são Client Components (MUI X Charts) que só recebem dados prontos.
**Stack:** Drizzle `sql`, `@mui/x-charts` 9, `Intl` pt-BR.
**Spec:** [métricas](../domains/metricas.md) · [backlog F5](./backlog.md) · [schema](../domains/schema.md)

## Restrições globais

- Só pedidos `paid`; período local `[from 03:00Z, to+1 03:00Z)` (`toUtcRange`, F4).
- Agrupamento no fuso da loja: dia local = `date(created_at, '-3 hours')`.
- Granularidade: ≤ 31 dias → dia; ≤ 180 → semana (segunda a domingo, chave = segunda);
  acima → mês (chave = dia 1). Buckets sem venda aparecem com 0 (linha contínua).
- Receita de produto/categoria = `SUM(order_items.quantity * unit_price_cents)` (preço da venda,
  não o preço atual do produto). O seed garante `orders.total_cents` = soma dos itens.
- Top 10 com desempate estável (receita/quantidade desc, depois nome asc).
- Cor da categoria segue a entidade (ordem do `id`), nunca o ranking (skill dataviz).

## Review Focus

1. Venda às 02:59Z do dia D cai no bucket D−1.
2. Semana que começa antes de `from` usa a segunda-feira como chave (bucket parcial).
3. Cancelados/reembolsados fora de todas as agregações (inclusive itens).
4. Período sem vendas: séries zeradas, listas vazias, `hasData` falso, UI com estado vazio.
5. 366 dias no banco do seed em tempo aceitável (medir; referência F4 < 400 ms).

---

### Task 1: Granularidade e buckets

**Files:** Create `src/lib/granularity.ts` · Test `granularity.test.ts` · Modify `src/lib/format.ts`
**Produces:**

- `type Granularity = 'day' | 'week' | 'month'` (em `src/types/metrics.ts`)
- `granularityFor(period): Granularity` · `bucketKeys(period, granularity): string[]`
- `formatBucket(key, granularity)` — dia `dd/mm`, semana `sem. dd/mm`, mês `mmm/aa`

- [ ] Testes RED: limites 31/32 e 180/181 dias; semanas atravessando mês/ano; meses; formatação
- [ ] Implementar; commit `feat(sales): granularidade automática e buckets`

### Task 2: Service de vendas

**Files:** Create `src/server/services/metrics/sales.ts` · Modify `index.ts`, `src/types/metrics.ts` ·
Test `sales.test.ts`, `index.test.ts`
**Produces:**

- `type RevenuePoint = { bucket: string; revenueCents: number; orders: number }`
- `type ProductRank = { productId; name; revenueCents; quantity }`
- `type CategoryRevenue = { categoryId; name; revenueCents }`
- `type SalesMetrics = { period; granularity; revenue: RevenuePoint[]; topByRevenue; topByQuantity; byCategory; hasData }`
- `getSalesMetrics(db, period)` · `loadSales(period)`

- [ ] Testes RED: Review Focus 1–4; zeros preenchidos; top 10 com limite e desempate;
      `loadSales` sem sessão lança 401 sem consultar o banco
- [ ] Implementar; medir (Review Focus 5); commit `feat(sales): service de métricas de vendas`

### Task 3: Gráficos e página

**Files:** Create `src/features/sales/*` (chart-card, revenue-chart, top-products-chart,
category-chart, category-colors), `src/app/(dashboard)/vendas/loading.tsx` · Modify `vendas/page.tsx` ·
Test colocalizados + `pages.test.tsx`

- [ ] Testes RED: cartão com título/descrição e estado vazio; alternância receita/quantidade;
      legenda da categoria com valor e %; página chama `loadSales` com o período e mostra aviso sem dados
- [ ] Implementar; verificação no navegador (claro e escuro, mobile); commit `feat(sales): gráficos`

### Task 4: Docs e entrega

- [ ] `backlog.md` (F5 ✅), `metricas.md` (implementação), `overview.md`, decisão de paleta
- [ ] `yarn lint`, `yarn typecheck`, `yarn test:run`, `yarn build`; commit `docs: F5`; push
