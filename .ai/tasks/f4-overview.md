# F4 — Visão geral (KPIs): plano de implementação

> **Para agentes:** execute com superpowers:executing-plans (TDD em cada passo).

**Objetivo:** cards de KPI da visão geral com variação vs. período anterior.
**Arquitetura:** matemática de período e fórmulas puras em `src/lib`; agregação SQL num service
puro (`getOverviewMetrics(db, period)`) testado com SQLite `:memory:`; fachada `loadOverview`
exige sessão (`requireUser`) e usa `getDb()` — a mesma que a API da F8 vai reusar.
**Stack:** Drizzle `sql` (better-sqlite3), MUI 9, `Intl` pt-BR.
**Spec:** [métricas](../domains/metricas.md) · [backlog F4](./backlog.md) · [schema](../domains/schema.md)

## Restrições globais

- Período `from`/`to` inclusivos no fuso da loja (UTC-3): o intervalo UTC é
  `[from 03:00Z, (to + 1 dia) 03:00Z)`.
- Período anterior: mesma duração, imediatamente antes (01–30/09 → 02–31/08).
- Só pedidos `status = 'paid'` contam. Dinheiro em centavos até a UI.
- Razão com denominador 0 → `null` (UI "—"). Variação com anterior 0 ou `null` → `null` ("—").
- KPIs: Receita, Pedidos, Ticket médio, Acessos, Visitantes únicos, Taxa de conversão (aproximação).
- Card: rótulo, valor, variação com sinal + seta + texto "vs. período anterior" (nunca só cor).

## Review Focus

1. Pedido às 02:59Z do dia D conta no dia D−1 (fuso), não em D.
2. Período atual sem pedidos e anterior com pedidos → variação −100%, não "—".
3. Pedidos cancelados/reembolsados não entram em receita, pedidos nem ticket.
4. Visitante que aparece nos dois períodos conta uma vez em cada (DISTINCT por período).
5. Consulta de 366 dias sobre ~480 mil acessos responde em tempo aceitável (< 300 ms).

---

### Task 1: Período anterior, intervalo UTC, fórmulas e formatação

**Files:** Create `src/lib/period.ts`, `src/lib/kpi-math.ts`, `src/lib/format.ts` · Test idem
**Produces:**

- `previousPeriod(period: Period): Period` · `toUtcRange(period: Period): { start: string; end: string }`
- `ratio(numerator: number, denominator: number): number | null` ·
  `variation(current: number | null, previous: number | null): number | null`
- `formatCurrency(cents: number)`, `formatInteger(n)`, `formatPercent(ratio, digits?)`,
  `formatVariation(ratio)` (com sinal), `formatDate(iso)` (dd/mm/aaaa)

- [ ] Testes RED: anterior de 1 dia, de 30 dias e atravessando ano; UTC range; divisão por zero;
      variação com anterior 0; formatação pt-BR (R$, milhar, vírgula decimal, sinal "+"/"−")
- [ ] Implementar; commit `feat(overview): período anterior, fórmulas e formatação`

### Task 2: Service de métricas da visão geral

**Files:** Create `src/types/metrics.ts`, `src/server/services/metrics/overview.ts`,
`src/server/services/metrics/index.ts` · Test `overview.test.ts`, `index.test.ts`
**Produces:**

- `type OverviewTotals = { revenueCents; orders; pageViews; visitors }` ·
  `type KpiId`, `type KpiFormat = 'currency' | 'integer' | 'percent'`,
  `type Kpi = { id; label; format; value: number | null; previous: number | null; variation: number | null }`,
  `type OverviewMetrics = { period; previousPeriod; kpis: Kpi[]; hasData: boolean }`
- `getOverviewMetrics(db: AppDatabase, period: Period): OverviewMetrics` — 2 consultas
  (pedidos, acessos) com agregação condicional cobrindo os dois períodos numa varredura
- `loadOverview(period: Period): Promise<OverviewMetrics>` — `requireUser()` + `getDb()`

- [ ] Testes RED: todos os itens do Review Focus 1–4; KPIs na ordem da spec; `hasData` falso sem linhas;
      `loadOverview` sem sessão lança 401 sem consultar o banco
- [ ] Implementar; medir com o banco do seed (Review Focus 5); commit `feat(overview): service de KPIs`

### Task 3: Cards de KPI e página

**Files:** Create `src/features/overview/kpi-card.tsx`, `kpi-grid.tsx` · Modify `src/app/(dashboard)/page.tsx` ·
Test `kpi-card.test.tsx`, `src/app/(dashboard)/pages.test.tsx`
**Consumes:** Tasks 1–2.

- [ ] Testes RED: valor formatado por tipo; variação positiva/negativa com seta e rótulo acessível;
      `null` → "—" com "sem base de comparação"; página chama `loadOverview` com o período resolvido,
      mostra o intervalo comparado e aviso quando não há dados
- [ ] Implementar (grid responsivo 1/2/3 colunas); verificação no navegador; commit `feat(overview): cards de KPI`

### Task 4: Docs e entrega

- [ ] Atualizar `backlog.md` (F4 ✅), `metricas.md` (implementação), `overview.md`, `README.md`
- [ ] `yarn lint`, `yarn typecheck`, `yarn test:run`, `yarn build`; commit `docs: F4`; push
