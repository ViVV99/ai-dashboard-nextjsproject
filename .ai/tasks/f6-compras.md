# F6 — Compras: plano de implementação

> **Para agentes:** execute com superpowers:executing-plans (TDD em cada passo).

**Objetivo:** página de compras com custo de compras ao longo do tempo, receita × custo das
mercadorias vendidas (CMV) e margem bruta do período.
**Arquitetura:** igual à F5 — buckets SQL compartilhados com vendas; agregação num service puro
(`getPurchasesMetrics(db, period)`) testado com SQLite `:memory:`; fachada `loadPurchases` com
`requireUser()` + `getDb()`. Gráficos são Client Components (MUI X Charts) com `ChartCard`.
**Stack:** Drizzle `sql`, `@mui/x-charts` 9, `Intl` pt-BR.
**Spec:** [métricas › Compras](../domains/metricas.md#compras) · [gráficos](../decisions/0004-graficos.md) ·
[schema](../domains/schema.md) · [F5](./f5-vendas.md)

## Restrições globais

- Custo de compras = `SUM(purchases.quantity * unit_cost_cents)`; período local
  `[from 03:00Z, to+1 03:00Z)` (`toUtcRange`); bucket no fuso da loja (`'-3 hours'`).
- Receita = `SUM(order_items.quantity * unit_price_cents)` dos pedidos `paid` (mesma da F5).
- CMV = `SUM(order_items.quantity * products.cost_cents)` dos pedidos `paid` (custo **atual** do
  produto, conforme a spec — não o custo da compra).
- Margem bruta = `(receita − CMV) ÷ receita`; receita 0 ⇒ `null` e a UI mostra "—".
- Granularidade e buckets zerados como na F5 (`granularityFor`, `bucketKeys`).
- Receita × CMV: mesma unidade (BRL) ⇒ um eixo só; 2 séries ⇒ legenda; cores = slots 1 e 2 da
  paleta categórica já validada (0004). Custo de compras: série única, cor primária, sem legenda.

## Review Focus

1. Compra às 02:59Z do dia D cai no bucket D−1 (mesma regra das vendas).
2. Itens de pedidos cancelados/reembolsados fora da receita e do CMV.
3. Período só com compras (sem venda): margem `null` ("—"), Receita × CMV vazio, compras visíveis.
4. Período sem compras nem vendas: `hasData` falso e aviso na página.
5. 366 dias no banco do seed em tempo aceitável (medir; referência F5 ≈ 60 ms).

---

### Task 1: Base comum (buckets SQL e ChartCard)

**Files:** Create `src/server/services/metrics/buckets.ts` + test · Modify `sales.ts` ·
Move `src/features/sales/chart-card.tsx` (+ test) → `src/components/chart-card.tsx`
**Produces:**

- `bucketKey(column: SQLiteColumn, granularity): SQL` — dia local, segunda-feira ou dia 1
- `fillBuckets<T>(period, granularity, rows: (T & { bucket })[], empty: (bucket) => T): T[]`
- `ChartCard` importado de `@/components/chart-card` (0004 previa a mudança no 2º uso)

- [ ] Testes RED: `bucketKey` em `purchases.created_at` (02:59Z → D−1; semana → segunda; mês → dia 1);
      `fillBuckets` preenche faltantes na ordem de `bucketKeys`
- [ ] Implementar; `sales.test.ts` continua verde; commit `refactor(metrics): buckets e ChartCard compartilhados`

### Task 2: Service de compras

**Files:** Create `src/server/services/metrics/purchases.ts` + test · Modify `index.ts` (+ test),
`src/types/metrics.ts`
**Produces:**

- `type PurchasesPoint = { bucket: string; purchaseCents: number; revenueCents: number; cogsCents: number }`
- `type PurchasesSummary = { purchaseCents; revenueCents; cogsCents; grossMargin: number | null }`
- `type PurchasesMetrics = { period; granularity; series: PurchasesPoint[]; summary; hasData }`
- `getPurchasesMetrics(db, period)` · `loadPurchases(period)`

- [ ] Testes RED: Review Focus 1–4; CMV usa `products.cost_cents` (e não `unit_cost_cents`);
      resumo = soma da série; `loadPurchases` sem sessão lança 401 sem consultar o banco
- [ ] Implementar; medir (Review Focus 5); commit `feat(purchases): service de métricas de compras`

### Task 3: Gráficos e página

**Files:** Create `src/features/purchases/*` (purchases-summary, purchase-cost-chart,
revenue-cogs-chart), `src/app/(dashboard)/compras/loading.tsx` (+ test) · Modify `compras/page.tsx` ·
Test colocalizados + `pages.test.tsx`

- [ ] Testes RED: resumo com 4 valores e margem "—" quando `null`; custo de compras com tabela e
      estado vazio; receita × CMV com legenda das 2 séries, coluna de margem por bucket e estado
      vazio; página chama `loadPurchases` com o período e mostra aviso sem dados
- [ ] Implementar; verificação no navegador (claro e escuro, mobile); commit `feat(purchases): gráficos`

### Task 4: Docs e entrega

- [ ] `backlog.md` (F6 ✅), `metricas.md` (implementação), `0004` (ChartCard movido), `overview.md`
- [ ] `yarn lint`, `yarn typecheck`, `yarn test:run`, `yarn build`; commit `docs: F6`; push
