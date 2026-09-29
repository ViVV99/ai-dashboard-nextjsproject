# F3 — Layout e filtro de período: plano de implementação

> **Para agentes:** execute com superpowers:executing-plans (TDD em cada passo).

**Objetivo:** casca do dashboard (menu lateral por perfil, barra superior, tema) e filtro de
período na URL, base para as páginas F4–F9.
**Arquitetura:** regras puras (datas, período, itens do menu) em `src/lib`, `src/schemas` e
`src/features/layout`; o layout do grupo `(dashboard)` é Server Component que autentica e
passa dados serializáveis ao `AppShell` (client). O filtro lê e escreve `?from&to`.
**Stack:** Next 16 App Router, MUI 9 (`useColorScheme`, `Drawer`), RHF + Zod 4.
**Spec:** [backlog F3](./backlog.md) · [métricas](../domains/metricas.md) · [rotas](../context/routes.md)

## Restrições globais

- Datas `YYYY-MM-DD` no fuso da loja (America/Sao_Paulo, UTC-3 fixo).
- Período padrão: últimos **30 dias** terminando hoje (inclusive). `from ≤ to`; máximo **366 dias**.
- Páginas: período inválido na URL → usa o padrão e mostra aviso. (API da F8 → 400.)
- Menu: Visão geral, Vendas, Compras, Acessos, Perfil para todos; Usuários e Auditoria só admin.
- Sem `any`/`enum`; função ≤ 40 linhas; componente ≤ 200 linhas. Testes colocalizados.

## Review Focus

1. `?from=2026-02-30` (data inexistente) é rejeitada, não "normalizada" para março.
2. Só `from` ou só `to` na URL → período inválido (usa o padrão), sem exceção.
3. Viewer acessando `/admin/usuarios` direto é redirecionado (guard na página, não só no proxy).
4. Trocar o período preserva a rota atual e outros parâmetros da query.
5. Item de menu ativo em sub-rotas (`/admin/usuarios/1` destaca "Usuários").

---

### Task 1: Datas e schema de período

**Files:** Create `src/lib/dates.ts`, `src/schemas/period.ts`, `src/types/period.ts` ·
Modify `src/server/db/seed/env.ts` (reusar `todayInStore`) · Test `dates.test.ts`, `period.test.ts`
**Produces:**

- `todayInStore(now?: Date): string` · `addDays(date: string, days: number): string` ·
  `daysBetween(from: string, to: string): number` (inclusivo) · `isValidIsoDate(value: string): boolean`
- `type Period = { from: string; to: string }`; `MAX_PERIOD_DAYS = 366`; `DEFAULT_PERIOD_DAYS = 30`
- `periodSchema` (Zod) · `defaultPeriod(now?: Date): Period`
- `resolvePeriod(params: Record<string, string | string[] | undefined>, now?: Date): { period: Period; invalid: boolean }`
- `periodToSearch(period: Period, current?: URLSearchParams): string`

- [ ] Testes RED: datas inexistentes; bissexto; `daysBetween` inclusivo; limites 366/367;
      `from > to`; parâmetro repetido (array) → inválido; sem parâmetros → padrão, `invalid: false`
- [ ] Implementar; → PASS; commit `feat(layout): datas e schema de período`

### Task 2: Navegação por perfil e guard de página

**Files:** Create `src/features/layout/nav-items.ts` · Modify `src/server/auth/index.ts` ·
Test `nav-items.test.ts`, `src/server/auth/index.test.ts`
**Produces:** `NAV_ITEMS`, `navItemsFor(role: Role): NavItem[]`, `isActivePath(href, pathname): boolean`;
`requirePageRole(role: Role): Promise<SessionUser>` (401 → `/login`, 403 → `/`).

- [ ] Testes RED: viewer não vê admin; admin vê tudo; `/` só ativo em `/`; sub-rota ativa;
      `requirePageRole('admin')` com viewer redireciona para `/`
- [ ] Implementar; → PASS; commit `feat(layout): menu por perfil e guard de página`

### Task 3: AppShell (sidebar, topbar, tema, drawer mobile)

**Files:** Create `src/features/layout/app-shell.tsx`, `nav-list.tsx`, `user-menu.tsx`,
`theme-toggle.tsx`, `src/app/(dashboard)/layout.tsx`, `loading.tsx`, `error.tsx` ·
Move `src/app/page.tsx` → `src/app/(dashboard)/page.tsx` · Test `*.test.tsx`
**Consumes:** Task 2. **Produces:** `<AppShell user={{ name, email, role }}>`.

- [ ] Testes RED: menu por perfil; item ativo com `aria-current="page"`; botão "Sair" chama
      `logoutAction`; toggle alterna claro/escuro; botão de menu abre o drawer no mobile
- [ ] Implementar; `(dashboard)/layout.tsx` chama `requirePageUser`; commit `feat(layout): app shell`

### Task 4: Filtro de período

**Files:** Create `src/features/period/period-filter.tsx`, `src/features/period/presets.ts` · Test idem
**Consumes:** Task 1. **Produces:** `<PeriodFilter period={Period} invalid={boolean} />` e
`PERIOD_PRESETS` (7, 30, 90 dias, 12 meses).

- [ ] Testes RED: preset navega com `?from&to` preservando outros params; datas inválidas mostram
      erro sem navegar; `invalid` exibe aviso de período padrão
- [ ] Implementar com RHF + `zodResolver(periodSchema)`; commit `feat(layout): filtro de período`

### Task 5: Páginas do dashboard (placeholders até F4–F9) e docs

**Files:** Create `(dashboard)/{vendas,compras,acessos,perfil}/page.tsx`,
`(dashboard)/admin/{usuarios,auditoria}/page.tsx`, `src/features/layout/page-header.tsx` ·
Modify `.ai/context/routes.md`, `.ai/tasks/backlog.md`, `.ai/README.md`, `.ai/architeture/overview.md`

- [ ] Páginas de métricas leem `searchParams` com `resolvePeriod` e mostram o `PeriodFilter`
- [ ] Páginas admin chamam `requirePageRole('admin')`
- [ ] `yarn lint`, `yarn typecheck`, `yarn test:run`, `yarn build` → verdes; verificação no browser
- [ ] Commit `feat(layout): páginas do dashboard` e `docs: F3`
