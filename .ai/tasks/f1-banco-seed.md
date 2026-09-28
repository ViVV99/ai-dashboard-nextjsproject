# F1 — Banco + seed: plano de implementação

> **Para agentes:** execute com superpowers:executing-plans (TDD em cada passo).

**Objetivo:** SQLite com schema Drizzle, migrations e seed determinístico de ~12 meses.
**Arquitetura:** schema em `src/server/db/schema.ts`; geradores puros (sem banco) produzem
linhas a partir de um PRNG com seed; `seedDatabase` limpa e insere tudo numa transação.
**Stack:** drizzle-orm 0.45.3, drizzle-kit 0.31.11, better-sqlite3 13, @node-rs/argon2 2, zod 4, tsx.
**Spec:** [schema](../domains/schema.md) · [perfis](../domains/usuarios-e-perfis.md) ·
[backlog F1](./backlog.md) · [métricas](../domains/metricas.md)

## Restrições globais

- Sem `any`/`enum`; valores de domínio vêm de `src/types/domain.ts` (já existe).
- Dinheiro em centavos (INTEGER); datas em ISO 8601 UTC (TEXT); dia local = America/Sao_Paulo (UTC-3).
- Função ≤ 40 linhas; arquivo ≤ 500 linhas. Testes colocalizados em `src/`.
- Credenciais só por variável de ambiente; nunca hardcoded nem logadas.

## Review Focus

1. Rodar o seed duas vezes no mesmo banco não duplica nem viola UNIQUE (idempotente).
2. Env do admin ausente/fraca → erro claro e **nenhuma** escrita no banco.
3. `orders.total_cents` = soma de `quantity * unit_price_cents` dos itens.
4. `foreign_keys` ligado: item de pedido órfão é rejeitado.
5. Venda às 22h (BRT) cai no dia local correto (UTC do dia seguinte).

---

### Task 1: PRNG determinístico

**Files:** Create `src/server/db/seed/random.ts` · Test `src/server/db/seed/random.test.ts` (já escrito)
**Produces:** `createRandom(seed: number): Random` com `next, int(min,max), chance(p), pick(items), weighted(entries), hex(len)`.

- [ ] Rodar `yarn vitest run src/server/db/seed/random.test.ts` → FAIL (módulo inexistente)
- [ ] Implementar com mulberry32; `pick([])` lança "lista vazia"
- [ ] Rodar de novo → PASS; commit `feat(seed): PRNG determinístico`

### Task 2: Calendário da loja

**Files:** Create `src/server/db/seed/calendar.ts` · Test `calendar.test.ts` (já escrito)
**Produces:** `type LocalDay = string`; `lastDays(endDay, days): LocalDay[]`;
`localToUtcIso(day, minuteOfDay): string`; `randomTimestamp(random, day): string`;
`seasonality(day, index, total): number` (fim de semana ×1.3, nov/dez ×1.5, crescimento 0.85→1.15).

- [ ] Rodar o teste → FAIL; implementar; rodar → PASS; commit `feat(seed): calendário e sazonalidade`

### Task 3: Schema, migrations e cliente

**Files:** Create `src/server/db/schema.ts`, `src/server/db/client.ts`, `drizzle.config.ts`,
`drizzle/` (gerado) · Test `src/server/db/schema.test.ts` · Modify `vitest.config.mts`, `package.json`
**Produces:** tabelas `users, auditLogs, categories, products, customers, orders, orderItems, purchases, pageViews`;
`createDatabase(url: string): AppDatabase` (liga `foreign_keys`; WAL fora de `:memory:`);
`migrateDatabase(db: AppDatabase): void` (pasta `drizzle/`).

- [ ] Vitest com dois projetos: `node` (`src/server/**`) e `dom` (resto, jsdom)
- [ ] Testes (banco `:memory:` migrado), cada um RED antes do schema:
  `rejeita role fora de ROLES`, `rejeita e-mail duplicado`, `rejeita status de pedido inválido`,
  `rejeita quantidade ≤ 0`, `rejeita preço negativo`, `rejeita item com pedido inexistente (FK)`
- [ ] Schema com CHECK gerado de `ROLES`/`USER_STATUSES`/`ORDER_STATUSES`/`TRAFFIC_SOURCES` e índices do spec
- [ ] `yarn db:generate` gera a migration; testes → PASS; commit `feat(db): schema e migrations`

### Task 4: Geradores de dados

**Files:** Create `src/server/db/seed/catalog.ts` (já escrito), `src/server/db/seed/generate.ts` · Test `generate.test.ts`
**Consumes:** Tasks 1–2. **Produces:** `generateDataset(random, { endDay, days }): Dataset` com
`categories, products, customers, orders, orderItems, purchases, pageViews` (ids explícitos).

- [ ] Testes RED: `mesma seed gera dataset idêntico`; `total do pedido = soma dos itens`;
  `status ~90% paid`; `custo do produto entre 50% e 70% do preço`; `todas as datas dentro do período local`;
  `page_views de produto têm product_id e path /produtos/{id}`
- [ ] Implementar em funções ≤ 40 linhas (uma por tabela); rodar → PASS; commit `feat(seed): geradores`

### Task 5: Seed no banco + usuários + CLI

**Files:** Create `src/schemas/password.ts`, `src/server/db/seed/seed.ts`, `src/server/db/seed/env.ts`,
`src/server/db/cli/migrate.ts`, `src/server/db/cli/seed.ts`, `.env.example` · Tests `password.test.ts`, `env.test.ts`, `seed.test.ts`
**Produces:** `passwordSchema` (≥ 8, letra e número); `parseSeedEnv(env): SeedEnv`
(`DATABASE_URL`=`./data/app.db`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`=`Administrador`,
`SEED_VIEWER_PASSWORD` opcional, `SEED_RANDOM_SEED`=`20260928`, `SEED_END_DATE`=hoje em BRT, `SEED_DAYS`=`365`);
`seedDatabase(db, options): Promise<SeedSummary>` (contagens por tabela).

- [ ] Testes RED: senha fraca rejeitada; env sem admin → erro que cita a variável;
  `seed duas vezes → mesmas contagens`; `admin com hash argon2 que verifica a senha`;
  `viewers só existem com SEED_VIEWER_PASSWORD (3, sendo 1 bloqueado)`; `e-mail normalizado em minúsculas`
- [ ] Implementar: hash antes da transação; transação limpa tabelas (ordem das FKs) e insere em lotes de 500
- [ ] CLI recusa `NODE_ENV=production`; scripts `db:generate`, `db:migrate`, `db:seed`
- [ ] Rodar `yarn db:migrate && yarn db:seed` com env de exemplo; conferir contagens; commit `feat(seed): seed e CLI`

### Task 6: Documentação e verificação final

**Files:** Modify `.ai/domains/schema.md`, `.ai/architeture/overview.md`, `.ai/tasks/backlog.md`, `CLAUDE.md` (comandos)

- [ ] Documentar comandos `db:*`, variáveis de ambiente e decisões tomadas
- [ ] `yarn lint`, `yarn typecheck`, `yarn test:run`, `yarn build` → todos verdes
- [ ] Revisão final do branch por revisor independente; commit `docs: F1`
