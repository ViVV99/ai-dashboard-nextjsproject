# F7 — Acessos: plano de implementação

> **Para agentes:** execute com superpowers:executing-plans (TDD em cada passo).

**Objetivo:** página de acessos com acessos e visitantes únicos ao longo do tempo, top 10 páginas
mais vistas e acessos por origem.
**Arquitetura:** igual à F5/F6 — buckets SQL de `metrics/buckets.ts`; agregação num service puro
(`getAccessMetrics(db, period)`) testado com SQLite `:memory:`; fachada `loadAccess` com
`requireUser()` + `getDb()`. Gráficos são Client Components (MUI X Charts) com `ChartCard`.
**Stack:** Drizzle `sql`, `@mui/x-charts` 9, `Intl` pt-BR.
**Spec:** [métricas › Acessos](../domains/metricas.md#acessos) · [gráficos](../decisions/0004-graficos.md) ·
[schema](../domains/schema.md) · [F6](./f6-compras.md)

## Restrições globais

- Acessos = `COUNT(page_views)`; visitantes únicos = `COUNT(DISTINCT session_id)` (mesmas
  fórmulas da visão geral); período local `[from 03:00Z, to+1 03:00Z)` (`toUtcRange`).
- Visitantes por bucket são distintos **dentro do bucket**: a soma dos buckets pode passar do
  total do período (um visitante em dois dias conta nos dois). Documentar em `metricas.md`.
- Top 10 páginas por acessos, desempate por `path` asc; rótulo = nome do produto quando há
  `product_id`, senão o `path`.
- Origens: as 5 de `TRAFFIC_SOURCES` sempre presentes (0 quando sem acesso), ordenadas por acessos
  desc e, no empate, pela ordem de `TRAFFIC_SOURCES`. Rótulos pt-BR na UI.
- Acessos × visitantes: mesma unidade (contagem) ⇒ um eixo, base zero, legenda, slots 0 e 1 da
  paleta (`paletteColor`). Páginas e origens: barras horizontais de série única (cor primária,
  sem legenda; o eixo nomeia cada barra).
- Desempenho: 366 dias no seed (~474 mil acessos) < 400 ms (referência F4). Se passar, índice de
  cobertura via migration (`yarn db:generate`) com ruling no ledger.

## Review Focus

1. Acesso às 02:59Z do dia D cai no bucket D−1.
2. Mesmo `session_id` em dois buckets conta como visitante em cada um; no período, uma vez.
3. Página de produto aparece com o nome do produto; página estática com o `path`.
4. Período sem acessos: série zerada, top vazio, 5 origens com 0, `hasData` falso, aviso na página.
5. 366 dias no banco do seed em tempo aceitável (medir).

---

### Task 1: Legenda de séries compartilhada

**Files:** Create `src/components/series-legend.tsx` + test · Modify
`src/features/purchases/revenue-cogs-chart.tsx` (usar o componente)
**Produces:** `SeriesLegend({ series: { id: string; label: string; color: string }[] })` — `ul`
"Legenda" com amostra de linha (`aria-hidden`) e rótulo em texto

- [x] Testes RED: lista "Legenda" com um item por série, na ordem
- [x] Implementar; `revenue-cogs-chart.test.tsx` continua verde; commit
      `refactor(charts): legenda de séries compartilhada`

### Task 2: Service de acessos

**Files:** Create `src/server/services/metrics/access.ts` + test · Modify `index.ts` (+ test),
`src/types/metrics.ts`
**Produces:**

- `type TrafficPoint = { bucket: string; views: number; visitors: number }`
- `type PageRank = { path: string; label: string; views: number }`
- `type SourceViews = { source: TrafficSource; views: number; visitors: number }`
- `type AccessMetrics = { period; granularity; traffic: TrafficPoint[]; topPages: PageRank[]; bySource: SourceViews[]; hasData }`
- `getAccessMetrics(db, period)` · `loadAccess(period)`

- [x] Testes RED: Review Focus 1–4; top 10 com limite e desempate; origens ordenadas com zeros;
      `loadAccess` sem sessão lança 401 sem consultar o banco
- [x] Implementar; medir (Review Focus 5); commit `feat(access): service de métricas de acessos`

### Task 3: Gráficos e página

**Files:** Create `src/features/access/*` (traffic-chart, top-pages-chart, sources-chart,
source-labels), `src/app/(dashboard)/acessos/loading.tsx` (+ test) · Modify `acessos/page.tsx` ·
Test colocalizados + `pages.test.tsx`

- [x] Testes RED: tráfego com legenda das 2 séries, tabela por bucket e estado vazio; top páginas
      com rótulo e caminho na tabela e estado vazio; origens com rótulo pt-BR, acessos e
      participação (%) na tabela; página chama `loadAccess` com o período e mostra aviso sem dados
- [x] Implementar; verificação no navegador (claro e escuro, mobile, vazio); commit
      `feat(access): gráficos`

### Task 4: Docs e entrega

- [x] `backlog.md` (F7 ✅), `metricas.md` (implementação), `0004`, `overview.md`, `README.md`
- [x] `yarn lint`, `yarn typecheck`, `yarn test:run`, `yarn build`; commit `docs: F7`; push
